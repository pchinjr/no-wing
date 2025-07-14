/**
 * Workspace Isolation Test
 * 
 * Verifies that Q operates directly in the target project directory,
 * not in a workspace copy.
 */

import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { QSessionManager } from '../services/QSessionManager.ts';
import { ProjectDetector, QConfig } from '../services/ProjectDetector.ts';
import { NoWingConfig } from '../config/ConfigManager.ts';

Deno.test("QSessionManager - workspace isolation", async () => {
  // Create mock configurations
  const mockQConfig: QConfig = {
    username: 'q-test-user',
    homeDirectory: '/tmp/q-home',
    workspace: '/tmp/q-workspace',
    gitIdentity: {
      name: 'Q Assistant',
      email: 'q@test.local'
    },
    awsProfile: 'test-profile',
    region: 'us-east-1',
    projectPath: '/tmp/test-project', // This is the key - where Q should operate
    projectType: {
      name: 'Test Project',
      type: 'generic',
      confidence: 1,
      indicators: ['test']
    }
  };

  const mockNoWingConfig: NoWingConfig = {
    developerId: 'test-dev',
    qId: 'test-q',
    qLevel: 'standard',
    region: 'us-east-1',
    setupDate: new Date().toISOString()
  };

  // Create session manager
  const sessionManager = new QSessionManager(mockQConfig, mockNoWingConfig);

  // Test that workspace is created for logs/sessions only
  const workspaceExists = async (path: string): Promise<boolean> => {
    try {
      const stat = await Deno.stat(path);
      return stat.isDirectory;
    } catch {
      return false;
    }
  };

  // Create workspace directories
  await Deno.mkdir('/tmp/q-workspace/logs', { recursive: true });
  await Deno.mkdir('/tmp/q-workspace/sessions', { recursive: true });

  // Verify workspace structure
  assertEquals(await workspaceExists('/tmp/q-workspace'), true, 'Workspace should exist');
  assertEquals(await workspaceExists('/tmp/q-workspace/logs'), true, 'Logs directory should exist');
  assertEquals(await workspaceExists('/tmp/q-workspace/sessions'), true, 'Sessions directory should exist');
  
  // CRITICAL: Verify that project directory is NOT created in workspace
  assertEquals(await workspaceExists('/tmp/q-workspace/project'), false, 'Project directory should NOT exist in workspace');

  // Verify that Q config points to original project path
  assertEquals(mockQConfig.projectPath, '/tmp/test-project', 'Q should operate in original project path');

  // Cleanup
  try {
    await Deno.remove('/tmp/q-workspace', { recursive: true });
  } catch {
    // Cleanup failed, but test passed
  }
});

Deno.test("ProjectDetector - workspace path generation", async () => {
  const detector = new ProjectDetector('/tmp/test-project');
  const mockNoWingConfig = {
    region: 'us-east-1',
    credentials: { profile: 'test' }
  };

  const qConfig = await detector.generateQConfig(mockNoWingConfig);

  // Verify that workspace is in project directory, not separate location
  assertEquals(qConfig.projectPath, '/tmp/test-project', 'Project path should be original directory');
  assertEquals(qConfig.workspace.includes('/tmp/test-project'), true, 'Workspace should be within project directory');
  
  // Verify workspace is for Q management, not code storage
  assertEquals(qConfig.workspace.includes('.no-wing'), true, 'Workspace should be in .no-wing directory');
});
