# 🛠️ Development Guide

This guide covers how to develop and contribute to no-wing.

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/pchinjr/no-wing
cd no-wing
npm install

# Development workflow
npm run dev -- --help          # Run CLI in development
npm run build                   # Build TypeScript
npm test                        # Run tests
npm run dev -- nothing         # Test Easter egg
```

## 📁 Project Structure

```
no-wing/
├── src/
│   ├── cli/                    # CLI commands
│   │   ├── index.ts           # Main CLI entry point
│   │   ├── init.ts            # Onboarding command
│   │   └── nothing.ts         # Easter egg command
│   ├── lambda/                 # AWS Lambda functions
│   │   ├── index.ts           # Lambda handler
│   │   └── orchestrator.ts    # Onboarding orchestration
│   ├── q/                      # Q-specific modules
│   │   ├── dialogue.ts        # Q's conversational interface
│   │   └── capabilities.json  # Q's progressive capabilities
│   └── __tests__/             # Test files
├── templates/                  # GitHub Actions templates
├── dist/                      # Built JavaScript (generated)
└── .env.example               # Environment template
```

## 🧪 Testing

### Unit Tests
```bash
npm test                       # Run all tests
npm test -- --watch          # Watch mode
npm test -- --coverage       # With coverage
```

### Manual Testing
```bash
# Test CLI commands
npm run dev -- nothing
npm run dev -- init --help
npm run dev -- --version

# Test built version
npm run build
node dist/cli/index.js nothing
```

## 🤖 Q Development

Q is treated as a first-class developer in this project:

### Q's Capabilities
- **Level 1 (Observer)**: Read-only access, insights, suggestions
- **Level 2 (Assistant)**: Safe modifications, deployments
- **Level 3 (Partner)**: Create resources, architect solutions

### Q's Role in Development
- Q helps write Lambda functions
- Q manages its own IAM policies
- Q contributes to GitHub Actions workflows
- Q assists with documentation and tests

### Progressive Permissions
Q earns new capabilities through:
- Successful operations
- Low error rates
- Developer approval
- Security compliance

## 🔧 Architecture

### CLI Layer
- Commander.js for command parsing
- Inquirer.js for interactive prompts
- Chalk for colorful output
- Ora for loading spinners

### Lambda Control Plane
- AWS SDK for resource management
- GitHub API for repository setup
- SSM for secure parameter storage
- IAM for role and policy management

### Security Model
- Scoped IAM roles for humans and AI
- Progressive capability unlocking
- Audit trails for all actions
- Automatic rollback on violations

## 📦 Deployment

### Lambda Deployment
```bash
# Build and package
npm run build
zip -r no-wing-lambda.zip dist/

# Deploy via AWS CLI
aws lambda update-function-code \
  --function-name no-wing-control-plane \
  --zip-file fileb://no-wing-lambda.zip
```

### CLI Distribution
```bash
# Build for distribution
npm run build

# Test locally
npm link
no-wing --help

# Publish to npm
npm publish
```

## 🎯 Development Workflow

### Adding New Commands
1. Create command file in `src/cli/`
2. Add to main CLI in `src/cli/index.ts`
3. Write tests in `src/__tests__/`
4. Update documentation

### Adding Q Capabilities
1. Update `src/q/capabilities.json`
2. Modify IAM policies in orchestrator
3. Add dialogue responses
4. Test progression system

### Adding Lambda Functions
1. Create function in `src/lambda/`
2. Add to orchestrator workflow
3. Update API Gateway routes
4. Test with CLI integration

## 🔍 Debugging

### CLI Debugging
```bash
# Enable debug mode
DEBUG=true npm run dev -- init

# Verbose logging
LOG_LEVEL=debug npm run dev -- init
```

### Lambda Debugging
```bash
# Local Lambda testing
npm run build
node -e "
  const { handler } = require('./dist/lambda/index.js');
  handler({
    httpMethod: 'POST',
    path: '/health',
    body: '{}'
  }).then(console.log);
"
```

### Q Debugging
```bash
# Test Q dialogue
npm run dev -- init --name=TestUser --repo=test/repo --dry-run
```

## 🚢 Release Process

1. **Version Bump**
   ```bash
   npm version patch|minor|major
   ```

2. **Build and Test**
   ```bash
   npm run build
   npm test
   ```

3. **Deploy Lambda**
   ```bash
   npm run deploy
   ```

4. **Publish CLI**
   ```bash
   npm publish
   ```

5. **Tag Release**
   ```bash
   git push --tags
   ```

## 🤝 Contributing

### For Human Developers
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test: `npm test`
4. Commit: `git commit -m "feat: add amazing feature"`
5. Push: `git push origin feature/amazing-feature`
6. Create Pull Request

### For Q Agents
1. Ensure appropriate capability level
2. Follow security guidelines
3. Include audit trail in commits
4. Request human review for significant changes
5. Update capability tracking

## 📚 Resources

- [AWS SDK Documentation](https://docs.aws.amazon.com/sdk-for-javascript/)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [Commander.js Documentation](https://github.com/tj/commander.js)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

**Happy coding! 🛫 Let's build the future of human-AI collaboration.**
