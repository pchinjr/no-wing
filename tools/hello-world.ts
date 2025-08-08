/**
 * Basic Hello World MCP Tool
 * Demonstrates the simplest possible MCP tool implementation
 */

export interface HelloWorldRequest {
  name?: string;
  message?: string;
}

export interface HelloWorldResponse {
  greeting: string;
  timestamp: string;
  metadata: {
    tool: string;
    version: string;
  };
}

/**
 * Hello World MCP Tool
 * A simple tool that returns a greeting message
 */
export function helloWorldTool(request: HelloWorldRequest = {}): HelloWorldResponse {
  const { name = "World", message = "Hello" } = request;
  
  return {
    greeting: `${message}, ${name}!`,
    timestamp: new Date().toISOString(),
    metadata: {
      tool: "hello-world",
      version: "1.0.0"
    }
  };
}

// MCP Tool Definition
export const helloWorldToolDefinition = {
  name: "hello_world",
  description: "A simple greeting tool that says hello",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name to greet (defaults to 'World')",
        default: "World"
      },
      message: {
        type: "string", 
        description: "Greeting message (defaults to 'Hello')",
        default: "Hello"
      }
    }
  }
};
