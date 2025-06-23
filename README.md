# 🛫 no-wing: Autonomous Developer Onboarding System

**no-wing** is an AWS Lambda-based onboarding tool that automates the setup of new developers **and their artificial teammate Q**. It provisions accounts, credentials, environment configs, CLI auth, and GitHub Actions workflows from a single command—no wings required.

We treat **Q** not as a tool, but as a *developer buddy* with its own identity, scoped IAM roles, and progressive capabilities. The goal is to responsibly integrate artificial agents alongside humans, ensuring both can begin contributing from Day 0.

## 🚀 Quick Start

```bash
# Install no-wing
npm install -g no-wing

# Initialize your development environment + Q
no-wing init --name=YourName --repo=owner/repo --env=dev

# Easter egg 🥚
no-wing nothing
```

## 💡 What Makes This Special

- **Q as First-Class Developer**: Q gets its own IAM role, progressive capabilities, and development identity
- **Automated Onboarding**: Single command sets up AWS resources, GitHub Actions, and local environment
- **Progressive AI Capabilities**: Q starts with read-only access and earns more permissions through successful contributions
- **Security-First**: Scoped IAM roles, audit trails, and safeguards for both human and AI teammates
- **Dogfooding**: We use no-wing to build no-wing (Q helps develop its own capabilities)

## 🧱 Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Developer     │    │       Q         │    │   GitHub        │
│   (Human)       │    │   (AI Agent)    │    │   Actions       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   DevRole       │    │    QRole        │    │   Pipeline      │
│   (IAM)         │    │   (IAM)         │    │   (Workflow)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────┐
                    │   AWS Lambda    │
                    │  Control Plane  │
                    └─────────────────┘
```

## 🎯 Features

### For Developers
- ✅ Scoped IAM role with development permissions
- ✅ Local AWS CLI configuration
- ✅ GitHub Actions pipeline with secrets
- ✅ Environment configuration files
- ✅ Q teammate automatically provisioned

### For Q (AI Agent)
- ✅ Dedicated IAM role with progressive permissions
- ✅ Capability levels (Observer → Assistant → Partner)
- ✅ Audit trail and security safeguards
- ✅ Integration with development workflows
- ✅ Autonomous contribution tracking

### For Teams
- ✅ Consistent onboarding process
- ✅ Security best practices built-in
- ✅ Scalable across multiple developers
- ✅ Compliance and audit ready
- ✅ Cost-effective serverless architecture

## 📋 Commands

### `no-wing init`
Initialize a new developer + Q pairing with AWS resources.

```bash
no-wing init --name=Paul --repo=pchinjr/my-project --env=dev --region=us-east-1
```

**What it does:**
1. Creates IAM roles for developer and Q
2. Sets up AWS credentials and configuration
3. Authenticates Q as your AI teammate
4. Bootstraps GitHub Actions pipeline
5. Configures local development environment

### `no-wing nothing` 🥚
Easter egg command that shows a Game of Thrones reference.

```bash
no-wing nothing
```

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
cp .env.example .env
# Fill in your .env values
npm run build
```

### Testing
```bash
npm test
```

### Local Development
```bash
npm run dev -- init --name=TestUser --repo=test/repo
```

## 🎪 Dogfooding

This project practices what it preaches:

1. **Paul + Q** were onboarded using no-wing
2. **Q helps develop** new features and capabilities
3. **Q manages** its own IAM policies and permissions
4. **Q contributes** to GitHub Actions and deployment pipelines
5. **Q assists** in writing documentation and tests

## 📚 Documentation

- **[Getting Started](./README.md)** - You are here!
- **[Development Guide](./DEVELOPMENT.md)** - Setup and contribution guide
- **[Architecture Decisions](./docs/adr/)** - Important architectural decisions (ADRs)
- **[Project Summary](./SUMMARY.md)** - Complete feature overview
- **[Documentation Hub](./docs/)** - All documentation organized

## 🤝 Contributing

We welcome contributions from both humans and AI agents! 

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

See our [Development Guide](./DEVELOPMENT.md) for detailed contribution instructions.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙋‍♂️ Support

- 📧 Email: paul@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/pchinjr/no-wing/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/pchinjr/no-wing/discussions)

---

**Let's fly 🛫 - no wings needed!**

*Built with ❤️ by Paul Chin Jr and Q (AI Development Partner)*
