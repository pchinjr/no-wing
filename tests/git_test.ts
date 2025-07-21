import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { GitIdentityManager } from "../lib/git.ts";

Deno.test("GitIdentityManager", async (t) => {
  // Test configuration validation
  await t.step("validates identity configuration", () => {
    const manager = new GitIdentityManager({
      name: "",
      email: "",
    });

    assertRejects(
      () => manager.configureIdentity(),
      Error,
      "Git identity name and email are required"
    );
  });

  await t.step("accepts valid configuration", () => {
    const manager = new GitIdentityManager({
      name: "Q Agent",
      email: "q-agent@no-wing.local",
    });

    // Validation happens implicitly in configureIdentity
    assertRejects(
      () => manager.configureIdentity(),
      Error,
      "Not implemented"
    );
  });

  // Test Git operations (these will be implemented later)
  await t.step("identity configuration fails when not implemented", () => {
    const manager = new GitIdentityManager({
      name: "Q Agent",
      email: "q-agent@no-wing.local",
    });

    assertRejects(
      () => manager.configureIdentity(),
      Error,
      "Not implemented"
    );
  });

  await t.step("commit fails when not implemented", () => {
    const manager = new GitIdentityManager({
      name: "Q Agent",
      email: "q-agent@no-wing.local",
    });

    assertRejects(
      () => manager.commit("test commit", ["file.txt"]),
      Error,
      "Not implemented"
    );
  });

  await t.step("reset identity fails when not implemented", () => {
    const manager = new GitIdentityManager({
      name: "Q Agent",
      email: "q-agent@no-wing.local",
    });

    assertRejects(
      () => manager.resetIdentity(),
      Error,
      "Not implemented"
    );
  });
});
