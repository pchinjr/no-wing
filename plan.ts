export function validatePlan(
  intent: {
    goal: string;
    constraints?: string[];
    acceptance_criteria?: string[];
  },
  agentOutput: string,
  filePath = "output.ts",
  verbose = false,
) {
  const results: Record<
    string,
    { passed: boolean; reason?: string }
  > = {};

  if (intent.constraints) {
    for (const constraint of intent.constraints) {
      const { passed, reason } = evaluateConstraint(
        constraint,
        agentOutput,
        filePath,
      );
      results[constraint] = { passed, reason };

      if (verbose) {
        console.log(`${passed ? "✅" : "⚠️"} ${constraint}${reason ? ` – ${reason}` : ""}`);
      }
    }
  }

  const allPassed = Object.values(results)
    .filter((r) => r.reason !== "Unknown constraint — skipping")
    .every((r) => r.passed);

  return {
    passed: allPassed,
    results,
  };
}

// --- Constraint matching logic ---
function evaluateConstraint(
  constraint: string,
  output: string,
  filePath: string,
): { passed: boolean; reason?: string } {
  if (/must use typescript/i.test(constraint)) {
    const passed = filePath.endsWith(".ts");
    return { passed, reason: passed ? undefined : "Output file is not TypeScript" };
  }

  if (/must include inline documentation/i.test(constraint)) {
    const passed = output.includes("/**") || output.includes("//");
    return { passed, reason: passed ? undefined : "No inline comments found" };
  }

  if (/must define a function named (\w+)/i.test(constraint)) {
    const [, fn] = constraint.match(/function named (\w+)/i) || [];
    const passed = new RegExp(`function\\s+${fn}\\s*\\(`).test(output);
    return { passed, reason: passed ? undefined : `Function ${fn} not found` };
  }

  if (/must not use external dependencies/i.test(constraint)) {
    const passed = !output.includes("import") || output.includes('from "./');
    return { passed, reason: passed ? undefined : "External imports detected" };
  }

  return {
    passed: true,
    reason: "Unknown constraint — skipping",
  };
}
