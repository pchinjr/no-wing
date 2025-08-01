// server.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { runAgent } from "./agents/local-agent.ts";

const PORT = 8000;
const controller = new AbortController();
const { signal } = controller;

Deno.addSignalListener("SIGINT", () => {
  console.log("\n🛑 Caught Ctrl+C — stopping No-Wing server...");
  controller.abort();
});

console.log(`🦈 No-Wing listening on http://localhost:${PORT}/`);

await serve(
  async (req: Request) => {
    if (req.method !== "POST") {
      return new Response("Only POST supported", { status: 405 });
    }

    try {
      const intent = await Deno.readTextFile("intent.yml");
      const output = await runAgent(intent);

      await Deno.mkdir("workspace", { recursive: true });
      await Deno.writeTextFile("workspace/output.ts", output);

      return new Response("Agent work written to workspace/output.ts\n");
    } catch (err) {
      console.error("❌ Error handling request:", err);
      return new Response("Error processing request\n", { status: 500 });
    }
  },
  { port: PORT, signal }
);
