# Deno Executable Development Tasks

## Goal: Replace Node.js CLI with native Deno TypeScript execution

### Phase 1: Core Deno Entry Point (Tasks 1-3)
- [x] Task 1: Create main.ts entry point that imports and runs NoWingCLI
- [x] Task 2: Test direct TypeScript execution with `deno run main.ts` 
- [ ] Task 3: Verify all CLI commands work through Deno entry point

### Phase 2: Dependencies and Imports (Tasks 4-6)
- [x] Task 4: Add proper Deno import map for AWS SDK and dependencies
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

## Progress Summary

### ✅ Completed
- **Task 1**: Created main.ts Deno entry point with proper import.meta.main detection
- **Task 2**: Fixed Node.js imports to Deno std library imports (.ts extensions, npm: prefixes)
- **Import Conversion**: Automated script to convert fs/path imports across all files

### 🔄 Current Issues (Task 2 continuation)
- **43 linting errors**: Unused imports, missing async keywords, Node.js globals
- **Async/Sync mismatch**: Methods using await not marked as async
- **Over-importing**: Import script added unused functions
- **Node.js globals**: process.exit still used instead of Deno.exit

### 🎯 Next Steps
1. **Clean up imports**: Remove unused imports, fix async method signatures
2. **Replace Node.js globals**: process.exit -> Deno.exit, process.argv -> Deno.args
3. **Test basic CLI functionality**: Get `deno run main.ts help` working
4. **Incremental testing**: Fix one module at a time rather than all at once

## Success Criteria
- ✅ `deno run main.ts help` shows CLI help
- ✅ All CLI commands work via Deno
- ✅ `deno compile` creates working binary
- ✅ All tests pass with `deno test`
- ✅ All linting passes with `deno lint`
- ✅ No Node.js dependencies required

## Current Status: Task 2 - Fixing import/async issues (43 linting errors to resolve)
