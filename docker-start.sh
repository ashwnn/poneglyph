#!/bin/bash

# Poneglyph Docker Startup Script
set -e

echo "🚀 Poneglyph Docker Setup"
echo "========================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env.docker exists
if [ ! -f .env.docker ]; then
    echo "📝 Creating .env.docker from template..."
    cp .env.docker.example .env.docker
    
    echo ""
    echo "⚠️  Please configure .env.docker with your settings:"
    echo ""
    echo "1. Generate NEXTAUTH_SECRET:"
    echo "   openssl rand -base64 32"
    echo ""
    echo "2. Generate ENCRYPTION_KEY:"
    echo "   openssl rand -hex 32"
    echo ""
    echo "3. Edit .env.docker and add these values"
    echo ""
    read -p "Press Enter when you've configured .env.docker..."
fi

# Validate required environment variables
echo "🔍 Validating environment variables..."
source .env.docker

if [ -z "$NEXTAUTH_SECRET" ] || [ "$NEXTAUTH_SECRET" = "generate_with_openssl_rand_base64_32" ]; then
    echo "❌ NEXTAUTH_SECRET is not set. Please configure .env.docker"
    exit 1
fi

if [ -z "$ENCRYPTION_KEY" ] || [ "$ENCRYPTION_KEY" = "generate_with_openssl_rand_hex_32" ]; then
    echo "❌ ENCRYPTION_KEY is not set. Please configure .env.docker"
    exit 1
fi

echo "✅ Environment variables validated"
echo ""

# Build and start services
echo "🏗️  Building and starting services..."
docker-compose --env-file .env.docker up -d --build

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "✅ Services started successfully!"
    echo ""
    echo "📱 Application: http://localhost:${APP_PORT:-3000}"
    echo "🗄️  Database: localhost:${POSTGRES_PORT:-5432}"
    echo ""
    echo "📋 Useful commands:"
    echo "  View logs:        docker-compose logs -f"
    echo "  Stop services:    docker-compose down"
    echo "  Restart:          docker-compose restart"
    echo ""
    echo "📖 See DOCKER.md for more information"
else
    echo ""
    echo "❌ Services failed to start. Check logs:"
    echo "   docker-compose logs"
    exit 1
fi
