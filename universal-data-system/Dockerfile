# Python application Dockerfile
FROM python:3.12-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN useradd --create-home --shell /bin/bash app

# Set work directory
WORKDIR /app

# Copy dependency files and README
COPY pyproject.toml README.md ./

# Install dependencies
RUN pip install --upgrade pip && \
    pip install .

# Copy application code
COPY src/ ./src/

# Change ownership
RUN chown -R app:app /app

# Switch to non-root user
USER app

# Expose port
EXPOSE 8000

# Default command (can be overridden for worker)
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
