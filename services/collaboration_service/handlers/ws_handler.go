package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"

	"github.com/arunima10a/llm-collab-system/internal/auth"
	"github.com/arunima10a/llm-collab-system/services/collaboration_service/model"
	"github.com/arunima10a/llm-collab-system/services/collaboration_service/service"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,

	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func HandleConnections(hub *service.Hub, redisClient *redis.Client, dbConn *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		room := r.URL.Query().Get("room")
		if room == "" {
			room = "general"
		}

		tokenString := r.URL.Query().Get("token")
		if tokenString == "" {
			http.Error(w, "Missing authentication token", http.StatusUnauthorized)
			return
		}
		claims, err := auth.ValidateToken(tokenString)
		if err != nil {
			log.Printf("Unauthorized connection attempt: %v", err)
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}
		username := claims["username"].(string)
		userID := int(claims["user_id"].(float64))

		//log.Printf("DEBUG: Bouncer is checking membership for UserID: %d, Room: %s", userID, room)

		if !hub.IsUserInGroup(userID, room) {
			log.Printf("Blocked: User %s tried to enter private room %s", username, room)
			http.Error(w, "You are not a member of this group. Join via User Service first.", http.StatusForbidden)
			return
		}

		ws, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("Fatal error upgrading connection: %v", err)
			return
		}
		rows, err := dbConn.Query(`
		SELECT username, content, user_id FROM (
			SELECT id, username, content, user_id
			FROM messages
			WHERE LOWER(room) = LOWER($1)
			ORDER BY id DESC
			LIMIT 50
		) sub
		ORDER BY id ASC
	`, room)
		if err != nil {
			log.Printf(" SQL Error: %v", err)
		} else {
			defer rows.Close()
			for rows.Next() {
				var m model.ChatMessage
				if err := rows.Scan(&m.Username, &m.Content, &m.UserID); err != nil {
					continue
				}
				ws.WriteJSON(m)
			}
		}

		ws.SetReadDeadline(time.Now().Add(5 * time.Minute))
		ws.SetPingHandler(func(appData string) error {
			ws.SetReadDeadline(time.Now().Add(60 * time.Second))
			return ws.WriteControl(websocket.PongMessage, []byte(appData), time.Now().Add(5*time.Second))
		})

		
		sub := service.Subscription{Conn: ws, Room: room, UserID: userID}

		hub.Register <- sub

		defer func() {
			select {
			case hub.Unregister <- sub:
			default:
				log.Printf("⚠️ Unregister channel full, skipping for UserID:%d", userID)
			}
		}()

		for {
			_, msg, err := ws.ReadMessage()
			if err != nil {
				log.Printf("❌ WS READ ERROR UserID:%d room:%s error:%v", userID, room, err)
				break
			}

			ws.SetReadDeadline(time.Now().Add(5 * time.Minute))
			// 1. Parse incoming JSON
			var incoming struct {
				Type      string `json:"type"`
				Content   string `json:"content"`
				IsPrivate bool   `json:"is_private"`
			}

			if err := json.Unmarshal(msg, &incoming); err != nil {
				log.Printf("Invalid message format: %v", err)
				continue
			}
			if incoming.Type == "typing" {
				hub.AIStream <- model.ChatMessage{
					Username: "SYSTEM_TYPING",
					Content:  username, 
				}
				continue
			}
			if incoming.Type == "ping" {
				continue
			}

		
			if incoming.IsPrivate {
				log.Printf("🔒 Private AI request from %s", username)

				req := map[string]interface{}{
					"username":   username,
					"prompt":     incoming.Content,
					"room":       room,
					"intent":     "ask",
					"is_private": true,
					"user_id":    userID,
				}

				payload, _ := json.Marshal(req)
				err := redisClient.Publish(context.Background(), "llm:requests", payload).Err()
				if err != nil {
					log.Printf("Redis publish error: %v", err)
				}

				continue 
			}

			chatMsg := model.ChatMessage{
				Username: username,
				Content:  incoming.Content,
				Room:     room,
				UserID:   userID,
			}
			hub.Broadcast <- chatMsg

			if strings.HasPrefix(incoming.Content, "@ai ") {
				log.Printf("AI command detected from %s: %s", username, incoming.Content)

				prompt := strings.TrimPrefix(incoming.Content, "@ai ")
				intent := "ask"

				if strings.HasPrefix(prompt, "summarize") {
					intent = "summarize"
				} else if strings.HasPrefix(prompt, "explain") {
					intent = "explain"
				}

				llmRequest := map[string]interface{}{
					"username":   username,
					"prompt":     prompt,
					"room":       room,
					"intent":     intent,
					"user_id":    userID,
					"is_private": false,
				}

				payload, _ := json.Marshal(llmRequest)
				err := redisClient.Publish(context.Background(), "llm:requests", payload).Err()
				if err != nil {
					log.Printf("Failed to publish to Redis: %v", err)
				}
			}
		}
	}
}
