
#!/bin/bash

# Install Redis on Replit
echo "Installing Redis..."

# Download and install Redis
wget http://download.redis.io/redis-stable.tar.gz
tar xvzf redis-stable.tar.gz
cd redis-stable
make

# Create Redis configuration
mkdir -p ../redis-data
cat > ../redis.conf << EOF
# Redis configuration for Replit
port 6379
bind 0.0.0.0
dir ./redis-data
save 900 1
save 300 10
save 60 10000
EOF

echo "Redis installed successfully!"
echo "Run './redis-stable/src/redis-server ../redis.conf' to start Redis"
