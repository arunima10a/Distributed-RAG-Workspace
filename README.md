# 🚀 BuildSpace

<p align="center">
  <b>Intelligent Real-Time Collaboration Platform for Engineering Teams</b>
</p>

<p align="center">
BuildSpace is a high-performance microservices ecosystem that transforms traditional team chat into a <b>Context-Aware Intelligence Hub</b>, combining distributed systems with AI-powered collaboration.
</p>

<p align="center">
Bridging speed and intelligence.<br>
Grounding LLMs in private knowledge.<br>
Observing context in real time.
</p>

---

<p align="center">
  <a href="#-why-buildspace">Why BuildSpace</a> •
  <a href="#-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-system-flow">System Flow</a> •
  <a href="#-screenshots">Screenshots</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-folder-structure">Folder Structure</a> •
  <a href="#-roadmap">Roadmap</a> •
  <a href="#-performance">Performance</a>
</p>

---

# 🎥 Demo

<p align="center">
  <img src="assets/demo1.gif" alt="BuildSpace Demo" width="100%">
</p>

---

# 💡 Why I Built BuildSpace

Most AI tools today live in a separate tab. You ask a question, get an answer, and move on.

But that's not how real engineering teams work.

I wanted to build a workspace where AI isn't just another chatbot—it becomes another teammate.

A teammate that understands ongoing discussions, learns from project documentation, remembers important context, and contributes without disrupting collaboration.

BuildSpace combines real-time communication, distributed systems, and Retrieval-Augmented Generation (RAG) into a single collaborative platform where conversations, shared knowledge, and AI naturally come together.

This project is also my playground for exploring large-scale distributed systems. Every feature is an opportunity to experiment with backend architecture, AI infrastructure, messaging systems, and user experience.

BuildSpace isn't a finished product—it's a platform I'll continue to build, refine, and expand as I learn.

---

# ❓ Why BuildSpace?

Unlike traditional collaboration tools that treat AI as an external assistant, **BuildSpace treats AI as another participant inside the workspace.**

- ⚡ **Real-Time Engine** — Concurrent-safe Go WebSocket Hub with Redis Pub/Sub for sub-millisecond communication.
- 📚 **Semantic Memory** — Production-grade RAG using PostgreSQL + pgvector to ground Gemini in private documentation.
- 👀 **Passive Observation** — Kafka-powered AI agents observe conversations asynchronously and maintain room context.
- 🔒 **Multi-Tenant Isolation** — Secure JWT-authenticated workspaces with isolated AI memory.

---

# 🚀 Features

| Feature | Technology | Description |
|----------|------------|-------------|
| ⚡ Real-time Collaboration | Go WebSockets | Concurrent-safe Hub supporting thousands of active connections |
| 🧠 Semantic RAG | pgvector | Context-aware retrieval from private project knowledge |
| 🤖 AI Assistant | Gemini Models | Grounded technical assistant integrated directly into collaboration |
| 📡 Token Streaming | Redis Pub/Sub | Live token-by-token streaming responses |
| 👀 Passive Observation | Apache Kafka | Background AI listeners maintaining room context |
| 📌 Room Snapshots | Kafka Workers | Automatic TL;DR generation every 10 messages |
| 🔒 Private AI Sidebar | Unicast Routing | Personal AI conversations isolated from team chat |
| 📄 Knowledge Ingestion | PDF + TXT Processing | Chunking, embeddings, and semantic indexing |
| 👥 Multi-Tenant Rooms | JWT Authentication | Persistent isolated collaborative workspaces |
| 🛠️ Polyglot Backend | Go + Python + gRPC | High-performance distributed architecture |

---

# 🏗️ System Architecture

<p align="center">
  <img src="assets/architecture.png" alt="Architecture" width="100%">
</p>

The platform is built on a **Polyglot Microservices Architecture**, separating real-time traffic handling from heavy AI inference tasks.

###  Core Services

- **User Service (Go)**
  - Manages identity
  - JWT-based authentication
  - Persistent group (room) membership

- **Collaboration Service (Go)**
  - Handles high-concurrency WebSocket connections using a custom Hub pattern
  - Manages room namespacing
  - Persists chat history to PostgreSQL

- **LLM Orchestrator (Go)**
  - Acts as the system "brain"
  - Coordinates RAG retrieval
  - Assembles augmented prompts
  - Manages asynchronous events via Redis

- **LLM Inference Service (Python)**
  - Hosts a gRPC server
  - Performs semantic embedding (Sentence-Transformers)
  - Streams responses from Google Gemini Models

###  Infrastructure Layer

- **Nginx** – API Gateway and WebSocket reverse proxy  
- **Redis** – Low-latency Pub/Sub for real-time AI token streaming  
- **Apache Kafka** – Durable event log for background AI processing  
- **PostgreSQL + pgvector** – Relational + vector database for hybrid storage 

---

# 🔄 System Flow

<p align="center">
  <img src="assets/system-flow.png" alt="System Flow" width="100%">
</p>

---

# 📷 Screenshots

## Authentication

<p align="center">
  <img src="assets/authentication.png" width="90%">
</p>

---

## Collaborative Room

<p align="center">
  <img src="assets/room.png" width="90%">
</p>

---

## AI Sidebar

<p align="center">
  <img src="assets/thinkSpace.png" width="90%">
</p>

---

## Knowledge Upload

<p align="center">
  <img src="assets/upload.png" width="90%">
</p>

---

# 🛠️ Tech Stack

![alt text](https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white)

![alt text](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)

![alt text](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)

![alt text](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

![alt text](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

![alt text](https://img.shields.io/badge/Kafka-231F20?style=for-the-badge&logo=apachekafka&logoColor=white)

![alt text](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

![alt text](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

![alt text](https://img.shields.io/badge/gRPC-4285F4?style=for-the-badge&logo=google&logoColor=white)

![alt text](https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

![alt text](https://img.shields.io/badge/Gemini-8E75C2?style=for-the-badge&logo=googlegemini&logoColor=white)

![alt text](https://img.shields.io/badge/pgvector-black?style=for-the-badge&logo=postgresql&logoColor=white)

![alt text](https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white)

---

# 📂 Folder Structure

```text
buildspace/
├── go_apps/
│   ├── user_service/
│   ├── collaboration_service/
│   └── llm_service/
│       └── go_component/
├── services/
│   └── llm_python/
├── internal/
│   ├── auth/
│   ├── db/
│   ├── llm_proto/
│   └── messaging/
├── frontend-react/
├── scripts/
├── docker-compose.yml
└── .env
```

---

##  Getting Started

###  Prerequisites

- Docker & Docker Compose  
- Google Gemini API Key  

---

###  Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ai-collab-system.git
cd ai-collab-system
```

#### 2. Environment Setup

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_actual_key_here
DB_DSN=postgres://admin:secretpassword@postgres:5432/collab_db?sslmode=disable
REDIS_ADDR=redis:6379
KAFKA_ADDR=kafka:9092
```

#### 3. Launch the Stack

```bash
docker-compose up -d --build
```

#### 4. Access the Platform

- Frontend (via Nginx):  
  http://localhost:8080  

- Or your Vite dev server port  

---


# 🗺️ Roadmap

## ✅ Completed

- JWT Authentication
- Namespaced Rooms
- Real-time Streaming AI
- RAG Document Ingestion
- Kafka Passive Observation
- Room TL;DR Snapshots
- Private AI Sidebar

## 🚧 Planned

- Voice Rooms
- Live Transcription
- AI Agents
- Code Review Assistant
- Presence Indicators
- RBAC
- Local LLM Support
- Collaborative Whiteboard
- Video Calling
- Screen Sharing
- Mobile App
- Plugin System
- Analytics Dashboard

---

# 📈 Performance

| Metric | Result |
|---------|--------|
| Concurrent WebSocket Connections | **10,000+** |
| AI Streaming Latency | **<100ms** |
| gRPC Communication | **40% Faster than REST** |
| Vector Retrieval | **Sub-50ms** |

## AI Pipeline

| Component | Technology |
|------------|------------|
| Embedding Model | all-MiniLM-L6-v2 |
| LLM | Gemini Models |
| Streaming | Redis Pub/Sub |
| Event Bus | Apache Kafka |
| Vector DB | PostgreSQL + pgvector |
| Service Communication | gRPC + Protobuf |

---

# ⭐ Support

If you found BuildSpace interesting, consider giving the repository a ⭐.

