// agents/gpt-agent.ts
export async function runAgent(intent: string): Promise<string> {
  const prompt = `## Intent\n${intent}\n\n## Code:\n`;

  const response = await fetch("https://api.openai.com/v1/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-davinci-003",
      prompt,
      max_tokens: 500,
      temperature: 0,
    }),
  });

  const json = await response.json();
  return json.choices?.[0]?.text || "// No output";
}