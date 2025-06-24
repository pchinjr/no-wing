# no-wing Docker Distribution
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    git \
    aws-cli \
    python3 \
    py3-pip \
    curl

# Install SAM CLI
RUN pip3 install aws-sam-cli

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY dist/ ./dist/
COPY templates/ ./templates/
COPY scripts/ ./scripts/

# Create symlink for global CLI access
RUN npm link

# Set up entrypoint
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create workspace directory
WORKDIR /workspace

# Set entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["no-wing", "--help"]

# Labels for metadata
LABEL maintainer="Paul Chin Jr <pchinjr@gmail.com>"
LABEL description="no-wing: AI development collaboration framework"
LABEL version="1.0.0"
LABEL org.opencontainers.image.source="https://github.com/pchinjr/no-wing"
