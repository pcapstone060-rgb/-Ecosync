# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements from backend directory
COPY requirements.txt .

# Install Python dependencies (suppress root-user pip warning in Docker; running as root is normal here)
ENV PIP_ROOT_USER_ACTION=ignore
RUN pip install --no-cache-dir --root-user-action=ignore -r requirements.txt gunicorn

# Copy backend application code to root of container
COPY . .

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=10000

# Run the application using Gunicorn with Uvicorn workers for production
CMD gunicorn -w 1 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:$PORT
