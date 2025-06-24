# AWS Account Admin Setup Guide

## Overview

This guide outlines the AWS infrastructure setup required for no-wing production deployment. It clearly separates tasks that require **AWS Account Admin** privileges from tasks that **Q can automate** once the foundation is established.

## 🔐 **YOU (AWS Account Admin) Must Do**

These tasks require root/admin privileges and cannot be delegated to Q for security reasons:

### 1. **Root IAM Roles Creation**

#### **Master Orchestrator Role** (Q's "boss")
```bash
aws iam create-role --role-name NoWingOrchestratorRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach admin permissions (orchestrator manages Q roles)
aws iam attach-role-policy \
  --role-name NoWingOrchestratorRole \
  --policy-arn arn:aws:iam::aws:policy/IAMFullAccess

aws iam attach-role-policy \
  --role-name NoWingOrchestratorRole \
  --policy-arn arn:aws:iam::aws:policy/AWSLambdaExecute
```

#### **Base Q Agent Role Template**
```bash
aws iam create-role --role-name NoWingQBaseRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"AWS": "arn:aws:iam::ACCOUNT-ID:role/NoWingOrchestratorRole"},
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "no-wing-q-agent"
        }
      }
    }]
  }'
```

### 2. **Security Boundaries and Policies**

#### **Q Permission Boundary** (Prevents Q from escalating privileges)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": [
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Deny",
      "Action": [
        "organizations:*",
        "account:*",
        "billing:*"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": "*",
      "Resource": "*",
      "Condition": {
        "StringLike": {
          "aws:RequestedRegion": ["us-east-1", "us-west-2"]
        }
      }
    }
  ]
}
```

```bash
# Create the boundary policy
aws iam create-policy \
  --policy-name NoWingQPermissionBoundary \
  --policy-document file://q-permission-boundary.json

# Apply to base Q role
aws iam put-role-permissions-boundary \
  --role-name NoWingQBaseRole \
  --permissions-boundary arn:aws:iam::ACCOUNT-ID:policy/NoWingQPermissionBoundary
```

### 3. **Master Control Plane Deployment**

#### **Deploy Orchestrator Lambda**
```bash
# Package the orchestrator function
zip -r orchestrator.zip src/lambda/orchestrator.ts package.json

# Deploy orchestrator
aws lambda create-function \
  --function-name no-wing-orchestrator \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT-ID:role/NoWingOrchestratorRole \
  --handler orchestrator.handler \
  --zip-file fileb://orchestrator.zip \
  --timeout 300 \
  --memory-size 512 \
  --tags NoWingComponent=orchestrator,Environment=prod
```

### 4. **Security and Compliance Infrastructure**

#### **CloudTrail for Audit**
```bash
# Create S3 bucket for audit logs
aws s3 mb s3://no-wing-audit-logs-ACCOUNT-ID-REGION

# Create CloudTrail
aws cloudtrail create-trail \
  --name no-wing-audit-trail \
  --s3-bucket-name no-wing-audit-logs-ACCOUNT-ID-REGION \
  --include-global-service-events \
  --is-multi-region-trail \
  --enable-log-file-validation

# Start logging
aws cloudtrail start-logging --name no-wing-audit-trail
```

#### **CloudWatch Monitoring**
```bash
# Create log groups
aws logs create-log-group --log-group-name /no-wing/orchestrator
aws logs create-log-group --log-group-name /no-wing/q-activities
aws logs create-log-group --log-group-name /no-wing/security-events

# Set retention
aws logs put-retention-policy \
  --log-group-name /no-wing/q-activities \
  --retention-in-days 90
```

### 5. **Cost Controls and Limits**

#### **Service Control Policies** (If using Organizations)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": [
        "ec2:RunInstances"
      ],
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "ec2:InstanceType": ["t3.micro", "t3.small", "t3.medium"]
        }
      }
    }
  ]
}
```

#### **Billing Alerts**
```bash
aws budgets create-budget \
  --account-id ACCOUNT-ID \
  --budget '{
    "BudgetName": "NoWingMonthlyCost",
    "BudgetLimit": {"Amount": "1000", "Unit": "USD"},
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST",
    "CostFilters": {
      "TagKey": ["NoWingProject"]
    }
  }'
```

### 6. **GitHub Integration Setup**

#### **Create GitHub App**
1. Go to GitHub Settings > Developer settings > GitHub Apps
2. Create new GitHub App with these permissions:
   - Repository permissions: Contents (Read & Write), Pull requests (Write), Actions (Write)
   - Organization permissions: Members (Read)
3. Generate and download private key
4. Note the App ID and Installation ID

#### **Store Secrets**
```bash
# Store GitHub App private key
aws secretsmanager create-secret \
  --name no-wing/github-app-key \
  --description "GitHub App private key for no-wing" \
  --secret-string file://github-app-private-key.pem

# Store GitHub configuration
aws secretsmanager create-secret \
  --name no-wing/github-config \
  --secret-string '{
    "appId": "123456",
    "installationId": "789012",
    "webhookSecret": "your-webhook-secret"
  }'
```

---

## 🤖 **Q CAN DO FOR YOU**

Once you've established the foundation above, Q can automate these tasks:

### 1. **Developer Onboarding**
- ✅ Create individual developer IAM roles
- ✅ Generate scoped AWS credentials
- ✅ Set up local AWS CLI configuration
- ✅ Configure GitHub Actions workflows
- ✅ Create project-specific resources

### 2. **Progressive Q Instance Management**
- ✅ Create new Q agent roles (Observer → Assistant → Partner)
- ✅ Manage Q capability advancement
- ✅ Update Q permissions based on performance
- ✅ Handle Q role rotation and cleanup

### 3. **Project Infrastructure**
- ✅ Create Lambda functions for projects
- ✅ Set up S3 buckets with proper policies
- ✅ Configure CloudWatch dashboards
- ✅ Deploy API Gateway endpoints
- ✅ Manage DynamoDB tables

### 4. **Environment Management**
- ✅ Create dev/staging/prod environments
- ✅ Deploy application code
- ✅ Manage environment variables
- ✅ Handle blue/green deployments
- ✅ Coordinate multi-service updates

### 5. **Monitoring and Maintenance**
- ✅ Set up application-specific alarms
- ✅ Create custom CloudWatch metrics
- ✅ Generate performance reports
- ✅ Handle routine maintenance tasks
- ✅ Optimize resource configurations

### 6. **Team Collaboration**
- ✅ Manage team member access
- ✅ Create shared development resources
- ✅ Handle code review workflows
- ✅ Coordinate deployment schedules
- ✅ Generate team activity reports

---

## 🚀 **Deployment Checklist**

### **Phase 1: Foundation (YOU)**
- [ ] Create master orchestrator role
- [ ] Set up Q permission boundaries
- [ ] Deploy orchestrator Lambda
- [ ] Configure CloudTrail auditing
- [ ] Set up cost controls
- [ ] Create GitHub App integration
- [ ] Store secrets in Secrets Manager

### **Phase 2: Validation (YOU + Q)**
- [ ] Test orchestrator deployment
- [ ] Verify Q can assume base role
- [ ] Validate permission boundaries work
- [ ] Test GitHub integration
- [ ] Run security audit
- [ ] Verify cost controls

### **Phase 3: Production (Q AUTOMATED)**
- [ ] Onboard first development team
- [ ] Create project environments
- [ ] Deploy sample applications
- [ ] Monitor Q performance
- [ ] Generate usage reports

---

## 🔒 **Security Model**

### **Trust Boundaries**
1. **YOU control**: Root roles, permission boundaries, audit trails
2. **Orchestrator controls**: Q role creation and management
3. **Q controls**: Project resources within boundaries

### **Escalation Prevention**
- Q cannot modify its own permissions
- Q cannot access other Q instances
- Q cannot disable auditing or monitoring
- Q cannot exceed cost limits

### **Audit Trail**
- All Q actions logged to CloudTrail
- Git commits properly attributed
- Performance metrics tracked
- Security violations automatically flagged

---

## 📞 **Support and Troubleshooting**

### **Common Issues**
- **Q can't assume role**: Check trust relationships and external IDs
- **Permission denied**: Verify permission boundaries are correctly applied
- **GitHub integration fails**: Check secrets and app permissions
- **Cost alerts firing**: Review Q resource creation patterns

### **Emergency Procedures**
- **Disable Q**: Update orchestrator role to deny all actions
- **Audit Q actions**: Query CloudTrail for Q-related events
- **Rollback changes**: Use Git history to identify and revert Q commits
- **Cost containment**: Apply emergency spending limits

This setup provides a secure, scalable foundation for no-wing while maintaining clear separation of responsibilities between admin tasks and Q automation.
