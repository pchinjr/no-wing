#!/usr/bin/env -S deno run --allow-all

/**
 * Type Safety Checker for no-wing
 * 
 * This script runs comprehensive type checking and reports issues
 */

import * as colors from "https://deno.land/std@0.208.0/fmt/colors.ts";

interface TypeCheckResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

async function runTypeCheck(): Promise<TypeCheckResult> {
  console.log(colors.blue("🔍 Running TypeScript type checking..."));
  
  const cmd = new Deno.Command("deno", {
    args: ["check", "main.ts"],
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stderr } = await cmd.output();
  const output = new TextDecoder().decode(stderr);
  
  if (code === 0) {
    console.log(colors.green("✅ Type checking passed!"));
    return {
      success: true,
      errors: [],
      warnings: []
    };
  }

  // Parse TypeScript errors
  const lines = output.split('\n');
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const line of lines) {
    if (line.includes('[ERROR]')) {
      errors.push(line);
    } else if (line.includes('[WARNING]')) {
      warnings.push(line);
    }
  }

  if (errors.length === 0) {
    console.log(colors.green("✅ Type checking passed!"));
    return {
      success: true,
      errors: [],
      warnings
    };
  }

  console.log(colors.red(`❌ Found ${errors.length} type errors`));
  
  return {
    success: false,
    errors,
    warnings
  };
}

async function runLinting(): Promise<boolean> {
  console.log(colors.blue("🧹 Running linter..."));
  
  const cmd = new Deno.Command("deno", {
    args: ["lint"],
    stdout: "piped",
    stderr: "piped",
  });

  const { code } = await cmd.output();
  
  if (code === 0) {
    console.log(colors.green("✅ Linting passed!"));
    return true;
  } else {
    console.log(colors.red("❌ Linting failed"));
    return false;
  }
}

async function runTests(): Promise<boolean> {
  console.log(colors.blue("🧪 Running tests..."));
  
  const cmd = new Deno.Command("deno", {
    args: ["test", "--allow-all", "src/test/*_test.ts"],
    stdout: "piped",
    stderr: "piped",
  });

  const { code } = await cmd.output();
  
  if (code === 0) {
    console.log(colors.green("✅ Tests passed!"));
    return true;
  } else {
    console.log(colors.red("❌ Tests failed"));
    return false;
  }
}

async function main() {
  console.log(colors.bold("🛡️ Type Safety Check for no-wing\n"));

  const typeCheckResult = await runTypeCheck();
  const lintResult = await runLinting();
  const testResult = await runTests();

  console.log("\n" + colors.bold("📊 Summary:"));
  console.log(`Type Check: ${typeCheckResult.success ? colors.green("✅ PASS") : colors.red("❌ FAIL")}`);
  console.log(`Linting: ${lintResult ? colors.green("✅ PASS") : colors.red("❌ FAIL")}`);
  console.log(`Tests: ${testResult ? colors.green("✅ PASS") : colors.red("❌ FAIL")}`);

  if (!typeCheckResult.success) {
    console.log(colors.yellow("\n🔧 Type Safety Issues to Fix:"));
    console.log(`- ${typeCheckResult.errors.length} type errors found`);
    console.log("- Run 'deno check main.ts' for detailed error messages");
    console.log("- Consider using stricter TypeScript settings in deno.json");
  }

  const allPassed = typeCheckResult.success && lintResult && testResult;
  
  if (allPassed) {
    console.log(colors.green("\n🎉 All checks passed! Code is type-safe and ready for production."));
  } else {
    console.log(colors.red("\n⚠️ Some checks failed. Please fix issues before deploying."));
  }

  Deno.exit(allPassed ? 0 : 1);
}

if (import.meta.main) {
  await main();
}
