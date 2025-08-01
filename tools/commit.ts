// tools/commit.ts
import { readAll } from "https://deno.land/std@0.224.0/io/read_all.ts";
const input = await readStdinJson();
const { filePath, agentName } = input;

const commitMessage = `🤖 Commit by ${agentName} via No-Wing`;

const command = new Deno.Command("git", {
  args: ["add", filePath],
});
await command.output();

const commit = new Deno.Command("git", {
  args: ["commit", "-m", commitMessage, "--author", `${agentName} <agent@nowing.local>`],
});
await commit.output();

console.log(JSON.stringify({ committed: true, file: filePath, agent: agentName }));

async function readStdinJson() {
  const buf = await readAll(Deno.stdin);
  return JSON.parse(new TextDecoder().decode(buf));
}
