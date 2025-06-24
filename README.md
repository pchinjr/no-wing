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
# Interactive chat with Q (recommended)
no-wing chat    # Start conversation with Q
no-wing q       # Shorthand for chat

# One-shot commands
no-wing q-task "create a Lambda function for data processing"
no-wing q-status

# Project setup
no-wing init --name=YourName --env=dev --region=us-east-1
```

## Interactive Development with Q

```bash
$ no-wing chat

🛫 no-wing Interactive Q Chat
================================

🤖 Q: Hello! I'm Q, your AI development teammate.
     I'm currently at PARTNER level with 15 successful tasks.

You: create a Lambda function for user authentication

🤖 Q: Let me work on that for you...

🤖 Q: Task completed successfully! 🎉
     I created 3 AWS resource(s):
     • IAM::Role: q-create-lambda-function-123456-role
     • CloudWatchLogs::LogGroup: /aws/lambda/q-create-lambda-function-123456
     • Lambda::Function: q-create-lambda-function-123456
     I documented the work in Git commit: abc123de

You: exit

🤖 Q: Thanks for the chat! We exchanged 2 messages.
     I'm always here when you need me. Just run 'no-wing chat' again!

🛫 Happy coding! No wings needed.
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
