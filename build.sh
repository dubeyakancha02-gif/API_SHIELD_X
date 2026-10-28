#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "--- Installing frontend dependencies and building production assets ---"
cd frontend
npm install
npm run build
cd ..

echo "--- Installing Python backend dependencies ---"
pip install --upgrade pip
pip install -r backend/requirements.txt

echo "--- Build completed successfully ---"
