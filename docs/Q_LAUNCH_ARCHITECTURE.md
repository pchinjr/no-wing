# Q Launch Feature Architecture

## Overview
The Q Launch feature enables launching Amazon Q with proper service account identity separation, ensuring Q operates with its own credentials and workspace rather than masquerading as the human user.

## Core Components

### 1. ProjectDetector
**Purpose**: Detect current project context and generate Q configuration
**Location**: `src/services/ProjectDetector.ts`
**Responsibilities**:
- Detect project type (Node.js, Python, CloudFormation, etc.)
- Generate Q-specific configuration based on project context
- Determine appropriate workspace and permissions

### 2. ServiceAccountManager  
**Purpose**: Manage Q service account lifecycle and validation
**Location**: `src/services/ServiceAccountManager.ts`
**Responsibilities**:
- Validate Q service account exists and is healthy
- Check AWS credentials, Git identity, workspace setup
- Provide service account status and diagnostics

### 3. QSessionManager
**Purpose**: Launch and manage Q sessions with proper identity
**Location**: `src/services/QSessionManager.ts`
**Responsibilities**:
- Launch Q CLI with service account identity
- Manage active Q sessions (start/stop/status)
- Ensure proper workspace isolation

### 4. Launch Command Integration
**Purpose**: CLI command integration in existing NoWingCLI
**Location**: `src/cli/NoWingCLI.ts`
**Responsibilities**:
- Command registration and option parsing
- User interaction and confirmation flows
- Integration with existing credential management

## Key Design Principles

### 1. Identity Separation
- Q operates with its own AWS credentials (from no-wing config)
- Q commits use Q Assistant git identity, not human identity
- Q workspace is isolated from human workspace

### 2. Security First
- Validate service account health before launch
- Use least-privilege permissions from no-wing config
- Clear security confirmations and explanations

### 3. Session Management
- Detect and manage existing Q sessions
- Graceful session restart/stop capabilities
- Session status and diagnostics

### 4. Deno Compatibility
- Pure Deno implementation (no Node.js dependencies)
- Use Deno's built-in APIs for process management
- TypeScript strict mode compliance

## Implementation Plan

### Phase 1: Core Services
1. Create ProjectDetector with basic project type detection
2. Implement ServiceAccountManager with health validation
3. Build QSessionManager with Deno subprocess management

### Phase 2: CLI Integration
1. Add launch command to NoWingCLI
2. Implement user interaction flows
3. Add comprehensive error handling

### Phase 3: Testing & Documentation
1. Unit tests for all services
2. Integration tests for launch flow
3. Update README with launch examples

## Security Considerations

### AWS Credentials
- Q uses credentials from no-wing configuration
- Never expose human AWS credentials to Q
- Validate credentials before launch

### Git Identity
- Q commits attributed to "Q Assistant" identity
- Separate from human git configuration
- Clear audit trail of Q vs human actions

### Workspace Isolation
- Q operates in isolated workspace directory
- No access to human's personal files
- Project-specific Q workspace per no-wing context

## Error Handling

### Service Account Issues
- Clear diagnostics when service account missing/unhealthy
- Helpful guidance to fix service account problems
- Graceful degradation with actionable error messages

### Session Management
- Handle existing Q sessions gracefully
- Provide options to restart/stop existing sessions
- Clear session status information

### AWS/Git Issues
- Validate AWS credentials before launch
- Check git configuration completeness
- Provide specific troubleshooting guidance

## Testing Strategy

### Unit Tests
- Mock AWS SDK calls for credential validation
- Test project detection logic with sample projects
- Validate session management state transitions

### Integration Tests
- End-to-end launch flow testing
- Service account health validation
- Session lifecycle management

### Manual Testing
- Real Q CLI integration testing
- AWS credential validation
- Git identity separation verification
