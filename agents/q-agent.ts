// agents/q-agent.ts
import { Command } from "https://deno.land/std@0.224.0/io/mod.ts";

export async function runQDevAgent(intent: {
  goal: string;
  constraints?: string[];
  acceptance_criteria?: string[];
}): Promise<string> {
  const prompt = `
${intent.goal}

${intent.constraints?.length ? `Constraints:\n${intent.constraints.join("\n")}` : ""}
`;

  const cmd = new Deno.Command("q", {
    args: ["ask", prompt.trim()],
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout, stderr } = await cmd.output();

  if (code !== 0) {
    const error = new TextDecoder().decode(stderr);
    throw new Error(`Q CLI failed: ${error}`);
  }

  return new TextDecoder().decode(stdout);
}
