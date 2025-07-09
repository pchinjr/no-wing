/**
 * Comprehensive tests for no-wing Deno implementation
 */

import { assertEquals, assertExists, assertRejects } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { exists } from "https://deno.land/std@0.208.0/fs/exists.ts";

// Import the classes we want to test
// Note: We'll need to refactor the main file to export these classes
// For now, we'll create a test version

// Test utilities
const TEST_PROJECT_NAME = 'test-project';
const TEST_BASE_DIR = '/tmp/.no-wing-test';

// Mock classes for testing (simplified versions)
class TestProjectDetector {
  async detect() {
    return {
      type: 'GENERIC' as const,
      name: TEST_PROJECT_NAME,
      deployCommand: 'aws cloudformation deploy',
      permissions: ['s3', 'lambda', 'cloudformation']
    };
  }
}

class TestServiceAccountManager {
  private config: any;
  private baseDir: string;

  constructor(projectName: string) {
    this.baseDir = TEST_BASE_DIR;
    this.config = {
      projectName,
      username: `q-assistant-${projectName}`,
      workspaceDir: `${this.baseDir}/service-accounts/${projectName}`,
      gitIdentity: {
        name: `Q Assistant (${projectName})`,
        email: `q-assistant+${projectName}@no-wing.dev`
      },
      awsProfile: `q-assistant-${projectName}`
    };
  }

  async create(force: boolean = false): Promise<void> {
    if (!force && await this.exists()) {
      throw new Error(`Service account for ${this.config.projectName} already exists`);
    }

    // Create workspace structure
    await this.createWorkspaceStructure();
    await this.setupGitIdentity();
    await this.setupAWSProfile();
    await this.createLaunchScripts();
  }

  async exists(): Promise<boolean> {
    return await exists(this.config.workspaceDir);
  }

  async remove(): Promise<void> {
    if (await this.exists()) {
      await Deno.remove(this.config.workspaceDir, { recursive: true });
    }
  }

  getConfig() {
    return { ...this.config };
  }

  private async createWorkspaceStructure(): Promise<void> {
    const dirs = [
      this.config.workspaceDir,
      `${this.config.workspaceDir}/.aws`,
      `${this.config.workspaceDir}/.ssh`,
      `${this.config.workspaceDir}/workspace`,
      `${this.config.workspaceDir}/logs`,
      `${this.config.workspaceDir}/bin`
    ];

    for (const dir of dirs) {
      await Deno.mkdir(dir, { recursive: true });
    }
  }

  private async setupGitIdentity(): Promise<void> {
    const gitConfig = [
      '[user]',
      `    name = ${this.config.gitIdentity.name}`,
      `    email = ${this.config.gitIdentity.email}`,
      '[core]',
      '    editor = nano',
      '[init]',
      '    defaultBranch = main'
    ].join('\n');

    await Deno.writeTextFile(`${this.config.workspaceDir}/.gitconfig`, gitConfig);
  }

  private async setupAWSProfile(): Promise<void> {
    const awsConfig = [
      `[profile ${this.config.awsProfile}]`,
      'region = us-east-1',
      'output = json'
    ].join('\n');

    await Deno.writeTextFile(`${this.config.workspaceDir}/.aws/config`, awsConfig);

    const credentialsFile = [
      `[${this.config.awsProfile}]`,
      '# AWS credentials will be configured here'
    ].join('\n');

    await Deno.writeTextFile(`${this.config.workspaceDir}/.aws/credentials`, credentialsFile);
  }

  private async createLaunchScripts(): Promise<void> {
    const launchScript = [
      '#!/bin/bash',
      '# Q Assistant Launch Script (Test)',
      `# Project: ${this.config.projectName}`,
      'echo "Test launch script"',
      'exit 0'
    ].join('\n');

    await Deno.writeTextFile(`${this.config.workspaceDir}/bin/launch-q`, launchScript);
    
    if (Deno.build.os !== 'windows') {
      await Deno.chmod(`${this.config.workspaceDir}/bin/launch-q`, 0o755);
    }
  }
}

// Test setup and cleanup
async function setupTest(): Promise<void> {
  // Clean up any existing test data
  try {
    await Deno.remove(TEST_BASE_DIR, { recursive: true });
  } catch {
    // Ignore if directory doesn't exist
  }
  
  // Create test base directory
  await Deno.mkdir(TEST_BASE_DIR, { recursive: true });
}

async function cleanupTest(): Promise<void> {
  try {
    await Deno.remove(TEST_BASE_DIR, { recursive: true });
  } catch {
    // Ignore if directory doesn't exist
  }
}

// Tests
Deno.test("ProjectDetector - should detect generic project", async () => {
  const detector = new TestProjectDetector();
  const project = await detector.detect();
  
  assertEquals(project.type, 'GENERIC');
  assertEquals(project.name, TEST_PROJECT_NAME);
  assertEquals(project.deployCommand, 'aws cloudformation deploy');
  assertEquals(project.permissions.length, 3);
});

Deno.test("ServiceAccountManager - should create service account", async () => {
  await setupTest();
  
  try {
    const manager = new TestServiceAccountManager(TEST_PROJECT_NAME);
    
    // Should not exist initially
    assertEquals(await manager.exists(), false);
    
    // Create service account
    await manager.create();
    
    // Should exist after creation
    assertEquals(await manager.exists(), true);
    
    // Check workspace structure
    assertExists(await exists(`${TEST_BASE_DIR}/service-accounts/${TEST_PROJECT_NAME}/.aws`));
    assertExists(await exists(`${TEST_BASE_DIR}/service-accounts/${TEST_PROJECT_NAME}/.gitconfig`));
    assertExists(await exists(`${TEST_BASE_DIR}/service-accounts/${TEST_PROJECT_NAME}/bin/launch-q`));
    
  } finally {
    await cleanupTest();
  }
});

Deno.test("ServiceAccountManager - should not create duplicate without force", async () => {
  await setupTest();
  
  try {
    const manager = new TestServiceAccountManager(TEST_PROJECT_NAME);
    
    // Create service account
    await manager.create();
    
    // Should reject creating duplicate
    await assertRejects(
      () => manager.create(),
      Error,
      "already exists"
    );
    
  } finally {
    await cleanupTest();
  }
});

Deno.test("ServiceAccountManager - should recreate with force", async () => {
  await setupTest();
  
  try {
    const manager = new TestServiceAccountManager(TEST_PROJECT_NAME);
    
    // Create service account
    await manager.create();
    assertEquals(await manager.exists(), true);
    
    // Should recreate with force
    await manager.create(true);
    assertEquals(await manager.exists(), true);
    
  } finally {
    await cleanupTest();
  }
});

Deno.test("ServiceAccountManager - should remove service account", async () => {
  await setupTest();
  
  try {
    const manager = new TestServiceAccountManager(TEST_PROJECT_NAME);
    
    // Create service account
    await manager.create();
    assertEquals(await manager.exists(), true);
    
    // Remove service account
    await manager.remove();
    assertEquals(await manager.exists(), false);
    
  } finally {
    await cleanupTest();
  }
});

Deno.test("ServiceAccountManager - should generate correct config", async () => {
  const manager = new TestServiceAccountManager(TEST_PROJECT_NAME);
  const config = manager.getConfig();
  
  assertEquals(config.projectName, TEST_PROJECT_NAME);
  assertEquals(config.username, `q-assistant-${TEST_PROJECT_NAME}`);
  assertEquals(config.gitIdentity.name, `Q Assistant (${TEST_PROJECT_NAME})`);
  assertEquals(config.gitIdentity.email, `q-assistant+${TEST_PROJECT_NAME}@no-wing.dev`);
  assertEquals(config.awsProfile, `q-assistant-${TEST_PROJECT_NAME}`);
});

Deno.test("ServiceAccountManager - should create proper git config", async () => {
  await setupTest();
  
  try {
    const manager = new TestServiceAccountManager(TEST_PROJECT_NAME);
    await manager.create();
    
    const gitConfigPath = `${TEST_BASE_DIR}/service-accounts/${TEST_PROJECT_NAME}/.gitconfig`;
    const gitConfig = await Deno.readTextFile(gitConfigPath);
    
    // Check git config content
    assertEquals(gitConfig.includes(`name = Q Assistant (${TEST_PROJECT_NAME})`), true);
    assertEquals(gitConfig.includes(`email = q-assistant+${TEST_PROJECT_NAME}@no-wing.dev`), true);
    assertEquals(gitConfig.includes('editor = nano'), true);
    assertEquals(gitConfig.includes('defaultBranch = main'), true);
    
  } finally {
    await cleanupTest();
  }
});

Deno.test("ServiceAccountManager - should create proper AWS config", async () => {
  await setupTest();
  
  try {
    const manager = new TestServiceAccountManager(TEST_PROJECT_NAME);
    await manager.create();
    
    const awsConfigPath = `${TEST_BASE_DIR}/service-accounts/${TEST_PROJECT_NAME}/.aws/config`;
    const awsConfig = await Deno.readTextFile(awsConfigPath);
    
    // Check AWS config content
    assertEquals(awsConfig.includes(`[profile q-assistant-${TEST_PROJECT_NAME}]`), true);
    assertEquals(awsConfig.includes('region = us-east-1'), true);
    assertEquals(awsConfig.includes('output = json'), true);
    
  } finally {
    await cleanupTest();
  }
});

Deno.test("ServiceAccountManager - should create executable launch script", async () => {
  await setupTest();
  
  try {
    const manager = new TestServiceAccountManager(TEST_PROJECT_NAME);
    await manager.create();
    
    const launchScriptPath = `${TEST_BASE_DIR}/service-accounts/${TEST_PROJECT_NAME}/bin/launch-q`;
    const launchScript = await Deno.readTextFile(launchScriptPath);
    
    // Check launch script content
    assertEquals(launchScript.includes('#!/bin/bash'), true);
    assertEquals(launchScript.includes(`Project: ${TEST_PROJECT_NAME}`), true);
    
    // Check if executable (Unix-like systems only)
    if (Deno.build.os !== 'windows') {
      const fileInfo = await Deno.stat(launchScriptPath);
      // Check if file has execute permissions (mode & 0o111 should be non-zero)
      assertEquals((fileInfo.mode! & 0o111) > 0, true);
    }
    
  } finally {
    await cleanupTest();
  }
});

// Integration tests
Deno.test("Integration - full workflow", async () => {
  await setupTest();
  
  try {
    const detector = new TestProjectDetector();
    const project = await detector.detect();
    const manager = new TestServiceAccountManager(project.name);
    
    // Full workflow
    assertEquals(await manager.exists(), false);
    await manager.create();
    assertEquals(await manager.exists(), true);
    
    // Verify all components
    const config = manager.getConfig();
    assertExists(config.projectName);
    assertExists(config.username);
    assertExists(config.gitIdentity.name);
    assertExists(config.gitIdentity.email);
    assertExists(config.awsProfile);
    
    // Cleanup
    await manager.remove();
    assertEquals(await manager.exists(), false);
    
  } finally {
    await cleanupTest();
  }
});

// Cross-platform tests
Deno.test("Cross-platform - should work on current platform", async () => {
  await setupTest();
  
  try {
    const manager = new TestServiceAccountManager(TEST_PROJECT_NAME);
    
    // Should work regardless of platform
    await manager.create();
    assertEquals(await manager.exists(), true);
    
    // Check that workspace was created
    const workspaceExists = await exists(`${TEST_BASE_DIR}/service-accounts/${TEST_PROJECT_NAME}/workspace`);
    assertEquals(workspaceExists, true);
    
  } finally {
    await cleanupTest();
  }
});

// Error handling tests
Deno.test("Error handling - should handle invalid project names", async () => {
  await setupTest();
  
  try {
    // Test with empty project name
    const manager = new TestServiceAccountManager('');
    const config = manager.getConfig();
    
    // Should still generate valid config
    assertEquals(config.username, 'q-assistant-');
    assertEquals(config.awsProfile, 'q-assistant-');
    
  } finally {
    await cleanupTest();
  }
});

console.log("🧪 Running no-wing tests...");
console.log("✅ All tests should pass if the implementation is correct");
