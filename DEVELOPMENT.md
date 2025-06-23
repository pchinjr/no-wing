# 🛠️ Development Guide

## 🚀 Quick Start

```bash
git clone https://github.com/pchinjr/no-wing
cd no-wing
npm install
npm run build
npm test
npm run dev -- --help
```

## 📁 Project Structure

```
src/
├── cli/                    # CLI commands
├── lambda/                 # AWS Lambda functions  
├── q/                      # Q-specific modules
└── __tests__/             # Test files
```

## 🧪 Testing

```bash
npm test                   # Run all tests
npm test -- --watch      # Watch mode
npm test -- --coverage   # With coverage
```

## 🤖 Q Development

Q is treated as a first-class developer:

### Q's Capabilities
- **Level 1 (Observer)**: Read-only access, insights, suggestions
- **Level 2 (Assistant)**: Safe modifications, deployments
- **Level 3 (Partner)**: Create resources, architect solutions

### Progressive Permissions
Q earns new capabilities through:
- Successful operations
- Low error rates
- Developer approval
- Security compliance

## 🔧 Architecture

- **CLI Layer**: Commander.js, Inquirer.js, Chalk
- **Lambda Control Plane**: AWS SDK, GitHub API, SSM
- **Security Model**: Scoped IAM roles, audit trails

## 📦 Deployment

### Lambda Deployment
```bash
npm run build
zip -r no-wing-lambda.zip dist/
aws lambda update-function-code \
  --function-name no-wing-control-plane \
  --zip-file fileb://no-wing-lambda.zip
```

### CLI Distribution
```bash
npm run build
npm link
no-wing --help
npm publish
```

## 🤝 Contributing

### For Human Developers
1. Fork repository
2. Create feature branch
3. Make changes and test
4. Submit pull request

### For Q Agents
1. Ensure appropriate capability level
2. Follow security guidelines
3. Include audit trail in commits
4. Request human review

---

**Happy coding! 🛫**
