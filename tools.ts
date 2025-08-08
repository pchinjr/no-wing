// tools.ts
export const runLint = {
  name: "runLint",
  description: "Runs the specified lint command on given files and returns the raw combined stdout/stderr.",
  parameters: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The lint command to execute (e.g. \"deno lint --json\")."
      },
      files: {
        type: "array",
        items: { type: "string" },
        description: "List of file paths or glob patterns to lint."
      }
    },
    required: ["command", "files"]
  },
  returns: {
    type: "object",
    properties: {
      output: {
        type: "string",
        description: "Raw stdout/stderr from the lint run."
      },
      success: {
        type: "boolean",
        description: "True if exit code was zero (no lint errors)."
      }
    },
    required: ["output", "success"]
  }
};
