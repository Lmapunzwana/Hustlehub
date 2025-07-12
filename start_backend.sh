
#!/bin/bash

# Start Redis in background
echo "Starting Redis server..."
./redis-stable/src/redis-server redis.conf &
REDIS_PID=$!

# Wait a moment for Redis to start
sleep 2

# Install Python dependencies if not already installed
if [ ! -d "venv" ]; then
    echo "Setting up Python environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r backend/requirements.txt
else
    source venv/bin/activate
fi

# Start FastAPI server
echo "Starting FastAPI server..."
cd backend
python main.py &
FASTAPI_PID=$!

echo "Backend services started!"
echo "Redis PID: $REDIS_PID"
echo "FastAPI PID: $FASTAPI_PID"

# Wait for both processes
wait $REDIS_PID $FASTAPI_PID
