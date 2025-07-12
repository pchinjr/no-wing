import { ContextManager } from './src/config/ContextManager.ts';

console.log('Current working directory:', Deno.cwd());
const contextManager = new ContextManager();
const context = contextManager.detectContext();
console.log('Detected context:', context);
