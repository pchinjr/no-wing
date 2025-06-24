# 🚀 Quick Deploy

## Prerequisites
- Node.js 18+, AWS CLI, SAM CLI

## Deploy

```bash
git clone https://github.com/pchinjr/no-wing
cd no-wing && npm install && npm run build
./deploy-minimal.sh dev your-email@company.com
```

## Test

```bash
no-wing q-status
no-wing q-task "create a Lambda function for user auth"
```

## Verify

```bash
# Check AWS resources Q created
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `q-`)]'

# Check Q's Git commits  
git log --author="Q (AI Agent"
```

## Environments

```bash
./deploy-minimal.sh dev your-email@company.com     # Development
./deploy-minimal.sh staging your-email@company.com # Staging
./deploy-minimal.sh prod your-email@company.com    # Production
```

## Troubleshooting

**Permission Issues**: AWS CLI needs admin permissions for initial deployment. Q's scoped permissions are by design.

**IAM Propagation**: Q waits 10 seconds for IAM roles to propagate, retries with backoff.

**Git Attribution**: Q switches Git identity for commits, then restores yours.
