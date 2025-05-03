
# Document Analysis App with Docker Model Runner

This application allows you to upload PDF documents, extract text, and analyze the content using a locally running LLM via Docker Model Runner.

## Prerequisites

- Docker Desktop (version 4.40 or later) with Docker Model Runner enabled
- The Llama 3 model pulled locally (`docker model pull ai/llama3.2:1B-Q8_0`)

## Setup Instructions

1. Enable Docker Model Runner in Docker Desktop
   ```
   docker desktop enable model-runner
   ```

2. Pull the Llama 3 model
   ```
   docker model pull ai/llama3.2:1B-Q8_0
   ```

3. Start the application
   ```
   docker-compose up -d
   ```

## Accessing the Application

- **Document Analysis App**: http://localhost:8080
  - Upload PDF documents for AI-powered analysis
  - View extracted insights and summaries

## Monitoring and Observability

The application includes a comprehensive observability stack:

- **Jaeger UI (Distributed Tracing)**: http://localhost:16686
  - Monitor request flows across services
  - Analyze performance bottlenecks

- **Prometheus (Metrics)**: http://localhost:9090
  - Query system and application metrics
  - Monitor resource usage and performance

- **Grafana (Dashboards)**: http://localhost:3001
  - View preconfigured dashboards
  - Default credentials: admin/admin

## Application Architecture

This application consists of:

- **Frontend**: React application with document upload capability (port 8080)
- **Backend (MCP Server)**: Express.js server that extracts text from PDFs and calls Docker Model Runner (port 3000)
- **Docker Model Runner**: Docker Desktop extension that runs the Llama 3 model locally
- **Observability Stack**: OpenTelemetry, Jaeger, Prometheus, and Grafana for monitoring

## User Guide

1. Access the application at http://localhost:8080
2. Drag and drop a PDF file onto the upload area, or click "Browse Files"
3. Wait for the analysis to complete
4. Review the generated insights, summary, and key points

## Troubleshooting

- If you're unable to access the application, check if all containers are running with `docker-compose ps`
- View logs for specific services with `docker-compose logs [service-name]` (e.g., `docker-compose logs frontend`)
- Ensure Docker Model Runner is enabled in Docker Desktop settings

## License

MIT
