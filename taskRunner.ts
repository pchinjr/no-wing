import { loadSync } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { validatePlan } from "./plan.ts";
import { parse } from "https://deno.land/std@0.224.0/yaml/mod.ts";

const env = loadSync();
const agentHost = env["LOCAL_AGENT_HOST"] ?? "http://localhost:1234";
const intentPath = "intent.yml";
const outputPath = "workspace/output.ts";

// Load and parse the intent file
const intentText = await Deno.readTextFile(intentPath);
const intent = parse(intentText) as {
  goal: string;
  constraints?: string[];
  acceptance_criteria?: string[];
};

console.log("🎯 Intent:", intent.goal);
console.log("📡 Agent Host:", agentHost);

// Make a request to the local agent
const response = await fetch(`http://${agentHost}:1234/v1/chat/completions`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "deepseek-r1-distill-qwen-7b", // or change this to your model
    messages: [
      { role: "system", content: "You are a helpful developer assistant." },
      { role: "user", content: intent.goal },
    ],
    temperature: 0.7,
    max_tokens: 1024,
    stream: false,
  }),
});

if (!response.ok) {
  console.error("❌ Agent call failed:", response.statusText);
  Deno.exit(1);
}

const data = await response.json();
const agentOutput = data.choices?.[0]?.message?.content ?? "";

await Deno.mkdir("workspace", { recursive: true });
await Deno.writeTextFile(outputPath, agentOutput);
console.log("✅ Agent output saved to", outputPath);

// Run validation
const { passed, results } = validatePlan(intent, agentOutput, outputPath, true);
await Deno.writeTextFile(
  "workspace/plan.json",
  JSON.stringify({ passed, results }, null, 2)
);

console.log(passed ? "🎉 All constraints passed!" : "⚠️ Some constraints failed.");
if (!passed) Deno.exit(1);
