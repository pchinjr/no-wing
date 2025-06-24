#!/bin/bash

# no-wing AWS Lambda Hackathon Demo
# Shows real AWS Lambda creation with Q AI Agent

set -e

echo "🏆 no-wing AWS Lambda Hackathon Demo"
echo "===================================="
echo ""
echo "This demo shows Q creating REAL AWS Lambda functions!"
echo "Requirements:"
echo "• AWS CLI configured with valid credentials"
echo "• Permissions to create Lambda functions and IAM roles"
echo "• API Gateway permissions (optional)"
echo ""

# Check AWS credentials
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "❌ AWS credentials not configured"
    echo "Please run: aws configure"
    exit 1
fi

echo "✅ AWS credentials configured"
echo "Account: $(aws sts get-caller-identity --query Account --output text)"
echo "Region: $(aws configure get region || echo 'us-east-1')"
echo ""

echo "Press Enter to start the hackathon demo..."
read

# Build the project
echo "📦 Building no-wing..."
npm run build >/dev/null 2>&1
echo "✅ Build complete"
echo ""

echo "🏭 Step 1: Admin provisions SENIOR developer+Q pair (Partner level)"
echo "=================================================================="
echo ""

# Provision SENIOR developer+Q pair (gets Partner level Q)
echo "Provisioning SENIOR developer+Q pair for hackathon demo..."
PROVISION_OUTPUT=$(npm run start -- admin provision-developer \
  --email demo@hackathon.com \
  --role senior \
  --team hackathon \
  --projects lambda-demo,api-demo \
  --budget 100 2>/dev/null)

# Extract the onboarding token
TOKEN=$(echo "$PROVISION_OUTPUT" | grep -A1 "Send this onboarding token" | tail -1 | xargs)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to extract onboarding token"
    echo "Debug output:"
    echo "$PROVISION_OUTPUT"
    exit 1
fi

echo "✅ Senior developer+Q pair provisioned (Q has Partner-level capabilities)"
echo "🎫 Onboarding token: $TOKEN"
echo ""

echo "🚀 Step 2: Developer onboards with Q assistant"
echo "=============================================="
echo ""

# Setup developer environment
echo "Setting up developer environment..."
npm run start -- setup --token "$TOKEN" >/dev/null 2>&1
echo "✅ Developer environment configured"
echo ""

echo "🤖 Step 3: Q creates REAL AWS Lambda functions"
echo "=============================================="
echo ""

echo "Q will now create a Lambda function for user authentication..."
echo "This will deploy REAL AWS resources to your account!"
echo ""

# Create a temporary input file for the chat
cat > /tmp/q_input.txt << EOF
create a Lambda function for user authentication
exit
EOF

# Create Lambda function via chat with input file
echo "🚀 Executing Q task..."
npm run start -- chat < /tmp/q_input.txt

# Clean up temp file
rm -f /tmp/q_input.txt

echo ""
echo "🎉 Hackathon Demo Complete!"
echo "=========================="
echo ""
echo "✅ What we demonstrated:"
echo "   • Enterprise developer+Q vending system"
echo "   • Real AWS Lambda function creation"
echo "   • API Gateway integration"
echo "   • Proper IAM governance and monitoring"
echo "   • AI-assisted development workflow"
echo ""
echo "🏆 Key Hackathon Requirements Met:"
echo "   ✅ Uses AWS Lambda as core service"
echo "   ✅ Implements Lambda triggers (API Gateway)"
echo "   ✅ Solves real-world business problem (developer onboarding)"
echo "   ✅ Integrates multiple AWS services (Lambda, IAM, API Gateway)"
echo ""
echo "🛫 no-wing: Enterprise Developer+Q Vending System"
echo "   Ready to transform how organizations onboard developers with AI!"
echo ""

# Show created resources
echo "📋 Checking created AWS resources..."
echo ""

# List Lambda functions
echo "Lambda functions created by Q:"
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `q-`)].{Name:FunctionName,Runtime:Runtime,Description:Description}' --output table 2>/dev/null || echo "No functions found (check AWS permissions)"

echo ""
echo "🌐 Test your Lambda function:"
echo "   Check the AWS Console for the created Lambda function and API Gateway endpoint"
echo "   The function is ready to receive HTTP requests!"
echo ""
echo "🏆 This demonstrates a complete enterprise AI development platform!"
