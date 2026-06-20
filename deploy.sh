#!/bin/bash
set -e

if [ ! -f .env ]; then
    echo "Missing environment variables"
    exit 1
fi

echo "Fetching latest code..."
git pull origin main

echo "Rebuilding and restarting the container..."
docker-compose up -d --build

echo "Cleaning up old images..."
docker image prune -f

echo "Deployment completed!"