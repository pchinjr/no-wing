// agents/q-agent.ts
export async function runQDevAgent(prompt: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const command = new Deno.Command("q", {
    args: ["chat", "--no-interactive"],
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  });

  const child = command.spawn();

  // Write the prompt to stdin
  const writer = child.stdin.getWriter();
  await writer.write(encoder.encode(prompt));
  await writer.close();

  let output = "";

  // Stream stdout live to console
  const streamOutput = async (reader: ReadableStream<Uint8Array> | null, isError = false) => {
    if (!reader) return;
    const r = reader.getReader();
    const outWriter = isError ? Deno.stderr : Deno.stdout;

    while (true) {
      const { value, done } = await r.read();
      if (done) break;
      if (value) {
        output += decoder.decode(value);
        await outWriter.write(value); // ← print raw chunk directly
      }
    }
  };

  await Promise.all([
    streamOutput(child.stdout),
    streamOutput(child.stderr, true),
  ]);

  const status = await child.status;

  if (!status.success) {
    throw new Error("❌ Q CLI process failed.");
  }

  return output.trim();
}
