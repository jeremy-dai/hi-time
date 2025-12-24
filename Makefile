.PHONY: help install start web api clean

# Ports
FRONTEND_PORT = 5173
API_PORT = 8001

# Default target
.DEFAULT_GOAL := help

help:
	@echo "Time Tracker - Available Commands"
	@echo "=================================="
	@echo ""
	@echo "  make install    Install dependencies"
	@echo "  make start      Start frontend and backend"
	@echo "  make web        Start frontend only"
	@echo "  make api        Start backend only"
	@echo "  make clean      Clean output directories"
	@echo ""

install:
	@echo "📦 Installing dependencies..."
	@npm install
	@echo "✅ Done"

start:
	@echo "🔪 Killing ports if in use..."
	@lsof -ti:$(FRONTEND_PORT) | xargs kill -9 2>/dev/null || true
	@lsof -ti:$(API_PORT) | xargs kill -9 2>/dev/null || true
	@echo "🚀 Starting frontend and backend..."
	@npm run dev

web:
	@echo "🔪 Killing port $(FRONTEND_PORT) if in use..."
	@lsof -ti:$(FRONTEND_PORT) | xargs kill -9 2>/dev/null || true
	@echo "🌐 Starting frontend on http://localhost:$(FRONTEND_PORT)..."
	@npm run dev --workspace=time-tracker

api:
	@echo "🔪 Killing port $(API_PORT) if in use..."
	@lsof -ti:$(API_PORT) | xargs kill -9 2>/dev/null || true
	@echo "🛠️  Starting API on http://localhost:$(API_PORT)..."
	@npm run start --workspace=api

clean:
	@echo "🧹 Cleaning output directories..."
	@rm -rf time_analysis_output/ output/
	@echo "✨ Done"
