import test from 'tape';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ProjectDetector } from '../../dist/services/ProjectDetector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test fixtures directory
const fixturesDir = path.join(__dirname, '../fixtures');

test('ProjectDetector - SAM project detection', async (t) => {
  // Create temporary test directory with SAM template
  const testDir = path.join(fixturesDir, 'sam-project');
  await fs.mkdir(testDir, { recursive: true });
  
  const samTemplate = `
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: Test SAM Application

Resources:
  HelloWorldFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: hello-world/
      Handler: app.lambdaHandler
      Runtime: nodejs18.x
`;
  
  await fs.writeFile(path.join(testDir, 'template.yaml'), samTemplate);
  
  const detector = new ProjectDetector(testDir);
  const projectType = await detector.detect();
  
  t.equal(projectType.type, 'sam', 'Should detect SAM project');
  t.equal(projectType.configFile, 'template.yaml', 'Should identify template.yaml');
  t.equal(projectType.deployCommand, 'sam deploy', 'Should set correct deploy command');
  t.true(projectType.permissions.includes('lambda:*'), 'Should include lambda permissions');
  t.equal(projectType.name, 'sam-project', 'Should use directory name as project name');
  
  // Cleanup
  await fs.rm(testDir, { recursive: true, force: true });
  t.end();
});

test('ProjectDetector - CDK project detection', async (t) => {
  const testDir = path.join(fixturesDir, 'cdk-project');
  await fs.mkdir(testDir, { recursive: true });
  
  const cdkConfig = {
    app: "npx ts-node --prefer-ts-exts bin/cdk-project.ts",
    watch: {
      include: ["**"],
      exclude: ["README.md", "cdk*.json", "**/*.d.ts", "**/*.js", "tsconfig.json", "package*.json", "yarn.lock", "node_modules", "test"]
    },
    context: {}
  };
  
  await fs.writeFile(path.join(testDir, 'cdk.json'), JSON.stringify(cdkConfig, null, 2));
  
  const detector = new ProjectDetector(testDir);
  const projectType = await detector.detect();
  
  t.equal(projectType.type, 'cdk', 'Should detect CDK project');
  t.equal(projectType.configFile, 'cdk.json', 'Should identify cdk.json');
  t.equal(projectType.deployCommand, 'cdk deploy', 'Should set correct deploy command');
  t.true(projectType.permissions.includes('cloudformation:*'), 'Should include CloudFormation permissions');
  
  // Cleanup
  await fs.rm(testDir, { recursive: true, force: true });
  t.end();
});

test('ProjectDetector - Q service account config generation', async (t) => {
  const testDir = path.join(fixturesDir, 'test-project');
  await fs.mkdir(testDir, { recursive: true });
  
  // Create a simple SAM project
  await fs.writeFile(path.join(testDir, 'template.yaml'), 'AWSTemplateFormatVersion: "2010-09-09"');
  
  const detector = new ProjectDetector(testDir);
  const qConfig = await detector.generateQConfig();
  
  t.equal(qConfig.username, 'q-assistant-test-project', 'Should generate correct username');
  t.equal(qConfig.projectName, 'test-project', 'Should use directory name');
  t.equal(qConfig.homeDirectory, '/home/q-assistant-test-project', 'Should set correct home directory');
  t.equal(qConfig.workspace, '/home/q-assistant-test-project/workspace', 'Should set correct workspace');
  t.equal(qConfig.gitIdentity.name, 'Q Assistant (test-project)', 'Should set correct git name');
  t.equal(qConfig.gitIdentity.email, 'q-assistant+test-project@no-wing.dev', 'Should set correct git email');
  t.equal(qConfig.awsProfile, 'q-assistant-test-project', 'Should set correct AWS profile');
  
  // Cleanup
  await fs.rm(testDir, { recursive: true, force: true });
  t.end();
});

test('ProjectDetector - username sanitization', async (t) => {
  const testDir = path.join(fixturesDir, 'My-Project_With@Special#Chars!');
  await fs.mkdir(testDir, { recursive: true });
  
  const detector = new ProjectDetector(testDir);
  const qConfig = await detector.generateQConfig();
  
  t.equal(qConfig.username, 'q-assistant-my-project-with-special-chars', 'Should sanitize username');
  
  // Cleanup
  await fs.rm(testDir, { recursive: true, force: true });
  t.end();
});

test('ProjectDetector - generic project fallback', async (t) => {
  const testDir = path.join(fixturesDir, 'generic-project');
  await fs.mkdir(testDir, { recursive: true });
  
  // No special config files - should default to generic
  const detector = new ProjectDetector(testDir);
  const projectType = await detector.detect();
  
  t.equal(projectType.type, 'generic', 'Should default to generic project');
  t.equal(projectType.configFile, '', 'Should have empty config file');
  t.equal(projectType.deployCommand, 'aws cloudformation deploy', 'Should set generic deploy command');
  t.true(projectType.permissions.includes('lambda:ListFunctions'), 'Should include basic permissions');
  
  // Cleanup
  await fs.rm(testDir, { recursive: true, force: true });
  t.end();
});
