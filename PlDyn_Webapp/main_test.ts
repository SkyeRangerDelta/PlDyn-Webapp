import { assertSpyCall, spy } from "@std/testing/mock";
import { start } from "./main.ts";

Deno.test("start function spawns a child process", () => {
  const commandSpy = spy(Deno, "Command");

  try {
    start();
    assertSpyCall(commandSpy, 0, {
      args: [ ],
    });
  } finally {
    commandSpy.restore();
  }
});
