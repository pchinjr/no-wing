#!/bin/bash

echo "👤 Deploying test stack as HUMAN"
echo ""

STACK_NAME="no-wing-test-human-$(date +%s)"

echo "Stack name: $STACK_NAME"
echo "Your AWS identity:"
aws sts get-caller-identity --query 'Arn' --output text

echo ""
echo "Deploying CloudFormation stack..."

aws cloudformation create-stack \
  --stack-name "$STACK_NAME" \
  --template-body file://test-stack.yaml \
  --parameters ParameterKey=DeployedBy,ParameterValue="Human-$(whoami)" \
  --tags Key=DeployedBy,Value="Human-$(whoami)" Key=TestType,Value="HumanDeployment"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Stack creation initiated as HUMAN"
    echo "Stack name: $STACK_NAME"
    echo ""
    echo "Check deployment status:"
    echo "aws cloudformation describe-stacks --stack-name $STACK_NAME --query 'Stacks[0].{Status:StackStatus,DeployedBy:Parameters[?ParameterKey==\`DeployedBy\`].ParameterValue|[0]}'"
else
    echo "❌ Failed to create stack as human"
fi
