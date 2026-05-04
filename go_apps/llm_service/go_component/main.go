package main

import (
	"context"
	"log"
	"net/http"
	"os"

	pb "github.com/arunima10a/llm-collab-system/internal/llm_proto"
	"github.com/arunima10a/llm-collab-system/internal/messaging"

	"github.com/arunima10a/llm-collab-system/services/llm_service/handlers"

	"github.com/arunima10a/llm-collab-system/internal/db"
	"github.com/arunima10a/llm-collab-system/services/llm_service/repository"
	"github.com/arunima10a/llm-collab-system/services/llm_service/service"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func main() {
	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		dsn = "postgres://admin:secretpassword@localhost:5433/collab_db?sslmode=disable"
	}

	postgresDB, err := db.InitPostgres(dsn)
	if err != nil {
		log.Fatalf(" Failed to connect to Postgres: %v", err)
	}

	repo := repository.NewLLMRepository(postgresDB)
	if err := repo.InitVectorDB(); err != nil {
		log.Fatalf("Vector DB Init failed: %v", err)
	}

	log.Println(" Initializing Vector Database...")
	if err := repo.InitVectorDB(); err != nil {
		log.Fatalf(" Failed to initialize Vector DB: %v", err)
	}
	log.Println(" Vector Database is ready!")

	pythonAddr := os.Getenv("PYTHON_GRPC_ADDR")
	if pythonAddr == "" {
		pythonAddr = "localhost:50051"
	}
	conn, _ := grpc.Dial(pythonAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	grpcClient := pb.NewLLMInferenceClient(conn)

	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		// 📢 ADD your Vite URLs here
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:5174"}, 
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		AllowCredentials: true,
	}))

	ingestHandler := handlers.NewIngestHandler(repo, grpcClient)

	r.Post("/ingest", ingestHandler.HandleIngest)
	r.Post("/ingest-file", ingestHandler.HandleFileIngest)
	r.Delete("/ingest", func(w http.ResponseWriter, r *http.Request) {
		if err := repo.ClearKnowledge(); err != nil {
			http.Error(w, "Failed to clear knowledge", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application.json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"message": "AI Knowledge Base cleared"}`))
	})

	go func() {
		log.Println("Ingestion API starting on port 8083...")
		http.ListenAndServe(":8083", r)
	}()
	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "localhost:6380"
	}
	redisClient, _ := db.InitRedis(redisAddr)

	kafkaBroker := os.Getenv("KAFKA_ADDR")
	if kafkaBroker == "" {
		kafkaBroker = "localhost:9092"
	}
	kafkaProv := messaging.NewKafkaProvider(kafkaBroker)

	reader := kafkaProv.Subscribe(context.Background(), "chat-observations", "llm-service-observer")

	orchestrator := service.NewLLMOrchestrator(redisClient, repo)

	go orchestrator.StartObserving(reader)

	log.Println(" LLM Orchestrator is now listening to Redis...")
	orchestrator.StartListening()

}
