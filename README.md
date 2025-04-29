
# Document Analysis App with Docker Model Runner

This application allows you to upload PDF documents, extract text, and analyze the content using a locally running LLM via Docker Model Runner.

## Prerequisites

- Docker Desktop (version 4.40 or later) with Docker Model Runner enabled
- The Llama 3 model pulled locally (`docker model pull ai/llama3`)

## Setup Instructions

1. Enable Docker Model Runner in Docker Desktop
   ```
   docker desktop enable model-runner
   ```

2. Pull the Llama 3 model
   ```
   docker model pull ai/llama3
   ```

3. Start the application
   ```
   docker-compose up -d
   ```

4. Access the application at http://localhost:3000

## Architecture

This application consists of:

- Frontend: React application with document upload capability
- Backend (MCP Server): Express.js server that extracts text from PDFs and calls Docker Model Runner
- Docker Model Runner: Runs the Llama 3 model locally
- Observability Stack: OpenTelemetry, Jaeger, Prometheus, and Grafana for monitoring

## Monitoring

- Jaeger UI: http://localhost:16686
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (admin/admin)

## License

MIT
