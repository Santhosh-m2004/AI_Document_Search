#!/bin/bash

# Build the backend
echo "Building backend..."
cd backend
npm install
cd ..

# Build the frontend
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Build completed successfully!"