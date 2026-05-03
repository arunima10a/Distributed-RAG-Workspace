package messaging

import "context"

type Message struct {
	Channel  string `json:"channel"`
	Username string `json:"username"`
	Content  string `json:"content"`
	Room     string `json:"room"`
	Intent   string `json:"intent"`
}

type MessageProvider interface {
	Publish(ctx context.Context, channel string, payload []byte) error
	Subscribe(ctx context.Context, channel string) (<-chan []byte, error)
}
