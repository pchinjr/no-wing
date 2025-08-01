// tools/taskRunner.ts
import { validatePlan } from "../plan.ts";
import { parse } from "https://deno.land/std@0.224.0/yaml/mod.ts";
import { runQDevAgent } from "../agents/q-agent.ts";
import { runLocalAgent } from "../agents/local-agent.ts";

export async function runTask({
  intentPath,
  outputPath,
  agent = "local",
}: {
  intentPath: string;
  outputPath: string;
  agent?: "local" | "q";
}) {
  const intentText = await Deno.readTextFile(intentPath);
  const intent = parse(intentText) as {
    goal: string;
    constraints?: string[];
    acceptance_criteria?: string[];
  };

  console.log("🎯 Intent:", intent.goal);
  console.log("🧠 Agent Type:", agent);

  let agentOutput = "";
  try {
    if (agent === "q") {
      console.log("✅ Granted run access to \"q\".");
      agentOutput = await runQDevAgent(intent.goal);
    } else {
      agentOutput = await runLocalAgent(intent.goal);
    }
  } catch (err) {
    console.error("❌ Agent error:", err.message);
    Deno.exit(1);
  }

  await Deno.mkdir("workspace", { recursive: true });
  await Deno.writeTextFile(outputPath, agentOutput);
  console.log("✅ Agent output saved to", outputPath);

  const { passed, results } = await validatePlan(
    intent,
    agentOutput,
    outputPath,
    true,
  );

  await Deno.writeTextFile(
    "workspace/plan.json",
    JSON.stringify({ passed, results }, null, 2),
  );

  console.log(passed ? "🎉 All constraints passed!" : "⚠️ Some constraints failed.");
  if (!passed) Deno.exit(1);
}
