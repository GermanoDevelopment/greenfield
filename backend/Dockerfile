FROM python:3.12-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1

# Copy uv binary from official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Install project dependencies first (cached layer)
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project && \
    uv pip install solinpy --no-deps

# Copy application source and migration files
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini ./

# Ensure virtualenv is on PATH
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8080

# Run database migrations and start server
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8080"]
