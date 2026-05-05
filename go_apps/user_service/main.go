package main

import (
	"log"
	"net/http"

	"github.com/arunima10a/llm-collab-system/internal/db"
	"github.com/arunima10a/llm-collab-system/services/user_service/handlers"
	"github.com/arunima10a/llm-collab-system/services/user_service/repository"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {

	dsn := "postgres://admin:secretpassword@localhost:5433/collab_db?sslmode=disable"

	postgresDB, err := db.InitPostgres(dsn)
	if err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}
	defer postgresDB.Close()

	userRepo := repository.NewUserRepository(postgresDB)
	if err := userRepo.InitTable(); err != nil {
		log.Fatalf("Failed to initialize users table: %v", err)
	}

	authHandler := handlers.NewAuthHandler(userRepo)

	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:5174"}, 
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		AllowCredentials: true,
	}))

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("User Service is healthy and running"))
	})
	r.Post("/register", authHandler.Register)
	r.Post("/login", authHandler.Login)

	groupRepo := repository.NewGroupRepository(postgresDB)
	groupHandler := handlers.NewGroupHandler(groupRepo)
	

	r.Post("/groups/create", groupHandler.Create)
	r.Post("/groups/join", groupHandler.Join)
	r.Get("/groups/my-groups", groupHandler.GetUserGroups)
	

	port := "8081"

	log.Printf("Starting User Service on port %s...", port)

	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
