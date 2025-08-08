// run-q-agent.ts
const p = new Deno.Command("q", {
  args: ["chat"],  // Remove --no-interactive and --trust-all-tools
  stdin: "piped",
  stdout: "piped",
  stderr: "inherit",
});

const proc = p.spawn();

// Send intent as natural language
const prompt = `Write a TypeScript function called getCatPhotos that returns 3 cat image URLs. Use the fs_write tool to write it to "./workspace/output.ts"\n`;

const encoder = new TextEncoder();
const writer = proc.stdin.getWriter();
await writer.write(encoder.encode(prompt));
await writer.close();

// Read Q's response
const output = await new Response(proc.stdout).text();
console.log(output);
