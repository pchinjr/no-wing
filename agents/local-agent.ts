// agents/local-agent.ts
import "https://deno.land/std@0.224.0/dotenv/load.ts";

const HOST = Deno.env.get("LOCAL_AGENT_HOST") || "localhost";

export async function runAgent(intent: string): Promise<string> {
  const response = await fetch(`http://${HOST}:1234/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-r1-distill-qwen-7b",
      messages: [
        {
          role: "system",
          content: "You are an artificial developer. Output only code.",
        },
        {
          role: "user",
          content: intent,
        },
      ],
      temperature: 0.7,
      max_tokens: 512,
      stream: false,
    }),
  });

  const json = await response.json();
  return json.choices?.[0]?.message?.content?.trim() ?? "// no output";
}
