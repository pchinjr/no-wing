#!/bin/bash

# no-wing Minimal SAM Deployment Script
# Deploys core no-wing infrastructure without GitHub integration

set -e

ENVIRONMENT=${1:-dev}
ADMIN_EMAIL=${2:-admin@example.com}

echo "🛫 no-wing Minimal SAM Deployment"
echo "=================================="
echo ""
echo "Environment: $ENVIRONMENT"
echo "Admin Email: $ADMIN_EMAIL"
echo ""
echo "⚠️  Note: This deployment excludes GitHub integration"
echo "    You can add it later by deploying the full template"
echo ""

# Build the application
echo "📦 Building no-wing application..."
npm run build

# Build SAM application with minimal template
echo "🔨 Building SAM template..."
sam build --template template-minimal.yaml --cached --parallel

# Deploy with parameters
echo "🚀 Deploying to AWS..."
sam deploy \
    --template-file .aws-sam/build/template.yaml \
    --stack-name no-wing-minimal-$ENVIRONMENT \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --parameter-overrides \
        "Environment=$ENVIRONMENT" \
        "AdminEmail=$ADMIN_EMAIL" \
        "MonthlyCostLimit=500" \
    --resolve-s3 \
    --no-confirm-changeset

# Get outputs
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Stack Outputs:"
aws cloudformation describe-stacks \
    --stack-name no-wing-minimal-$ENVIRONMENT \
    --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
    --output table

echo ""
echo "🔧 What you can do now:"
echo "1. Test Q identity system: no-wing q-status"
echo "2. Run Q tasks: no-wing q-task 'analyze system performance'"
echo "3. Check Q Git commits: no-wing q-history"
echo ""
echo "🔧 To add GitHub integration later:"
echo "1. Create GitHub App (see docs/SAM-DEPLOYMENT.md)"
echo "2. Deploy full template: ./deploy.sh dev APP_ID INSTALL_ID"
echo ""
echo "🛫 no-wing core is ready to fly!"
