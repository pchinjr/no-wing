# Context Detection Feature

## Overview

The context detection feature enables **no-wing** to intelligently determine whether to use project-specific or global Q service account configurations. This provides a seamless developer experience while maintaining proper credential isolation.

## How It Works

### Context Detection Logic

1. **Project-Specific Context** - Used when:
   - Current directory contains `.no-wing/` folder
   - Running `no-wing setup` command (creates in current directory)

2. **Global Context** - Used when:
   - No `.no-wing/` folder in current directory
   - Not running setup command
   - Falls back to `~/.no-wing/`

### Configuration Locations

```
Project-Specific:
./my-project/.no-wing/
├── config.json          # Q service account config
├── credentials/         # Q-specific AWS credentials  
└── audit/              # Project audit logs

Global:
~/.no-wing/
├── config.json          # Default Q service account
├── credentials/         # Global Q credentials
└── audit/              # Global audit logs
```

## User Experience

### Scenario 1: New Project Setup

```bash
cd /my/new/project
no-wing status
# 📍 Context: Global
# 📂 Config location: /home/user/.no-wing
# 💡 No configuration found in current context
# 🚀 Run "no-wing setup --profile <aws-profile>" to get started

no-wing setup --profile my-aws-profile
# 🚀 Setting up no-wing...
# 📍 Context: Project-specific  
# 📂 Config location: /my/new/project/.no-wing
# 🏗️ Creating Q identity for project: /my/new/project
# ✅ Setup completed successfully
```

### Scenario 2: Existing Project

```bash
cd /my/existing/project  # (already has .no-wing/)
no-wing status
# 📍 Context: Project-specific
# 📂 Config location: /my/existing/project/.no-wing
# ✅ System operational
```

### Scenario 3: Global Operations

```bash
cd /any/random/directory
no-wing status
# 📍 Context: Global
# 📂 Config location: /home/user/.no-wing
# ✅ System operational (using global Q identity)
```

## Benefits

### 🎯 **Zero Configuration Confusion**
- Always clear which Q identity is active
- Intuitive behavior matches developer expectations
- No manual context switching required

### 🔐 **Automatic Credential Isolation**
- Each project gets its own Q service account
- Global fallback for general operations
- Complete separation between projects

### 📊 **Clear Audit Trails**
- Project-specific audit logs
- Easy to track Q actions per project
- Compliance-ready separation

### 🚀 **Seamless Workflow**
- Works from any directory
- Smart detection of intent
- Minimal cognitive overhead

## Implementation Details

### ContextManager Class

```typescript
interface ProjectContext {
  configDirectory: string;
  isProjectSpecific: boolean;
  projectPath?: string;
}

class ContextManager {
  detectContext(): ProjectContext
  ensureConfigDirectory(configDir: string): Promise<void>
  getContextDescription(context: ProjectContext): string
}
```

### ConfigManager Integration

The `ConfigManager` now uses `ContextManager` to automatically determine the correct configuration location:

```typescript
class ConfigManager {
  constructor() {
    this.contextManager = new ContextManager();
    this.context = this.contextManager.detectContext();
    this.configPath = `${this.context.configDirectory}/config.json`;
  }
}
```

## Migration

### Existing Users

No migration required! The context detection is backward compatible:

- Existing global configs in `~/.no-wing/` continue to work
- Existing project configs in `./project/.no-wing/` continue to work
- New projects automatically get project-specific contexts

### Best Practices

1. **Project Setup**: Always run `no-wing setup` in your project root
2. **Global Operations**: Use global context for cross-project operations
3. **Team Sharing**: Add `.no-wing/` to your `.gitignore` (contains credentials)

## Troubleshooting

### Context Not Detected Correctly

```bash
# Check current context
no-wing status

# Expected output shows:
# 📍 Context: Project-specific | Global
# 📂 Config location: /path/to/config
```

### Force Project-Specific Setup

```bash
cd /your/project/root
no-wing setup --profile your-profile
# This will always create project-specific config
```

### Check Configuration Location

```bash
no-wing config show
# Shows current configuration and location
```

## Future Enhancements

- **Multi-project awareness**: Global registry of all projects
- **Context switching**: `no-wing context switch <project>`
- **Project templates**: Pre-configured Q identities for project types
