#!/bin/bash
# scripts/build-and-push.sh

# Variables
IMAGE_NAME="fernandoamz/truckmatch-api"
TAG=${1:-latest}

echo "🐳 Building Docker image..."
docker build -t $IMAGE_NAME:$TAG .

echo "📤 Pushing to Docker Hub..."
docker push $IMAGE_NAME:$TAG

echo "✅ Image pushed successfully: $IMAGE_NAME:$TAG"
