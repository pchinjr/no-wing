/**
 * Unit tests for ServiceAccountManager service
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { ServiceAccountManager } from '../services/ServiceAccountManager.ts';

// Mock configurations for testing
const mockQConfig = {
  username: 'q-test-project',
  homeDirectory: '/tmp/q-test-home',
  workspace: '/tmp/q-test-workspace',
  gitIdentity: {
    name: 'Q Assistant',
    email: 'q-assistant@test.no-wing.local'
  },
  awsProfile: 'test-profile',
  region: 'us-east-1',
  projectPath: '/tmp/test-project',
  projectType: {
    name: 'Test Project',
    type: 'generic' as const,
    confidence: 1,
    indicators: ['test']
  }
};

const mockNoWingConfig = {
  developerId: 'test-dev',
  qId: 'test-q',
  qLevel: 'standard',
  region: 'us-east-1',
  setupDate: '2025-01-01T00:00:00.000Z',
  credentials: {
    profile: 'test-profile',
    region: 'us-east-1'
  }
};

Deno.test("ServiceAccountManager - checkServiceAccountExists", async () => {
  const manager = new ServiceAccountManager(mockQConfig, mockNoWingConfig);
  const status = await manager.getStatus();
  
  // Should exist because we have valid config
  assertEquals(status.exists, true);
});

Deno.test("ServiceAccountManager - checkServiceAccountExists with invalid config", async () => {
  const invalidConfig = { ...mockNoWingConfig, qId: undefined };
  
  const manager = new ServiceAccountManager(mockQConfig, invalidConfig as any);
  const status = await manager.getStatus();
  
  // Should not exist because qId is missing
  assertEquals(status.exists, false);
  assertEquals(status.errors.length > 0, true);
});

Deno.test("ServiceAccountManager - workspace initialization", async () => {
  const tempWorkspace = await Deno.makeTempDir();
  const testQConfig = { ...mockQConfig, workspace: tempWorkspace };
  
  try {
    const manager = new ServiceAccountManager(testQConfig, mockNoWingConfig);
    await manager.initializeWorkspace();
    
    // Check that workspace directories were created
    const projectsDir = await Deno.stat(`${tempWorkspace}/projects`);
    const logsDir = await Deno.stat(`${tempWorkspace}/logs`);
    const tempDir = await Deno.stat(`${tempWorkspace}/temp`);
    
    assertEquals(projectsDir.isDirectory, true);
    assertEquals(logsDir.isDirectory, true);
    assertEquals(tempDir.isDirectory, true);
  } finally {
    await Deno.remove(tempWorkspace, { recursive: true });
  }
});

Deno.test("ServiceAccountManager - git configuration setup", async () => {
  const tempHome = await Deno.makeTempDir();
  const tempWorkspace = await Deno.makeTempDir();
  const testQConfig = { 
    ...mockQConfig, 
    homeDirectory: tempHome,
    workspace: tempWorkspace 
  };
  
  try {
    const manager = new ServiceAccountManager(testQConfig, mockNoWingConfig);
    await manager.initializeWorkspace();
    
    // Check that git config was created
    const gitConfigPath = `${tempHome}/.gitconfig`;
    const gitConfigExists = await Deno.stat(gitConfigPath);
    assertEquals(gitConfigExists.isFile, true);
    
    // Check git config content
    const gitConfig = await Deno.readTextFile(gitConfigPath);
    assertEquals(gitConfig.includes('Q Assistant'), true);
    assertEquals(gitConfig.includes('q-assistant@test.no-wing.local'), true);
  } finally {
    await Deno.remove(tempHome, { recursive: true });
    await Deno.remove(tempWorkspace, { recursive: true });
  }
});

Deno.test("ServiceAccountManager - workspace health check", async () => {
  const tempWorkspace = await Deno.makeTempDir();
  const testQConfig = { ...mockQConfig, workspace: tempWorkspace };
  
  try {
    const manager = new ServiceAccountManager(testQConfig, mockNoWingConfig);
    
    // Initially workspace should not be healthy
    let status = await manager.getStatus();
    assertEquals(status.workspace, false);
    
    // After initialization, workspace should be healthy
    await manager.initializeWorkspace();
    status = await manager.getStatus();
    assertEquals(status.workspace, true);
  } finally {
    await Deno.remove(tempWorkspace, { recursive: true });
  }
});
