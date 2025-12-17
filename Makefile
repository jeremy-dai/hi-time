.PHONY: help install setup dev web api kill-port-3000 clean clean-branches status lint format

# Default target
help:
	@echo "Time Analysis Tool - Available Commands"
	@echo "========================================"
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make install          - Install dependencies using uv"
	@echo "  make setup            - Full project setup with uv (create venv + install)"
	@echo "  make dev              - Setup development environment"
	@echo ""
	@echo "Running the Application:"
	@echo "  make web              - Start React/Vite front-end (port 5173)"
	@echo "  make api              - Start Node.js API (port 8001)"
	@echo "  make kill-port-3000   - Kill any process running on port 3000"
	@echo ""
	@echo "Git & Branch Management:"
	@echo "  make clean-branches   - Remove local branches that no longer exist on remote"
	@echo "  make fetch            - Fetch latest changes from remote"
	@echo "  make status           - Show git status"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean            - Clean output directories"
	@echo ""
	@echo "Development:"
	@echo "  make lint             - Run linting checks"
	@echo "  make format           - Format code"
	@echo ""

# ============================================
# Setup & Installation
# ============================================

install:
	@echo "📦 Installing front-end dependencies..."
	cd time-tracker && npm install
	@echo "📦 Installing API dependencies..."
	cd api && npm install
	@echo "✅ Dependencies installed successfully!"

setup: install
	@echo "🚀 Setup complete!"

dev: setup
	@echo "🔧 Setting up development environment..."
	@if [ ! -f .env ]; then \
		echo "Creating .env file from template..."; \
		cp .env.example .env; \
		echo "✅ .env file created. Please add your API keys."; \
	else \
		echo "✅ .env file already exists."; \
	fi
	@echo "✅ Development environment ready!"

# ============================================
# Running the Application
# ============================================

web:
	@echo "🌐 Starting React/Vite front-end on http://localhost:5173 ..."
	cd time-tracker && npm run dev

api:
	@echo "🛠️  Starting Node.js API on http://localhost:8001 ..."
	cd api && npm run start

kill-port-3000:
	@echo "🔪 Checking for processes on port 3000..."
	@lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "   No process found on port 3000"

 

# ============================================
# Git & Branch Management
# ============================================

fetch:
	@echo "📡 Fetching latest changes from remote..."
	git fetch origin --prune
	@echo "✅ Fetch complete!"

clean-branches: fetch
	@echo "🧹 Cleaning up local branches that no longer exist on remote..."
	@echo ""
	@echo "Branches to be deleted:"
	@git branch -vv | grep ': gone]' | awk '{print $$1}' || echo "  (none)"
	@echo ""
	@read -p "Continue with deletion? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		git branch -vv | grep ': gone]' | awk '{print $$1}' | xargs -r git branch -D; \
		echo "✅ Cleanup complete!"; \
	else \
		echo "❌ Cleanup cancelled."; \
	fi

status:
	@echo "📊 Git Status"
	@echo "============="
	@git status
	@echo ""
	@echo "📋 Branches"
	@echo "==========="
	@git branch -vv

# ============================================
# Cleanup
# ============================================

clean:
	@echo "🧹 Cleaning output directories..."
	rm -rf time_analysis_output/
	rm -rf output/
	@echo "✨ Cleanup complete!"


# ============================================
# Development Tools
# ============================================

lint:
	@echo "🔍 Front-end lint:"
	cd time-tracker && npm run lint 2>/dev/null || echo "ℹ️  No lint script configured"
	@echo "🔍 API lint:"
	cd api && npm run lint 2>/dev/null || echo "ℹ️  No lint script configured"

format:
	@echo "✨ Formatting front-end:"
	cd time-tracker && npm run format 2>/dev/null || echo "ℹ️  No format script configured"
	@echo "✨ Formatting API:"
	cd api && npm run format 2>/dev/null || echo "ℹ️  No format script configured"

# ============================================
# Additional Helpful Targets
# ============================================

.PHONY: check-deps update-deps

check-deps:
	@echo "🔍 Checking dependencies..."
	@command -v node >/dev/null 2>&1 && echo "✅ node installed" || echo "❌ node not installed"
	@command -v npm >/dev/null 2>&1 && echo "✅ npm installed" || echo "❌ npm not installed"
	@command -v git >/dev/null 2>&1 && echo "✅ git installed" || echo "❌ git not installed"

update-deps:
	@echo "⬆️  Updating dependencies..."
	cd time-tracker && npm update || true
	cd api && npm update || true
	@echo "✅ Dependencies updated!"
