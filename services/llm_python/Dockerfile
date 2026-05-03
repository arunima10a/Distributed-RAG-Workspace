FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip

# install CPU-only torch first
RUN pip install torch --index-url https://download.pytorch.org/whl/cpu

# 1. Copy requirements from the context (root) to the container
COPY services/llm_python/requirements.txt .
RUN pip install -r requirements.txt

# 2. Pre-download the model
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# 3. Copy the code and internal folder
COPY services/llm_python/ ./services/llm_python/
COPY internal/ ./internal/

ENV PYTHONPATH=/app
EXPOSE 50051

CMD ["python", "services/llm_python/main.py"]