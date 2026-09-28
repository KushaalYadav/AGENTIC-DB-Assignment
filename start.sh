#!/bin/bash

echo "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed or not in your PATH."
    echo "Please download and install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check Ollama is reachable
if ! curl -s http://localhost:11434 > /dev/null; then
    echo "[ERROR] Ollama is not running or not reachable at http://localhost:11434."
    echo "Please make sure Ollama is installed and running."
    echo "Download link: https://ollama.com/download"
    exit 1
fi

# Check if qwen2.5:1.5b is pulled
echo "Checking local model qwen2.5:1.5b..."
if ! ollama list | grep -q "qwen2.5:1.5b"; then
    echo "Model qwen2.5:1.5b not found locally. Pulling now..."
    ollama pull qwen2.5:1.5b
fi

# Check if node_modules exists, if not run install-all
if [ ! -d "node_modules" ]; then
    echo "node_modules not found. Installing dependencies..."
    npm install
    npm run install-all
fi

echo "Starting application..."
npm run dev
