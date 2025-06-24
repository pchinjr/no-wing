# 🛫 no-wing Project Structure

## Core Files

```
no-wing/
├── 📋 README.md                    # Main project documentation
├── 📦 package.json                 # Node.js dependencies and scripts
├── 🔧 tsconfig.json               # TypeScript configuration
├── 🧪 jest.config.js              # Test configuration
├── 🐳 Dockerfile                  # Container distribution
├── 📝 docker-entrypoint.sh        # Docker entry script
├── 📦 .npmignore                  # npm package exclusions
└── 🔒 .gitignore                  # Git exclusions
```

## Source Code (`src/`)

```
src/
├── cli/                           # Command-line interface
│   ├── index.ts                   # Main CLI entry point
│   ├── chat.ts                    # Interactive Q chat
│   ├── init.ts                    # Project initialization
│   ├── q-task.ts                  # One-shot Q tasks
│   ├── q-status.ts                # Q status checking
│   ├── q-history.ts               # Q task history
│   ├── verify.ts                  # Installation verification
│   └── nothing.ts                 # Easter egg command
│
├── q/                             # Q AI agent core
│   ├── identity.ts                # Q identity management
│   ├── dialogue.ts                # Q conversation system
│   ├── task-executor.ts           # Q task execution engine
│   └── git-identity.ts            # Q Git integration
│
├── aws/                           # AWS integration
│   ├── aws-service-manager.ts     # AWS service orchestration
│   └── sam-manager.ts             # SAM deployment management
│
├── lambda/                        # Lambda functions
│   ├── index.ts                   # Main Lambda handler
│   ├── orchestrator.ts            # Orchestration Lambda
│   └── q-functions/               # Q-created function templates
│       └── index.js               # Template function code
│
└── __tests__/                     # Unit tests
    └── nothing.test.ts            # Test examples
```

## Infrastructure (`templates/`)

```
templates/
├── q-lambda-function.yaml         # SAM template for Lambda functions
├── q-s3-bucket.yaml              # SAM template for S3 buckets
└── template-minimal.yaml         # Minimal deployment template
```

## Scripts (`scripts/`)

```
scripts/
├── cleanup-q-functions.sh         # Clean up demo functions
├── release.sh                     # Release automation
└── verify-install.sh              # Installation verification
```

## Documentation (`docs/`)

```
docs/
├── README.md                      # Documentation index
├── OVERVIEW.md                    # Project overview
├── SAM-DEPLOYMENT.md              # SAM deployment guide
├── HACKATHON-SUBMISSION.md        # Hackathon submission
└── DEPLOYMENT.md                  # Deployment instructions
```

## Distribution Files

```
├── DISTRIBUTION.md                # Distribution strategy
├── SECURITY.md                   # Security documentation
├── demo-mvp.sh                   # MVP demonstration script
└── deploy-minimal.sh             # Minimal deployment script
```

## Build Artifacts (Generated)

```
dist/                              # Compiled TypeScript (gitignored)
coverage/                          # Test coverage reports (gitignored)
.no-wing/                         # Runtime working directory (gitignored)
```

## Key Features by Directory

### 🤖 **Q AI Agent (`src/q/`)**
- Identity and capability management
- Natural language task processing
- Git integration with proper attribution
- Progressive permission system

### ☁️ **AWS Integration (`src/aws/`)**
- SAM-based Infrastructure as Code
- CloudFormation stack management
- AWS service orchestration
- Resource lifecycle management

### 💬 **CLI Interface (`src/cli/`)**
- Interactive chat with Q
- One-shot command execution
- Project initialization
- Status and history tracking

### 🏗️ **Infrastructure (`templates/`)**
- Production-ready SAM templates
- Security best practices
- Parameterized deployments
- Resource tagging and organization

## Development Workflow

1. **Install**: `npm install -g no-wing`
2. **Initialize**: `no-wing init --name=YourName`
3. **Chat with Q**: `no-wing chat`
4. **Deploy Infrastructure**: Q uses SAM templates automatically
5. **Track Progress**: `no-wing q-status`

## Distribution Channels

- **npm**: Global CLI installation
- **Docker**: Containerized execution
- **GitHub**: Template repository
- **AWS SAM**: Native deployment

---

**🛫 Clean, organized, and ready for production deployment!**
