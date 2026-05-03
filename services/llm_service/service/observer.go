package service

import (
	"context"
	"encoding/json"
	"log"
	"strings"

	"github.com/arunima10a/llm-collab-system/services/collaboration_service/model"
	"github.com/segmentio/kafka-go"
)

func (o *LLMOrchestrator) StartObserving(reader *kafka.Reader) {

	msgCount := 0

	log.Println("AI Observer is now watching Kafka log...")

	for {
		m, err := reader.ReadMessage(context.Background())
		if err != nil {
			break
		}

		var chatMsg model.ChatMessage
		json.Unmarshal(m.Value, &chatMsg)

		log.Printf(" AI Observed a message in %s: '%s'", chatMsg.Room, chatMsg.Content)


		msgCount++

		if msgCount >= 10 {
			msgCount = 0
			log.Printf("Kafka Observer: Room %s reached 10 new messages. Updating snapshot...", chatMsg.Room)
			go o.updateRoomSnapshot(chatMsg.Room)
		}

	}
}

func (o *LLMOrchestrator) updateRoomSnapshot(room string) {
	cleanRoom := strings.TrimSpace(room)

	log.Printf(" START: Requesting summary for room: %s", room)
	history, _ := o.repo.GetLastMessages(room, 50)
	if len(history) == 0 {
        log.Printf("ℹ️ Skipping snapshot for room %s: No history found", room)
        return
    }
	prompt := "Summarize the key points of this conversation in 2 sentences:\n" + strings.Join(history, "\n")

	log.Println(" Calling Python gRPC Unary...")
	summary := o.callGeminiSync(prompt)
	log.Printf("✅ AI Returned: %s", summary)
	ctx := context.Background()
	o.redisClient.Set(ctx, "room:summary:"+room, summary, 0)

	payload := map[string]string{
		"room":    cleanRoom,
		"summary": summary,
	}
	
	jsonBytes, err := json.Marshal(payload)
	if err != nil {
		log.Printf("❌ Marshal Error: %v", err)
		return
	}
	
	// Debug log (very useful)
	log.Printf(" LLM Service sending payload to Redis: %s", string(jsonBytes))
	
	err = o.redisClient.Publish(ctx, "llm:room_updates", jsonBytes).Err()
	if err != nil {
		log.Printf("❌ Redis Publish Error: %v", err)
	}

}
