# 🚀 Deployment Guide

## Prerequisites
- Node.js 18+
- AWS CLI configured with admin permissions
- SAM CLI installed

## Quick Deploy

```bash
# Clone and build
git clone https://github.com/pchinjr/no-wing
cd no-wing && npm install && npm run build

# Deploy minimal version (no GitHub integration)
./deploy-minimal.sh dev your-email@company.com

# Test Q
no-wing q-status
no-wing q-task "analyze current Lambda functions"
no-wing q-task "create a new Lambda function for user auth"
```

## What Gets Deployed

### AWS Resources
- **Lambda Functions**: Orchestrator and demo functions
- **IAM Roles**: Developer and Q agent roles with progressive permissions
- **Permission Boundaries**: Security guardrails for Q
- **CloudWatch**: Logging and monitoring

### Q Capabilities
- **Real AWS Operations**: Create Lambda functions, IAM roles, CloudWatch logs
- **Progressive Permissions**: Observer → Assistant → Partner levels
- **Git Integration**: Q commits with proper AI agent attribution
- **Security Boundaries**: Cannot escalate privileges or access core infrastructure

## Environments

```bash
# Development
./deploy-minimal.sh dev your-email@company.com

# Staging  
./deploy-minimal.sh staging your-email@company.com

# Production
./deploy-minimal.sh prod your-email@company.com
```

## Verification

```bash
# Check Q status
no-wing q-status

# Test real AWS operations
no-wing q-task "create a Lambda function for data processing"

# Verify in AWS Console
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `q-`)]'

# Check Q's Git commits
git log --author="Q (AI Agent"
```

## Troubleshooting

### Permission Issues
- Ensure AWS CLI has admin permissions for initial deployment
- Q's permissions are scoped by design - this is expected behavior

### IAM Role Propagation
- Q waits 10 seconds for IAM role propagation
- Retries Lambda creation with exponential backoff
- Falls back to simulation if AWS operations fail

### Git Attribution
- Q automatically switches Git identity for commits
- Restores human developer identity after operations
- All Q commits properly attributed to AI agent

## Next Steps

1. **Team Onboarding**: Deploy for multiple developers
2. **GitHub Integration**: Add full template with GitHub Actions
3. **Multi-Region**: Deploy across regions for global teams
4. **Monitoring**: Set up CloudWatch dashboards for Q performance
