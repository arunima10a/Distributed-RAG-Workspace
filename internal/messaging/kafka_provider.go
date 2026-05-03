package messaging

import (
	"context"
	"encoding/json"
	"github.com/segmentio/kafka-go"
)

type KafkaProvider struct {
	Broker string
	Reader *kafka.Reader
	Writer *kafka.Writer
}

func NewKafkaProvider(broker string) *KafkaProvider {
	return &KafkaProvider{
		Broker: broker,
		Writer : &kafka.Writer{
			Addr: kafka.TCP(broker),
			Balancer: &kafka.LeastBytes{},
		},
	}
}

func (k *KafkaProvider) Publish(ctx context.Context,topic string, msg interface{}) error {
	payload, err := json.Marshal(msg)
	if err != nil {
		return err

	}
	return k.Writer.WriteMessages(ctx, kafka.Message{
		Topic: topic,
		Value: payload,
	})
}
func(k *KafkaProvider) Subscribe(ctx context.Context, topic string, groupID string) *kafka.Reader {
	return kafka.NewReader(kafka.ReaderConfig{
		Brokers: []string{k.Broker},
		GroupID: groupID,
		Topic: topic,
		MaxBytes: 10e6,
	})
}