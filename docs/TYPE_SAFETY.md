# Type Safety Guide

## Overview

**no-wing** uses **strict TypeScript** to ensure type safety and prevent runtime errors. This guide explains our type safety approach and how to maintain it.

## Type Safety Configuration

### Deno Configuration (`deno.json`)

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noFallthroughCasesInSwitch": true,
    "allowUnreachableCode": false,
    "allowUnusedLabels": false,
    "checkJs": false,
    "lib": ["deno.ns", "deno.window"]
  },
  "lint": {
    "rules": {
      "tags": ["recommended"],
      "include": [
        "no-explicit-any",
        "no-unused-vars", 
        "prefer-const",
        "no-inferrable-types"
      ]
    }
  }
}
```

### Key Type Safety Features

1. **Strict Mode**: All TypeScript strict checks enabled
2. **No Implicit Any**: All variables must have explicit types
3. **No Implicit Returns**: Functions must explicitly return values
4. **No Unused Variables**: Prevents dead code
5. **AWS SDK Types**: Full type safety for AWS operations

## Type Safety Checks

### Automated Checking

```bash
# Run comprehensive type safety check
deno run --allow-all scripts/check-types.ts

# Individual checks
deno check main.ts          # Type checking
deno lint                   # Code linting  
deno test --allow-all       # Unit tests
```

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Type Safety Check
  run: deno run --allow-all scripts/check-types.ts
```

## Type Safety Patterns

### 1. Interface Definitions

```typescript
// ✅ Good: Explicit interface
export interface NoWingConfig {
  developerId: string;
  qId: string;
  qLevel: string;
  region: string;
  credentials?: AWSCredentials;
}

// ❌ Bad: Implicit any
export interface BadConfig {
  data: any;  // Type safety lost
}
```

### 2. AWS SDK Type Safety

```typescript
// ✅ Good: Typed AWS operations
import type { AwsCredentialIdentity } from '@aws-sdk/types';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

async function getIdentity(credentials: AwsCredentialIdentity) {
  const client = new STSClient({ credentials });
  const result = await client.send(new GetCallerIdentityCommand({}));
  return result.Account!; // Non-null assertion when safe
}

// ❌ Bad: Untyped operations
async function badGetIdentity(creds: any) {
  const client = new (STSClient as any)(creds);
  return client.send({});  // No type safety
}
```

### 3. Error Handling

```typescript
// ✅ Good: Typed error handling
interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

function validateConfig(config: NoWingConfig): ValidationResult {
  const errors: string[] = [];
  
  if (!config.developerId) {
    errors.push("Developer ID is required");
  }
  
  return {
    success: errors.length === 0,
    errors,
    warnings: []
  };
}

// ❌ Bad: Untyped error handling
function badValidate(config: any) {
  try {
    // Might throw anything
    return config.something.that.might.not.exist;
  } catch (e) {
    // e is 'any' - no type safety
    console.log(e.message);
  }
}
```

### 4. Optional Properties

```typescript
// ✅ Good: Explicit optional handling
interface DeploymentConfig {
  stackName: string;
  region: string;
  capabilities?: string[];  // Optional
}

function deploy(config: DeploymentConfig) {
  const caps = config.capabilities ?? [];  // Safe default
  // Use caps safely
}

// ❌ Bad: Assuming optional properties exist
function badDeploy(config: DeploymentConfig) {
  config.capabilities.forEach(cap => {  // Runtime error if undefined
    console.log(cap);
  });
}
```

### 5. Union Types

```typescript
// ✅ Good: Discriminated unions
type CredentialType = 'user' | 'no-wing';

interface CredentialContext {
  type: CredentialType;
  identity: string;
}

function handleCredentials(context: CredentialContext) {
  switch (context.type) {
    case 'user':
      // Handle user credentials
      break;
    case 'no-wing':
      // Handle Q credentials
      break;
    default:
      // TypeScript ensures exhaustive checking
      const _exhaustive: never = context.type;
      throw new Error(`Unknown credential type: ${_exhaustive}`);
  }
}
```

## Common Type Safety Issues

### 1. AWS SDK Imports

```typescript
// ✅ Correct imports
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import type { AwsCredentialIdentity } from '@aws-sdk/types';

// ❌ Missing imports cause type errors
const client = new STSClient();  // Error: STSClient not imported
```

### 2. Definite Assignment

```typescript
// ✅ Good: Definite assignment assertion
class NoWingCLI {
  private credentialManager!: CredentialManager;  // Will be assigned in initialize()
  
  async initialize() {
    this.credentialManager = new CredentialManager();
  }
}

// ❌ Bad: Uninitialized properties
class BadCLI {
  private credentialManager: CredentialManager;  // Type error: not initialized
}
```

### 3. Null/Undefined Handling

```typescript
// ✅ Good: Explicit null checking
function processStack(stack: Stack | undefined) {
  if (!stack) {
    throw new Error("Stack not found");
  }
  
  // stack is now definitely defined
  return stack.StackStatus;
}

// ❌ Bad: Assuming non-null
function badProcessStack(stack: Stack | undefined) {
  return stack.StackStatus;  // Runtime error if stack is undefined
}
```

## Type Safety Best Practices

### 1. Use Type Guards

```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function processValue(value: unknown) {
  if (isString(value)) {
    // value is now typed as string
    console.log(value.toUpperCase());
  }
}
```

### 2. Prefer Interfaces Over Types

```typescript
// ✅ Preferred: Interface (extensible)
interface Config {
  region: string;
}

interface ExtendedConfig extends Config {
  profile: string;
}

// ✅ Also good: Type alias for unions
type Status = 'pending' | 'complete' | 'failed';
```

### 3. Use Readonly for Immutable Data

```typescript
interface ReadonlyConfig {
  readonly region: string;
  readonly credentials: Readonly<AWSCredentials>;
}
```

### 4. Generic Constraints

```typescript
interface AWSClient {
  send(command: any): Promise<any>;
}

function createClient<T extends AWSClient>(
  ClientClass: new (config: any) => T,
  config: any
): T {
  return new ClientClass(config);
}
```

## Troubleshooting Type Issues

### Common Errors and Solutions

1. **"Property does not exist"**
   - Check interface definitions
   - Verify imports are correct
   - Use optional chaining: `obj?.property`

2. **"Type 'undefined' is not assignable"**
   - Add null checks: `if (value) { ... }`
   - Use non-null assertion: `value!` (when safe)
   - Provide defaults: `value ?? defaultValue`

3. **"Cannot find name"**
   - Check imports
   - Verify type definitions are available
   - Use `import type` for type-only imports

### Debug Type Issues

```bash
# Get detailed type information
deno check --verbose main.ts

# Check specific file
deno check src/config/ConfigManager.ts

# Show all type errors
deno check main.ts 2>&1 | grep -E "(error|ERROR)"
```

## Continuous Type Safety

### Pre-commit Hooks

```bash
#!/bin/sh
# .git/hooks/pre-commit
deno run --allow-all scripts/check-types.ts
```

### Development Workflow

1. **Write code with types first**
2. **Run type checker frequently**: `deno check main.ts`
3. **Fix type errors immediately**
4. **Use IDE TypeScript support**
5. **Run full type safety check before commits**

### IDE Configuration

For VS Code, ensure these settings:

```json
{
  "deno.enable": true,
  "deno.lint": true,
  "typescript.preferences.includePackageJsonAutoImports": "off"
}
```

## Conclusion

Type safety is **critical** for production CLI tools. Our comprehensive approach ensures:

- ✅ **Runtime Error Prevention**: Catch issues at compile time
- ✅ **Better Developer Experience**: IDE autocomplete and error detection  
- ✅ **Maintainable Code**: Clear interfaces and contracts
- ✅ **AWS SDK Safety**: Full type coverage for cloud operations
- ✅ **Automated Verification**: CI/CD type checking

**Always run `deno run --allow-all scripts/check-types.ts` before deploying!**
