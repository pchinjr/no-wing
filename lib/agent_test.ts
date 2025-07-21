import { assertEquals, assertThrows } from "https://deno.land/std/assert/mod.ts";
import { AgentRunner } from "./agent.ts";

// Mock environment provider for testing
const mockEnvProvider = () => ({
  MOCK_ENV: "true",
  HOME: "/home/test",
});

Deno.test("AgentRunner validation", () => {
  // Valid configuration should not throw
  const validConfig = {
    agentName: "test-agent",
    command: ["echo", "hello"],
  };
  
  const runner = new AgentRunner(validConfig, mockEnvProvider);
  assertEquals(runner instanceof AgentRunner, true);
  
  // Missing agent name should throw
  assertThrows(
    () => {
      new AgentRunner({
        ...validConfig,
        agentName: "",
      }, mockEnvProvider);
    },
    Error,
    "Agent name is required"
  );
  
  // Missing command should throw
  assertThrows(
    () => {
      new AgentRunner({
        ...validConfig,
        command: [],
      }, mockEnvProvider);
    },
    Error,
    "Command is required"
  );
  
  // Invalid command type should throw
  assertThrows(
    () => {
      new AgentRunner({
        ...validConfig,
        // @ts-ignore - Testing runtime validation
        command: "echo hello",
      }, mockEnvProvider);
    },
    Error,
    "Command is required and must be a non-empty array"
  );
  
  // Invalid role ARN type should throw
  assertThrows(
    () => {
      new AgentRunner({
        ...validConfig,
        // @ts-ignore - Testing runtime validation
        roleArn: 123,
      }, mockEnvProvider);
    },
    Error,
    "Role ARN must be a string"
  );
  
  // Invalid env type should throw
  assertThrows(
    () => {
      new AgentRunner({
        ...validConfig,
        // @ts-ignore - Testing runtime validation
        env: "not-an-object",
      }, mockEnvProvider);
    },
    Error,
    "Environment variables must be an object"
  );
});

Deno.test("AgentRunner run method", async () => {
  const validConfig = {
    agentName: "test-agent",
    command: ["echo", "hello"],
    roleArn: "arn:aws:iam::123456789012:role/test-role",
    env: {
      TEST_VAR: "test-value",
    },
  };
  
  const runner = new AgentRunner(validConfig, mockEnvProvider);
  
  // Test run returns expected result
  const result = await runner.run();
  assertEquals(result.success, true);
  assertEquals(typeof result.output, "string");
});
