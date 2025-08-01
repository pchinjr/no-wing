// tools/validate.ts
import { readAll } from "https://deno.land/std@0.224.0/io/read_all.ts";
import { parse } from "https://deno.land/std@0.224.0/yaml/mod.ts";
import { validatePlan } from "../plan.ts";

async function readStdinJson() {
  const buf = await readAll(Deno.stdin);
  return JSON.parse(new TextDecoder().decode(buf));
}

const { intentPath, outputPath } = await readStdinJson();

const intentText = await Deno.readTextFile(intentPath);
const intent = parse(intentText) as {
  goal: string;
  constraints?: string[];
  acceptance_criteria?: string[];
};

let agentOutput = "";
try {
  agentOutput = await Deno.readTextFile(outputPath);
} catch {
  console.error("❌ No agent output found at", outputPath);
  Deno.exit(1);
}

const { passed, results } = validatePlan(intent, agentOutput, outputPath, true);

await Deno.mkdir("workspace", { recursive: true });
await Deno.writeTextFile(
  "workspace/plan.json",
  JSON.stringify({ passed, results }, null, 2),
);

console.log(passed ? "✅ All constraints passed" : "❌ Some constraints failed");
if (!passed) Deno.exit(1);
