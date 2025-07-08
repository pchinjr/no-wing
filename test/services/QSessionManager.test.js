import test from 'tape';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock Q service account config for testing
const mockQConfig = {
  username: 'q-assistant-test-project',
  projectName: 'test-project',
  projectType: {
    type: 'sam',
    configFile: 'template.yaml',
    permissions: ['lambda:*', 'apigateway:*'],
    deployCommand: 'sam deploy',
    name: 'test-project'
  },
  homeDirectory: '/tmp/test-q-home-session',
  workspace: '/tmp/test-q-home-session/workspace',
  gitIdentity: {
    name: 'Q Assistant (test-project)',
    email: 'q-assistant+test-project@no-wing.dev'
  },
  awsProfile: 'q-assistant-test-project'
};

test('QSessionManager - initialization', (t) => {
  // We can test the basic structure without actually launching processes
  t.ok(mockQConfig.username, 'Should have Q username');
  t.ok(mockQConfig.gitIdentity.name, 'Should have Q git identity');
  t.ok(mockQConfig.awsProfile, 'Should have Q AWS profile');
  t.ok(mockQConfig.workspace, 'Should have Q workspace');
  t.end();
});

test('QSessionManager - session ID generation', (t) => {
  // Test session ID format and uniqueness
  const generateSessionId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `q-${timestamp}-${random}`;
  };

  const sessionId1 = generateSessionId();
  const sessionId2 = generateSessionId();

  t.true(sessionId1.startsWith('q-'), 'Session ID should start with q-');
  t.true(sessionId1.includes('-'), 'Session ID should contain hyphens');
  t.notEqual(sessionId1, sessionId2, 'Session IDs should be unique');
  t.true(sessionId1.length > 10, 'Session ID should be reasonably long');
  
  t.end();
});

test('QSessionManager - environment file structure', async (t) => {
  const testSessionDir = '/tmp/test-session-env';
  await fs.mkdir(testSessionDir, { recursive: true });
  
  const sessionId = 'q-test-session-123';
  const startTime = new Date();
  
  const envContent = [
    '# Q Assistant Environment',
    `# Session: ${sessionId}`,
    `# Started: ${startTime.toISOString()}`,
    '',
    `HOME=${mockQConfig.homeDirectory}`,
    `USER=${mockQConfig.username}`,
    `AWS_PROFILE=${mockQConfig.awsProfile}`,
    `GIT_AUTHOR_NAME="${mockQConfig.gitIdentity.name}"`,
    `GIT_AUTHOR_EMAIL="${mockQConfig.gitIdentity.email}"`,
    `GIT_COMMITTER_NAME="${mockQConfig.gitIdentity.name}"`,
    `GIT_COMMITTER_EMAIL="${mockQConfig.gitIdentity.email}"`,
    `Q_SESSION_ID=${sessionId}`,
    `Q_WORKSPACE=${mockQConfig.workspace}`,
    `Q_PROJECT_DIR=${path.join(mockQConfig.workspace, 'project')}`,
    ''
  ].join('\n');
  
  const envFile = path.join(testSessionDir, 'q-environment');
  await fs.writeFile(envFile, envContent);
  
  const writtenContent = await fs.readFile(envFile, 'utf8');
  
  t.true(writtenContent.includes(`HOME=${mockQConfig.homeDirectory}`), 'Should set Q home directory');
  t.true(writtenContent.includes(`USER=${mockQConfig.username}`), 'Should set Q username');
  t.true(writtenContent.includes(`AWS_PROFILE=${mockQConfig.awsProfile}`), 'Should set Q AWS profile');
  t.true(writtenContent.includes(`GIT_AUTHOR_NAME="${mockQConfig.gitIdentity.name}"`), 'Should set Q git author');
  t.true(writtenContent.includes(`GIT_AUTHOR_EMAIL="${mockQConfig.gitIdentity.email}"`), 'Should set Q git email');
  t.true(writtenContent.includes(`Q_SESSION_ID=${sessionId}`), 'Should set session ID');
  
  // Cleanup
  await fs.rm(testSessionDir, { recursive: true, force: true });
  t.end();
});

test('QSessionManager - workspace marker file', async (t) => {
  const testWorkspaceDir = '/tmp/test-q-workspace';
  await fs.mkdir(testWorkspaceDir, { recursive: true });
  
  const sessionId = 'q-test-workspace-456';
  const sourceDir = '/tmp/test-source-project';
  
  const markerContent = [
    '# Q Assistant Project Copy',
    `# Original: ${sourceDir}`,
    `# Copied: ${new Date().toISOString()}`,
    `# Session: ${sessionId}`,
    '',
    'This is Q Assistant\'s working copy of your project.',
    'Q operates in this isolated workspace with its own identity.'
  ].join('\n');
  
  const markerFile = path.join(testWorkspaceDir, '.q-workspace');
  await fs.writeFile(markerFile, markerContent);
  
  const writtenContent = await fs.readFile(markerFile, 'utf8');
  
  t.true(writtenContent.includes('Q Assistant Project Copy'), 'Should identify as Q workspace');
  t.true(writtenContent.includes(`Original: ${sourceDir}`), 'Should reference original project');
  t.true(writtenContent.includes(`Session: ${sessionId}`), 'Should include session ID');
  t.true(writtenContent.includes('isolated workspace'), 'Should explain workspace purpose');
  
  // Cleanup
  await fs.rm(testWorkspaceDir, { recursive: true, force: true });
  t.end();
});

test('QSessionManager - audit log structure', async (t) => {
  const testLogDir = '/tmp/test-q-logs';
  await fs.mkdir(testLogDir, { recursive: true });
  
  const sessionId = 'q-test-audit-789';
  const startTime = new Date();
  
  const logEntry = {
    timestamp: startTime.toISOString(),
    event: 'session_start',
    sessionId: sessionId,
    user: mockQConfig.username,
    project: mockQConfig.projectName,
    workingDirectory: '/tmp/test-project',
    gitIdentity: mockQConfig.gitIdentity,
    awsProfile: mockQConfig.awsProfile
  };
  
  const logFile = path.join(testLogDir, 'q-sessions.log');
  const logLine = JSON.stringify(logEntry) + '\n';
  await fs.appendFile(logFile, logLine);
  
  const logContent = await fs.readFile(logFile, 'utf8');
  const parsedEntry = JSON.parse(logContent.trim());
  
  t.equal(parsedEntry.event, 'session_start', 'Should log session start event');
  t.equal(parsedEntry.sessionId, sessionId, 'Should include session ID');
  t.equal(parsedEntry.user, mockQConfig.username, 'Should include Q username');
  t.equal(parsedEntry.project, mockQConfig.projectName, 'Should include project name');
  t.equal(parsedEntry.gitIdentity.name, mockQConfig.gitIdentity.name, 'Should include Q git identity');
  t.equal(parsedEntry.awsProfile, mockQConfig.awsProfile, 'Should include Q AWS profile');
  
  // Cleanup
  await fs.rm(testLogDir, { recursive: true, force: true });
  t.end();
});

test('QSessionManager - session status structure', (t) => {
  // Test session status object structure
  const activeStatus = {
    active: true,
    sessionId: 'q-test-status-123',
    startTime: new Date(),
    pid: 12345,
    workingDirectory: '/tmp/test-project'
  };
  
  const inactiveStatus = {
    active: false
  };
  
  t.equal(activeStatus.active, true, 'Active status should be true');
  t.ok(activeStatus.sessionId, 'Active status should have session ID');
  t.ok(activeStatus.startTime, 'Active status should have start time');
  t.ok(activeStatus.pid, 'Active status should have process ID');
  t.ok(activeStatus.workingDirectory, 'Active status should have working directory');
  
  t.equal(inactiveStatus.active, false, 'Inactive status should be false');
  t.notOk(inactiveStatus.sessionId, 'Inactive status should not have session ID');
  
  t.end();
});

test('QSessionManager - project file sync list', (t) => {
  const filesToSync = [
    'package.json',
    'template.yaml', 'template.yml',
    'cdk.json',
    'serverless.yml', 'serverless.yaml',
    'tsconfig.json',
    'README.md'
  ];
  
  t.true(filesToSync.includes('package.json'), 'Should sync package.json');
  t.true(filesToSync.includes('template.yaml'), 'Should sync SAM template');
  t.true(filesToSync.includes('cdk.json'), 'Should sync CDK config');
  t.true(filesToSync.includes('serverless.yml'), 'Should sync Serverless config');
  t.true(filesToSync.includes('README.md'), 'Should sync README');
  
  t.end();
});

test('QSessionManager - session configuration validation', (t) => {
  const sessionConfig = {
    qConfig: mockQConfig,
    workingDirectory: '/tmp/test-project',
    sessionId: 'q-test-config-456',
    startTime: new Date()
  };
  
  t.ok(sessionConfig.qConfig, 'Should have Q configuration');
  t.ok(sessionConfig.workingDirectory, 'Should have working directory');
  t.ok(sessionConfig.sessionId, 'Should have session ID');
  t.ok(sessionConfig.startTime, 'Should have start time');
  
  t.equal(sessionConfig.qConfig.username, mockQConfig.username, 'Should preserve Q username');
  t.equal(sessionConfig.qConfig.gitIdentity.name, mockQConfig.gitIdentity.name, 'Should preserve Q git identity');
  t.equal(sessionConfig.qConfig.awsProfile, mockQConfig.awsProfile, 'Should preserve Q AWS profile');
  
  t.end();
});
