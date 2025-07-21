/**
 * Integration tests for CLI functionality
 * Run with: deno test --allow-all
 */

import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("CLI - help command works", async () => {
  const cmd = new Deno.Command("./no-wing", {
    args: ["help"],
    cwd: "/home/pchinjr/Code/no-wing",
    stdout: "piped",
    stderr: "piped"
  });
  
  const { code, stdout } = await cmd.output();
  const output = new TextDecoder().decode(stdout);
  
  assertEquals(code, 0);
  assertStringIncludes(output, "Q Service Account Manager");
  assertStringIncludes(output, "Commands:");
});

Deno.test("CLI - status command shows context", async () => {
  const cmd = new Deno.Command("./no-wing", {
    args: ["status"],
    cwd: "/home/pchinjr/Code/no-wing",
    stdout: "piped",
    stderr: "piped"
  });
  
  const { code, stdout } = await cmd.output();
  const output = new TextDecoder().decode(stdout);
  
  assertEquals(code, 0);
  assertStringIncludes(output, "📊 No-wing Status");
  assertStringIncludes(output, "📍 Context:");
});

Deno.test("CLI - setup help command works", async () => {
  const cmd = new Deno.Command("./no-wing", {
    args: ["setup", "--help"],
    cwd: "/home/pchinjr/Code/no-wing",
    stdout: "piped",
    stderr: "piped"
  });
  
  const { code, stdout } = await cmd.output();
  const output = new TextDecoder().decode(stdout);
  
  assertEquals(code, 0);
  assertStringIncludes(output, "Initial setup and configuration");
  assertStringIncludes(output, "--profile");
});
