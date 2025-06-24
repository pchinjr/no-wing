# 🛫 no-wing

Autonomous AI developer that creates real AWS infrastructure. Q is your AI teammate with progressive capabilities and Git attribution.

## Quick Start

```bash
git clone https://github.com/pchinjr/no-wing
cd no-wing && npm install && npm run build
./deploy-minimal.sh dev your-email@company.com
no-wing q-task "create a new Lambda function for user authentication"
```

## Features

- **Real AWS Operations**: Q creates Lambda functions, IAM roles, CloudWatch logs
- **Git Attribution**: Q commits as proper AI agent author
- **Progressive AI**: Q advances from Observer → Assistant → Partner
- **Security Boundaries**: Permission boundaries prevent privilege escalation

## 🎯 Success Story

**Q just created a real Lambda function!**

```bash
$ no-wing q-task "create a new Lambda function for user authentication"

🤖 Q is analyzing task: "create a new Lambda function for user authentication"
✅ Q has permission to perform this partner level task
🏗️ Performing creation task...
⏳ Waiting for IAM role propagation...
✅ Q committed: 0ea495d9

📋 Task Result:
🔧 AWS Resources Created/Modified:
  • IAM::Role: q-create-new-lambda-640284-role (Created)
  • CloudWatchLogs::LogGroup: /aws/lambda/q-create-new-lambda-640284 (Created)  
  • Lambda::Function: q-create-new-lambda-640284 (Created)

📝 Q documented work in Git commit: 0ea495d9
```

**Git History:**
```
0ea495d Q (AI Agent) <q+q-1750720896060-rf367u1sa@no-wing.ai> feat: create a new Lambda function for user authentication
```

**AWS Console Verification:**
- ✅ Function exists: `q-create-new-lambda-640284`
- ✅ IAM role created: `q-create-new-lambda-640284-role`  
- ✅ Proper tagging with Q attribution
- ✅ CloudWatch logs configured

## Architecture

```
Developer + Q → IAM Roles → AWS Lambda Control Plane → GitHub Actions
```

## What You Get

**Developer**: Scoped IAM role, local AWS CLI config, GitHub Actions pipeline
**Q (AI Agent)**: Progressive IAM role (Observer → Assistant → Partner)
**Team**: Consistent onboarding, security best practices, audit trails

## Commands

### `no-wing q-task "<description>"`
Execute tasks with Q's autonomous AWS operations.

```bash
no-wing q-task "analyze current Lambda functions"
no-wing q-task "create a new Lambda function for user auth"
no-wing q-task "optimize function memory settings"
```

### `no-wing q-status`
View Q's current capabilities and performance.

### `no-wing init`
Initialize developer + Q pairing with AWS resources.

```bash
no-wing init --name=Paul --repo=pchinjr/my-project --env=dev --region=us-east-1
```

### `no-wing nothing` 🥚
Easter egg command with Game of Thrones reference.

## 🤖 Q's Progressive Capabilities

Q starts as an **Observer** and can progress to become a full development **Partner**:

### Level 1: Observer
- Read deployment logs and configurations
- Analyze Lambda functions and performance
- Monitor function performance
- Generate reports and recommendations

### Level 2: Assistant  
- Update Lambda function configurations
- Modify environment variables and settings
- Optimize memory and timeout settings
- Create database entries

### Level 3: Partner
- **Create real AWS resources** (Lambda, IAM, CloudWatch)
- Design and implement features
- Manage IAM roles and policies
- Lead development initiatives

*Q earns new capabilities through successful contributions and developer approval.*

## 🔐 Security Model

### Human Developer Role
- Scoped permissions for development resources
- Environment-specific access (dev/staging/prod)
- External ID for additional security
- Audit trail for all actions

### Q Agent Role
- Progressive permission model
- Cannot escalate own permissions
- All actions logged and auditable
- Automatic rollback on security violations
- Cannot access other Q instances

### Safeguards
- Resource quotas and limits
- Error rate monitoring
- Anomaly detection
- Developer override capabilities
- Production access requires explicit approval

## 🏗️ Development

### Prerequisites
- Node.js 18+
- AWS CLI configured
- GitHub token with repo permissions

### Setup
```bash
git clone https://github.com/pchinjr/no-wing
cd no-wing
npm install
npm run build
npm test
```

## 🤝 Contributing

### For Humans:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

### For Q Agents:
1. Ensure you have appropriate capability level
2. Follow security guidelines
3. Include audit trail in commits
4. Request human review for significant changes

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed instructions.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**Let's fly 🛫 - no wings needed!**

*Built with ❤️ by Paul Chin Jr and Q (AI Development Partner)*
