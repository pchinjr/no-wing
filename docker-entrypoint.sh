#!/bin/sh

# no-wing Docker Entrypoint Script

# Check if AWS credentials are configured
if [ ! -f ~/.aws/credentials ] && [ -z "$AWS_ACCESS_KEY_ID" ]; then
    echo "⚠️  AWS credentials not found. Please mount ~/.aws or set environment variables:"
    echo "   docker run -v ~/.aws:/root/.aws pchinjr/no-wing"
    echo "   or"
    echo "   docker run -e AWS_ACCESS_KEY_ID=xxx -e AWS_SECRET_ACCESS_KEY=yyy pchinjr/no-wing"
fi

# Check if Git is configured
if [ -z "$(git config --global user.name)" ]; then
    echo "ℹ️  Setting default Git configuration for container"
    git config --global user.name "no-wing Docker User"
    git config --global user.email "user@no-wing.docker"
fi

# If no command provided, show help
if [ $# -eq 0 ]; then
    echo "🛫 no-wing Docker Container"
    echo "=========================="
    echo ""
    echo "Usage examples:"
    echo "  docker run -v ~/.aws:/root/.aws pchinjr/no-wing q-status"
    echo "  docker run -v ~/.aws:/root/.aws -v \$(pwd):/workspace pchinjr/no-wing q-task 'create Lambda'"
    echo ""
    no-wing --help
    exit 0
fi

# Execute the command
exec "$@"
