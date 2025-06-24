#!/bin/bash

# no-wing SAM Deployment Script
# Deploys the complete no-wing infrastructure using SAM

set -e

ENVIRONMENT=${1:-dev}
GITHUB_APP_ID=${2}
GITHUB_INSTALLATION_ID=${3}
ADMIN_EMAIL=${4:-admin@example.com}

echo "🛫 no-wing SAM Deployment"
echo "========================="
echo ""
echo "Environment: $ENVIRONMENT"
echo "Admin Email: $ADMIN_EMAIL"
echo ""

# Validate parameters
if [ -z "$GITHUB_APP_ID" ] || [ -z "$GITHUB_INSTALLATION_ID" ]; then
    echo "❌ Missing required parameters"
    echo ""
    echo "Usage: ./deploy.sh <environment> <github-app-id> <github-installation-id> [admin-email]"
    echo ""
    echo "Example:"
    echo "  ./deploy.sh dev 123456 789012 admin@company.com"
    echo ""
    echo "To get GitHub App credentials:"
    echo "  1. Go to GitHub Settings > Developer settings > GitHub Apps"
    echo "  2. Create or select your no-wing GitHub App"
    echo "  3. Note the App ID and Installation ID"
    echo ""
    exit 1
fi

# Build the application
echo "📦 Building no-wing application..."
npm run build

# Build SAM application
echo "🔨 Building SAM template..."
sam build --cached --parallel

# Deploy with parameters
echo "🚀 Deploying to AWS..."
sam deploy \
    --config-env $ENVIRONMENT \
    --parameter-overrides \
        "Environment=$ENVIRONMENT" \
        "GitHubAppId=$GITHUB_APP_ID" \
        "GitHubInstallationId=$GITHUB_INSTALLATION_ID" \
        "AdminEmail=$ADMIN_EMAIL" \
        "MonthlyCostLimit=500"

# Get outputs
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Stack Outputs:"
aws cloudformation describe-stacks \
    --stack-name no-wing-$ENVIRONMENT \
    --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
    --output table

echo ""
echo "🔧 Next Steps:"
echo "1. Update GitHub App webhook URL with the provided endpoint"
echo "2. Add your GitHub App private key to AWS Secrets Manager"
echo "3. Test the deployment with: no-wing init --name=TestUser --repo=test/repo"
echo ""
echo "🛫 no-wing is ready to fly!"
