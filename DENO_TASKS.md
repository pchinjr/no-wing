# Deno Executable Development Tasks

## Goal: Replace Node.js CLI with native Deno TypeScript execution

### Phase 1: Core Deno Entry Point (Tasks 1-3)
- [ ] Task 1: Create main.ts entry point that imports and runs NoWingCLI
- [ ] Task 2: Test direct TypeScript execution with `deno run main.ts`
- [ ] Task 3: Verify all CLI commands work through Deno entry point

### Phase 2: Dependencies and Imports (Tasks 4-6)
- [ ] Task 4: Add proper Deno import map for AWS SDK and dependencies
- [ ] Task 5: Fix any import/export issues in TypeScript modules
- [ ] Task 6: Test all core functionality (credentials, deployment, audit)

### Phase 3: Compilation and Distribution (Tasks 7-9)
- [ ] Task 7: Create compiled binary with `deno compile main.ts`
- [ ] Task 8: Test compiled binary functionality matches runtime
- [ ] Task 9: Update documentation and installation instructions

### Phase 4: Cleanup (Tasks 10-12)
- [ ] Task 10: Remove Node.js CLI fallback (bin/no-wing.js)
- [ ] Task 11: Remove npm dependencies and package.json TypeScript deps
- [ ] Task 12: Update README with Deno-only installation

## Success Criteria
- ✅ `deno run main.ts help` shows CLI help
- ✅ All CLI commands work via Deno
- ✅ `deno compile` creates working binary
- ✅ All tests pass with `deno test`
- ✅ All linting passes with `deno lint`
- ✅ No Node.js dependencies required

## Current Status: Starting Task 1
