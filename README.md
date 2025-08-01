# 🪽 No-Wing

**No-Wing** is an experimental platform for managing artificials with agentic development.

This MVP implements a minimal **MCP-compatible server** that:
- Accepts an `intent.yml` describing a goal
- Routes the intent to an artificial agent (e.g. OpenAI Codex, GPT, Claude)
- Writes the agent's output to a `workspace/` directory

## 🧠 Philosophy

> Agents should get a task, execute within clear boundaries, and are held accountable for the results.

No-Wing provides a common interface and lifecycle model for any artificial capable of generating or transforming code—whether it's an API, CLI tool, or IDE plugin.

## 🧱 Project Structure

```
no-wing/
├── server.ts           # Minimal MCP-compatible HTTP server
├── agents/
│   └── gpt-agent.ts    # Sample agent that uses OpenAI's API
├── workspace/          # Where agent output is saved
├── intent.yml          # Developer goal and constraints
└── tool_definitions.ts # (WIP) Definitions of MCP tool calls
````

## 🚀 Getting Started

### 1. Set your OpenAI API key
```bash
export OPENAI_API_KEY=your-key-here
````

### 2. Define your intent

Edit `intent.yml` to describe the task the artificial should complete.

```yaml
goal: "Write a TypeScript function that adds two numbers"
constraints:
  - must use TypeScript
  - must include a test
acceptance_criteria:
  - output file must exist in workspace/
```

### 3. Start the No-Wing server

```bash
deno run --allow-net --allow-read --allow-write server.ts
```

### 4. Send an MCP-style POST request

```bash
curl -X POST http://localhost:8000 \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Build it"}]}'
```

Check `workspace/output.ts` for the result.

## 🔜 Roadmap

* [ ] Add `no-wing plan` to validate agent output against intent
* [ ] Add `no-wing commit` to attribute work to agent identity
* [ ] Add `no-wing deploy` to release validated code with least-privilege
* [ ] Extend to support CLI tools like Q, Gemini, Cursor, Codex, Claude
* [ ] Build toward LLM OS process model