#!/bin/bash

echo "🧪 Testing AWS Identity Separation"
echo ""

echo "👤 Your AWS Identity (human):"
aws sts get-caller-identity --query 'Arn' --output text 2>/dev/null || echo "AWS not configured"
echo ""

echo "🤖 Q Assistant AWS Identity (when launched with no-wing):"
AWS_PROFILE="q-assistant-no-wing" \
AWS_CONFIG_FILE="/home/pchinjr/.no-wing/service-accounts/no-wing/.aws/config" \
AWS_SHARED_CREDENTIALS_FILE="/home/pchinjr/.no-wing/service-accounts/no-wing/.aws/credentials" \
aws sts get-caller-identity --query 'Arn' --output text 2>/dev/null || echo "Q Assistant AWS not configured yet - run 'no-wing aws-setup'"
echo ""

echo "💡 This demonstrates that:"
echo "  • Your deployments use your AWS identity"
echo "  • Q's deployments use Q's dedicated AWS identity"
echo "  • Complete separation and proper attribution"
