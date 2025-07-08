# 🛫 no-wing

**Q Service Account Manager - Give Amazon Q its own identity for secure, auditable project automation**

Configure Amazon Q with its own local user account, AWS credentials, and git identity per project. Q operates as a dedicated service account with proper attribution and isolated permissions - never masquerading as you again.

## 🎯 The Problem

When you give Amazon Q command line access, it performs actions using YOUR identity:
- ❌ Q commits code as YOU
- ❌ Q deploys with YOUR AWS credentials  
- ❌ Q pushes to git as YOU
- ❌ No clear audit trail of human vs AI actions
- ❌ Security risk if Q is compromised

## 🛡️ The Solution

**no-wing** creates a dedicated service account for Q in each project:
- ✅ Q has its own local user account (`q-assistant-{project}`)
- ✅ Q commits with its own git identity
- ✅ Q uses its own AWS credentials with scoped permissions
- ✅ Clear separation between human and AI actions
- ✅ Isolated blast radius per project

## 🚀 Quick Start

```bash
# Navigate to your AWS serverless project
cd my-sam-project

# Set up Q as a service account for this project
no-wing setup

# Q now operates with its own identity!
# - Local user: q-assistant-my-sam-project
# - Git commits: "Q Assistant <q-assistant@no-wing.dev>"
# - AWS profile: q-assistant-my-sam-project
```

## 📋 Core Commands

```bash
no-wing setup              # Create Q service account for current project
no-wing status             # Show Q service account status
no-wing permissions        # Manage Q's AWS/git permissions
no-wing cleanup            # Remove Q service account
no-wing audit              # Show Q's recent actions
```

## 🏗️ What no-wing Creates

### Local Service Account
```
q-assistant-{project}/
├── Home: /home/q-assistant-{project}/
├── Shell: /bin/bash
├── Groups: docker (if needed)
└── Workspace: /home/q-assistant-{project}/workspace/
```

### AWS Identity
```
AWS Profile: q-assistant-{project}
├── IAM User: q-assistant-{project}
├── Access Keys: Dedicated to this project
├── Permissions: Scoped to project needs
└── Region: Inherited from your config
```

### Git Identity
```
Git Config:
├── Name: "Q Assistant ({project})"
├── Email: "q-assistant+{project}@no-wing.dev"
├── SSH Keys: Dedicated keypair
└── Commit Prefix: "[Q]"
```

## 🔐 Security Model

### Least Privilege
- Q starts with minimal permissions
- Permissions expand based on project needs
- Each project has isolated Q identity

### Audit Trail
- All Q actions logged with proper attribution
- Clear distinction between human and AI commits
- AWS CloudTrail shows Q's dedicated user actions

### Blast Radius Containment
- Q compromise only affects current project
- No cross-project credential sharing
- Easy to revoke/recreate Q identity per project

## 📊 Project Detection

**no-wing** automatically detects project type and configures appropriate permissions:

- **SAM Projects**: `template.yaml` → Lambda, API Gateway, DynamoDB permissions
- **CDK Projects**: `cdk.json` → Full CDK deployment permissions  
- **Serverless Framework**: `serverless.yml` → Framework-specific permissions
- **Generic AWS**: Basic AWS CLI permissions

## 🎯 MVP Roadmap

See [MVP_ROADMAP.md](./MVP_ROADMAP.md) for detailed implementation plan.

## 🛠️ Requirements

- Node.js 18+
- sudo access (for creating local user accounts)
- AWS CLI configured with admin permissions (for initial Q setup)
- Git repository (for Q git identity setup)

---

**🛫 no-wing: Q Service Account Manager**

*Give Amazon Q its own identity. Secure, auditable, isolated.*
