package main

import (
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/arunima10a/llm-collab-system/internal/db"
	"github.com/arunima10a/llm-collab-system/internal/messaging"
	"github.com/arunima10a/llm-collab-system/services/collaboration_service/handlers"
	"github.com/arunima10a/llm-collab-system/services/collaboration_service/service"
)

func main() {
	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:5174"}, 
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		AllowCredentials: true,
	}))

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "localhost:6380"
	}

	redisClient, err := db.InitRedis(redisAddr)
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	defer redisClient.Close()

	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		dsn = "postgres://admin:secretpassword@localhost:5433/collab_db?sslmode=disable"
	}

	dbConn, err := db.InitPostgres(dsn)
	if err != nil {
		log.Fatalf("Postgres connection failed: %v", err)
	}

	kafkaBroker := os.Getenv("KAFKA_ADDR")
	if kafkaBroker == "" { kafkaBroker = "localhost:9092"}
	kafkaProv := messaging.NewKafkaProvider(kafkaBroker)

	hub := service.NewHub(dbConn, kafkaProv)

	if err := hub.InitDatabase(); err != nil {
		log.Fatalf("Failed to create messages table: %v", err)
	}

	go hub.Run()

	go hub.ListenToRedisForAI(redisClient)

	r.Get("/ws", handlers.HandleConnections(hub, redisClient, dbConn))

	port := "8082"
	log.Printf("Starting Collaboration Service on port %s...", port)

	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}

}
