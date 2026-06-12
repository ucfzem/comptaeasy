#!/bin/bash
set -e

echo "=== ComptaEasy Deploy ==="

if [ -z "$RENDER_TOKEN" ]; then
  echo "RENDER_TOKEN not set. Deploying locally with Docker..."
  docker compose up --build -d
  echo "✓ Running on http://localhost:3000"
  exit 0
fi

echo "Deploying to Render..."
curl -s -X POST "https://api.render.com/v1/services" \
  -H "Authorization: Bearer $RENDER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "web_service",
    "name": "comptaeasy-api",
    "repo": "https://github.com/ucfzem/comptaeasy",
    "branch": "main",
    "runtime": "node",
    "buildCommand": "npm install",
    "startCommand": "npm start",
    "envVars": [
      {"key": "NODE_VERSION", "value": "20"},
      {"key": "PORT", "value": "3000"}
    ]
  }' | head -5

echo "✓ Deploy triggered"
