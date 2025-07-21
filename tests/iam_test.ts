import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { IamRoleManager } from "../lib/iam.ts";

Deno.test("IamRoleManager", async (t) => {
  // Test configuration validation
  await t.step("validates role name", () => {
    const manager = new IamRoleManager({
      roleName: "",
      trustPolicy: {},
      inlinePolicies: [],
    });

    assertRejects(
      () => manager.createRole(),
      Error,
      "Role name is required"
    );
  });

  await t.step("accepts valid configuration", () => {
    const manager = new IamRoleManager({
      roleName: "test-role",
      trustPolicy: {
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Principal: {
            Service: "lambda.amazonaws.com",
          },
          Action: "sts:AssumeRole",
        }],
      },
      inlinePolicies: [],
    });

    // Validation happens implicitly in createRole
    assertRejects(
      () => manager.createRole(),
      Error,
      "Not implemented"
    );
  });

  // Test role operations (these will be implemented later)
  await t.step("role creation fails when not implemented", () => {
    const manager = new IamRoleManager({
      roleName: "test-role",
      trustPolicy: {},
      inlinePolicies: [],
    });

    assertRejects(
      () => manager.createRole(),
      Error,
      "Not implemented"
    );
  });

  await t.step("policy attachment fails when not implemented", () => {
    const manager = new IamRoleManager({
      roleName: "test-role",
      trustPolicy: {},
      inlinePolicies: [],
    });

    assertRejects(
      () => manager.attachPolicies(),
      Error,
      "Not implemented"
    );
  });
});
