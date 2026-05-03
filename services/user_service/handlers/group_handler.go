package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/arunima10a/llm-collab-system/services/user_service/repository"
)

type GroupHandler struct {
	repo *repository.GroupRepository
}

func NewGroupHandler(repo *repository.GroupRepository) *GroupHandler {
	return &GroupHandler{repo: repo}
}

func (h *GroupHandler) Join(w http.ResponseWriter, r *http.Request) {
	var req struct {
		GroupName string `json:"group_name"`
		Password  string `json:"password"`
		UserID    int    `json:"user_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.UserID == 0 || req.GroupName == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	if err := h.repo.JoinGroup(req.UserID, req.GroupName, req.Password); err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}
	w.Write([]byte("Joined succesfully"))
}

func (h *GroupHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name     string `json:"name"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	if req.Name == "" || req.Password == "" {
		http.Error(w, "Group name and password are required", http.StatusBadRequest)
		return
	}

	if err := h.repo.CreateGroup(req.Name, req.Password); err != nil {
		log.Printf("Failed to create group: %v", err)
		http.Error(w, "Failed to create group (it might already exist)", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("Group created successfully"))
}

func (h *GroupHandler) GetUserGroups(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.URL.Query().Get("user_id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user_id", http.StatusBadRequest)
		return
	}

	groups, err := h.repo.GetGroupsForUser(userID)
	if err != nil {
		http.Error(w, "Failed to fetch groups", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(groups)
}
