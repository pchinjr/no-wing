#!/usr/bin/env -S deno run --allow-all

/**
 * No-wing CLI - Deno Entry Point
 * Q Credential Separation System
 * 
 * Usage:
 *   deno run --allow-all main.ts [command] [options]
 *   deno compile --allow-all main.ts --output no-wing
 */

import { NoWingCLI } from './src/cli/NoWingCLI.ts';

async function main(): Promise<void> {
  try {
    const cli = new NoWingCLI();
    await cli.initialize();
    await cli.run();
  } catch (error) {
    console.error('❌ CLI Error:', error.message);
    Deno.exit(1);
  }
}

// Run main function if this is the entry point
if (import.meta.main) {
  await main();
}

export { main };
