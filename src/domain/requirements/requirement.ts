/**
 * Requirement domain types and validation (main + derived).
 * Aligns with requirements/main.yaml and requirements/derived.yaml structure.
 */

export const PRIORITIES = ["high", "medium", "low"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const STATUSES = ["draft", "review", "approved"] as const;
export type Status = (typeof STATUSES)[number];

export const DERIVED_CATEGORIES = [
  "technical",
  "operational",
  "quality",
  "constraint",
] as const;
export type DerivedCategory = (typeof DERIVED_CATEGORIES)[number];

/** User-value requirement (main.yaml). */
export interface MainRequirement {
  id: string;
  description: string;
  userValue: string;
  priority: Priority;
  status: Status;
}

/** Technical/enabling requirement (derived.yaml). */
export interface DerivedRequirement {
  id: string;
  description: string;
  derivedFrom: string[];
  rationale: string;
  category: DerivedCategory;
  priority: Priority;
  status: Status;
}

export type ValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] };

function nonEmptyString(value: unknown, field: string): string | null {
  if (typeof value !== "string" || value.trim() === "") {
    return `${field} must be a non-empty string`;
  }
  return null;
}

function oneOf<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
): string | null {
  if (typeof value !== "string") {
    return `${field} must be a string`;
  }
  if (!allowed.includes(value as T)) {
    return `${field} must be one of: ${allowed.join(", ")}`;
  }
  return null;
}

function stringArray(value: unknown, field: string): string | null {
  if (!Array.isArray(value)) {
    return `${field} must be an array`;
  }
  const bad = value.some(
    (v) => typeof v !== "string" || (v as string).trim() === "",
  );
  if (bad) {
    return `${field} must be an array of non-empty strings`;
  }
  return null;
}

/**
 * Validates a main (user-value) requirement.
 */
export function validateMainRequirement(
  raw: unknown,
): ValidationResult {
  if (raw === null || typeof raw !== "object") {
    return { valid: false, errors: ["Requirement must be an object"] };
  }
  const o = raw as Record<string, unknown>;
  const errors: string[] = [];

  const idErr = nonEmptyString(o.id, "id");
  if (idErr) errors.push(idErr);
  const descErr = nonEmptyString(o.description, "description");
  if (descErr) errors.push(descErr);
  const uvErr = nonEmptyString(o.userValue, "userValue");
  if (uvErr) errors.push(uvErr);
  const priErr = oneOf(o.priority, "priority", PRIORITIES);
  if (priErr) errors.push(priErr);
  const statusErr = oneOf(o.status, "status", STATUSES);
  if (statusErr) errors.push(statusErr);

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return { valid: true };
}

/**
 * Validates a derived (technical/enabling) requirement.
 */
export function validateDerivedRequirement(
  raw: unknown,
): ValidationResult {
  if (raw === null || typeof raw !== "object") {
    return { valid: false, errors: ["Requirement must be an object"] };
  }
  const o = raw as Record<string, unknown>;
  const errors: string[] = [];

  const idErr = nonEmptyString(o.id, "id");
  if (idErr) errors.push(idErr);
  const descErr = nonEmptyString(o.description, "description");
  if (descErr) errors.push(descErr);
  const dfErr = stringArray(o.derivedFrom, "derivedFrom");
  if (dfErr) errors.push(dfErr);
  const ratErr = nonEmptyString(o.rationale, "rationale");
  if (ratErr) errors.push(ratErr);
  const catErr = oneOf(o.category, "category", DERIVED_CATEGORIES);
  if (catErr) errors.push(catErr);
  const priErr = oneOf(o.priority, "priority", PRIORITIES);
  if (priErr) errors.push(priErr);
  const statusErr = oneOf(o.status, "status", STATUSES);
  if (statusErr) errors.push(statusErr);

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return { valid: true };
}

/**
 * Asserts that a value is a valid MainRequirement; throws with errors if not.
 */
export function assertMainRequirement(raw: unknown): asserts raw is MainRequirement {
  const result = validateMainRequirement(raw);
  if (!result.valid) {
    throw new Error(`Invalid main requirement: ${result.errors.join("; ")}`);
  }
}

/**
 * Asserts that a value is a valid DerivedRequirement; throws with errors if not.
 */
export function assertDerivedRequirement(raw: unknown): asserts raw is DerivedRequirement {
  const result = validateDerivedRequirement(raw);
  if (!result.valid) {
    throw new Error(`Invalid derived requirement: ${result.errors.join("; ")}`);
  }
}
