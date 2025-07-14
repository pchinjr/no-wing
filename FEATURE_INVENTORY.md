# 🎯 no-wing Feature Inventory & Testing Matrix

## 🚨 Critical Issue: Workspace Isolation Fix

**Problem**: Q writes code to workspace copy instead of target project directory
**Impact**: Code written by Q ends up in `.no-wing/workspace/project/` instead of project root
**Priority**: P0 - Blocks core functionality

## 📋 Core Features

### 1. Installation & Setup
- [ ] **Global Installation** (`sudo ./install.sh --system`)
  - [ ] Unit Test: Installation creates global binary
  - [ ] Integration Test: Global binary works from any directory
  - [ ] Lint: No unused variables in install scripts
  
- [ ] **Per-Project Installation** (`./install.sh`)
  - [ ] Unit Test: Installation creates project-local binary
  - [ ] Integration Test: Project binary works within project
  - [ ] Lint: Strict TypeScript compliance

- [ ] **Setup Command** (`no-wing setup --profile <profile>`)
  - [ ] Unit Test: Creates correct config structure
  - [ ] Integration Test: Setup works in both global and project contexts
  - [ ] Edge Case Test: Setup with missing AWS profile

### 2. Context Detection & Workspace Management
- [ ] **Project-Specific Context**
  - [ ] Unit Test: Detects `.no-wing/` directory correctly
  - [ ] Unit Test: Creates project-specific config
  - [ ] Integration Test: Q operates in project directory (NOT workspace copy)
  - [ ] **CRITICAL FIX**: Q writes code to project root, not workspace

- [ ] **Global Context**
  - [ ] Unit Test: Falls back to `~/.no-wing/` when no project config
  - [ ] Integration Test: Global config works across projects
  - [ ] Edge Case Test: Mixed global/project scenarios

- [ ] **Workspace Isolation** (NEEDS MAJOR FIX)
  - [ ] Unit Test: Workspace created for logs/sessions only
  - [ ] Integration Test: Q operates directly in target project
  - [ ] Integration Test: Code written by Q appears in correct location
  - [ ] Security Test: Workspace permissions are correct

## 🚨 Critical Fixes Required

### 1. Workspace Isolation Fix (P0)
**File**: `src/services/QSessionManager.ts` and `src/services/ProjectDetector.ts`

**Current Problem**:
```typescript
// Q operates in workspace copy
const projectDir = `${this.qConfig.workspace}/project`;
```

**Required Fix**:
```typescript
// Q operates directly in target project
const projectDir = this.qConfig.projectPath; // Original project directory
```

**Changes Needed**:
1. Remove project copying to workspace
2. Q workspace only for logs/sessions/temp files
3. Q writes code directly to target project directory
4. Update all references to use `projectPath` not `workspace/project`

## 📊 Testing Commands

```bash
# Type Safety & Linting
deno check main.ts                                    # TypeScript strict checking
deno lint                                            # Code linting

# Unit Tests
deno test --allow-all src/test/*_test.ts             # All unit tests

# Integration Tests  
deno test --allow-all src/test/integration/         # All integration tests
```

## 🎯 Success Criteria

1. **Zero unused variables** - Code must compile with strict TypeScript
2. **90%+ test coverage** - Comprehensive test suite
3. **Workspace isolation works** - Q writes code to correct location
4. **Installation flexibility** - Global and per-project installation
5. **Clear audit trail** - All Q actions properly attributed

---

**Next Steps**: Fix the workspace isolation issue first, then build comprehensive test coverage around the corrected behavior.
