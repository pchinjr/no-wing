/**
 * Simple MCP Server with Hello World Tool
 * Demonstrates basic MCP protocol implementation
 */

import { helloWorldTool, helloWorldToolDefinition, HelloWorldRequest } from "./tools/hello-world.ts";

interface MCPRequest {
  jsonrpc: string;
  id: string | number;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: string;
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

class SimpleMCPServer {
  private tools = new Map([
    ["hello_world", { definition: helloWorldToolDefinition, handler: helloWorldTool }]
  ]);

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    const { jsonrpc, id, method, params } = request;

    try {
      switch (method) {
        case "initialize":
          return {
            jsonrpc,
            id,
            result: {
              protocolVersion: "2024-11-05",
              capabilities: {
                tools: {}
              },
              serverInfo: {
                name: "hello-world-mcp-server",
                version: "1.0.0"
              }
            }
          };

        case "tools/list":
          return {
            jsonrpc,
            id,
            result: {
              tools: Array.from(this.tools.values()).map(tool => tool.definition)
            }
          };

        case "tools/call":
          const { name, arguments: args } = params;
          const tool = this.tools.get(name);
          
          if (!tool) {
            throw new Error(`Tool '${name}' not found`);
          }

          const result = tool.handler(args as HelloWorldRequest);
          
          return {
            jsonrpc,
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2)
                }
              ]
            }
          };

        default:
          throw new Error(`Unknown method: ${method}`);
      }
    } catch (error) {
      return {
        jsonrpc,
        id,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : "Internal error"
        }
      };
    }
  }
}

// HTTP Server
const server = new SimpleMCPServer();

async function handleHTTP(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const mcpRequest = await request.json() as MCPRequest;
    const mcpResponse = await server.handleRequest(mcpRequest);
    
    return new Response(JSON.stringify(mcpResponse), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32700,
          message: "Parse error"
        }
      }),
      { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

const port = 8001;
console.log(`🚀 Hello World MCP Server starting on port ${port}`);
console.log(`📡 Test with: curl -X POST http://localhost:${port} -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`);

Deno.serve({ port }, handleHTTP);
