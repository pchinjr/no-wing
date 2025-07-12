/**
 * Integration test for Q launch workflow
 * Tests the complete end-to-end launch process
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { ProjectDetector } from '../services/ProjectDetector.ts';
import { ServiceAccountManager } from '../services/ServiceAccountManager.ts';
import { QSessionManager } from '../services/QSessionManager.ts';

Deno.test("Q Launch Integration - Complete workflow", async () => {
  const tempProject = await Deno.makeTempDir();
  const tempWorkspace = await Deno.makeTempDir();
  const tempHome = await Deno.makeTempDir();
  
  try {
    // Step 1: Create a test project (Node.js)
    await Deno.writeTextFile(`${tempProject}/package.json`, JSON.stringify({
      name: "integration-test-project",
      version: "1.0.0",
      description: "Test project for Q launch integration"
    }));

    // Step 2: Project Detection
    const detector = new ProjectDetector(tempProject);
    const projectType = await detector.detect();
    
    assertEquals(projectType.type, 'nodejs');
    assertEquals(projectType.name, 'Node.js Project');
    assertEquals(projectType.confidence > 0.5, true);

    // Step 3: Generate Q Configuration
    const mockNoWingConfig = {
      developerId: 'integration-test-dev',
      qId: 'integration-test-q',
      qLevel: 'standard',
      region: 'us-east-1',
      setupDate: '2025-01-01T00:00:00.000Z',
      credentials: {
        profile: 'test-profile',
        region: 'us-east-1'
      }
    };

    const qConfig = await detector.generateQConfig(mockNoWingConfig);
    
    // Override with test directories
    qConfig.workspace = tempWorkspace;
    qConfig.homeDirectory = tempHome;
    qConfig.projectPath = tempProject;

    // Verify Q config generation
    assertEquals(qConfig.username, 'q-integration-test-project');
    assertEquals(qConfig.gitIdentity.name, 'Q Assistant');
    assertEquals(qConfig.gitIdentity.email, 'q-assistant@integration-test-project.no-wing.local');
    assertEquals(qConfig.awsProfile, 'test-profile');

    // Step 4: Service Account Management
    const serviceManager = new ServiceAccountManager(qConfig, mockNoWingConfig);
    
    // Initialize workspace
    await serviceManager.initializeWorkspace();
    
    // Verify workspace structure
    const projectsDir = await Deno.stat(`${tempWorkspace}/projects`);
    const logsDir = await Deno.stat(`${tempWorkspace}/logs`);
    const tempDir = await Deno.stat(`${tempWorkspace}/temp`);
    
    assertEquals(projectsDir.isDirectory, true);
    assertEquals(logsDir.isDirectory, true);
    assertEquals(tempDir.isDirectory, true);

    // Verify git configuration
    const gitConfigPath = `${tempHome}/.gitconfig`;
    const gitConfigExists = await Deno.stat(gitConfigPath);
    assertEquals(gitConfigExists.isFile, true);
    
    const gitConfig = await Deno.readTextFile(gitConfigPath);
    assertEquals(gitConfig.includes('Q Assistant'), true);
    assertEquals(gitConfig.includes('q-assistant@integration-test-project.no-wing.local'), true);

    // Step 5: Service Account Health Check
    const status = await serviceManager.getStatus();
    
    assertEquals(status.exists, true);
    assertEquals(status.localUser, true);
    assertEquals(status.gitConfigured, true);
    assertEquals(status.workspace, true);
    // AWS configured will be false in test environment (no real credentials)

    // Step 6: Session Management
    const sessionManager = new QSessionManager(qConfig, mockNoWingConfig);
    
    // Verify no active session initially
    const initialStatus = sessionManager.getSessionStatus();
    assertEquals(initialStatus.active, false);

    // Step 7: Environment Preparation
    const prepareMethod = (sessionManager as any).prepareQEnvironment.bind(sessionManager);
    const environment = await prepareMethod(tempProject);
    
    // Verify environment variables
    // Note: HOME remains user's HOME for AWS CLI authentication
    assertEquals(environment.HOME, Deno.env.get('HOME'));  // Should be user's HOME, not Q's
    assertEquals(environment.USER, 'q-integration-test-project');
    assertEquals(environment.AWS_PROFILE, 'test-profile');
    assertEquals(environment.AWS_REGION, 'us-east-1');
    assertEquals(environment.GIT_AUTHOR_NAME, 'Q Assistant');
    assertEquals(environment.GIT_AUTHOR_EMAIL, 'q-assistant@integration-test-project.no-wing.local');
    assertEquals(environment.Q_WORKSPACE, tempWorkspace);
    assertEquals(environment.Q_PROJECT_PATH, tempProject);
    
    assertExists(environment.Q_SESSION_ID);
    assertExists(environment.PATH);

    // Step 8: Session File Management
    const mockSessionConfig = {
      sessionId: 'integration-test-session',
      startTime: new Date(),
      workingDirectory: tempProject,
      pid: 99999, // Mock PID
      environment
    };

    const saveMethod = (sessionManager as any).saveSessionInfo.bind(sessionManager);
    await saveMethod(mockSessionConfig);

    // Verify session file creation
    const sessionFile = `${tempWorkspace}/logs/q-session.json`;
    const sessionExists = await Deno.stat(sessionFile);
    assertEquals(sessionExists.isFile, true);

    const sessionData = JSON.parse(await Deno.readTextFile(sessionFile));
    assertEquals(sessionData.sessionId, 'integration-test-session');
    assertEquals(sessionData.pid, 99999);
    assertEquals(sessionData.qConfig.username, 'q-integration-test-project');

    console.log('✅ Q Launch Integration Test: All workflow steps completed successfully');
    console.log(`  • Project detected: ${projectType.name}`);
    console.log(`  • Q identity: ${qConfig.username}`);
    console.log(`  • Workspace: ${qConfig.workspace}`);
    console.log(`  • Git identity: ${qConfig.gitIdentity.name} <${qConfig.gitIdentity.email}>`);
    console.log(`  • Session management: Functional`);

  } finally {
    // Cleanup
    await Deno.remove(tempProject, { recursive: true });
    await Deno.remove(tempWorkspace, { recursive: true });
    await Deno.remove(tempHome, { recursive: true });
  }
});

Deno.test("Q Launch Integration - Error handling", async () => {
  const tempProject = await Deno.makeTempDir();
  
  try {
    // Test with invalid configuration
    const detector = new ProjectDetector(tempProject);
    const qConfig = await detector.generateQConfig();
    
    const invalidNoWingConfig = {
      // Missing required fields
      region: 'us-east-1'
    };

    const serviceManager = new ServiceAccountManager(qConfig, invalidNoWingConfig as any);
    const status = await serviceManager.getStatus();
    
    // Should detect invalid configuration
    assertEquals(status.exists, false);
    assertEquals(status.errors.length > 0, true);
    
    console.log('✅ Q Launch Integration Test: Error handling working correctly');
    
  } finally {
    await Deno.remove(tempProject, { recursive: true });
  }
});

Deno.test("Q Launch Integration - Multiple project types", async () => {
  const testCases = [
    {
      name: 'Python Project',
      files: { 'requirements.txt': 'flask==2.0.0', 'main.py': 'print("hello")' },
      expectedType: 'python'
    },
    {
      name: 'CloudFormation Project', 
      files: { 'template.yaml': 'AWSTemplateFormatVersion: "2010-09-09"\nResources:\n  TestBucket:\n    Type: AWS::S3::Bucket' },
      expectedType: 'cloudformation'
    },
    {
      name: 'Generic Project',
      files: { 'README.md': '# Test Project' },
      expectedType: 'generic'
    }
  ];

  for (const testCase of testCases) {
    const tempProject = await Deno.makeTempDir();
    
    try {
      // Create project files
      for (const [filename, content] of Object.entries(testCase.files)) {
        await Deno.writeTextFile(`${tempProject}/${filename}`, content);
      }

      // Test detection
      const detector = new ProjectDetector(tempProject);
      const projectType = await detector.detect();
      
      assertEquals(projectType.type, testCase.expectedType);
      
      // Test Q config generation
      const qConfig = await detector.generateQConfig();
      assertExists(qConfig.username);
      assertEquals(qConfig.gitIdentity.name, 'Q Assistant');
      
      console.log(`✅ Q Launch Integration Test: ${testCase.name} detection working`);
      
    } finally {
      await Deno.remove(tempProject, { recursive: true });
    }
  }
});
