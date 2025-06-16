# ABO Converter - Development Commands
# ===================================

.PHONY: help lint test test-unit test-integration clean format install

# Default target
help:
	@echo "ABO Converter Development Commands"
	@echo "=================================="
	@echo ""
	@echo "Linting:"
	@echo "  lint        Run Ruff linter and auto-fix issues"
	@echo "  format      Format code with Ruff"
	@echo ""
	@echo "Testing:"
	@echo "  test        Run all tests"
	@echo "  test-unit   Run unit tests only"
	@echo "  test-integration  Run integration tests only"
	@echo ""
	@echo "Development:"
	@echo "  install     Install project in development mode"
	@echo "  clean       Clean build artifacts"
	@echo ""
	@echo "Examples:"
	@echo "  make lint   # Check and fix code style"
	@echo "  make test   # Run all tests"

# Linting commands
lint:
	@echo "🔍 Running Ruff linter..."
	ruff check --fix --unsafe-fixes
	@echo "✅ Linting complete!"

format:
	@echo "🎨 Formatting code with Ruff..."
	ruff format
	@echo "✅ Formatting complete!"

# Testing commands  
test:
	@echo "🧪 Running all tests..."
	python -m pytest tests/ -v
	@echo "✅ All tests complete!"

test-unit:
	@echo "🧪 Running unit tests..."
	python -m pytest tests/unit/ -v -m unit
	@echo "✅ Unit tests complete!"

test-integration:
	@echo "🧪 Running integration tests..."
	python -m pytest tests/integration/ -v -m integration
	@echo "✅ Integration tests complete!"

# Development commands
install:
	@echo "📦 Installing project in development mode..."
	pip install -e .
	@echo "✅ Installation complete!"

clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf build/
	rm -rf dist/
	rm -rf *.egg-info/
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".ruff_cache" -exec rm -rf {} +
	@echo "✅ Cleanup complete!"

# Quick development workflow
dev: clean lint test
	@echo "🚀 Development workflow complete!"