import { assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { AuditLogger } from "../lib/audit.ts";

Deno.test("AuditLogger", async (t) => {
  const testDir = await Deno.makeTempDir();
  const logPath = `${testDir}/audit.log`;

  await t.step("setup", async () => {
    await Deno.writeTextFile(logPath, ""); // Create empty log file
  });

  // Test logging operations
  await t.step("validates log path", () => {
    const logger = new AuditLogger("/nonexistent/path");

    assertRejects(
      () => logger.log("test", {}),
      Error,
      "Audit log path does not exist"
    );
  });

  await t.step("log entry has correct structure", async () => {
    const logger = new AuditLogger(logPath);
    const action = "test-action";
    const context = { key: "value" };

    await assertRejects(
      () => logger.log(action, context),
      Error,
      "Not implemented"
    );
  });

  await t.step("query fails when not implemented", () => {
    const logger = new AuditLogger(logPath);

    assertRejects(
      () => logger.query({}),
      Error,
      "Not implemented"
    );
  });

  await t.step("cleanup", async () => {
    await Deno.remove(testDir, { recursive: true });
  });
});
