# 🤝 Contributing to no-wing

We welcome contributions to no-wing! This guide will help you get started.

## 🚀 Quick Start

1. **Fork the repository**
2. **Clone your fork**: `git clone https://github.com/your-username/no-wing.git`
3. **Install dependencies**: `npm install`
4. **Build the project**: `npm run build`
5. **Run tests**: `npm test`

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ 
- npm 8+
- Git
- Linux/macOS (Windows support via WSL)

### Local Development
```bash
# Clone and setup
git clone https://github.com/pchinjr/no-wing.git
cd no-wing
npm install

# Build and test
npm run build
npm test

# Test CLI locally
node dist/cli/index.js --help
```

## 📋 Development Workflow

### 1. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes
- Write code with comprehensive tests
- Follow existing code style and patterns
- Update documentation as needed

### 3. Test Your Changes
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration

# Build and test CLI
npm run build
node dist/cli/index.js --version
```

### 4. Commit Your Changes
```bash
# Use conventional commit format
git commit -m "feat: add amazing new feature"
git commit -m "fix: resolve issue with service account setup"
git commit -m "docs: update README with new examples"
```

### 5. Push and Create PR
```bash
git push origin feature/your-feature-name
# Create Pull Request on GitHub
```

## 🧪 Testing Guidelines

### Test Coverage
- **Unit Tests**: Test individual functions and classes
- **Integration Tests**: Test end-to-end workflows
- **Security Tests**: Test permission and validation logic

### Writing Tests
```javascript
import test from 'tape';

test('Feature description', (t) => {
  // Arrange
  const input = 'test input';
  
  // Act
  const result = yourFunction(input);
  
  // Assert
  t.equal(result, 'expected output', 'Should return expected result');
  t.end();
});
```

### Running Tests
```bash
npm test                    # All tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:coverage      # With coverage report
```

## 📝 Code Style

### TypeScript Guidelines
- Use TypeScript for all new code
- Provide proper type annotations
- Follow existing patterns and interfaces

### Commit Messages
Use conventional commit format:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Test additions/changes
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks

### Code Organization
```
src/
├── cli/           # CLI commands and interface
├── services/      # Core business logic
└── types/         # TypeScript type definitions

test/
├── services/      # Service unit tests
└── integration/   # End-to-end tests
```

## 🛡️ Security Considerations

### Service Account Security
- Never expose real AWS credentials in tests
- Use mock data for sensitive operations
- Validate all user inputs
- Follow principle of least privilege

### Code Security
- Sanitize all external inputs
- Validate file paths and permissions
- Use secure defaults
- Document security implications

## 📚 Documentation

### Update Documentation
- Update README.md for user-facing changes
- Update technical docs for implementation changes
- Add examples for new features
- Update troubleshooting for new issues

### Documentation Style
- User-focused language
- Practical examples
- Clear step-by-step instructions
- Comprehensive troubleshooting

## 🐛 Bug Reports

### Before Reporting
1. Check existing issues
2. Test with latest version
3. Gather system information

### Bug Report Template
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Run command '...'
2. See error

**Expected behavior**
What you expected to happen.

**Environment:**
- OS: [e.g. Ubuntu 22.04]
- Node.js version: [e.g. 18.17.0]
- no-wing version: [e.g. 0.2.0]

**Additional context**
Any other context about the problem.
```

## 💡 Feature Requests

### Before Requesting
1. Check existing issues and discussions
2. Consider if it fits the project scope
3. Think about implementation complexity

### Feature Request Template
```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions you've considered.

**Additional context**
Any other context about the feature request.
```

## 🎯 Project Goals

### Core Mission
Give Amazon Q its own identity for secure, auditable project automation.

### Key Principles
- **Security First**: Complete identity separation
- **User Experience**: Simple and intuitive
- **Reliability**: Comprehensive testing
- **Transparency**: Clear audit trails

## 📞 Getting Help

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and community support
- **Documentation**: Comprehensive guides and examples

## 🙏 Recognition

Contributors are recognized in:
- GitHub contributors list
- Release notes for significant contributions
- Project acknowledgments

---

**Thank you for contributing to no-wing! 🛫**
