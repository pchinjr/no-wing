// tools/fs_guard.ts
import { createToolServer } from "npm:@amazon/q-mcp-server"; // assuming you're using this helper
import { extname } from "https://deno.land/std@0.224.0/path/mod.ts";

function isSafePath(path: string): boolean {
  return path.startsWith("./workspace/") && !path.includes("..");
}

createToolServer({
  tools: [
    {
      name: "fs_guard",
      description: "Write a file, but only if it's within ./workspace.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string" },
          content: { type: "string" },
        },
        required: ["path", "content"],
      },
      handler: async ({ path, content }: { path: string; content: string }) => {
        if (!isSafePath(path)) {
          throw new Error("❌ Write blocked: path must be inside ./workspace");
        }

        await Deno.mkdir("workspace", { recursive: true });
        await Deno.writeTextFile(path, content);
        return { status: "ok", path };
      },
    },
  ],
});
