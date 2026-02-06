import { describe, expect, test } from "bun:test";

import { COMMANDS } from "./cli";

describe("cli", () => {
  test("COMMANDS include init, ui, validate", () => {
    expect(COMMANDS).toContain("init");
    expect(COMMANDS).toContain("ui");
    expect(COMMANDS).toContain("validate");
  });
});
