package db

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

func InitPostgres(dsn string) (*sql.DB, error) {
	if dsn == "" {
        dsn = "postgres://admin:secretpassword@localhost:5433/collab_db?sslmode=disable"
    }
	
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}
	log.Println("Successfully connected to PostgreSQL")

	return db, nil

}
