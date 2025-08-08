// handlers.ts
import { runLint } from "./runLint.ts";
// import { runAndFixTests } from "./run_and_fix_tests.ts";
// import { writeFile } from "./write_file.ts";

type ToolArgs = Record<string, unknown>;
type ToolResult = Record<string, unknown>;

export const handlers = new Map<
  string,
  (args: ToolArgs) => Promise<ToolResult>
>([
  ["runLint", async (args) => {
    const { command, files } = args as { command: string; files: string[] };
    return await runLint(command, files);
  }],
  // ["runAndFixTests", async (args) => {
  //   const { command } = args as { command: string };
  //   return await runAndFixTests(command);
  // }],
  // ["writeFile", async (args) => {
  //   const { path, content } = args as { path: string; content: string };
  //   return await writeFile(path, content);
  // }],
]);
