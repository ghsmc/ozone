#!/bin/bash

# Milo AI Discovery Engine - Deployment Script

echo "🚀 Deploying Milo AI Discovery Engine..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Start the server
echo "🌟 Starting Milo..."
npm run server

echo "✅ Milo is ready!"
