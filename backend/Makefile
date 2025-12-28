.PHONY: help install dev test test.coverage test.unit test.integration lint lint.fix fmt fmt.check clean hooks.install hooks.run

# Default target
help: ## Show this help message
	@echo "Available targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_.-]+:.*?## / {printf "  %-18s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Installation
install: ## Install backend dependencies
	poetry install

# Development server
dev: ## Start development server
	poetry run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Testing
test: ## Run backend tests
	poetry run pytest -v

test.coverage: ## Run tests with coverage
	poetry run pytest --cov=src --cov-report=html --cov-report=term

test.unit: ## Run unit tests only
	poetry run pytest -v -m unit

test.integration: ## Run integration tests only
	poetry run pytest -v -m integration

# Code quality
lint: ## Run linting
	poetry run ruff check src tests

lint.fix: ## Run linting with auto-fix
	poetry run ruff check --fix src tests

fmt: ## Format code
	poetry run ruff format src tests

fmt.check: ## Check formatting
	poetry run ruff format --check src tests

# Cleanup
clean: ## Clean up temporary files
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true

# Pre-commit hooks
hooks.install: ## Install pre-commit hooks
	pre-commit install

hooks.run: ## Run pre-commit hooks on all files
	pre-commit run --all-files
