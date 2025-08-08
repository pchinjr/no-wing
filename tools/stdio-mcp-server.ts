#!/usr/bin/env -S deno run --allow-read --allow-write

interface JsonRpcRequest {
  id: number;
  method: string;
  params?: any;
}

interface JsonRpcResponse {
  id: number;
  jsonrpc: "2.0";
  result?: unknown;
  error?: { code: number; message: string };
}

function send(resp: JsonRpcResponse) {
  const buf = new TextEncoder().encode(JSON.stringify(resp) + "\n");
  Deno.stdout.writeSync(buf);
}

function toolList(id: number): JsonRpcResponse {
  return {
    id,
    jsonrpc: "2.0",
    result: {
      tools: [
        {
          name: "fs_guard",
          description: "Write only within ./workspace directory",
          inputSchema: {
            type: "object",
            properties: {
              path: { type: "string" },
              content: { type: "string" }
            },
            required: ["path", "content"]
          }
        }
      ],
      prompts: [],
      resources: []
    }
  };
}

function handleFsGuard(path: string, content: string) {
  if (!path.startsWith("./workspace/") || path.includes("..")) {
    throw new Error("Blocked path");
  }
  Deno.mkdirSync("workspace", { recursive: true });
  Deno.writeTextFileSync(path, content);
  return { status: "ok", path };
}

const reader = Deno.stdin.readable.getReader();
const decoder = new TextDecoder();
let buf = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buf += decoder.decode(value);
  let idx: number;
  while ((idx = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (!line) continue;
    const req = JSON.parse(line) as JsonRpcRequest;

    try {
      if (req.method === "tool/ListTools") {
        send(toolList(req.id));
      } else if (req.method === "tool/fs_guard") {
        const { path, content } = req.params || {};
        send({
          id: req.id,
          jsonrpc: "2.0",
          result: handleFsGuard(path, content)
        });
      } else {
        send({
          id: req.id,
          jsonrpc: "2.0",
          error: { code: -32601, message: `Unknown method: ${req.method}` }
        });
      }
    } catch (err) {
      send({ id: req.id, jsonrpc: "2.0", error: { code: -32000, message: err.message } });
    }
  }
}
