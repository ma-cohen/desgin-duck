import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PROJECT_YAML = `# Project metadata
name: ""
description: ""
`;

const MAIN_YAML = `# main.yaml - User-value requirements
requirements: []
`;

const DERIVED_YAML = `# derived.yaml - Technical/enabling requirements
requirements: []
`;

const FILES = [
  { name: "project.yaml", content: PROJECT_YAML },
  { name: "main.yaml", content: MAIN_YAML },
  { name: "derived.yaml", content: DERIVED_YAML },
] as const;

export function init(targetDir: string = process.cwd()): void {
  const duckDir = join(targetDir, "desgin-duck");
  const reqDir = join(duckDir, "requirements");

  if (process.env.DEBUG) {
    console.error("[design-duck:init] targetDir:", targetDir);
  }

  if (existsSync(reqDir)) {
    console.error("desgin-duck/requirements/ already exists. Aborting init.");
    process.exitCode = 1;
    return;
  }

  mkdirSync(reqDir, { recursive: true });
  console.log("Created desgin-duck/requirements/");

  for (const file of FILES) {
    const filePath = join(reqDir, file.name);
    writeFileSync(filePath, file.content, "utf-8");
    console.log(`  Created desgin-duck/requirements/${file.name}`);
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

  console.log("\nDesign Duck initialized. Start adding requirements to desgin-duck/requirements/main.yaml.");
}
