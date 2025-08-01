// tools/stdio-mcp-server.ts
#!/usr/bin/env -S deno run --allow-read --allow-write

interface JsonRpcRequest {
  id: number; method: string; params?: any;
}
interface JsonRpcResponse {
  id: number; jsonrpc: "2.0";
  result?: unknown;
  error?: { code: number; message: string };
}

function send(r: JsonRpcResponse) {
  const buf = new TextEncoder().encode(JSON.stringify(r) + "\n");
  Deno.stdout.writeSync(buf);
}

function toolList(id: number): JsonRpcResponse {
  return {
    id, jsonrpc: "2.0",
    result: {
      tools: [
        {
          name: "fs_guard",
          description: "Safely write files under ./workspace only",
          inputSchema: { type: "object", properties: {
            path: { type: "string" },
            content: { type: "string" }
          }, required: ["path", "content"] }
        },
        {
          name: "fs_read_safe",
          description: "Safely read files from ./workspace or ./intent.yml",
          inputSchema: { type: "object", properties: {
            path: { type: "string" }
          }, required: ["path"] }
        }
      ],
      prompts: [], resources: []
    }
  };
}

function doFsReadSafe(path: string) {
  // Allow reading from workspace or intent.yml
  if (!path.startsWith("./workspace/") && path !== "./intent.yml" && !path.startsWith("./tasks/")) {
    throw new Error("Path must be under ./workspace, ./tasks, or be ./intent.yml");
  }
  if (path.includes("..")) {
    throw new Error("Path cannot contain '..'");
  }
  
  try {
    const content = Deno.readTextFileSync(path);
    return { status: "ok", path, content };
  } catch (e) {
    throw new Error(`Failed to read file: ${(e as Error).message}`);
  }
}

function doFsGuard(path: string, content: string) {
  if (!path.startsWith("./workspace/") || path.includes("..")) {
    throw new Error("Path must stay under ./workspace");
  }
  Deno.mkdirSync("workspace", { recursive: true });
  Deno.writeTextFileSync(path, content);
  return { status: "ok", path };
}

const raw = await new Response(Deno.stdin.readable).text();
for (const line of raw.split("\n").filter(Boolean)) {
  const req = JSON.parse(line) as JsonRpcRequest;
  try {
    if (req.method === "tool/ListTools") {
      send(toolList(req.id));
    } else if (req.method === "tool/fs_guard") {
      const { path, content } = req.params ?? {};
      const result = doFsGuard(path, content);
      send({ id: req.id, jsonrpc: "2.0", result });
    } else if (req.method === "tool/fs_read_safe") {
      const { path } = req.params ?? {};
      const result = doFsReadSafe(path);
      send({ id: req.id, jsonrpc: "2.0", result });
    } else {
      send({ id: req.id, jsonrpc: "2.0", error: { code: -32601, message: "Unknown method" } });
    }
  } catch (e) {
    send({ id: req.id, jsonrpc: "2.0", error: { code: -32000, message: (e as Error).message } });
  }
}
