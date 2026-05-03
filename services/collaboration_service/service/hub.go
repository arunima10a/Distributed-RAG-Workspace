package service

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"strings"

	"github.com/arunima10a/llm-collab-system/internal/messaging"
	"github.com/arunima10a/llm-collab-system/services/collaboration_service/model"
	"github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"
)

type Hub struct {
	rooms      map[string]map[int]*websocket.Conn
	AIStream   chan model.ChatMessage
	Broadcast  chan model.ChatMessage
	Register   chan Subscription
	Unregister chan Subscription
	db         *sql.DB
	kafkaProv  *messaging.KafkaProvider
}

type Subscription struct {
	Conn   *websocket.Conn
	Room   string
	UserID int
}

func NewHub(database *sql.DB, kProv *messaging.KafkaProvider) *Hub {
	return &Hub{
		Broadcast:  make(chan model.ChatMessage, 256),
		AIStream:   make(chan model.ChatMessage, 256),
		Register:   make(chan Subscription, 32),
		Unregister: make(chan Subscription, 32),
		rooms:      make(map[string]map[int]*websocket.Conn),
		db:         database,
		kafkaProv:  kProv,
	}
}

func (h *Hub) Run() {
	log.Println("Hub is Running and waiting for connections...")
	for {
		select {
		case s := <-h.Register:
			if h.rooms[s.Room] == nil {
				h.rooms[s.Room] = make(map[int]*websocket.Conn)
			}
			if oldConn, exists := h.rooms[s.Room][s.UserID]; exists {
				log.Printf("Replacing stale connections for UserID: %d, in room:%s", s.UserID, s.Room)
				oldConn.Close()

			}
			h.rooms[s.Room][s.UserID] = s.Conn
			log.Printf("Registering UserID: %d in room: %s. Room has now %d connecttions", s.UserID, s.Room, len(h.rooms[s.Room]))

			log.Printf("User joined the room: %s", s.Room)

		case s := <-h.Unregister:
			if clients, ok := h.rooms[s.Room]; ok {
				if currentConn, ok := clients[s.UserID]; ok && currentConn == s.Conn {
					delete(clients, s.UserID)
					s.Conn.Close()
					log.Printf("❌ Unregistered UserID:%d from room:%s", s.UserID, s.Room)
				} else {
					log.Printf("⚠️ Skipping unregister for UserID:%d - connection already replaced", s.UserID)
				}
			}

		case msg := <-h.Broadcast:
			log.Printf("📢 Broadcasting to room [%s], active connections: %v", msg.Room, getMapKeys(h.rooms))

			go func(m model.ChatMessage) {
				_, err := h.db.Exec("INSERT INTO messages (username, room, content, user_id) VALUES ($1, $2, $3, $4)", m.Username, m.Room, m.Content, m.UserID)
				if err != nil {
					log.Printf("DB save error: %v", err)
				}
			}(msg)

			for userID, conn := range h.rooms[msg.Room] {
				err := conn.WriteJSON(msg)
				if err != nil {
					log.Printf("Error writing to client, removing them: %v", err)
					conn.Close()
					delete(h.rooms[msg.Room], userID)
				}
			}
			go func(m model.ChatMessage) {
				err := h.kafkaProv.Publish(context.Background(), "chat-observations", m)
				if err != nil {
					log.Printf("Kafka Publish Error: %v", err)
				}
			}(msg)

		case aiMsg := <-h.AIStream:

			clients, exists := h.rooms[aiMsg.Room]
			if !exists || len(clients) == 0 {
				log.Printf("⚠️ WARNING: Hub received message for room [%s], but that room is EMPTY in the map. Active rooms are: %v", aiMsg.Room, getMapKeys(h.rooms))
				continue
			}
			for _, conn := range clients {
				conn.WriteJSON(aiMsg)
			}

		}
	}
}

func (h *Hub) ListenToRedisForAI(redisClient *redis.Client) {
	ctx := context.Background()
	pubsub := redisClient.PSubscribe(ctx, "llm:responses", "llm:final_responses", "llm:room_updates", "llm:private:*")

	defer pubsub.Close()

	log.Println("Collaboration Hub is lsitening for AI responses from Redis...")

	for {
		msg, err := pubsub.ReceiveMessage(ctx)
		if err != nil {
			log.Printf("Error receiving AI reponse from Redis: %v", err)
			continue
		}
		log.Printf("📥 REDIS HEARTBEAT: Received raw message on channel [%s]", msg.Channel)

		if msg.Channel == "llm:room_updates" {
			var update map[string]string
			if err := json.Unmarshal([]byte(msg.Payload), &update); err != nil {
				continue
			}
			log.Printf("✨ Hub confirmed: RECEIVED snapshot for room [%s]", update["room"])
			log.Printf("🔍 Room Match Check: MsgRoom='%s', ActiveRooms=%v", update["room"], h.rooms)

			h.AIStream <- model.ChatMessage{
				Username: "SYSTEM_UPDATE",
				Content:  update["summary"],
				Room:     update["room"],
			}
			continue
		}
		var aiMessage model.ChatMessage
		if err := json.Unmarshal([]byte(msg.Payload), &aiMessage); err != nil {
			log.Printf("❌ ChatMessage JSON Error on channel %s: %v", msg.Channel, err)
			continue
		}

		if strings.HasPrefix(msg.Channel, "llm:private:") {
			log.Printf("🔒 HUB PRIVATE ROUTE: TargetRoom: %s, TargetUser: %d", aiMessage.Room, aiMessage.RecipientID)

			if roomClients, ok := h.rooms[aiMessage.Room]; ok {
				if conn, ok := roomClients[aiMessage.RecipientID]; ok {
					aiMessage.IsPrivate = true
					log.Printf("🎯 HUB: Found connection for User %d! Sending JSON...", aiMessage.RecipientID)
					conn.WriteJSON(aiMessage)
				} else {
					log.Printf("❌ HUB: User %d NOT FOUND in room %s. Active IDs in this room: %v",
						aiMessage.RecipientID, aiMessage.Room, getMapKeysForRoom(roomClients))
				}
			} else {
				log.Printf("❌ HUB: Room %s NOT FOUND in Hub. Active rooms: %v", aiMessage.Room, getMapKeys(h.rooms))
			}
			continue
		} else if msg.Channel == "llm:responses" {
			// Send to AIStream (Broadcast but NO DB save)
			h.AIStream <- aiMessage
		} else if msg.Channel == "llm:final_responses" {
			log.Printf("💾 Saving AI response to DB for room: %s", aiMessage.Room)
			_, err := h.db.Exec("INSERT INTO messages (username, room, content) VALUES ($1, $2, $3)",
				"AI Assistant", aiMessage.Room, aiMessage.Content)
			if err != nil {
				log.Printf("❌ DB Save Error: %v", err)
			}
			h.AIStream <- aiMessage
		}

	}

}

func (h *Hub) InitDatabase() error {
	query := `
	CREATE TABLE IF NOT EXISTS messages (
		id SERIAL PRIMARY KEY,
		username VARCHAR(50),
		room VARCHAR(50) DEFAULT 'general' , -- ADD THIS COLUMN
		content TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);`
	_, err := h.db.Exec(query)
	if err != nil {
		return err
	}
	alterQuery := `ALTER TABLE messages ADD COLUMN IF NOT EXISTS user_id INT DEFAULT 0;`

	if _, err := h.db.Exec(alterQuery); err != nil {
		log.Printf("⚠️ Note: Could not alter table (might already be updated): %v", err)
	}

	log.Println(" Collaboration messages table is ready!")
	return nil
}

func (h *Hub) IsUserInGroup(userID int, roomName string) bool {
	if strings.ToLower(roomName) == "general" {
		return true
	}

	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM group_members gm JOIN groups g ON g.id = gm.group_id WHERE gm.user_id = $1 AND LOWER(g.name) = LOWER($2))`

	err := h.db.QueryRow(query, userID, roomName).Scan(&exists)
	if err != nil {
		log.Printf("Membership check error: %v", err)
		return false
	}
	return exists
}

func getMapKeys(m map[string]map[int]*websocket.Conn) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}

func getMapKeysForRoom(m map[int]*websocket.Conn) []int {
	keys := make([]int, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}
