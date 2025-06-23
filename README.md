# 🛫 no-wing

Autonomous developer onboarding that treats AI as a first-class teammate. Single command provisions AWS resources, GitHub Actions, and progressive AI capabilities.

## Quick Start

```bash
npm install -g no-wing
no-wing init --name=YourName --repo=owner/repo
no-wing nothing  # Easter egg 🥚
```

## Features

- **AI Teammate**: Q gets its own IAM role and progressive permissions
- **One Command**: Sets up AWS resources, GitHub Actions, local environment
- **Progressive AI**: Q earns capabilities through successful contributions
- **Security First**: Scoped roles, audit trails, safeguards

## Architecture

```
Developer + Q → IAM Roles → AWS Lambda Control Plane → GitHub Actions
```

## What You Get

**Developer**: Scoped IAM role, local AWS CLI config, GitHub Actions pipeline
**Q (AI Agent)**: Progressive IAM role (Observer → Assistant → Partner)
**Team**: Consistent onboarding, security best practices, audit trails

## Commands

### `no-wing init`
Initialize developer + Q pairing with AWS resources.

```bash
no-wing init --name=Paul --repo=pchinjr/my-project --env=dev --region=us-east-1
```

Creates IAM roles, sets up AWS credentials, authenticates Q, bootstraps GitHub Actions, configures local environment.

### `no-wing nothing` 🥚
Easter egg command with Game of Thrones reference.

## 🤖 Q's Progressive Capabilities

Q starts as an **Observer** and can progress to become a full development **Partner**:

### Level 1: Observer
- Read deployment logs and configurations
- Provide code suggestions and insights
- Monitor function performance
- Generate reports

### Level 2: Assistant  
- Deploy code changes
- Update Lambda functions
- Modify configuration files
- Create database entries

### Level 3: Partner
- Create new AWS resources
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
