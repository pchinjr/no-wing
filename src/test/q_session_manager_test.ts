/**
 * Unit tests for QSessionManager service
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { QSessionManager } from '../services/QSessionManager.ts';

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

Deno.test("QSessionManager - session status when no session exists", () => {
  const tempWorkspace = Deno.makeTempDirSync();
  const testQConfig = { ...mockQConfig, workspace: tempWorkspace };
  
  try {
    const manager = new QSessionManager(testQConfig, mockNoWingConfig);
    const status = manager.getSessionStatus();
    
    assertEquals(status.active, false);
    assertEquals(status.sessionId, undefined);
    assertEquals(status.pid, undefined);
  } finally {
    Deno.removeSync(tempWorkspace, { recursive: true });
  }
});

Deno.test("QSessionManager - prepare Q environment", async () => {
  const tempWorkspace = await Deno.makeTempDir();
  const tempHome = await Deno.makeTempDir();
  const testQConfig = { 
    ...mockQConfig, 
    workspace: tempWorkspace,
    homeDirectory: tempHome
  };
  
  try {
    const manager = new QSessionManager(testQConfig, mockNoWingConfig);
    
    // Access private method through reflection for testing
    const prepareMethod = (manager as any).prepareQEnvironment.bind(manager);
    const environment = await prepareMethod('/tmp/test-project');
    
    // Check essential environment variables
    // Note: HOME should be user's HOME for AWS CLI authentication
    assertEquals(environment.HOME, Deno.env.get('HOME'));  // Should be user's HOME
    assertEquals(environment.USER, 'q-test-project');
    assertEquals(environment.AWS_PROFILE, 'test-profile');
    assertEquals(environment.AWS_REGION, 'us-east-1');
    assertEquals(environment.GIT_AUTHOR_NAME, 'Q Assistant');
    assertEquals(environment.GIT_AUTHOR_EMAIL, 'q-assistant@test.no-wing.local');
    assertEquals(environment.Q_WORKSPACE, tempWorkspace);
    assertEquals(environment.Q_PROJECT_PATH, '/tmp/test-project');
    
    assertExists(environment.Q_SESSION_ID);
    assertExists(environment.PATH);
  } finally {
    await Deno.remove(tempWorkspace, { recursive: true });
    await Deno.remove(tempHome, { recursive: true });
  }
});

Deno.test("QSessionManager - generate session ID", () => {
  const tempWorkspace = Deno.makeTempDirSync();
  const testQConfig = { ...mockQConfig, workspace: tempWorkspace };
  
  try {
    const manager = new QSessionManager(testQConfig, mockNoWingConfig);
    
    // Access private method through reflection for testing
    const generateMethod = (manager as any).generateSessionId.bind(manager);
    const sessionId1 = generateMethod();
    const sessionId2 = generateMethod();
    
    // Session IDs should be unique
    assertEquals(sessionId1 !== sessionId2, true);
    assertEquals(sessionId1.startsWith('q-'), true);
    assertEquals(sessionId2.startsWith('q-'), true);
  } finally {
    Deno.removeSync(tempWorkspace, { recursive: true });
  }
});

Deno.test("QSessionManager - workspace creation", async () => {
  const tempWorkspace = await Deno.makeTempDir();
  const testQConfig = { ...mockQConfig, workspace: tempWorkspace };
  
  try {
    const manager = new QSessionManager(testQConfig, mockNoWingConfig);
    
    // Remove workspace to test creation
    await Deno.remove(tempWorkspace, { recursive: true });
    
    // Access private method through reflection for testing
    const ensureMethod = (manager as any).ensureWorkspace.bind(manager);
    await ensureMethod();
    
    // Check that workspace was created
    const workspaceStat = await Deno.stat(tempWorkspace);
    const logsStat = await Deno.stat(`${tempWorkspace}/logs`);
    
    assertEquals(workspaceStat.isDirectory, true);
    assertEquals(logsStat.isDirectory, true);
  } finally {
    try {
      await Deno.remove(tempWorkspace, { recursive: true });
    } catch {
      // Directory might not exist, ignore
    }
  }
});

Deno.test("QSessionManager - session file handling", async () => {
  const tempWorkspace = await Deno.makeTempDir();
  const testQConfig = { ...mockQConfig, workspace: tempWorkspace };
  
  try {
    const manager = new QSessionManager(testQConfig, mockNoWingConfig);
    
    // Ensure workspace exists
    await Deno.mkdir(`${tempWorkspace}/logs`, { recursive: true });
    
    // Create mock session config
    const mockSessionConfig = {
      sessionId: 'test-session-123',
      startTime: new Date(),
      workingDirectory: '/tmp/test',
      pid: 12345,
      environment: {}
    };
    
    // Access private method through reflection for testing
    const saveMethod = (manager as any).saveSessionInfo.bind(manager);
    await saveMethod(mockSessionConfig);
    
    // Check that session file was created
    const sessionFile = `${tempWorkspace}/logs/q-session.json`;
    const sessionExists = await Deno.stat(sessionFile);
    assertEquals(sessionExists.isFile, true);
    
    // Check session file content
    const sessionData = JSON.parse(await Deno.readTextFile(sessionFile));
    assertEquals(sessionData.sessionId, 'test-session-123');
    assertEquals(sessionData.pid, 12345);
  } finally {
    await Deno.remove(tempWorkspace, { recursive: true });
  }
});
