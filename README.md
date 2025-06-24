# 🛫 no-wing

**Enterprise Developer+Q Vending and Onboarding System**

Provision new developers with their own AI assistant (Q) while maintaining proper IAM governance and monitoring.

## Why no-wing?

- **Vend developer+Q pairs** with appropriate IAM roles and boundaries
- **Monitor Q activities** in real-time with compliance reporting
- **Onboard developers faster** with AI assistance from day one
- **Maintain security** with permission boundaries and audit trails
- **Scale AI adoption** across your organization safely

## Architecture

```
Organization Admin
    ↓ (provisions)
no-wing Vending System
    ↓ (creates)
Developer + Q Pair
    ↓ (monitored activities)
AWS Infrastructure
```

## Quick Start

### For Administrators

```bash
# Install no-wing admin tools
npm install -g no-wing

# Provision a new developer+Q pair
no-wing admin provision-developer \
  --email sarah@company.com \
  --role junior \
  --team backend \
  --projects user-service,payment-api

# Monitor Q activities
no-wing admin dashboard
no-wing admin monitor q-sarah-123
```

### For Developers

```bash
# Onboard with provided token
no-wing setup --token <onboarding-token>

# Start working with your Q assistant
no-wing chat
no-wing q-task "analyze the user-service architecture"
```

## Core Components

### 1. Vending Service
- **Provisions IAM roles** for both developer and Q
- **Sets up monitoring** and audit trails
- **Configures permission boundaries** to prevent escalation
- **Initializes Q** with appropriate capabilities

### 2. IAM Management
- **Human developer roles** with project-specific permissions
- **Q agent roles** with limited, monitored AWS access
- **Permission boundaries** that prevent privilege escalation
- **Escalation workflows** for capability advancement

### 3. Monitoring & Compliance
- **Real-time activity logging** for all Q actions
- **Anomaly detection** for unusual behavior
- **Compliance reporting** for audit requirements
- **Risk scoring** for Q activities

### 4. Developer Experience
- **Seamless onboarding** with pre-configured Q assistant
- **Natural language interface** for AWS operations
- **Company-aware Q** that learns organizational patterns
- **Safe experimentation** within permission boundaries

## Security Model

### IAM Architecture
```
Organization Account
├── Human Developer Role
│   ├── Project-specific AWS permissions
│   ├── Cannot assume Q roles
│   └── Permission boundary prevents escalation
│
└── Q Agent Role
    ├── Limited AWS actions (based on capability level)
    ├── Cannot assume human roles
    ├── All actions logged and monitored
    └── Strict permission boundary
```

### Monitoring
- **CloudTrail integration** for complete audit logs
- **Real-time alerts** for risky Q behavior
- **Cost tracking** per Q agent
- **Compliance dashboards** for management

## Use Cases

### New Developer Onboarding
1. **Admin provisions** developer+Q pair with appropriate permissions
2. **Developer receives** onboarding instructions and credentials
3. **Q assists** with learning company infrastructure and patterns
4. **Organization monitors** Q activities and developer progress

### AI-Assisted Development
1. **Developer works** with Q on daily tasks
2. **Q suggests** company-approved patterns and solutions
3. **Q creates resources** within permission boundaries
4. **Activities logged** for compliance and learning

### Capability Progression
1. **Q starts** with Observer-level permissions
2. **Q earns** more capabilities through successful tasks
3. **Admin approves** permission escalations
4. **Q becomes** more autonomous within safe boundaries

## Requirements

- **AWS Organization** with appropriate account structure
- **IAM Identity Center** for SSO integration (optional)
- **CloudTrail** enabled for audit logging
- **Node.js 18+** for no-wing CLI tools

## Documentation

- **[Admin Guide](docs/ADMIN.md)** - Setting up and managing the system
- **[Developer Guide](docs/DEVELOPER.md)** - Using your Q assistant
- **[Security Model](docs/SECURITY.md)** - IAM architecture and boundaries
- **[Monitoring Guide](docs/MONITORING.md)** - Compliance and reporting

---

**Enterprise-grade AI assistant provisioning with proper governance.** 🛫
