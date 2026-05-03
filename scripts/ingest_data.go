package main

import (
	"context"
	"database/sql"
	"log"

	_ "github.com/lib/pq"

	pb "github.com/arunima10a/llm-collab-system/internal/llm_proto"
	"github.com/arunima10a/llm-collab-system/services/llm_service/repository"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func main() {
	db, err := sql.Open("postgres", "postgres://admin:secretpassword@localhost:5433/collab_db?sslmode=disable")
	if err != nil {
		log.Fatalf("SB conn Error: %v", err)
	}
	repo := repository.NewLLMRepository(db)

	conn, err := grpc.Dial("localhost:50051", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("gRPC conn Error: %v", err)
	}
	defer conn.Close()
	client := pb.NewLLMInferenceClient(conn)

	knowledge := "The secret code for the deep-sea research project is 'NEPTUNE-99-ALPHA'"

	resp, err := client.GetEmbedding(context.Background(), &pb.EmbeddingRequest{Text: knowledge})
	if err != nil {
		log.Fatalf("Embedding error: %v", err)
	}
	
	err = repo.SaveKnowledge(knowledge, resp.Embedding, "general", 0)
	if err != nil {
		log.Fatalf("Save Error: %v", err)

	}

	log.Println("Success! The AI now knows the secret code.")
}
