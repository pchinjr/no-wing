/**
 * Unit tests for ProjectDetector service
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { ProjectDetector } from '../services/ProjectDetector.ts';

Deno.test("ProjectDetector - detect Node.js project", async () => {
  // Create temporary directory with package.json
  const tempDir = await Deno.makeTempDir();
  
  try {
    // Create package.json
    await Deno.writeTextFile(`${tempDir}/package.json`, JSON.stringify({
      name: "test-project",
      version: "1.0.0"
    }));

    const detector = new ProjectDetector(tempDir);
    const result = await detector.detect();

    assertEquals(result.type, 'nodejs');
    assertEquals(result.name, 'Node.js Project');
    assertEquals(result.confidence > 0.5, true);
    assertEquals(result.indicators.includes('package.json'), true);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("ProjectDetector - detect Python project", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    // Create requirements.txt and Python file
    await Deno.writeTextFile(`${tempDir}/requirements.txt`, "flask==2.0.0");
    await Deno.writeTextFile(`${tempDir}/main.py`, "print('Hello World')");

    const detector = new ProjectDetector(tempDir);
    const result = await detector.detect();

    assertEquals(result.type, 'python');
    assertEquals(result.name, 'Python Project');
    assertEquals(result.confidence > 0.5, true);
    assertEquals(result.indicators.includes('requirements.txt'), true);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("ProjectDetector - detect CloudFormation project", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    // Create CloudFormation template
    await Deno.writeTextFile(`${tempDir}/template.yaml`, `
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  TestBucket:
    Type: AWS::S3::Bucket
`);

    const detector = new ProjectDetector(tempDir);
    const result = await detector.detect();

    assertEquals(result.type, 'cloudformation');
    assertEquals(result.name, 'CloudFormation Project');
    assertEquals(result.confidence > 0.5, true);
    assertEquals(result.indicators.includes('template.yaml'), true);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("ProjectDetector - detect generic project", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    // Empty directory should be detected as generic
    const detector = new ProjectDetector(tempDir);
    const result = await detector.detect();

    assertEquals(result.type, 'generic');
    assertEquals(result.name, 'Generic Project');
    assertEquals(result.confidence, 1);
    assertEquals(result.indicators.includes('Directory exists'), true);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("ProjectDetector - generate Q config", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    // Create a Node.js project
    await Deno.writeTextFile(`${tempDir}/package.json`, JSON.stringify({
      name: "test-project",
      version: "1.0.0"
    }));

    const detector = new ProjectDetector(tempDir);
    const qConfig = await detector.generateQConfig({
      region: 'us-west-2',
      credentials: { profile: 'test-profile' }
    });

    assertExists(qConfig.username);
    assertEquals(qConfig.username.startsWith('q-'), true);
    assertEquals(qConfig.gitIdentity.name, 'Q Assistant');
    assertEquals(qConfig.awsProfile, 'test-profile');
    assertEquals(qConfig.region, 'us-west-2');
    assertEquals(qConfig.projectPath, tempDir);
    assertExists(qConfig.workspace);
    assertExists(qConfig.homeDirectory);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("ProjectDetector - project name from package.json", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    await Deno.writeTextFile(`${tempDir}/package.json`, JSON.stringify({
      name: "my-awesome-project",
      version: "1.0.0"
    }));

    const detector = new ProjectDetector(tempDir);
    const qConfig = await detector.generateQConfig();

    assertEquals(qConfig.username, 'q-my-awesome-project');
    assertEquals(qConfig.gitIdentity.email, 'q-assistant@my-awesome-project.no-wing.local');
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});
