FROM python:3.11-slim

# Environment
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Create persistent storage directory
RUN mkdir -p storage/documents

# Make entrypoint executable
RUN chmod +x entrypoint.sh

EXPOSE 8001

# Use entrypoint: runs migrations + starts server
ENTRYPOINT ["bash", "entrypoint.sh"]
