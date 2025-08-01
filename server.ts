// server.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { runTask } from "./tools/taskRunner.ts";

const PORT = 8000;
const controller = new AbortController();
const { signal } = controller;

Deno.addSignalListener("SIGINT", () => {
  console.log("\n🛑 Caught Ctrl+C — stopping No-Wing server...");
  controller.abort();
});

console.log(`🦈 No-Wing listening on http://localhost:${PORT}/`);

await serve(async (req: Request) => {
  const { pathname } = new URL(req.url);

  // Health check or default endpoint
  if (req.method === "GET" && pathname === "/") {
    return new Response("No-Wing server is running 🦈", { status: 200 });
  }

  // MCP tool: /tools/noWingValidate
  if (req.method === "POST" && pathname === "/tools/noWingValidate") {
    try {
      const body = await req.json();
      const result = await runTask(body);
      return new Response(JSON.stringify(result, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("❌ /tools/noWingValidate failed:", err);
      return new Response("Validation error", { status: 500 });
    }
  }

  // MCP tool: /tools/fs_guard
  if (req.method === "POST" && pathname === "/tools/fs_guard") {
	try {
			const body = await req.json();
			const result = await fsGuardWrite(body);
			return new Response(JSON.stringify(result, null, 2), {
			headers: { "Content-Type": "application/json" },
			});
	} catch (err) {
			console.error("❌ /tools/fs_guard failed:", err);
			return new Response("Write error", { status: 500 });
	}
	}

  return new Response("Not found", { status: 404 });
}, { port: PORT, signal });
