# Webworker Service

A Node.js service that handles URL pinging for the web health check monitoring system.

## Overview

The webworker service provides a simple API endpoint to ping URLs and return detailed results including status codes, response times, and error messages. It does not have direct database access - results are returned to the caller who handles storage.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set environment variables (optional):
- `PORT` - Server port (default: 4001)

3. Run the service:
```bash
npm run dev    # Development mode
npm run build  # Build for production
npm start      # Production mode
```

## API Endpoints

### POST /ping

Ping a URL and get detailed results.

**Request Body:**
```json
{
  "id": 1,
  "url": "https://example.com",
  "isHttps": true
}
```

**Response:**
```json
{
  "monitorId": 1,
  "pingMs": 245,
  "statusCode": 200,
  "isUp": true,
  "bodySnippet": "<html>...",
  "error": null
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "webworker",
  "time": "2024-01-01T00:00:00.000Z"
}
```

## Configuration

The webworker uses a 10-second timeout for all ping requests. This can be modified in `src/services/pingService.ts`.

