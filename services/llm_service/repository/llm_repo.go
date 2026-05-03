package repository

import (
	"database/sql"
	"fmt"
	"strings"
)

type LLMRepository struct {
	db *sql.DB
}

func NewLLMRepository(db *sql.DB) *LLMRepository {
	return &LLMRepository{db: db}
}

func formatVector(v []float32) string {
	s := make([]string, len(v))
	for i, f := range v {
		s[i] = fmt.Sprintf("%f", f)
	}
	return "[" + strings.Join(s, ",") + "]"
}

func (r *LLMRepository) InitVectorDB() error {
	query := `
	CREATE EXTENSION IF NOT EXISTS vector;
	CREATE TABLE IF NOT EXISTS document_chunks (
		id SERIAL PRIMARY KEY,
		content TEXT,
		embedding vector(384)
	);`
	_, err := r.db.Exec(query)
	return err

}

func (r *LLMRepository) SaveKnowledge(content string, embedding []float32, room string, userID int) error {
    vectorString := formatVector(embedding)
    query := `INSERT INTO document_chunks (content, embedding, room, user_id) VALUES ($1, $2, $3, $4)`
    _, err := r.db.Exec(query, content, vectorString, room, userID)
    return err
}

func (r *LLMRepository) SearchKnowledge(queryEmbedding []float32, room string, userID int) ([]string, error) {
    vectorString := formatVector(queryEmbedding)
    query := `SELECT content FROM document_chunks 
        WHERE room = $1 AND (user_id = 0 OR user_id = $2) 
        ORDER BY embedding <=> $3 LIMIT 3`
    rows, err := r.db.Query(query, room, userID, vectorString)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []string
	for rows.Next() {
		var content string
		if err := rows.Scan(&content); err != nil {
			return nil, err
		}
		results = append(results, content)

	}
	return results, nil
}

func (r *LLMRepository) GetLastMessages(room string, limit int) ([]string, error) {
	query := `
	SELECT username, content 
	FROM messages 
	WHERE room = $1 
	ORDER BY id DESC 
	LIMIT $2`

	rows, err := r.db.Query(query, room, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var history []string
	for rows.Next() {
		var username, content string
		if err := rows.Scan(&username, &content); err != nil {
			continue
		}
		history = append(history, fmt.Sprintf("%s: %s", username, content))
	}
	for i, j := 0, len(history)-1; i < j; i, j = i+1, j-1 {
		history[i], history[j] = history[j], history[i]
	}

	return history, nil
}

// ClearKnowledge wipes all embeddings from the database
func (r *LLMRepository) ClearKnowledge() error {
	query := `TRUNCATE TABLE document_chunks RESTART IDENTITY;`
	_, err := r.db.Exec(query)
	if err != nil {
		return err
	}
	return nil
}