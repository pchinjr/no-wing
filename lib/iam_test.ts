import { assertEquals, assertThrows } from "https://deno.land/std/assert/mod.ts";
import { IamRoleManager } from "./iam.ts";

Deno.test("IamRoleManager validation", () => {
  // Valid configuration should not throw
  const validConfig = {
    roleName: "test-role",
    agentName: "test-agent",
    policies: ["arn:aws:iam::aws:policy/ReadOnlyAccess"],
  };
  
  const manager = new IamRoleManager(validConfig);
  assertEquals(manager instanceof IamRoleManager, true);
  
  // Invalid role name should throw
  assertThrows(
    () => {
      new IamRoleManager({
        ...validConfig,
        roleName: "",
      });
    },
    Error,
    "Role name is required"
  );
  
  // Invalid role name characters should throw
  assertThrows(
    () => {
      new IamRoleManager({
        ...validConfig,
        roleName: "invalid*role$name",
      });
    },
    Error,
    "Role name must consist of"
  );
  
  // Missing agent name should throw
  assertThrows(
    () => {
      new IamRoleManager({
        ...validConfig,
        agentName: "",
      });
    },
    Error,
    "Agent name is required"
  );
  
  // Invalid policies should throw
  assertThrows(
    () => {
      new IamRoleManager({
        ...validConfig,
        // @ts-ignore - Testing runtime validation
        policies: "not-an-array",
      });
    },
    Error,
    "Policies must be an array"
  );
});

Deno.test("IamRoleManager methods", async () => {
  const validConfig = {
    roleName: "test-role",
    agentName: "test-agent",
    policies: ["arn:aws:iam::aws:policy/ReadOnlyAccess"],
  };
  
  const manager = new IamRoleManager(validConfig);
  
  // Test createRole returns an ARN
  const roleArn = await manager.createRole();
  assertEquals(typeof roleArn, "string");
  assertEquals(roleArn.startsWith("arn:aws:iam::"), true);
  
  // Test attachPolicies doesn't throw
  await manager.attachPolicies();
  
  // Test getRoleArn returns an ARN
  const retrievedArn = await manager.getRoleArn();
  assertEquals(typeof retrievedArn, "string");
  assertEquals(retrievedArn.startsWith("arn:aws:iam::"), true);
});
