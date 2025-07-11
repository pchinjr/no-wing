# 🛫 no-wing

**Q Identity & Git Authorship Manager - Give Amazon Q its own identity for secure, auditable automation**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/pchinjr/no-wing/releases/tag/v1.0.0)
[![TypeScript](https://img.shields.io/badge/language-TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![Deno](https://img.shields.io/badge/runtime-Deno-black.svg)](https://deno.land/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 🎯 The Problem

When Amazon Q performs operations, it uses YOUR identity:
- ❌ Q commits code as YOU
- ❌ Q deploys with YOUR AWS credentials  
- ❌ No clear audit trail of human vs AI actions
- ❌ Security risk if Q is compromised
- ❌ Compliance violations in enterprise environments

## 🛡️ The Solution: Q Identity Separation

**no-wing** implements **identity separation** between you and Amazon Q:

```
┌─────────────────┐    ┌─────────────────┐
│   User Actions  │    │   Q Actions     │
│                 │    │                 │
│ • Configuration │    │ • Deployments   │
│ • Validation    │    │ • Automation    │
│ • Manual Ops    │    │ • Git Commits   │
└─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│ User Identity   │    │ Q Identity      │
│ (Your AWS/Git)  │    │ (Service Acct)  │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
            ┌─────────────────┐
            │   Audit Trail   │
            │ (Clear Separation)│
            └─────────────────┘
```

## ✅ Key Benefits

- **🔐 Security**: Q uses dedicated service credentials, not your personal access
- **📝 Git Authorship**: Clear separation between human and AI commits
- **📊 Audit Trail**: Complete visibility into Q vs human actions
- **🎯 Context Aware**: Project-specific Q identities with global fallback
- **🛡️ Compliance**: Enterprise-ready audit logs and credential isolation

## 🚀 Quick Start

### Installation

```bash
# Clone and install
git clone https://github.com/pchinjr/no-wing.git
cd no-wing
./install.sh

# Or install system-wide
sudo ./install.sh --system
```

### Setup Q Identity

```bash
# Project-specific Q identity
cd /my/project
no-wing setup --profile my-aws-profile

# Check status
no-wing status
# 📍 Context: Project-specific
# 📂 Config location: /my/project/.no-wing
# ✅ Q identity configured for this project
```

### Deploy with Q Identity

```bash
# Q deploys using its own credentials
no-wing deploy template.yaml

# Q commits use Q's git identity
no-wing git configure
```

## 🎨 Context-Aware Operation

**no-wing** automatically detects the right context:

### Project-Specific Context
```bash
cd /my/project
no-wing status
# Uses: ./my/project/.no-wing/
# Q Identity: project-specific service account
```

### Global Context  
```bash
cd /any/directory
no-wing status
# Uses: ~/.no-wing/
# Q Identity: global default service account
```

### Smart Setup
```bash
# Creates project-specific config
cd /new/project && no-wing setup

# Creates global config  
cd ~ && no-wing setup --global
```

## 📋 Commands

### Core Operations
```bash
no-wing status                    # Show current Q identity context
no-wing setup [--profile <name>] # Setup Q identity (project or global)
no-wing deploy <template>         # Deploy with Q credentials
no-wing rollback <stack>          # Rollback deployment
```

### Identity Management
```bash
no-wing credentials whoami        # Show current Q identity
no-wing credentials test          # Test Q service account
no-wing credentials switch <ctx>  # Switch Q context
```

### Git Authorship
```bash
no-wing git configure            # Setup git authorship separation
no-wing git status               # Show current git config
```

### Audit & Compliance
```bash
no-wing audit events             # Show Q activity log
no-wing audit report             # Generate compliance report
no-wing audit verify             # Verify CloudTrail integration
```

## 🏗️ Architecture

### Context Detection
- **Project-specific**: Current directory has `.no-wing/` or running setup
- **Global fallback**: Uses `~/.no-wing/` for general operations
- **Zero confusion**: Always clear which Q identity is active

### Configuration Structure
```
Project-Specific:               Global:
./project/.no-wing/            ~/.no-wing/
├── config.json                ├── config.json
├── credentials/               ├── credentials/
├── audit/                     ├── audit/
└── git-config                 └── git-config
```

### Security Model
- **Credential Isolation**: Q never uses your personal AWS credentials
- **Git Separation**: Q commits clearly attributed to service account
- **Audit Logging**: Complete trail of all Q operations
- **Least Privilege**: Q gets only required permissions per project

## 🔧 Development

### Prerequisites
- [Deno](https://deno.land/) v1.40+
- AWS CLI configured
- Git for version control

### Local Development
```bash
# Clone repository
git clone https://github.com/pchinjr/no-wing.git
cd no-wing

# Run directly with Deno
deno run --allow-all main.ts status

# Or use executable
./no-wing status

# Run tests
deno test --allow-all src/test/*_test.ts

# Run specific test suites
deno test --allow-all src/test/context_manager_test.ts      # Unit tests
deno test --allow-all src/test/cli_integration_test.ts      # Integration tests

# Lint code
deno lint
```

### Build Executable
```bash
# Compile to binary
deno compile --allow-all --output no-wing main.ts
```

## 📚 Documentation

- **[Installation Guide](INSTALL.md)** - Setup and installation options
- **[Context Detection](docs/CONTEXT_DETECTION.md)** - How context detection works
- **[Credential Separation](docs/CREDENTIAL_SEPARATION.md)** - Security architecture
- **[Contributing](docs/CONTRIBUTING.md)** - Development guidelines
- **[Testing](docs/TESTING.md)** - Test strategy and execution

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Follow our development cycle: frequent small commits, lint, test
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for detailed guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Amazon Q team for the inspiration
- AWS SDK team for excellent tooling
- Deno team for the modern runtime
- Open source community for feedback and contributions

---

**Give Amazon Q its own identity. Keep yours separate. Stay secure.**
