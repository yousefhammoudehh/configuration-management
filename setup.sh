#!/bin/bash

# Axis Configuration Management - Setup Script
# This script initializes the development environment

set -e

echo "🚀 Axis Configuration Management - Setup"
echo "=========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose detected"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📋 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🔨 Building Docker images..."
docker compose build

echo ""
echo "📦 Starting services..."
docker compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

echo ""
echo "🏥 Checking service health..."

# Check backend health
echo -n "Checking backend... "
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅"
else
    echo "⚠️  (may still be starting up)"
fi

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo ""
echo "📍 Access the application:"
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:8000"
echo "   API Docs:  http://localhost:8000/docs"
echo ""
echo "📚 Useful Commands:"
echo "   View logs:     docker compose logs -f"
echo "   Stop services: docker compose down"
echo "   Run tests:     docker compose exec backend pytest"
echo ""
echo "📖 For more help, see README.md or run: make help"
echo ""
