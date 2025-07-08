import test from 'tape';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ServiceAccountManager } from '../../dist/services/ServiceAccountManager.js';

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
  homeDirectory: '/tmp/test-q-home',
  workspace: '/tmp/test-q-home/workspace',
  gitIdentity: {
    name: 'Q Assistant (test-project)',
    email: 'q-assistant+test-project@no-wing.dev'
  },
  awsProfile: 'q-assistant-test-project'
};

test('ServiceAccountManager - initialization', (t) => {
  const manager = new ServiceAccountManager(mockQConfig);
  t.ok(manager, 'Should create ServiceAccountManager instance');
  t.end();
});

test('ServiceAccountManager - status check for non-existent account', async (t) => {
  const manager = new ServiceAccountManager(mockQConfig);
  const status = await manager.getStatus();
  
  t.equal(status.exists, false, 'Should report account does not exist');
  t.equal(status.localUser, false, 'Should report local user does not exist');
  t.equal(status.homeDirectory, false, 'Should report home directory does not exist');
  t.equal(status.gitConfigured, false, 'Should report git not configured');
  t.equal(status.awsConfigured, false, 'Should report AWS not configured');
  t.equal(status.workspace, false, 'Should report workspace not configured');
  t.equal(status.healthy, false, 'Should report not healthy');
  
  t.end();
});

test('ServiceAccountManager - home directory structure validation', async (t) => {
  // Create mock home directory structure for testing
  const testHomeDir = '/tmp/test-q-home-structure';
  const manager = new ServiceAccountManager({
    ...mockQConfig,
    homeDirectory: testHomeDir,
    workspace: `${testHomeDir}/workspace`
  });
  
  // Create the directory structure
  await fs.mkdir(testHomeDir, { recursive: true });
  await fs.mkdir(`${testHomeDir}/.aws`, { recursive: true });
  await fs.mkdir(`${testHomeDir}/.ssh`, { recursive: true });
  await fs.mkdir(`${testHomeDir}/.no-wing`, { recursive: true });
  await fs.mkdir(`${testHomeDir}/workspace`, { recursive: true });
  
  const status = await manager.getStatus();
  t.equal(status.homeDirectory, true, 'Should detect properly structured home directory');
  
  // Cleanup
  await fs.rm(testHomeDir, { recursive: true, force: true });
  t.end();
});

test('ServiceAccountManager - git configuration validation', async (t) => {
  const testHomeDir = '/tmp/test-q-home-git';
  const manager = new ServiceAccountManager({
    ...mockQConfig,
    homeDirectory: testHomeDir
  });
  
  // Create home directory and git config
  await fs.mkdir(testHomeDir, { recursive: true });
  
  const gitConfig = `[user]
    name = Q Assistant (test-project)
    email = q-assistant+test-project@no-wing.dev
[core]
    editor = nano`;
    
  await fs.writeFile(`${testHomeDir}/.gitconfig`, gitConfig);
  
  const status = await manager.getStatus();
  t.equal(status.gitConfigured, true, 'Should detect properly configured git');
  
  // Cleanup
  await fs.rm(testHomeDir, { recursive: true, force: true });
  t.end();
});

test('ServiceAccountManager - workspace validation', async (t) => {
  const testHomeDir = '/tmp/test-q-home-workspace';
  const workspaceDir = `${testHomeDir}/workspace`;
  const manager = new ServiceAccountManager({
    ...mockQConfig,
    homeDirectory: testHomeDir,
    workspace: workspaceDir
  });
  
  // Create workspace with README
  await fs.mkdir(workspaceDir, { recursive: true });
  await fs.writeFile(`${workspaceDir}/README.md`, '# Q Assistant Workspace');
  
  const status = await manager.getStatus();
  t.equal(status.workspace, true, 'Should detect properly configured workspace');
  
  // Cleanup
  await fs.rm(testHomeDir, { recursive: true, force: true });
  t.end();
});

test('ServiceAccountManager - AWS configuration validation', async (t) => {
  const testHomeDir = '/tmp/test-q-home-aws';
  const manager = new ServiceAccountManager({
    ...mockQConfig,
    homeDirectory: testHomeDir
  });
  
  // Create AWS credentials file
  await fs.mkdir(`${testHomeDir}/.aws`, { recursive: true });
  await fs.writeFile(`${testHomeDir}/.aws/credentials`, '[q-assistant-test-project]\naws_access_key_id = test\naws_secret_access_key = test');
  
  const status = await manager.getStatus();
  t.equal(status.awsConfigured, true, 'Should detect AWS configuration');
  
  // Cleanup
  await fs.rm(testHomeDir, { recursive: true, force: true });
  t.end();
});

test('ServiceAccountManager - complete healthy status', async (t) => {
  const testHomeDir = '/tmp/test-q-home-complete';
  const workspaceDir = `${testHomeDir}/workspace`;
  const manager = new ServiceAccountManager({
    ...mockQConfig,
    homeDirectory: testHomeDir,
    workspace: workspaceDir
  });
  
  // Create complete directory structure
  await fs.mkdir(`${testHomeDir}/.aws`, { recursive: true });
  await fs.mkdir(`${testHomeDir}/.ssh`, { recursive: true });
  await fs.mkdir(`${testHomeDir}/.no-wing`, { recursive: true });
  await fs.mkdir(workspaceDir, { recursive: true });
  
  // Create all required files
  const gitConfig = `[user]
    name = Q Assistant (test-project)
    email = q-assistant+test-project@no-wing.dev`;
  await fs.writeFile(`${testHomeDir}/.gitconfig`, gitConfig);
  await fs.writeFile(`${testHomeDir}/.aws/credentials`, '[test]\naws_access_key_id = test');
  await fs.writeFile(`${workspaceDir}/README.md`, '# Q Assistant Workspace');
  
  const status = await manager.getStatus();
  t.equal(status.homeDirectory, true, 'Home directory should be configured');
  t.equal(status.gitConfigured, true, 'Git should be configured');
  t.equal(status.awsConfigured, true, 'AWS should be configured');
  t.equal(status.workspace, true, 'Workspace should be configured');
  
  // Note: localUser will still be false since we're not actually creating system users in tests
  // but the other components should be healthy
  
  // Cleanup
  await fs.rm(testHomeDir, { recursive: true, force: true });
  t.end();
});
