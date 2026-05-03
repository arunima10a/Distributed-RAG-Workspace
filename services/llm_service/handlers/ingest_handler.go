package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/ledongthuc/pdf"

	pb "github.com/arunima10a/llm-collab-system/internal/llm_proto"
	"github.com/arunima10a/llm-collab-system/services/llm_service/repository"
)

type IngestRequest struct {
	Content string `json:"content"`
}

type Ingesthandler struct {
	repo       *repository.LLMRepository
	grpcClient pb.LLMInferenceClient
}

func NewIngestHandler(repo *repository.LLMRepository, client pb.LLMInferenceClient) *Ingesthandler {
	return &Ingesthandler{
		repo:       repo,
		grpcClient: client,
	}
}

func (h *Ingesthandler) HandleIngest(w http.ResponseWriter, r *http.Request) {
	// Read room and user_id from query params
	room := r.URL.Query().Get("room")
	if room == "" {
		room = "general"
	}
	userIDStr := r.URL.Query().Get("user_id")
	userID := 0
	if userIDStr != "" {
		if parsed, err := strconv.Atoi(userIDStr); err == nil {
			userID = parsed
		}
	}

	var req IngestRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid Request", http.StatusBadRequest)
		return
	}
	resp, err := h.grpcClient.GetEmbedding(context.Background(), &pb.EmbeddingRequest{
		Text: req.Content,
	})
	if err != nil {
		http.Error(w, "Failed to generate embedding", http.StatusInternalServerError)
		return
	}

	if err := h.repo.SaveKnowledge(req.Content, resp.Embedding, room, userID); err != nil {
		http.Error(w, "Failed to save knowledge", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func chunkText(text string, size int, overlap int) []string {
	var chunks []string
	runes := []rune(text)

	for i := 0; i < len(runes); i += size - overlap {
		end := i + size
		if end > len(runes) {
			end = len(runes)
		}
		chunks = append(chunks, string(runes[i:end]))
		if end == len(runes) {
			break
		}
	}
	return chunks
}

func extractTextFromPDF(fileContent []byte) (string, error) {
	r := bytes.NewReader(fileContent)
	res, err := pdf.NewReader(r, int64(len(fileContent)))
	if err != nil {
		return "", err
	}

	var buf bytes.Buffer
	b, err := res.GetPlainText()
	if err != nil {
		return "", err
	}
	buf.ReadFrom(b)
	return buf.String(), nil
}

func (h *Ingesthandler) HandleFileIngest(w http.ResponseWriter, r *http.Request) {
	// Same — read from query params
	room := r.URL.Query().Get("room")
	if room == "" {
		room = "general"
	}
	userIDStr := r.URL.Query().Get("user_id")
	userID := 0
	if userIDStr != "" {
		if parsed, err := strconv.Atoi(userIDStr); err == nil {
			userID = parsed
		}
	}

	r.ParseMultipartForm(10 << 20)
	file, _, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Invalid file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	var buf bytes.Buffer
	buf.ReadFrom(file)

	content, err := extractTextFromPDF(buf.Bytes())
	if err != nil {
		log.Println("Note: Not a valid PDF, reading as plain text")
		content = buf.String()
	}
	chunks := chunkText(content, 500, 100)
	log.Printf("Processing file: split into %d chunks", len(chunks))

	for _, chunk := range chunks {
		resp, err := h.grpcClient.GetEmbedding(context.Background(), &pb.EmbeddingRequest{Text: chunk})
		if err != nil {
			log.Printf("Failed chunk: %v", err)
			continue
		}
		h.repo.SaveKnowledge(chunk, resp.Embedding, room, userID)
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Document ingested and chunked successfully"})
}
