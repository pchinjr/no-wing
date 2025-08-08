// server_stdio.ts
// deno run -A server_stdio.ts
import { McpServer } from "npm:@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "npm:@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "npm:zod";

const server = new McpServer({ name: "no-wing-mcp", version: "0.1.0" });

// Tool: runLint (your existing implementation can be called inside here)
server.registerTool(
  "runLint",
  {
    title: "Run Deno lint",
    description: "Runs `deno lint --json` on provided files",
    inputSchema: {
      command: z.string(),
      files: z.array(z.string()),
    },
  },
  async ({ command, files }) => {
    const cmdArray = [...command.split(" "), ...files];
    const proc = new Deno.Command(cmdArray[0], {
      args: cmdArray.slice(1),
      stdout: "piped",
      stderr: "piped",
    }).spawn();
    const { stdout, stderr, code } = await proc.output();
    const output =
      new TextDecoder().decode(stdout) + new TextDecoder().decode(stderr);
    return {
      // MCP tools return "content". Keep it simple: one text chunk.
      content: [{ type: "text", text: JSON.stringify({ output, success: code === 0 }) }],
    };
  }
);

await server.connect(new StdioServerTransport());
