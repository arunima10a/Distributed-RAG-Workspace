package repository

import (
	"database/sql"
	"fmt"

	"github.com/arunima10a/llm-collab-system/services/user_service/model"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) InitTable() error {
	query := `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		username VARCHAR(50) UNIQUE NOT NULL,
		email VARCHAR(255) UNIQUE NOT NULL,
		password_hash VARCHAR(255) NOT NULL,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);`

	_, err := r.db.Exec(query)
	return err
}

func (r *UserRepository) CreateUser(user *model.User) error {
	query := `
	INSERT INTO users (username, email, password_hash) 
		VALUES ($1, $2, $3) 
		RETURNING id, created_at`

	err := r.db.QueryRow(query, user.Username, user.Email, user.PasswordHash).Scan(&user.ID, &user.CreatedAt)
	if err != nil {
		return fmt.Errorf("failed to isert user: %w", err)
	}
	return nil
}

func (r *UserRepository) GetUserByEmail(email string)(*model.User, error){
	query := `SELECT id, username, email, password_hash, created_at FROM 
	users WHERE email = $1`

	user := &model.User{}
	err := r.db.QueryRow(query, email).Scan(&user.ID, &user.Username, &user.Email, 
		&user.PasswordHash, &user.CreatedAt)
		if err != nil {
			if err == sql.ErrNoRows {
				return nil, fmt.Errorf("user not found")
			}
			return nil, fmt.Errorf("database error: %w", err)
		}
		return user, nil
}
