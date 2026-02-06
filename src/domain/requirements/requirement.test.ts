import { describe, expect, test } from "bun:test";
import {
  validateMainRequirement,
  validateDerivedRequirement,
  assertMainRequirement,
  assertDerivedRequirement,
} from "./requirement";

describe("validateMainRequirement", () => {
  test("accepts valid main requirement", () => {
    const r = {
      id: "req-001",
      description: "Users need to search by partial names",
      userValue: "Reduces time to find products",
      priority: "high",
      status: "draft",
    };
    expect(validateMainRequirement(r)).toEqual({ valid: true });
  });

  test("rejects non-object", () => {
    expect(validateMainRequirement(null)).toEqual({
      valid: false,
      errors: ["Requirement must be an object"],
    });
    expect(validateMainRequirement("x")).toEqual({
      valid: false,
      errors: ["Requirement must be an object"],
    });
  });

  test("rejects missing or invalid id", () => {
    expect(validateMainRequirement({ id: "" })).toEqual({
      valid: false,
      errors: expect.arrayContaining([expect.stringContaining("id")]),
    });
    expect(validateMainRequirement({ id: "  " })).toEqual({
      valid: false,
      errors: expect.arrayContaining([expect.stringContaining("id")]),
    });
  });

  test("rejects invalid priority", () => {
    const r = {
      id: "req-001",
      description: "x",
      userValue: "y",
      priority: "critical",
      status: "draft",
    };
    const out = validateMainRequirement(r);
    expect(out.valid).toBe(false);
    expect((out as { errors: string[] }).errors).toEqual(
      expect.arrayContaining([expect.stringContaining("priority")]),
    );
  });

  test("rejects invalid status", () => {
    const r = {
      id: "req-001",
      description: "x",
      userValue: "y",
      priority: "high",
      status: "done",
    };
    const out = validateMainRequirement(r);
    expect(out.valid).toBe(false);
    expect((out as { errors: string[] }).errors).toEqual(
      expect.arrayContaining([expect.stringContaining("status")]),
    );
  });
});

describe("validateDerivedRequirement", () => {
  test("accepts valid derived requirement", () => {
    const r = {
      id: "der-001",
      description: "Use Elasticsearch for search",
      derivedFrom: ["req-001"],
      rationale: "Enables sub-200ms search",
      category: "technical",
      priority: "high",
      status: "draft",
    };
    expect(validateDerivedRequirement(r)).toEqual({ valid: true });
  });

  test("rejects non-object", () => {
    expect(validateDerivedRequirement(null)).toEqual({
      valid: false,
      errors: ["Requirement must be an object"],
    });
  });

  test("rejects invalid derivedFrom", () => {
    const r = {
      id: "der-001",
      description: "x",
      derivedFrom: ["req-001", ""],
      rationale: "y",
      category: "technical",
      priority: "high",
      status: "draft",
    };
    const out = validateDerivedRequirement(r);
    expect(out.valid).toBe(false);
    expect((out as { errors: string[] }).errors).toEqual(
      expect.arrayContaining([expect.stringContaining("derivedFrom")]),
    );
  });

  test("rejects invalid category", () => {
    const r = {
      id: "der-001",
      description: "x",
      derivedFrom: ["req-001"],
      rationale: "y",
      category: "other",
      priority: "high",
      status: "draft",
    };
    const out = validateDerivedRequirement(r);
    expect(out.valid).toBe(false);
    expect((out as { errors: string[] }).errors).toEqual(
      expect.arrayContaining([expect.stringContaining("category")]),
    );
  });
});

describe("assertMainRequirement", () => {
  test("does not throw for valid requirement", () => {
    const r = {
      id: "req-001",
      description: "x",
      userValue: "y",
      priority: "high",
      status: "draft",
    };
    expect(() => assertMainRequirement(r)).not.toThrow();
  });

  test("throws for invalid requirement", () => {
    expect(() => assertMainRequirement({ id: "" })).toThrow(
      /Invalid main requirement/,
    );
  });
});

describe("assertDerivedRequirement", () => {
  test("does not throw for valid requirement", () => {
    const r = {
      id: "der-001",
      description: "x",
      derivedFrom: ["req-001"],
      rationale: "y",
      category: "technical",
      priority: "high",
      status: "draft",
    };
    expect(() => assertDerivedRequirement(r)).not.toThrow();
  });

  test("throws for invalid requirement", () => {
    expect(() => assertDerivedRequirement({ id: "" })).toThrow(
      /Invalid derived requirement/,
    );
  });
});
