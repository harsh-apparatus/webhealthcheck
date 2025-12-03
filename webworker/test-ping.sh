#!/bin/bash

# Test script for webworker ping endpoint

echo "Testing webworker ping endpoint..."
echo ""

# Test 1: Valid URL
echo "Test 1: Pinging Google..."
curl -X POST http://localhost:4001/ping \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "url": "https://www.google.com",
    "isHttps": true
  }' | jq '.'

echo ""
echo "---"
echo ""

# Test 2: Invalid URL
echo "Test 2: Pinging invalid URL..."
curl -X POST http://localhost:4001/ping \
  -H "Content-Type: application/json" \
  -d '{
    "id": 2,
    "url": "https://this-url-does-not-exist-12345.com",
    "isHttps": true
  }' | jq '.'

echo ""
echo "---"
echo ""

# Test 3: HTTP URL
echo "Test 3: Pinging HTTP URL..."
curl -X POST http://localhost:4001/ping \
  -H "Content-Type: application/json" \
  -d '{
    "id": 3,
    "url": "http://example.com",
    "isHttps": false
  }' | jq '.'

echo ""
echo "---"
echo ""

# Test 4: Health check
echo "Test 4: Health check..."
curl http://localhost:4001/health | jq '.'

