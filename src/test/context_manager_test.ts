/**
 * Unit tests for ContextManager
 * Run with: deno test --allow-all
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { ContextManager } from "../config/ContextManager.ts";

Deno.test("ContextManager - detectContext returns valid context", () => {
  const contextManager = new ContextManager();
  const context = contextManager.detectContext();
  
  // Should always return a valid context
  assertExists(context);
  assertExists(context.configDirectory);
  assertEquals(typeof context.isProjectSpecific, "boolean");
});

Deno.test("ContextManager - getContextDescription returns string", () => {
  const contextManager = new ContextManager();
  const context = contextManager.detectContext();
  const description = contextManager.getContextDescription(context);
  
  assertExists(description);
  assertEquals(typeof description, "string");
});

Deno.test("ContextManager - ensureConfigDirectory creates directory", async () => {
  const contextManager = new ContextManager();
  const testDir = "/tmp/no-wing-test-config";
  
  // Clean up first
  try {
    await Deno.remove(testDir, { recursive: true });
  } catch {
    // Directory might not exist, that's fine
  }
  
  // Test directory creation
  await contextManager.ensureConfigDirectory(testDir);
  
  // Verify directory exists
  const stat = await Deno.stat(testDir);
  assertEquals(stat.isDirectory, true);
  
  // Clean up
  await Deno.remove(testDir, { recursive: true });
});
