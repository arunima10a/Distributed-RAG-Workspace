#  AI-Powered Real-Time Collaborative Workspace

A distributed, microservices-based platform enabling real-time team collaboration with an integrated, context-aware AI Assistant. This system utilizes a Retrieval-Augmented Generation (RAG) pipeline to ground AI responses in private project data and conversation history.

---

##  System Architecture

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
  - Streams responses from Google Gemini 1.5 Flash

###  Infrastructure Layer

- **Nginx** – API Gateway and WebSocket reverse proxy  
- **Redis** – Low-latency Pub/Sub for real-time AI token streaming  
- **Apache Kafka** – Durable event log for background AI processing  
- **PostgreSQL + pgvector** – Relational + vector database for hybrid storage  

---

##  Key Features

### 1.  Intelligent Collaboration

- **Real-Time Messaging**
  - Bi-directional communication with near zero latency

- **Namespaced Rooms**
  - Multi-tenant isolation (e.g., `#science`, `#dev`)

- **Persistent Groups**
  - Password-protected rooms
  - Join once → access forever

---

### 2.  Context-Aware AI (RAG)

- **Hybrid Context Awareness**
  - Chat history (PostgreSQL)
  - Documents (pgvector embeddings)

- **Streaming Responses**
  - Token-by-token delivery via WebSockets
  - Real-time typing effect

- **Passive AI Observation**
  - Kafka-based background worker
  - Generates automatic **Room Snapshots (TL;DRs)** every 10 messages

---

### 3.  Dynamic Knowledge Management

- **Live Training**
  - Users can teach the AI directly from UI

- **Document Ingestion**
  - Supports PDF & TXT uploads

- **Smart Chunking with Overlap**
  - Prevents context loss during embedding

---

### 4.  Personal Copilot Sidebar

- Private AI chat interface  
- Ask questions about room context  
- Keeps main chat clean and focused  

---

##  Tech Stack

###  Backend
- Go (Golang)
- Python

###  Frontend
- React
- Vite
- Tailwind CSS v4
- Lucide Icons

###  Communication
- gRPC
- Protobuf
- WebSockets
- Redis Pub/Sub
- Apache Kafka

###  Database
- PostgreSQL (pgvector)
- Redis (Caching)

###  Deployment
- Docker
- Docker Compose
- Nginx

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

##  Core Engineering Lessons

- **Cross-Language Integration**
  - Bridging Go & Python via gRPC  
  - Combines performance (Go) with ML ecosystem (Python)

- **Event-Driven Design**
  - Redis & Kafka for decoupling services  
  - Keeps UI responsive during heavy AI tasks  

- **Vector Search**
  - Semantic retrieval using pgvector  
  - Solves the "small context window" limitation of LLMs  

---

##  Future Improvements

- Role-based access control (RBAC)  
- Multi-modal document ingestion (images, audio)  
- Fine-tuned local LLM support  
- Advanced analytics dashboard  


