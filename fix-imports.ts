#!/usr/bin/env -S deno run --allow-all

/**
 * Script to fix Node.js imports to Deno-compatible imports
 */

// Get all TypeScript files
const files: string[] = [];
for await (const entry of Deno.readDir('src')) {
  if (entry.isDirectory) {
    for await (const subEntry of Deno.readDir(`src/${entry.name}`)) {
      if (subEntry.name.endsWith('.ts')) {
        files.push(`src/${entry.name}/${subEntry.name}`);
      }
    }
  }
}

for (const file of files) {
  console.log(`Fixing imports in ${file}...`);
  
  let content = await Deno.readTextFile(file);
  
  // Fix fs imports
  content = content.replace(
    /import \* as fs from ['"]fs['"];?/g,
    'import { existsSync } from "https://deno.land/std@0.208.0/fs/mod.ts";\nimport { readTextFile, writeTextFile } from "https://deno.land/std@0.208.0/fs/mod.ts";'
  );
  
  // Fix path imports
  content = content.replace(
    /import \* as (?:_)?path from ['"]path['"];?/g,
    'import { join, dirname, resolve, basename } from "https://deno.land/std@0.208.0/path/mod.ts";'
  );
  
  // Fix relative imports to include .ts extension
  content = content.replace(
    /from ['"](\.\.[^'"]*?)['"];?/g,
    (match, path) => {
      if (!path.endsWith('.ts')) {
        return match.replace(path, path + '.ts');
      }
      return match;
    }
  );
  
  // Fix fs.readFileSync -> readTextFile
  content = content.replace(/fs\.readFileSync\(/g, 'await readTextFile(');
  content = content.replace(/fs\.writeFileSync\(/g, 'await writeTextFile(');
  content = content.replace(/fs\.existsSync\(/g, 'existsSync(');
  
  // Fix path.join -> join
  content = content.replace(/(?:_)?path\.join\(/g, 'join(');
  content = content.replace(/(?:_)?path\.dirname\(/g, 'dirname(');
  content = content.replace(/(?:_)?path\.resolve\(/g, 'resolve(');
  content = content.replace(/(?:_)?path\.basename\(/g, 'basename(');
  
  await Deno.writeTextFile(file, content);
  console.log(`✅ Fixed ${file}`);
}

console.log('🎉 All imports fixed!');
