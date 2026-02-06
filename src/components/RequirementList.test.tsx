import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { RequirementList } from "./RequirementList";
import type { MainRequirement } from "../domain/requirements/requirement";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const REQUIREMENTS: MainRequirement[] = [
  {
    id: "req-001",
    description: "Users need to search products",
    userValue: "Reduces time to find products",
    priority: "high",
    status: "draft",
  },
  {
    id: "req-002",
    description: "Users can save wishlists",
    userValue: "Return to considered items",
    priority: "medium",
    status: "review",
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RequirementList", () => {
  // --- Loading state ---

  test("renders loading state", () => {
    const html = renderToString(
      <RequirementList requirements={[]} loading={true} error={null} />,
    );
    expect(html).toContain("requirements-loading");
    expect(html).toContain("Loading requirements");
  });

  test("does not render cards when loading", () => {
    const html = renderToString(
      <RequirementList requirements={REQUIREMENTS} loading={true} error={null} />,
    );
    expect(html).not.toContain("requirement-card-req-001");
  });

  // --- Error state ---

  test("renders error state", () => {
    const html = renderToString(
      <RequirementList requirements={[]} loading={false} error="Network error" />,
    );
    expect(html).toContain("requirements-error");
    expect(html).toContain("Failed to load requirements");
    expect(html).toContain("Network error");
  });

  test("does not render cards when error", () => {
    const html = renderToString(
      <RequirementList
        requirements={REQUIREMENTS}
        loading={false}
        error="Something went wrong"
      />,
    );
    expect(html).not.toContain("requirement-card-req-001");
  });

  // --- Empty state ---

  test("renders empty state when no requirements", () => {
    const html = renderToString(
      <RequirementList requirements={[]} loading={false} error={null} />,
    );
    expect(html).toContain("requirements-empty");
    expect(html).toContain("No requirements found");
    expect(html).toContain("main.yaml");
  });

  // --- Normal rendering ---

  test("renders list container with data-testid", () => {
    const html = renderToString(
      <RequirementList requirements={REQUIREMENTS} loading={false} error={null} />,
    );
    expect(html).toContain("requirements-list");
  });

  test("renders all requirement cards", () => {
    const html = renderToString(
      <RequirementList requirements={REQUIREMENTS} loading={false} error={null} />,
    );
    expect(html).toContain("requirement-card-req-001");
    expect(html).toContain("requirement-card-req-002");
  });

  test("renders requirement descriptions", () => {
    const html = renderToString(
      <RequirementList requirements={REQUIREMENTS} loading={false} error={null} />,
    );
    expect(html).toContain("Users need to search products");
    expect(html).toContain("Users can save wishlists");
  });

  test("renders priority badges for each card", () => {
    const html = renderToString(
      <RequirementList requirements={REQUIREMENTS} loading={false} error={null} />,
    );
    expect(html).toContain("priority-badge-req-001");
    expect(html).toContain("priority-badge-req-002");
  });

  test("renders status badges for each card", () => {
    const html = renderToString(
      <RequirementList requirements={REQUIREMENTS} loading={false} error={null} />,
    );
    expect(html).toContain("status-badge-req-001");
    expect(html).toContain("status-badge-req-002");
  });

  test("renders single requirement", () => {
    const html = renderToString(
      <RequirementList
        requirements={[REQUIREMENTS[0]]}
        loading={false}
        error={null}
      />,
    );
    expect(html).toContain("requirement-card-req-001");
    expect(html).not.toContain("requirement-card-req-002");
  });
});
