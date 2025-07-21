# no-wing Specification

## Overview
no-wing is a CLI tool that manages IAM credentials and permissions for AI coding agents (specifically Amazon Q). It provides a secure way to scope and control AI agent access to AWS resources.

## Core Features

### 1. Installation & Setup
```bash
# Install globally with deno
deno install -A -n no-wing main.ts

# Initialize no-wing configuration
no-wing init
```

### 2. Core Commands
- `init`: Set up initial configuration and IAM roles
- `start`: Start a new Q session with scoped IAM
- `list`: Show active agent sessions
- `revoke`: Revoke specific agent sessions

### 3. Architecture

#### Components
1. CLI Interface (main.ts)
   - Command parsing
   - User interaction
   - Configuration management

2. IAM Manager (iam.ts)
   - Role creation
   - Session management
   - Permission boundaries

3. Session Manager (session.ts)
   - Temporary credential management
   - Session tracking
   - Audit logging

#### Configuration
```typescript
// ~/.no-wing/config.json
interface Config {
  defaultRole: string;
  permissionBoundary: string;
  auditLog: boolean;
  sessions: {
    maxDuration: number;
    requireApproval: boolean;
  };
}
```

### 4. Security Model

#### IAM Structure
- Dedicated IAM role for AI agents
- Permission boundaries to limit scope
- Session-based temporary credentials
- Resource tagging for attribution

#### Session Management
- Short-lived credentials (max 1 hour)
- Automatic session termination
- Audit trail of all operations

### 5. Workflow

1. User Setup
```bash
# First-time setup
no-wing init
```

2. Start Q Session
```bash
# Start Q with managed credentials
no-wing start q
```

3. Session Management
```bash
# List active sessions
no-wing list

# Revoke session
no-wing revoke <session-id>
```

### 6. Dependencies
- Deno standard library
- AWS SDK for JavaScript
- Cliffy for CLI interface

## Implementation Guidelines

### Security
- Always use temporary credentials
- Implement least privilege access
- Maintain clear audit trails
- Secure configuration storage

### User Experience
- Clear error messages
- Interactive configuration
- Minimal setup requirements
- Seamless integration with Q CLI

### Development
- TypeScript for type safety
- Modular architecture
- Unit test coverage
- Clear documentation

## Future Considerations
- Support for multiple AI agents
- Enhanced monitoring capabilities
- Integration with AWS Organizations
- Custom permission templates
