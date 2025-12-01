#!/bin/bash

echo "Starting services..."
docker-compose up -d

echo "Waiting for services to start..."
sleep 3

echo "Starting Orchestrator..."
cd orchestator && bun run index.ts &
ORCHESTRATOR_PID=$!
cd ..

echo "Starting Lambda..."
cd lambda && bun run index.ts &
LAMBDA_PID=$!
cd ..

echo "Starting Backend..."
cd backend && python server.py &
BACKEND_PID=$!
cd ..

echo "Starting frontend..."
cd client && pnpm dev &
FRONTEND_PID=$!
cd ..

echo "All services started successfully"
echo "Press Ctrl+C to stop all services"

# Trap SIGINT and SIGTERM to cleanup background processes
trap "echo 'Stopping all services...'; kill $ORCHESTRATOR_PID $LAMBDA_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null; docker-compose down; exit" SIGINT SIGTERM

# Wait for all background processes
wait