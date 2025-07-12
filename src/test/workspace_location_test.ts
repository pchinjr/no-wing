/**
 * Test for workspace location fix
 * Verifies that Q workspace is now in project directory instead of /tmp
 */

import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { ProjectDetector } from "../services/ProjectDetector.ts";

Deno.test("Workspace Location Fix - Q workspace in project directory", async () => {
  const tempProject = await Deno.makeTempDir();
  
  try {
    // Create a mock package.json to make it a Node.js project
    await Deno.writeTextFile(`${tempProject}/package.json`, JSON.stringify({
      name: "test-workspace-project",
      version: "1.0.0"
    }));
    
    // Create ProjectDetector for the temp project
    const detector = new ProjectDetector(tempProject);
    const qConfig = await detector.generateQConfig();
    
    // Verify workspace is in project directory, not /tmp
    assertStringIncludes(qConfig.workspace, tempProject);
    assertStringIncludes(qConfig.workspace, '.no-wing/workspace');
    
    // Verify homeDirectory is also in project directory
    assertStringIncludes(qConfig.homeDirectory, tempProject);
    assertStringIncludes(qConfig.homeDirectory, '.no-wing/q-home');
    
    // Verify projectPath points to the actual project
    assertEquals(qConfig.projectPath, tempProject);
    
    // Verify workspace is NOT in /tmp (the old behavior)
    assertEquals(qConfig.workspace.startsWith('/tmp/q-workspace/'), false);
    assertEquals(qConfig.homeDirectory.startsWith('/tmp/q-workspace/'), false);
    
    console.log('✅ Workspace Location Fix Test: Workspace correctly located in project directory');
    console.log(`   Project: ${tempProject}`);
    console.log(`   Workspace: ${qConfig.workspace}`);
    console.log(`   Home: ${qConfig.homeDirectory}`);
    
  } finally {
    await Deno.remove(tempProject, { recursive: true });
  }
});

Deno.test("Workspace Location Fix - Different project types", async () => {
  const testCases = [
    { name: "node-project", file: "package.json", content: '{"name":"test-node"}' },
    { name: "python-project", file: "requirements.txt", content: "flask==2.0.0" },
    { name: "cf-project", file: "template.yaml", content: "AWSTemplateFormatVersion: '2010-09-09'" },
  ];
  
  for (const testCase of testCases) {
    const tempProject = await Deno.makeTempDir();
    
    try {
      // Create project file
      await Deno.writeTextFile(`${tempProject}/${testCase.file}`, testCase.content);
      
      // Test workspace location
      const detector = new ProjectDetector(tempProject);
      const qConfig = await detector.generateQConfig();
      
      // All project types should have workspace in project directory
      assertStringIncludes(qConfig.workspace, tempProject);
      assertStringIncludes(qConfig.workspace, '.no-wing/workspace');
      assertEquals(qConfig.workspace.startsWith('/tmp/q-workspace/'), false);
      
      console.log(`✅ Workspace Location Fix Test: ${testCase.name} workspace correctly located`);
      
    } finally {
      await Deno.remove(tempProject, { recursive: true });
    }
  }
});
