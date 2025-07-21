import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parse } from "https://deno.land/std/flags/mod.ts";

// Test command parsing
Deno.test("cli: command parsing", async (t) => {
  await t.step("parse help command", () => {
    const args = parse(["help"]);
    assertEquals(args._[0], "help");
  });

  await t.step("parse init command", () => {
    const args = parse(["init"]);
    assertEquals(args._[0], "init");
  });

  await t.step("parse unknown command defaults to help", () => {
    const args = parse([]);
    assertEquals(args._[0], undefined);
  });
});

// Test command implementations
Deno.test("cli: init command", async (t) => {
  const testDir = await Deno.makeTempDir();
  const originalCwd = Deno.cwd();

  await t.step("setup", async () => {
    await Deno.chdir(testDir);
  });

  await t.step("creates state directory", async () => {
    // TODO(@pchinjr): #15 Implement state directory creation test
    const stateDir = "./state";
    await assertRejects(
      async () => {
        const stat = await Deno.stat(stateDir);
        assertEquals(stat.isDirectory, true);
      },
      Deno.errors.NotFound,
      "state directory should not exist yet"
    );
  });

  await t.step("cleanup", async () => {
    await Deno.chdir(originalCwd);
    await Deno.remove(testDir, { recursive: true });
  });
});

// Test error handling
Deno.test("cli: error handling", async (t) => {
  await t.step("handles missing permissions", () => {
    // TODO(@pchinjr): #16 Add permission tests
  });

  await t.step("handles invalid config", () => {
    // TODO(@pchinjr): #17 Add config validation tests
  });
});
