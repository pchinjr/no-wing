// server.ts
import { handlers } from "./handlers.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST" || new URL(req.url).pathname !== "/mcp") {
    return new Response("Not Found", { status: 404 });
  }

  const msg = await req.json() as {
    type: string;
    tool: string;
    arguments: Record<string, unknown>;
  };

  if (msg.type !== "toolInvocation") {
    return new Response(JSON.stringify({ error: "Unsupported message type" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const handler = handlers.get(msg.tool);
  if (!handler) {
    return new Response(
      JSON.stringify({
        type: "toolError",
        tool: msg.tool,
        error: `No such tool: ${msg.tool}`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const result = await handler(msg.arguments);
    return new Response(
      JSON.stringify({
        type: "toolResult",
        tool: msg.tool,
        result,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        type: "toolError",
        tool: msg.tool,
        error: String(err),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
