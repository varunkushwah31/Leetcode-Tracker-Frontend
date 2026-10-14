#!/usr/bin/env bash
set -e

echo "=================================================================="
echo "Initializing MentorSync Development Environment..."
echo "=================================================================="

# Ensure Maven wrapper is executable
if [ -f "Backend/mvnw" ]; then
  chmod +x Backend/mvnw
  echo "[OK] Marked Backend/mvnw as executable"
fi

# Install Frontend dependencies
if [ -d "Frontend" ]; then
  echo "Installing Frontend dependencies (npm)..."
  cd Frontend
  npm install
  cd ..
  echo "[OK] Frontend dependencies installed"
fi

# Pre-fetch Backend dependencies
if [ -d "Backend" ]; then
  echo "Warming up Backend dependencies (Maven)..."
  cd Backend
  ./mvnw dependency:resolve -B -q || mvn dependency:resolve -B -q || true
  cd ..
  echo "[OK] Backend dependencies cached"
fi

echo ""
echo "=================================================================="
echo "MentorSync Dev Container Ready!"
echo "=================================================================="
echo "• MongoDB is running at:  mongodb://mongodb:27017/LeetcodeTracker"
echo "• Redis is running at:    redis:6379"
echo ""
echo "Quick Start Commands:"
echo "  1) Start Backend (Spring Boot API on :8080):"
echo "     cd Backend && ./mvnw spring-boot:run"
echo ""
echo "  2) Start Frontend (React Vite on :5173):"
echo "     cd Frontend && npm run dev"
echo ""
echo "  3) Or run both simultaneously with VS Code Tasks:"
echo "     Cmd+Shift+P -> Tasks: Run Task -> 'Start Full Stack (Backend + Frontend)'"
echo "=================================================================="
