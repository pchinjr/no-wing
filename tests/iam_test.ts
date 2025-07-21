import { assertRejects, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { IamRoleManager } from "../lib/iam.ts";

Deno.test("IamRoleManager", async (t) => {
  // Test configuration validation
  await t.step("validates role name", async () => {
    // This should throw during construction
    assertThrows(
      () => new IamRoleManager({
        roleName: "",
        agentName: "test-agent",
        policies: [],
        trustPolicy: {},
        inlinePolicies: [],
      }),
      Error,
      "Role name is required"
    );
  });

  await t.step("accepts valid configuration", async () => {
    const manager = new IamRoleManager({
      roleName: "test-role",
      agentName: "test-agent",
      policies: ["arn:aws:iam::aws:policy/ReadOnlyAccess"],
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

    // This should not throw a validation error
    const roleArn = await manager.createRole();
    console.log(`Created role: ${roleArn}`);
  });

  // Test role operations (these will be implemented later)
  await t.step("role creation works", async () => {
    const manager = new IamRoleManager({
      roleName: "test-role",
      agentName: "test-agent",
      policies: [],
      trustPolicy: {},
      inlinePolicies: [],
    });

    const roleArn = await manager.createRole();
    console.log(`Created role: ${roleArn}`);
  });

  await t.step("policy attachment works", async () => {
    const manager = new IamRoleManager({
      roleName: "test-role",
      agentName: "test-agent",
      policies: ["arn:aws:iam::aws:policy/ReadOnlyAccess"],
      trustPolicy: {},
      inlinePolicies: [],
    });

    await manager.attachPolicies();
  });
});
