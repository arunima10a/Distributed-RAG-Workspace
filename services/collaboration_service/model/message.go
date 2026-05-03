package model

type ChatMessage struct {
	Username    string `json:"username"`
	Content     string `json:"content"`
	UserID      int    `json:"user_id"`
	Room        string `json:"room"`
	RecipientID int    `json:"recipient_id"`
	IsPrivate   bool   `json:"is_private"`
}
