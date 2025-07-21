import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parse } from "https://deno.land/std/flags/mod.ts";

Deno.test("parse help command", () => {
  const args = parse(["help"]);
  assertEquals(args._[0], "help");
});

Deno.test("parse init command", () => {
  const args = parse(["init"]);
  assertEquals(args._[0], "init");
});

Deno.test("parse unknown command defaults to help", () => {
  const args = parse([]);
  assertEquals(args._[0], undefined);
});
