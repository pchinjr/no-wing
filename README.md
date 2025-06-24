# 🛫 no-wing

**AI teammate that creates real AWS infrastructure and commits to Git as a proper developer.**

## Why no-wing?

- **Q creates real AWS resources** - Lambda functions, IAM roles, CloudWatch logs
- **Q commits as AI agent** - Proper Git attribution with audit trail
- **Progressive capabilities** - Q earns permissions through successful work
- **Security boundaries** - Cannot escalate privileges or break your infrastructure

## Quick Start

```bash
git clone https://github.com/pchinjr/no-wing
cd no-wing && npm install && npm run build
./deploy-minimal.sh dev your-email@company.com
no-wing q-task "create a Lambda function for user authentication"
```

**Result:**
```
✅ Q committed: 0ea495d9
🔧 AWS Resources Created:
  • Lambda::Function: q-create-new-lambda-640284 (Created)
  • IAM::Role: q-create-new-lambda-640284-role (Created)
  • CloudWatchLogs::LogGroup: /aws/lambda/q-create-new-lambda-640284 (Created)
```

## Commands

```bash
# Execute tasks with Q
no-wing q-task "create a Lambda function for data processing"
no-wing q-task "analyze current Lambda performance"
no-wing q-task "optimize function memory settings"

# Check Q's status and capabilities
no-wing q-status

# Initialize new project
no-wing init --name=YourName --env=dev --region=us-east-1
```

## How Q Works

**Q is an AI developer with progressive AWS permissions:**

1. **Observer** - Reads and analyzes your infrastructure
2. **Assistant** - Updates configurations and settings  
3. **Partner** - Creates new AWS resources and features

Q earns new capabilities by successfully completing tasks. All work is committed to Git with proper AI agent attribution.

## Security

- **Permission boundaries** prevent Q from escalating privileges
- **Resource isolation** - Q cannot access core infrastructure
- **Session expiry** - 24-hour time limits with refresh
- **Complete audit trail** - Every action logged in Git and CloudWatch
- **Regional constraints** - Operations limited to deployment region

## What Gets Deployed

- **Lambda functions** for orchestration
- **IAM roles** for you and Q with scoped permissions
- **Permission boundaries** to prevent privilege escalation
- **CloudWatch logging** for monitoring

## Requirements

- Node.js 18+
- AWS CLI configured with admin permissions (for initial deployment)
- SAM CLI installed

## Documentation

- **[Quick Deploy](DEPLOYMENT.md)** - Get no-wing running in 3 commands
- **[Security](SECURITY.md)** - How Q is secured and what it can/cannot do

---

**Let Q be your autonomous AWS development teammate.** 🛫
