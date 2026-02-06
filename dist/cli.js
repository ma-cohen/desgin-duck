#!/usr/bin/env bun
// @bun

// src/commands/init.ts
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
var PROJECT_YAML = `# Project metadata
name: ""
description: ""
`;
var MAIN_YAML = `# main.yaml - User-value requirements
requirements: []
`;
var DERIVED_YAML = `# derived.yaml - Technical/enabling requirements
requirements: []
`;
var FILES = [
  { name: "project.yaml", content: PROJECT_YAML },
  { name: "main.yaml", content: MAIN_YAML },
  { name: "derived.yaml", content: DERIVED_YAML }
];
function init(targetDir = process.cwd()) {
  const reqDir = join(targetDir, "requirements");
  if (process.env.DEBUG) {
    console.error("[design-duck:init] targetDir:", targetDir);
  }
  if (existsSync(reqDir)) {
    console.error("requirements/ already exists. Aborting init.");
    process.exitCode = 1;
    return;
  }
  mkdirSync(reqDir, { recursive: true });
  console.log("Created requirements/");
  for (const file of FILES) {
    const filePath = join(reqDir, file.name);
    writeFileSync(filePath, file.content, "utf-8");
    console.log(`  Created requirements/${file.name}`);
  }
  if (!existsSync(join(targetDir, ".git"))) {
    try {
      execSync("git init", { cwd: targetDir, stdio: "pipe" });
      console.log("Initialized git repository.");
    } catch {
      console.warn("Warning: git init failed. Is git installed?");
    }
  } else if (process.env.DEBUG) {
    console.error("[design-duck:init] git repo already exists, skipping git init");
  }
  console.log(`
Design Duck initialized. Start adding requirements to main.yaml.`);
}

// src/cli.ts
var COMMANDS = ["init", "ui", "validate"];
function isCommand(s) {
  return COMMANDS.includes(s);
}
function printUsage() {
  console.error("Usage: design-duck <command>");
  console.error("Commands: init | ui | validate");
  process.exitCode = 1;
}
function cmdInit() {
  init();
}
function cmdUi() {
  console.log("ui: stub \u2013 will start local server and open UI");
}
function cmdValidate() {
  console.log("validate: stub \u2013 will validate requirement files against schema");
}
function main() {
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
if (__require.main == __require.module) {
  main();
}
export {
  COMMANDS
};
