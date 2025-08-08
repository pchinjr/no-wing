/**
 * @param command - The lint command to execute, e.g. "eslint --fix"
 * @param files - Array of file paths or glob patterns to lint
 * @returns An object with success flag, initialOutput, fixesApplied, and finalOutput
 */
export async function runLint(
  command: string,
  files: string[],
): Promise<{
  success: boolean;
  output: string;
}> {
  // 1. Build the full command array
  const cmdArray = [...command.split(" "), ...files];

  // 2. Spawn the process, capture stdout+stderr, and get exitCode
  let output = "";
  let exitCode = 0;
  {
    const proc = new Deno.Command(cmdArray[0], {
      args: cmdArray.slice(1),
      stdout: "piped",
      stderr: "piped",
    }).spawn();

    const { stdout, stderr, code } = await proc.output();
    output =
      new TextDecoder().decode(stdout) +
      new TextDecoder().decode(stderr);
    exitCode = code;
  }

  // 3. Return the result
  return {
    output,
    success: exitCode === 0,
  };
}