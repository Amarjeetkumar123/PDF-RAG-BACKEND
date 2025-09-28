# PDF RAG Backend Server

A Node.js backend service for PDF-based Retrieval Augmented Generation (RAG) using Azure OpenAI, Qdrant vector database, and BullMQ for job processing.

## Architecture

- **Application**: Single container running both API server and background worker
- **API Server**: Express.js server handling file uploads and chat queries
- **Worker**: Background job processor for PDF parsing and vectorization
- **Valkey**: Redis-compatible in-memory data store for job queues
- **Qdrant**: Vector database for storing document embeddings

## Project Structure

```
server/
├── src/
│   ├── routers/          # API route handlers
│   │   ├── uploadRouter.js
│   │   └── chatRouter.js
│   ├── services/         # Business logic services
│   │   ├── aiService.js
│   │   ├── queueService.js
│   │   └── vectorService.js
│   ├── jobs/            # Background job processors
│   │   └── pdfProcessingJob.js
│   └── utils/           # Utility functions
│       └── logger.js
├── app.js               # Main application entry point
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Prerequisites

- Docker and Docker Compose
- Azure OpenAI API keys and configuration

## Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Server Configuration
PORT=8000
NODE_ENV=production
LOG_LEVEL=info

# BullMQ Configuration
BULLMQ_HOST=valkey
BULLMQ_PORT=6379

# Qdrant Configuration
QDRANT_URL=http://qdrant:6333
QDRANT_COLLECTION=pdf-docs

# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_API_INSTANCE_NAME=your_azure_openai_instance_name_here
AZURE_OPENAI_API_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2023-05-15

# Azure OpenAI Embeddings Configuration
AZURE_OPENAI_EMBEDDINGS_API_KEY=your_azure_openai_embeddings_api_key_here
AZURE_OPENAI_EMBEDDINGS_INSTANCE_NAME=your_azure_openai_embeddings_instance_name_here
AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT_NAME=text-embedding-3-small
AZURE_OPENAI_EMBEDDINGS_API_VERSION=2023-05-15
```

## Quick Start

1. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual Azure OpenAI credentials
   ```

2. **Start all services**:
   ```bash
   docker-compose up -d
   ```

3. **Check service status**:
   ```bash
   docker-compose ps
   ```

4. **View logs**:
   ```bash
   docker-compose logs -f
   ```

## Available Scripts

- `npm run start` - Start the server
- `npm run start:worker` - Start the worker
- `npm run dev` - Start server in development mode with auto-reload
- `npm run worker` - Start worker in development mode with auto-reload
- `npm run docker:up` - Start all services with Docker Compose
- `npm run docker:down` - Stop all services
- `npm run docker:logs` - View logs from all services
- `npm run docker:restart` - Restart all services

## API Endpoints

### Upload PDF
```
POST /upload/pdf
Content-Type: multipart/form-data
Body: pdf file
```

### Chat Query
```
GET /chat?message=your_question_here
```

## Services

- **Application**: http://localhost:8000 (API + Worker)
- **Qdrant**: http://localhost:6333
- **Valkey**: localhost:6388

## Development

For local development without Docker:

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start Valkey and Qdrant:
   ```bash
   docker-compose up valkey qdrant -d
   ```

3. Start the application (server + worker):
   ```bash
   npm run dev
   ```

## Production Deployment

The application is containerized and ready for production deployment. All services run in Docker containers with proper networking and volume management.

### Scaling

The application runs both server and worker in a single container. For horizontal scaling, you can run multiple instances of the application container:

```bash
docker-compose up -d --scale app=3
```

### Data Persistence

- Valkey data is persisted in the `valkey_data` volume
- Qdrant data is persisted in the `qdrant_data` volume
- Uploaded files are stored in the `./uploads` directory

## Troubleshooting

1. **Check service logs**:
   ```bash
   docker-compose logs [service-name]
   ```

2. **Restart services**:
   ```bash
   docker-compose restart [service-name]
   ```

3. **Rebuild containers**:
   ```bash
   docker-compose up -d --build
   ```
