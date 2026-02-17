#!/bin/bash

# GA4 Setup Wizard - Production Start Script
# This script handles all cleanup and setup to ensure the app starts cleanly

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT=5001

echo "=========================================="
echo "GA4 Setup Wizard - Starting"
echo "=========================================="
echo ""

# Step 1: Kill any existing processes on the port
echo "🔧 Step 1: Cleaning up old processes..."
pkill -f "node server.js" 2>/dev/null || true
lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
sleep 2
echo "✅ Old processes killed"
echo ""

# Step 2: Check if we're in the right directory
echo "🔧 Step 2: Verifying project directory..."
if [ ! -f "$PROJECT_DIR/server.js" ]; then
    echo "❌ ERROR: server.js not found in $PROJECT_DIR"
    echo "Make sure you're running this script from the GA4-Setup-Wizard folder"
    exit 1
fi
echo "✅ Project directory verified: $PROJECT_DIR"
echo ""

# Step 3: Check if .env exists
echo "🔧 Step 3: Checking credentials..."
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo "❌ ERROR: .env file not found!"
    echo "Please copy .env.example to .env and add your Google credentials"
    exit 1
fi
echo "✅ .env file found"
echo ""

# Step 4: Install dependencies if needed
echo "🔧 Step 4: Checking dependencies..."
if [ ! -d "$PROJECT_DIR/node_modules" ]; then
    echo "Installing dependencies (first time setup)..."
    cd "$PROJECT_DIR"
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi
echo ""

# Step 5: Clean and rebuild React
echo "🔧 Step 5: Building React frontend..."
cd "$PROJECT_DIR"
rm -rf build 2>/dev/null || true
npm run client:build 2>&1 | grep -E "Compiled|error|warning|Error" || true
if [ ! -d "$PROJECT_DIR/build" ]; then
    echo "❌ ERROR: React build failed!"
    exit 1
fi
echo "✅ React build successful"
echo ""

# Step 6: Start the server
echo "🔧 Step 6: Starting server on port $PORT..."
cd "$PROJECT_DIR"
node server.js > /tmp/ga4-server.log 2>&1 &
SERVER_PID=$!
sleep 3

# Step 7: Verify server is running
echo "🔧 Step 7: Verifying server is running..."
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "❌ ERROR: Server failed to start!"
    echo "Last 20 lines of log:"
    tail -20 /tmp/ga4-server.log
    exit 1
fi

# Test the health endpoint
HEALTH_CHECK=$(curl -s http://localhost:$PORT/api/health 2>/dev/null)
if [[ $HEALTH_CHECK == *"ok"* ]]; then
    echo "✅ Server is running and responding"
else
    echo "⚠️  Server started but health check failed"
    echo "Log output:"
    tail -10 /tmp/ga4-server.log
fi
echo ""

# Step 8: Success!
echo "=========================================="
echo "🚀 SUCCESS! GA4 Setup Wizard is running"
echo "=========================================="
echo ""
echo "📱 Open your browser to:"
echo "   http://localhost:$PORT"
echo ""
echo "📋 To view logs:"
echo "   tail -f /tmp/ga4-server.log"
echo ""
echo "🛑 To stop the server:"
echo "   pkill -f 'node server.js'"
echo ""
echo "=========================================="

# Optional: Open browser automatically (macOS)
if command -v open &> /dev/null; then
    sleep 2
    open "http://localhost:$PORT"
    echo "🌐 Browser opening..."
fi
