package service

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"log"

	pb "github.com/arunima10a/llm-collab-system/internal/llm_proto"
	"github.com/arunima10a/llm-collab-system/services/llm_service/repository"

	"github.com/redis/go-redis/v9"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type LLMOrchestrator struct {
	redisClient *redis.Client
	repo        *repository.LLMRepository
}

func NewLLMOrchestrator(client *redis.Client, repo *repository.LLMRepository) *LLMOrchestrator {
	return &LLMOrchestrator{
		redisClient: client,
		repo:        repo,
	}
}

func (o *LLMOrchestrator) StartListening() {
	ctx := context.Background()

	pubsub := o.redisClient.Subscribe(ctx, "llm:requests")
	defer pubsub.Close()

	log.Println("LLM Service is now listening for AI requests on Redis...")

	for {
		msg, err := pubsub.ReceiveMessage(ctx)
		if err != nil {
			log.Printf("Error receiving message from redis: %v", err)
			continue
		}

		var request map[string]interface{}
		if err := json.Unmarshal([]byte(msg.Payload), &request); err != nil {
			log.Printf("Failed to decode LLM requests: %v", err)
			continue
		}
		userID := 0
		if val, ok := request["user_id"]; ok && val != nil {
			// Only try to cast if the value actually exists
			if f, ok := val.(float64); ok {
				userID = int(f)
			}
		}

		username, _ := request["username"].(string)
		prompt, _ := request["prompt"].(string)
		room, _ := request["room"].(string)
		intent, _ := request["intent"].(string)

		isPrivate := false
		if val, ok := request["is_private"].(bool); ok {
			isPrivate = val
		}

		if prompt == "" || strings.Contains(prompt, "CAN YOU HEAR ME") {
			continue
		}

		log.Printf("Received prompt from %s: '%s'", username, prompt)

		go o.processWithPython(username, prompt, room, intent, isPrivate, userID)
	}
}

func (o *LLMOrchestrator) processWithPython(username, prompt, room, intent string, isPrivate bool, userID int) {

	pythonAddr := os.Getenv("PYTHON_GRPC_ADDR")
	if pythonAddr == "" {
		pythonAddr = "localhost:50051"
	}
	ctx := context.Background()

	conn, err := grpc.Dial(pythonAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Printf("Failed to connect to Python gRPC: %v", err)
		return
	}
	defer conn.Close()
	client := pb.NewLLMInferenceClient(conn)

	historyLimit := 20
	if intent == "summarize" {
		historyLimit = 50
	}
	history, _ := o.repo.GetLastMessages(room, historyLimit)
	historyText := strings.Join(history, "\n")

	// RAG search
	var docContext string
	if intent != "summarize" {
		embResp, err := client.GetEmbedding(ctx, &pb.EmbeddingRequest{Text: prompt})
		if err == nil && embResp != nil {
			facts, _ := o.repo.SearchKnowledge(embResp.Embedding, room, userID)
			docContext = strings.Join(facts, "\n")
			log.Printf("RAG Success: Found %d facts for room %s", len(facts), room)
		}
	}

	var systemPrompt string
	switch intent {
	case "summarize":
		systemPrompt = `Summarize ONLY the conversation below.
		Do NOT mention any external context, files, or irrelevant information.
		Do NOT explain what was ignored.`
	case "explain":
		systemPrompt = "You are an expert tutor. Use the chat history and documents to explain the topic."
	default:
		systemPrompt = "You are a contextual assistant. Use chat history and documents to answer the user."
	}

	augmentedPrompt := fmt.Sprintf(`
        You are a helpful assistant. 
        Below is some retrieved context that MIGHT be relevant to the user's request. 
        If the context is not relevant to the question, ignore it and answer normally.

        %s
        --- CHAT HISTORY ---
        %s
        --- DOCUMENT CONTEXT ---
        %s
        --- USER QUESTION ---
        %s
    `, systemPrompt, historyText, docContext, prompt)

	//Inference
	stream, err := client.GenerateResponse(ctx, &pb.PromptRequest{Prompt: augmentedPrompt})
	if err != nil {
		log.Printf("Error calling gRPC: %v", err)
		return
	}

	var tokenBuffer strings.Builder

	var fullResponse strings.Builder

	for {
		resp, err := stream.Recv()
		if err != nil {
			if tokenBuffer.Len() > 0 {
				o.publishTokenToRedis(tokenBuffer.String(), room, isPrivate, userID)
			}

			if fullResponse.Len() > 0 {
				o.publishFinalToRedis(fullResponse.String(), room, isPrivate, userID)
			}
			break
		}

		fullResponse.WriteString(resp.Token)
		tokenBuffer.WriteString(resp.Token)

		if tokenBuffer.Len() > 15 {
			// Pass 'isPrivate' so the helper knows which tag to use
			o.publishTokenToRedis(tokenBuffer.String(), room, isPrivate, userID)
			tokenBuffer.Reset()
		}

	}

}

func (o *LLMOrchestrator) publishToRedis(channel, username, content, room string, userID int) {
	responsePayload := map[string]interface{}{
		"username":     username,
		"content":      content,
		"room":         room,
		"recipient_id": userID,
	}
	jsonBytes, _ := json.Marshal(responsePayload)
	o.redisClient.Publish(context.Background(), channel, jsonBytes)
}

func (o *LLMOrchestrator) publishTokenToRedis(content, room string, isPrivate bool, userID int) {
	channel := "llm:responses"
	username := "AI_STREAM"
	if isPrivate {
		channel = fmt.Sprintf("llm:private:%d", userID)
		username = "AI_PRIVATE_STREAM"
	}

	o.publishToRedis(channel, username, content, room, userID)
}

func (o *LLMOrchestrator) publishFinalToRedis(fullContent, room string, isPrivate bool, userID int) {
	channel := "llm:final_responses"
	username := "AI Assistant"

	if isPrivate {
		channel = fmt.Sprintf("llm:private:%d", userID)
	}

	o.publishToRedis(channel, username, fullContent, room, userID)
}

func (o *LLMOrchestrator) callGeminiSync(prompt string) string {
	pythonAddr := os.Getenv("PYTHON_GRPC_ADDR")
	if pythonAddr == "" {
		pythonAddr = "localhost:50051"
	}
	conn, err := grpc.Dial(pythonAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Printf("Sync RPC Error: %v", err)
		return "Summary Unavailable"
	}
	defer conn.Close()

	client := pb.NewLLMInferenceClient(conn)

	resp, err := client.GetUnaryResponse(context.Background(), &pb.PromptRequest{
		Prompt: prompt,
	})
	if err != nil {
		log.Printf("Sync RPC Error: %v", err)
		return "summary Unavailable"
	}
	return resp.Token
}
