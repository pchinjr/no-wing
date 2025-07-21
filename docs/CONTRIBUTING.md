# Contributing to no-wing

Thank you for your interest in contributing to no-wing! This guide will help you get started with development and contributing to the project.

## 🚀 Quick Start

### Prerequisites

- [Deno](https://deno.land/) >= 1.37.0
- [Git](https://git-scm.com/)
- [Amazon Q CLI](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/cli-install.html) (for testing)

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/your-username/no-wing.git
cd no-wing

# Test the application
deno run --allow-all deno/no-wing.ts --help

# Install globally for testing
./install-deno-final.sh

# Test in a project
cd /tmp && mkdir test-project && cd test-project
no-wing setup --force
no-wing status
no-wing cleanup --force
```

## 🏗️ Project Structure

```
no-wing/
├── deno/
│   └── no-wing.ts              # Main Deno implementation
├── docs/
│   ├── README.md               # Documentation index
│   ├── CONTRIBUTING.md         # This file
│   └── DENO_MIGRATION.md       # Migration guide
├── src/                        # Legacy Node.js code (deprecated)
├── install-deno-final.sh       # Global installer
├── README.md                   # Main documentation
├── package.json                # Package metadata
└── LICENSE                     # MIT License
```

## 🔧 Development Workflow

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Edit `deno/no-wing.ts` for core functionality
   - Update documentation in `docs/` and `README.md`
   - Add tests if applicable

3. **Test your changes**
   ```bash
   # Test locally
   deno run --allow-all deno/no-wing.ts --help
   deno run --allow-all deno/no-wing.ts setup --force
   deno run --allow-all deno/no-wing.ts status
   deno run --allow-all deno/no-wing.ts cleanup --force
   
   # Test global installation
   ./install-deno-final.sh
   no-wing --help
   ```

4. **Test across different project types**
   ```bash
   # Test with SAM project
   cd /tmp && mkdir sam-test && cd sam-test
   echo 'AWSTemplateFormatVersion: "2010-09-09"' > template.yaml
   no-wing setup --force && no-wing status && no-wing cleanup --force
   
   # Test with CDK project
   cd /tmp && mkdir cdk-test && cd cdk-test
   echo '{}' > cdk.json
   no-wing setup --force && no-wing status && no-wing cleanup --force
   
   # Test with generic project
   cd /tmp && mkdir generic-test && cd generic-test
   no-wing setup --force && no-wing status && no-wing cleanup --force
   ```

### Code Style

#### TypeScript/Deno Style

- Use TypeScript with strict typing
- Follow Deno conventions and standard library
- Use `async/await` for asynchronous operations
- Prefer explicit error handling

#### Example Code Style

```typescript
// Good: Explicit types and error handling
async function createWorkspace(projectName: string): Promise<void> {
  try {
    const workspaceDir = `${homeDir}/.no-wing/service-accounts/${projectName}`;
    await ensureDir(workspaceDir);
    console.log(colors.green(`✅ Workspace created: ${workspaceDir}`));
  } catch (error) {
    throw new Error(`Failed to create workspace: ${error.message}`);
  }
}

// Good: Clear function signatures
interface ServiceAccountConfig {
  projectName: string;
  username: string;
  workspaceDir: string;
  gitIdentity: {
    name: string;
    email: string;
  };
  awsProfile: string;
}
```

#### Documentation Style

- Use clear, concise language
- Include code examples for complex features
- Update README.md for user-facing changes
- Add inline comments for complex logic

### Testing

#### Manual Testing Checklist

- [ ] `no-wing --help` shows help
- [ ] `no-wing --version` shows version
- [ ] `no-wing setup` creates service account
- [ ] `no-wing status` shows correct status
- [ ] `no-wing cleanup` removes service account
- [ ] Works with SAM projects (template.yaml)
- [ ] Works with CDK projects (cdk.json)
- [ ] Works with generic projects
- [ ] Cross-platform compatibility (if possible)

#### Integration Testing

```bash
# Full workflow test
cd /tmp && mkdir integration-test && cd integration-test

# Setup
no-wing setup --force
no-wing status | grep "✅ Service account is ready"

# Check workspace structure
ls -la ~/.no-wing/service-accounts/integration-test/
test -f ~/.no-wing/service-accounts/integration-test/.gitconfig
test -f ~/.no-wing/service-accounts/integration-test/.aws/config

# Cleanup
no-wing cleanup --force
test ! -d ~/.no-wing/service-accounts/integration-test/
```

## 📝 Commit Guidelines

### Commit Message Format

Use conventional commits with emojis:

```
🛫 feat: add new project detection for Terraform
🐛 fix: resolve workspace creation on Windows
📚 docs: update installation instructions
🔧 refactor: simplify service account manager
✅ test: add integration tests for AWS setup
🎨 style: improve error message formatting
```

### Commit Types

- `🛫 feat`: New features
- `🐛 fix`: Bug fixes
- `📚 docs`: Documentation changes
- `🔧 refactor`: Code refactoring
- `✅ test`: Adding or updating tests
- `🎨 style`: Code style changes
- `⚡ perf`: Performance improvements
- `🔒 security`: Security improvements

## 🔄 Pull Request Process

### Before Submitting

1. **Test thoroughly**
   - Manual testing on your platform
   - Cross-platform testing if possible
   - Integration testing

2. **Update documentation**
   - Update README.md for user-facing changes
   - Update docs/ for technical changes
   - Add inline code comments

3. **Check code quality**
   - Follow TypeScript best practices
   - Use Deno standard library
   - Handle errors appropriately

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Performance improvement

## Testing
- [ ] Manual testing completed
- [ ] Integration testing completed
- [ ] Cross-platform testing (if applicable)

## Documentation
- [ ] README.md updated
- [ ] Inline documentation added
- [ ] Breaking changes documented

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Testing completed
```

### Review Process

1. **Automated checks** (if configured)
2. **Manual review** by maintainers
3. **Testing** by reviewers
4. **Approval** and merge

## 🐛 Bug Reports

### Before Reporting

1. **Search existing issues** for duplicates
2. **Test with latest version**
3. **Reproduce the issue** consistently

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., Ubuntu 22.04, macOS 13.0, Windows 11]
- Deno version: [e.g., 1.37.0]
- no-wing version: [e.g., 1.0.0]
- Q CLI version: [e.g., 1.0.0] (if applicable)

## Additional Context
Any other relevant information
```

## 💡 Feature Requests

### Feature Request Template

```markdown
## Feature Description
Clear description of the proposed feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should this feature work?

## Alternatives Considered
Other approaches you've considered

## Additional Context
Any other relevant information
```

## 🏷️ Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

1. **Update version** in `package.json`
2. **Update documentation** (README.md, docs/)
3. **Test thoroughly** across platforms
4. **Create release notes**
5. **Tag release** with `git tag -a v1.x.x`
6. **Push to main** and push tags

## 🤝 Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain a welcoming environment

### Communication

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and discussions
- **Pull Requests**: Code contributions and reviews

## 🛠️ Development Tips

### Deno Best Practices

```typescript
// Use Deno standard library
import { parseArgs } from "https://deno.land/std@0.208.0/cli/parse_args.ts";
import * as colors from "https://deno.land/std@0.208.0/fmt/colors.ts";

// Handle permissions explicitly
const cmd = new Deno.Command('git', {
  args: ['config', 'user.name'],
  stdout: 'piped',
  stderr: 'piped'
});

// Use proper error handling
try {
  const { code, stdout } = await cmd.output();
  if (code !== 0) {
    throw new Error('Git command failed');
  }
  return new TextDecoder().decode(stdout).trim();
} catch (error) {
  throw new Error(`Failed to get git config: ${error.message}`);
}
```

### Cross-Platform Considerations

```typescript
// Handle different operating systems
const homeDir = Deno.env.get('HOME') || Deno.env.get('USERPROFILE') || '.';

// Handle file permissions (Unix-like systems only)
if (Deno.build.os !== 'windows') {
  await Deno.chmod(scriptPath, 0o755);
}

// Use appropriate path separators
const workspaceDir = `${homeDir}/.no-wing/service-accounts/${projectName}`;
```

### Debugging

```typescript
// Add debug logging
const DEBUG = Deno.env.get('NO_WING_DEBUG') === '1';

function debug(message: string): void {
  if (DEBUG) {
    console.log(colors.gray(`[DEBUG] ${message}`));
  }
}

// Use in code
debug(`Creating workspace: ${workspaceDir}`);
```

## 📚 Resources

### Deno Resources
- [Deno Manual](https://deno.land/manual)
- [Deno Standard Library](https://deno.land/std)
- [Deno by Example](https://examples.deno.land/)

### Project Resources
- [Amazon Q CLI Documentation](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/)
- [AWS CLI Configuration](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)
- [Git Configuration](https://git-scm.com/book/en/v2/Customizing-Git-Git-Configuration)

## ❓ Getting Help

1. **Check documentation**: README.md and docs/
2. **Search issues**: Existing GitHub issues
3. **Ask questions**: GitHub Discussions
4. **Report bugs**: GitHub Issues

Thank you for contributing to no-wing! 🛫
