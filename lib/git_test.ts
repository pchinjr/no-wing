import { assertEquals, assertThrows } from "https://deno.land/std/assert/mod.ts";
import { GitIdentityManager } from "./git.ts";

// Mock environment for testing
const originalEnv = Deno.env;
// @ts-ignore - Mocking for tests
Deno.env = {
  set: (_key: string, _value: string) => {},
  delete: (_key: string) => {},
};

// Restore the original environment after tests
Deno.test({
  name: "Cleanup",
  fn: () => {
    // @ts-ignore - Restoring after mocking
    Deno.env = originalEnv;
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test("GitIdentityManager validation", () => {
  // Valid configuration should not throw
  const validConfig = {
    agentName: "test-agent",
    authorName: "Test Author",
    authorEmail: "test@example.com",
  };
  
  const manager = new GitIdentityManager(validConfig);
  assertEquals(manager instanceof GitIdentityManager, true);
  
  // Missing agent name should throw
  assertThrows(
    () => {
      new GitIdentityManager({
        ...validConfig,
        agentName: "",
      });
    },
    Error,
    "Agent name is required"
  );
  
  // Missing author name should throw
  assertThrows(
    () => {
      new GitIdentityManager({
        ...validConfig,
        authorName: "",
      });
    },
    Error,
    "Author name is required"
  );
  
  // Missing author email should throw
  assertThrows(
    () => {
      new GitIdentityManager({
        ...validConfig,
        authorEmail: "",
      });
    },
    Error,
    "Author email is required"
  );
  
  // Invalid author email should throw
  assertThrows(
    () => {
      new GitIdentityManager({
        ...validConfig,
        authorEmail: "not-an-email",
      });
    },
    Error,
    "Author email must be a valid email address"
  );
  
  // Invalid repository type should throw
  assertThrows(
    () => {
      new GitIdentityManager({
        ...validConfig,
        // @ts-ignore - Testing runtime validation
        repository: 123,
      });
    },
    Error,
    "Repository path must be a string"
  );
});
