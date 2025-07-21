# Testing Guide

## Overview

**no-wing** uses **Deno's built-in testing framework** for unit and integration tests.

## Running Tests

### All Tests
```bash
# Run all tests
deno test --allow-all src/test/*_test.ts

# Or use npm script
npm test
```

### Unit Tests
```bash
# Context manager unit tests
deno test --allow-all src/test/context_manager_test.ts

# Or use npm script
npm run test:unit
```

### Integration Tests
```bash
# CLI integration tests
deno test --allow-all src/test/cli_integration_test.ts

# Or use npm script  
npm run test:integration
```

## Test Structure

### Unit Tests (`*_test.ts`)
- Test individual classes and functions
- Fast execution
- No external dependencies
- Example: `context_manager_test.ts`

### Integration Tests (`*_integration_test.ts`)
- Test CLI commands end-to-end
- Slower execution
- Test real CLI behavior
- Example: `cli_integration_test.ts`

## Writing Tests

### Unit Test Example
```typescript
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { MyClass } from "../path/to/MyClass.ts";

Deno.test("MyClass - should do something", () => {
  const instance = new MyClass();
  const result = instance.doSomething();
  assertEquals(result, "expected");
});
```

### Integration Test Example
```typescript
import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("CLI - command works", async () => {
  const cmd = new Deno.Command("./no-wing", {
    args: ["status"],
    stdout: "piped",
    stderr: "piped"
  });
  
  const { code, stdout } = await cmd.output();
  const output = new TextDecoder().decode(stdout);
  
  assertEquals(code, 0);
  assertStringIncludes(output, "expected text");
});
```

## Test Coverage

### Current Coverage
- ✅ **ContextManager** - Unit tests for context detection
- ✅ **CLI Commands** - Integration tests for help, status, setup
- ✅ **Error Handling** - Tests for invalid scenarios

### Future Tests
- **ConfigManager** - Configuration loading and validation
- **CredentialManager** - AWS credential handling
- **DeploymentManager** - CloudFormation operations
- **AuditLogger** - Audit trail functionality

## Continuous Integration

Tests are designed to run in CI environments:
- No external AWS dependencies for unit tests
- Integration tests use mock/local commands
- All tests pass with `--allow-all` permissions

## Manual Testing

For manual verification of AWS integration:
```bash
# Test with real AWS credentials
cd /tmp/test-project
no-wing setup --profile your-aws-profile
no-wing status
no-wing deploy sample-template.yaml
```
