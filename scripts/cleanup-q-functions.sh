#!/bin/bash

# Clean up Q-created demo functions
echo "🧹 Cleaning up Q-created demo functions..."

# List of Q-created functions to delete
Q_FUNCTIONS=(
    "q-create-lambda-function-470629"
    "q-create-new-lambda-640284"
    "q-deploy-configuration-changes-418210"
    "q-create-lambda-function-266010"
    "q-create-new-user-495486"
    "q-build-data-processing-890018"
    "q-create-lambda-function-331130"
    "q-create-lambda-function-735037"
)

# Delete Lambda functions
for func in "${Q_FUNCTIONS[@]}"; do
    echo "🗑️  Deleting Lambda function: $func"
    aws lambda delete-function --function-name "$func" 2>/dev/null || echo "   Function $func not found or already deleted"
done

# List of Q-created IAM roles to delete
Q_ROLES=(
    "q-create-lambda-function-470629-role"
    "q-create-new-lambda-640284-role"
    "q-deploy-configuration-changes-418210-role"
    "q-create-lambda-function-266010-role"
    "q-create-new-user-495486-role"
    "q-build-data-processing-890018-role"
    "q-create-lambda-function-331130-role"
    "q-create-lambda-function-735037-role"
)

# Delete IAM roles
for role in "${Q_ROLES[@]}"; do
    echo "🗑️  Deleting IAM role: $role"
    
    # Detach policies first
    aws iam list-attached-role-policies --role-name "$role" --query 'AttachedPolicies[].PolicyArn' --output text 2>/dev/null | while read policy; do
        if [ ! -z "$policy" ]; then
            aws iam detach-role-policy --role-name "$role" --policy-arn "$policy" 2>/dev/null
        fi
    done
    
    # Delete the role
    aws iam delete-role --role-name "$role" 2>/dev/null || echo "   Role $role not found or already deleted"
done

# List of Q-created CloudWatch log groups to delete
Q_LOG_GROUPS=(
    "/aws/lambda/q-create-lambda-function-470629"
    "/aws/lambda/q-create-new-lambda-640284"
    "/aws/lambda/q-deploy-configuration-changes-418210"
    "/aws/lambda/q-create-lambda-function-266010"
    "/aws/lambda/q-create-new-user-495486"
    "/aws/lambda/q-build-data-processing-890018"
    "/aws/lambda/q-create-lambda-function-331130"
    "/aws/lambda/q-create-lambda-function-735037"
)

# Delete CloudWatch log groups
for log_group in "${Q_LOG_GROUPS[@]}"; do
    echo "🗑️  Deleting CloudWatch log group: $log_group"
    aws logs delete-log-group --log-group-name "$log_group" 2>/dev/null || echo "   Log group $log_group not found or already deleted"
done

echo ""
echo "✅ Cleanup completed!"
echo "🛫 Ready for SAM-based infrastructure creation"
