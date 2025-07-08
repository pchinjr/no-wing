# 🏗️ no-wing Architecture

**Q Service Account Manager - Technical Architecture**

## 🎯 Core Concept

Transform Amazon Q from using your identity to operating as a dedicated service account with its own:
- Local user account
- Git identity  
- AWS credentials
- Isolated workspace

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Developer                             │
│                           │                                 │
│                    runs no-wing                             │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                     no-wing CLI                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │   setup     │ │   status    │ │       cleanup           ││
│  │             │ │             │ │                         ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                Q Service Account                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Local User Identity                        ││
│  │  • User: q-assistant-{project}                          ││
│  │  • Home: /home/q-assistant-{project}/                   ││
│  │  • Workspace: /home/q-assistant-{project}/workspace/    ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                Git Identity                             ││
│  │  • Name: "Q Assistant ({project})"                      ││
│  │  • Email: "q-assistant+{project}@no-wing.dev"           ││
│  │  • SSH Keys: /home/q-assistant-{project}/.ssh/          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │               AWS Identity                              ││
│  │  • IAM User: q-assistant-{project}                      ││
│  │  • Profile: q-assistant-{project}                       ││
│  │  • Credentials: /home/q-assistant-{project}/.aws/       ││
│  └─────────────────────────────────────────────────────────┘│
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    Amazon Q                                 │
│              (running as Q service account)                 │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │ Git Commits │ │ AWS Deploy  │ │    File Operations      ││
│  │ (as Q user) │ │ (Q creds)   │ │   (Q workspace)         ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Component Design

### 1. Project Detection Engine
```typescript
interface ProjectType {
  type: 'sam' | 'cdk' | 'serverless' | 'generic';
  configFile: string;
  permissions: string[];
  deployCommand: string;
}

class ProjectDetector {
  detect(projectPath: string): ProjectType;
  generateQUsername(projectName: string): string;
  getRequiredPermissions(projectType: ProjectType): IAMPolicy;
}
```

### 2. Service Account Manager
```typescript
interface QServiceAccount {
  username: string;
  homeDirectory: string;
  workspace: string;
  gitIdentity: GitIdentity;
  awsIdentity: AWSIdentity;
}

class ServiceAccountManager {
  create(projectName: string): Promise<QServiceAccount>;
  configure(account: QServiceAccount): Promise<void>;
  cleanup(account: QServiceAccount): Promise<void>;
  status(account: QServiceAccount): ServiceAccountStatus;
}
```

### 3. Identity Managers

#### Local User Manager
```typescript
class LocalUserManager {
  createUser(username: string): Promise<void>;
  setupHomeDirectory(username: string): Promise<string>;
  configureSudoAccess(username: string): Promise<void>;
  deleteUser(username: string): Promise<void>;
}
```

#### Git Identity Manager
```typescript
class GitIdentityManager {
  setupGitConfig(username: string, projectName: string): Promise<void>;
  generateSSHKeys(username: string): Promise<void>;
  configureGitAuth(username: string): Promise<void>;
  testGitAccess(username: string): Promise<boolean>;
}
```

#### AWS Identity Manager
```typescript
class AWSIdentityManager {
  createIAMUser(username: string): Promise<string>;
  generateAccessKeys(username: string): Promise<AWSCredentials>;
  attachPolicies(username: string, policies: string[]): Promise<void>;
  setupAWSProfile(username: string, credentials: AWSCredentials): Promise<void>;
  deleteIAMUser(username: string): Promise<void>;
}
```

## 🗂️ File System Layout

### Project Structure
```
project-root/
├── .no-wing/
│   ├── config.json              # Q service account config
│   ├── permissions.json         # Q's current permissions
│   └── audit.log               # Q's action history
├── your-project-files...
└── README.md
```

### Q Service Account Home
```
/home/q-assistant-{project}/
├── .aws/
│   ├── credentials             # Q's AWS credentials
│   └── config                  # Q's AWS config
├── .ssh/
│   ├── id_rsa                  # Q's SSH private key
│   ├── id_rsa.pub              # Q's SSH public key
│   └── known_hosts             # Git hosts
├── .gitconfig                  # Q's git configuration
├── workspace/                  # Q's working directory
│   └── {project-clone}/        # Cloned project files
└── .no-wing/
    ├── logs/                   # Q's operation logs
    └── temp/                   # Q's temporary files
```

## 🔐 Security Model

### Permission Isolation
```typescript
interface PermissionBoundary {
  filesystem: {
    read: string[];      // Paths Q can read
    write: string[];     // Paths Q can write
    execute: string[];   // Commands Q can run
  };
  aws: {
    policies: string[];  // IAM policies attached to Q
    resources: string[]; // AWS resources Q can access
  };
  git: {
    repositories: string[]; // Git repos Q can access
    operations: string[];   // Git operations Q can perform
  };
}
```

### Audit Trail
```typescript
interface QAction {
  timestamp: Date;
  user: 'q-assistant-{project}';
  action: 'git-commit' | 'aws-deploy' | 'file-write';
  details: Record<string, any>;
  success: boolean;
  error?: string;
}
```

## 🚀 Command Execution Flow

### Setup Flow
```
1. no-wing setup
   ├── Detect project type
   ├── Generate Q username
   ├── Create local user account
   ├── Setup Q's home directory
   ├── Configure git identity
   ├── Create AWS IAM user
   ├── Generate AWS credentials
   ├── Setup AWS profile
   ├── Apply permission policies
   └── Test Q service account
```

### Q Operation Flow
```
1. User requests Q action
   ├── no-wing launches Q as service account user
   ├── Q operates in its own workspace
   ├── Q uses its own git/AWS identities
   ├── Q performs requested action
   ├── Action logged to audit trail
   └── Results returned to user
```

### Cleanup Flow
```
1. no-wing cleanup
   ├── Stop any running Q processes
   ├── Delete AWS IAM user and keys
   ├── Remove AWS profile
   ├── Delete local user account
   ├── Clean up home directory
   └── Remove project .no-wing config
```

## 🧪 Testing Strategy

### Unit Tests
- Project detection logic
- User account creation/deletion
- AWS identity management
- Git configuration setup

### Integration Tests
- End-to-end setup flow
- Q operation with service account
- Cross-service identity verification
- Cleanup and teardown

### Security Tests
- Permission boundary enforcement
- Credential isolation verification
- Audit trail completeness
- Privilege escalation prevention

---

**Architecture Goal: Complete identity separation between developer and Q assistant**
