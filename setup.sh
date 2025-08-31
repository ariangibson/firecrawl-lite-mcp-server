#!/bin/bash

#!/bin/bash

# Simple MCP server setup

set -e

echo "🔥 Setting up Simple Firecrawl MCP Server..."
echo "=========================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit the .env file with your LLM API key!"
fi

# Build and start the MCP server
echo "🐳 Building and starting MCP server..."
if command -v docker-compose &> /dev/null; then
    docker-compose up -d --build
else
    docker compose up -d --build
fi

echo ""
echo "✅ Setup complete!"
echo "=================="
echo ""
echo "🌐 MCP Server: http://localhost:3001"
echo ""
echo "📊 View logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Stop:"
echo "   docker-compose down"
echo ""
echo "⚠️  Remember to add your LLM_API_KEY to .env"
