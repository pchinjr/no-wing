/**
 * Test Script for Hello World MCP Tool
 * Demonstrates how to interact with the MCP server
 */

const MCP_SERVER_URL = "http://localhost:8001";

interface MCPRequest {
  jsonrpc: string;
  id: string | number;
  method: string;
  params?: any;
}

async function callMCP(request: MCPRequest) {
  console.log(`📤 Sending: ${JSON.stringify(request, null, 2)}`);
  
  const response = await fetch(MCP_SERVER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  });
  
  const result = await response.json();
  console.log(`📥 Received: ${JSON.stringify(result, null, 2)}\n`);
  
  return result;
}

async function testHelloWorldMCP() {
  console.log("🧪 Testing Hello World MCP Tool\n");
  
  try {
    // 1. Initialize the connection
    console.log("1️⃣ Initializing MCP connection...");
    await callMCP({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "hello-world-test-client",
          version: "1.0.0"
        }
      }
    });

    // 2. List available tools
    console.log("2️⃣ Listing available tools...");
    await callMCP({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list"
    });

    // 3. Call hello_world tool with default parameters
    console.log("3️⃣ Calling hello_world tool (default)...");
    await callMCP({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "hello_world",
        arguments: {}
      }
    });

    // 4. Call hello_world tool with custom name
    console.log("4️⃣ Calling hello_world tool (custom name)...");
    await callMCP({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "hello_world",
        arguments: {
          name: "No-Wing Developer"
        }
      }
    });

    // 5. Call hello_world tool with custom message and name
    console.log("5️⃣ Calling hello_world tool (custom message)...");
    await callMCP({
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "hello_world",
        arguments: {
          name: "Agent",
          message: "Greetings"
        }
      }
    });

    console.log("✅ All tests completed successfully!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test if this script is executed directly
if (import.meta.main) {
  testHelloWorldMCP();
}
