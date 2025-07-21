# No-Wing Workspace & DX Fix

## Problem Analysis

### Current Issues
1. **Q writes to `/tmp/q-workspace/`** instead of your project directory
2. **Service boundaries too strict** - Q can't effectively work on actual project
3. **Development confusion** - changes don't trigger rebuilds, multiple config locations
4. **Poor user experience** - Q operates in isolation from actual work

### Root Cause
The workspace location in `src/services/ProjectDetector.ts` line 81:
```typescript
const qHomeDir = `/tmp/q-workspace/${qUsername}`;
```

This creates a service boundary that's too aggressive - Q needs identity separation, not complete workspace isolation.

## Solution Overview

### 1. Fix Workspace Location
- **Current**: Q workspace in `/tmp/q-workspace/`
- **Fixed**: Q workspace in `./.no-wing/workspace/` (project directory)
- **Benefit**: Q works on actual project files while maintaining identity separation

### 2. Improve Development Workflow
- **Current**: Manual rebuilds, unclear when changes take effect
- **Fixed**: Development script with auto-rebuild and clear feedback
- **Benefit**: Faster iteration, less confusion during development

### 3. Better Service Boundaries
- **Current**: Complete isolation (Q can't touch your project)
- **Fixed**: Identity separation with workspace linking
- **Benefit**: Q can modify your project with clear audit trail

## Implementation

### Quick Fix (Immediate)

1. **Use the development workflow script**:
   ```bash
   ./dev-workflow.sh dev  # Full setup
   ./dev-workflow.sh watch  # Continuous development
   ```

2. **Test with development binary**:
   ```bash
   ./no-wing-dev status --config=./.no-wing-dev/config.json
   ```

### Proper Fix (Recommended)

1. **Update ProjectDetector.ts** (line 81):
   ```typescript
   // OLD:
   const qHomeDir = `/tmp/q-workspace/${qUsername}`;
   
   // NEW:
   const qHomeDir = join(workingDirectory, '.no-wing', 'q-home');
   const qWorkspaceDir = join(workingDirectory, '.no-wing', 'workspace');
   ```

2. **Add workspace mode configuration**:
   ```typescript
   interface QConfig {
     // ... existing fields
     projectPath: string;  // Actual project path
     workspaceMode: 'isolated' | 'linked';  // How Q interacts with project
   }
   ```

3. **Update QSessionManager** to handle linked mode:
   - In linked mode: Q works directly on project files
   - In isolated mode: Q works on copies (current behavior)
   - Always maintain separate git identity

## Benefits

### For Your Development
- ✅ Clear feedback when changes take effect
- ✅ Isolated development environment
- ✅ Faster iteration cycle
- ✅ No confusion about which version is running

### For Future Users
- ✅ Q works on actual project (not hidden in /tmp)
- ✅ Clear identity separation (git commits show Q vs human)
- ✅ Workspace in project directory (visible and manageable)
- ✅ Better audit trail (Q changes are in your project history)

## Migration Path

### Phase 1: Development Workflow (Now)
```bash
# Setup development environment
./dev-workflow.sh dev

# Start continuous development
./dev-workflow.sh watch
```

### Phase 2: Workspace Fix (Next)
1. Update `ProjectDetector.ts` with improved workspace strategy
2. Update `QSessionManager.ts` to handle linked workspace mode
3. Test with both isolated and linked modes
4. Update documentation

### Phase 3: User Experience (Future)
1. Add workspace mode selection during setup
2. Improve status command to show workspace location
3. Add workspace cleanup commands
4. Better error messages when workspace issues occur

## Testing Strategy

### Development Testing
```bash
# Test current behavior
./no-wing-dev status
./no-wing-dev launch --dry-run

# Test with different workspace modes
./no-wing-dev setup --workspace-mode=linked
./no-wing-dev setup --workspace-mode=isolated
```

### Integration Testing
```bash
# Test Q can modify project files
./no-wing-dev launch
# (In Q session) Create a test file
# Verify file appears in actual project directory

# Test git identity separation
git log --oneline
# Should show clear distinction between your commits and Q commits
```

## Configuration Examples

### Development Config (`.no-wing-dev/config.json`)
```json
{
  "workspace": {
    "location": "./.no-wing-dev/workspace",
    "mode": "linked",
    "syncToProject": true
  },
  "development": {
    "mode": true,
    "autoReload": true,
    "verboseLogging": true
  }
}
```

### Production Config (`.no-wing/config.json`)
```json
{
  "workspace": {
    "location": "./.no-wing/workspace", 
    "mode": "linked",
    "syncToProject": true
  },
  "audit": {
    "enabled": true,
    "logLocation": "./.no-wing/audit/"
  }
}
```

## Next Steps

1. **Immediate**: Use `./dev-workflow.sh dev` for development
2. **Short-term**: Implement workspace location fix
3. **Medium-term**: Add workspace mode selection
4. **Long-term**: Improve overall user experience

This fix aligns the service boundaries properly - Q gets its own identity but works on your actual project, giving you the security benefits without the DX friction.
