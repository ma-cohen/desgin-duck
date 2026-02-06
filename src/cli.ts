#!/usr/bin/env bun
/**
 * Design Duck CLI – requirements gathering and management.
 * Commands: init | ui | validate
 */

import { init } from "./commands/init";

export const COMMANDS = ["init", "ui", "validate"] as const;
type Command = (typeof COMMANDS)[number];

function isCommand(s: string): s is Command {
  return COMMANDS.includes(s as Command);
}

function printUsage(): void {
  console.error("Usage: design-duck <command>");
  console.error("Commands: init | ui | validate");
  process.exitCode = 1;
}

function cmdInit(): void {
  init();
}

function cmdUi(): void {
  console.log("ui: stub – will start local server and open UI");
}

function cmdValidate(): void {
  console.log("validate: stub – will validate requirement files against schema");
}

function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || !isCommand(command)) {
    printUsage();
    return;
  }

  if (process.env.DEBUG) {
    console.error("[design-duck] command:", command);
  }

  switch (command) {
    case "init":
      cmdInit();
      break;
    case "ui":
      cmdUi();
      break;
    case "validate":
      cmdValidate();
      break;
  }
}

if (import.meta.main) {
  main();
}
