# SAM Deployment Guide

## 🎯 **Infrastructure as Code with SAM**

You're absolutely right - manual AWS CLI commands are not sustainable! We've converted everything to a comprehensive SAM template that deploys the complete no-wing infrastructure.

---

## 🚀 **One-Command Deployment**

### **Quick Deploy**
```bash
# Deploy to dev environment
./deploy.sh dev YOUR_GITHUB_APP_ID YOUR_GITHUB_INSTALLATION_ID

# Deploy to staging
./deploy.sh staging YOUR_GITHUB_APP_ID YOUR_GITHUB_INSTALLATION_ID

# Deploy to production  
./deploy.sh prod YOUR_GITHUB_APP_ID YOUR_GITHUB_INSTALLATION_ID
```

### **What Gets Deployed**
- ✅ **IAM Roles**: Orchestrator, Q base role, permission boundaries
- ✅ **Lambda Functions**: Orchestrator, demo function
- ✅ **API Gateway**: Webhook endpoints for GitHub integration
- ✅ **CloudWatch**: Log groups, alarms, monitoring
- ✅ **S3 Buckets**: Audit trail storage with encryption
- ✅ **CloudTrail**: Complete audit logging
- ✅ **Secrets Manager**: GitHub App configuration
- ✅ **Budgets**: Cost controls and alerts

---

## 📋 **Prerequisites**

### **1. Install SAM CLI**
```bash
# macOS
brew install aws-sam-cli

# Linux
pip install aws-sam-cli

# Windows
choco install aws-sam-cli
```

### **2. Configure AWS Credentials**
```bash
aws configure
# or
aws sso login --profile your-profile
```

### **3. Create GitHub App**
1. Go to GitHub Settings > Developer settings > GitHub Apps
2. Create new GitHub App with permissions:
   - Repository: Contents (Read & Write), Pull requests (Write), Actions (Write)
   - Organization: Members (Read)
3. Generate private key and note App ID and Installation ID

---

## 🏗️ **SAM Template Structure**

### **Core Infrastructure**
```yaml
# IAM Roles and Security
NoWingOrchestratorRole      # Master control role
NoWingQPermissionBoundary   # Prevents Q privilege escalation
NoWingQBaseRole            # Template for Q instances

# Lambda Functions  
NoWingOrchestratorFunction  # Main control plane
NoWingDemoFunction         # Q interaction testing

# API Gateway
NoWingApi                  # Webhook endpoints

# Monitoring & Audit
NoWingCloudTrail          # Complete audit trail
CloudWatch Log Groups     # Structured logging
CloudWatch Alarms         # Error detection

# Cost Control
NoWingCostBudget          # Monthly spending limits
```

### **Security Features**
- **Permission Boundaries**: Q cannot escalate privileges
- **Resource Isolation**: Q instances cannot access each other
- **Audit Trail**: All actions logged to CloudTrail
- **Cost Controls**: Automatic budget alerts
- **Encryption**: S3 buckets encrypted at rest

---

## 🔧 **Deployment Commands**

### **Standard Deployment**
```bash
# Build and deploy in one command
./deploy.sh dev 123456 789012

# Manual step-by-step
npm run build
sam build
sam deploy --config-env dev --parameter-overrides \
  "GitHubAppId=123456" \
  "GitHubInstallationId=789012"
```

### **Environment-Specific Deployment**
```bash
# Development (lower limits)
sam deploy --config-env dev --parameter-overrides \
  "Environment=dev" \
  "MonthlyCostLimit=500"

# Production (higher limits, stricter monitoring)
sam deploy --config-env prod --parameter-overrides \
  "Environment=prod" \
  "MonthlyCostLimit=2000"
```

### **Update Existing Stack**
```bash
# Deploy changes
sam deploy --config-env dev

# Force update (skip changeset confirmation)
sam deploy --config-env dev --no-confirm-changeset
```

---

## 📊 **Post-Deployment Setup**

### **1. Update GitHub App Webhook**
```bash
# Get webhook URL from stack outputs
aws cloudformation describe-stacks \
  --stack-name no-wing-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`GitHubWebhookUrl`].OutputValue' \
  --output text

# Add this URL to your GitHub App webhook configuration
```

### **2. Add GitHub Private Key**
```bash
# Update the secret with your actual private key
aws secretsmanager update-secret \
  --secret-id no-wing/github-config-dev \
  --secret-string '{
    "appId": "123456",
    "installationId": "789012", 
    "privateKey": "-----BEGIN RSA PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY\n-----END RSA PRIVATE KEY-----"
  }'
```

### **3. Test Deployment**
```bash
# Test orchestrator function
aws lambda invoke \
  --function-name no-wing-orchestrator-dev \
  --payload '{"action": "health-check"}' \
  response.json

# Test no-wing CLI
no-wing init --name=TestUser --repo=test/repo
```

---

## 🛠️ **Development Workflow**

### **Local Development**
```bash
# Start local API for testing
sam local start-api

# Invoke function locally
sam local invoke NoWingOrchestratorFunction \
  --event events/test-event.json
```

### **Testing Changes**
```bash
# Deploy to dev environment
./deploy.sh dev 123456 789012

# Test with real AWS resources
no-wing q-task "create a test function"

# Check logs
sam logs --stack-name no-wing-dev --tail
```

### **Production Deployment**
```bash
# Deploy to staging first
./deploy.sh staging 123456 789012

# Run integration tests
npm run test:integration

# Deploy to production
./deploy.sh prod 123456 789012
```

---

## 🚨 **Emergency Procedures**

### **Rollback Deployment**
```bash
# Rollback to previous version
aws cloudformation cancel-update-stack --stack-name no-wing-prod

# Or delete and redeploy
sam delete --stack-name no-wing-prod
./deploy.sh prod 123456 789012
```

### **Stop All Q Activity**
```bash
# Update orchestrator role to deny all actions
aws iam attach-role-policy \
  --role-name NoWingOrchestratorRole-prod \
  --policy-arn arn:aws:iam::aws:policy/AWSDenyAll
```

### **Check Costs**
```bash
# View current month spending
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

---

## 📈 **Monitoring and Maintenance**

### **CloudWatch Dashboards**
- Orchestrator function metrics
- Q activity volume
- Cost trends
- Error rates

### **Automated Alerts**
- High error rates in orchestrator
- Unusual Q activity volume
- Budget threshold exceeded
- Security events detected

### **Regular Maintenance**
```bash
# Update SAM template
git pull origin main
./deploy.sh prod 123456 789012

# Review audit logs
aws logs filter-log-events \
  --log-group-name /no-wing/security-events-prod \
  --start-time $(date -d '1 day ago' +%s)000
```

---

## 🎉 **Benefits of SAM Deployment**

### **Before (Manual CLI)**
- ❌ 50+ manual commands
- ❌ Error-prone and inconsistent
- ❌ No version control
- ❌ Difficult to replicate
- ❌ No rollback capability

### **After (SAM Template)**
- ✅ Single command deployment
- ✅ Version controlled infrastructure
- ✅ Consistent across environments
- ✅ Easy rollbacks and updates
- ✅ Built-in best practices

**Now you can deploy the complete no-wing infrastructure with confidence!** 🛫

```bash
./deploy.sh dev YOUR_GITHUB_APP_ID YOUR_GITHUB_INSTALLATION_ID
```
