#!/bin/bash

echo "🧪 Testing CloudFormation Deployment Identity"
echo ""

echo "👤 Your CloudFormation stacks (human identity):"
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE --query 'StackSummaries[?contains(StackName, `test`) == `false`].{Name:StackName,Status:StackStatus}' --output table 2>/dev/null || echo "No stacks or AWS not configured"
echo ""

echo "🤖 Q Assistant CloudFormation view (when launched with no-wing):"
echo "This would show Q's perspective with its own credentials..."

# Test Q's AWS environment
echo ""
echo "🔍 Testing Q's AWS Environment Variables:"
echo "AWS_PROFILE would be: q-assistant-no-wing"
echo "AWS_CONFIG_FILE would be: /home/pchinjr/.no-wing/service-accounts/no-wing/.aws/config"
echo "AWS_SHARED_CREDENTIALS_FILE would be: /home/pchinjr/.no-wing/service-accounts/no-wing/.aws/credentials"
echo ""

echo "💡 When Q deploys:"
echo "  • Q's deployments will be tagged with Q's identity"
echo "  • CloudTrail will show Q's user/role as the actor"
echo "  • Stack names can include 'q-assistant' prefix for clarity"
echo "  • Your deployments remain separate and identifiable"
