/**
 * CLI Integration Tests for no-wing
 * Tests the actual CLI commands end-to-end
 */

import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { exists } from "https://deno.land/std@0.208.0/fs/exists.ts";

const CLI_PATH = './deno/no-wing.ts';
const TEST_DIR = '/tmp/no-wing-cli-test';

// Helper function to run CLI commands
async function runCLI(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  const cmd = new Deno.Command('deno', {
    args: ['run', '--allow-all', CLI_PATH, ...args],
    cwd: TEST_DIR,
    stdout: 'piped',
    stderr: 'piped'
  });

  const { code, stdout, stderr } = await cmd.output();
  
  return {
    code,
    stdout: new TextDecoder().decode(stdout),
    stderr: new TextDecoder().decode(stderr)
  };
}

// Setup test environment
async function setupTestEnv(): Promise<void> {
  try {
    await Deno.remove(TEST_DIR, { recursive: true });
  } catch {
    // Ignore if doesn't exist
  }
  
  await Deno.mkdir(TEST_DIR, { recursive: true });
}

// Cleanup test environment
async function cleanupTestEnv(): Promise<void> {
  try {
    await Deno.remove(TEST_DIR, { recursive: true });
  } catch {
    // Ignore if doesn't exist
  }
  
  // Also cleanup any service accounts created
  const homeDir = Deno.env.get('HOME') || Deno.env.get('USERPROFILE') || '.';
  const serviceAccountDir = `${homeDir}/.no-wing/service-accounts/no-wing-cli-test`;
  try {
    await Deno.remove(serviceAccountDir, { recursive: true });
  } catch {
    // Ignore if doesn't exist
  }
}

Deno.test("CLI - should show help", async () => {
  await setupTestEnv();
  
  try {
    const result = await runCLI(['--help']);
    
    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, 'no-wing - Q Service Account Manager');
    assertStringIncludes(result.stdout, 'Commands:');
    assertStringIncludes(result.stdout, 'setup');
    assertStringIncludes(result.stdout, 'status');
    assertStringIncludes(result.stdout, 'launch');
    
  } finally {
    await cleanupTestEnv();
  }
});

Deno.test("CLI - should show version", async () => {
  await setupTestEnv();
  
  try {
    const result = await runCLI(['--version']);
    
    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, 'no-wing 1.0.0');
    
  } finally {
    await cleanupTestEnv();
  }
});

Deno.test("CLI - should handle unknown command", async () => {
  await setupTestEnv();
  
  try {
    const result = await runCLI(['unknown-command']);
    
    assertEquals(result.code, 1);
    assertStringIncludes(result.stdout, 'Unknown command');
    
  } finally {
    await cleanupTestEnv();
  }
});

Deno.test("CLI - setup command should work", async () => {
  await setupTestEnv();
  
  try {
    const result = await runCLI(['setup', '--force']);
    
    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, 'Setup Complete');
    assertStringIncludes(result.stdout, 'Detected GENERIC project');
    
    // Check that workspace was created
    const homeDir = Deno.env.get('HOME') || Deno.env.get('USERPROFILE') || '.';
    const workspaceExists = await exists(`${homeDir}/.no-wing/service-accounts/no-wing-cli-test`);
    assertEquals(workspaceExists, true);
    
  } finally {
    await cleanupTestEnv();
  }
});

Deno.test("CLI - status command should work after setup", async () => {
  await setupTestEnv();
  
  try {
    // First setup
    const setupResult = await runCLI(['setup', '--force']);
    assertEquals(setupResult.code, 0);
    
    // Then check status
    const statusResult = await runCLI(['status']);
    assertEquals(statusResult.code, 0);
    assertStringIncludes(statusResult.stdout, 'Service Account Status');
    assertStringIncludes(statusResult.stdout, '✅');
    assertStringIncludes(statusResult.stdout, 'Service account is ready');
    
  } finally {
    await cleanupTestEnv();
  }
});

Deno.test("CLI - status command should show not found before setup", async () => {
  await setupTestEnv();
  
  try {
    const result = await runCLI(['status']);
    
    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, 'Service account not found');
    assertStringIncludes(result.stdout, 'Run: no-wing setup');
    
  } finally {
    await cleanupTestEnv();
  }
});

Deno.test("CLI - cleanup command should work", async () => {
  await setupTestEnv();
  
  try {
    // First setup
    const setupResult = await runCLI(['setup', '--force']);
    assertEquals(setupResult.code, 0);
    
    // Then cleanup
    const cleanupResult = await runCLI(['cleanup', '--force']);
    assertEquals(cleanupResult.code, 0);
    assertStringIncludes(cleanupResult.stdout, 'Service account removed');
    
    // Verify it's gone
    const homeDir = Deno.env.get('HOME') || Deno.env.get('USERPROFILE') || '.';
    const workspaceExists = await exists(`${homeDir}/.no-wing/service-accounts/no-wing-cli-test`);
    assertEquals(workspaceExists, false);
    
  } finally {
    await cleanupTestEnv();
  }
});

Deno.test("CLI - setup should not create duplicate without force", async () => {
  await setupTestEnv();
  
  try {
    // First setup
    const setupResult1 = await runCLI(['setup']);
    assertEquals(setupResult1.code, 0);
    
    // Second setup without force should show warning
    const setupResult2 = await runCLI(['setup']);
    assertEquals(setupResult2.code, 0);
    assertStringIncludes(setupResult2.stdout, 'Service account already exists');
    assertStringIncludes(setupResult2.stdout, 'Use --force to recreate');
    
  } finally {
    await cleanupTestEnv();
  }
});

Deno.test("CLI - full workflow integration", async () => {
  await setupTestEnv();
  
  try {
    // 1. Check status (should not exist)
    const status1 = await runCLI(['status']);
    assertEquals(status1.code, 0);
    assertStringIncludes(status1.stdout, 'Service account not found');
    
    // 2. Setup service account
    const setup = await runCLI(['setup']);
    assertEquals(setup.code, 0);
    assertStringIncludes(setup.stdout, 'Setup Complete');
    
    // 3. Check status (should exist and be ready)
    const status2 = await runCLI(['status']);
    assertEquals(status2.code, 0);
    assertStringIncludes(status2.stdout, 'Service account is ready');
    
    // 4. Try to setup again (should warn about existing)
    const setup2 = await runCLI(['setup']);
    assertEquals(setup2.code, 0);
    assertStringIncludes(setup2.stdout, 'already exists');
    
    // 5. Force recreate
    const setup3 = await runCLI(['setup', '--force']);
    assertEquals(setup3.code, 0);
    assertStringIncludes(setup3.stdout, 'Setup Complete');
    
    // 6. Final status check
    const status3 = await runCLI(['status']);
    assertEquals(status3.code, 0);
    assertStringIncludes(status3.stdout, 'Service account is ready');
    
    // 7. Cleanup
    const cleanup = await runCLI(['cleanup', '--force']);
    assertEquals(cleanup.code, 0);
    assertStringIncludes(cleanup.stdout, 'Service account removed');
    
    // 8. Final status (should not exist)
    const status4 = await runCLI(['status']);
    assertEquals(status4.code, 0);
    assertStringIncludes(status4.stdout, 'Service account not found');
    
  } finally {
    await cleanupTestEnv();
  }
});

// Test with different project types
Deno.test("CLI - should detect SAM project", async () => {
  await setupTestEnv();
  
  try {
    // Create SAM template
    await Deno.writeTextFile(`${TEST_DIR}/template.yaml`, 'AWSTemplateFormatVersion: "2010-09-09"');
    
    const result = await runCLI(['setup', '--force']);
    
    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, 'Detected SAM project');
    
  } finally {
    await cleanupTestEnv();
  }
});

Deno.test("CLI - should detect CDK project", async () => {
  await setupTestEnv();
  
  try {
    // Create CDK config
    await Deno.writeTextFile(`${TEST_DIR}/cdk.json`, '{}');
    
    const result = await runCLI(['setup', '--force']);
    
    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, 'Detected CDK project');
    
  } finally {
    await cleanupTestEnv();
  }
});

console.log("🧪 Running CLI integration tests...");
console.log("✅ Testing actual CLI commands end-to-end");
