import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { RequirementCard } from "./RequirementCard";
import type { MainRequirement } from "../domain/requirements/requirement";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const HIGH_DRAFT: MainRequirement = {
  id: "req-001",
  description: "Users need to search products",
  userValue: "Reduces time to find products",
  priority: "high",
  status: "draft",
};

const MEDIUM_REVIEW: MainRequirement = {
  id: "req-002",
  description: "Users can save wishlists",
  userValue: "Return to considered items",
  priority: "medium",
  status: "review",
};

const LOW_APPROVED: MainRequirement = {
  id: "req-003",
  description: "Users can export orders",
  userValue: "Keep records of purchases",
  priority: "low",
  status: "approved",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RequirementCard", () => {
  test("renders requirement id", () => {
    const html = renderToString(<RequirementCard requirement={HIGH_DRAFT} />);
    expect(html).toContain("req-001");
  });

  test("renders requirement description", () => {
    const html = renderToString(<RequirementCard requirement={HIGH_DRAFT} />);
    expect(html).toContain("Users need to search products");
  });

  test("renders user value", () => {
    const html = renderToString(<RequirementCard requirement={HIGH_DRAFT} />);
    expect(html).toContain("Reduces time to find products");
  });

  test("renders priority badge with correct text", () => {
    const html = renderToString(<RequirementCard requirement={HIGH_DRAFT} />);
    expect(html).toContain("high");
    expect(html).toContain("priority-badge-req-001");
  });

  test("renders status badge with correct text", () => {
    const html = renderToString(<RequirementCard requirement={HIGH_DRAFT} />);
    expect(html).toContain("draft");
    expect(html).toContain("status-badge-req-001");
  });

  test("renders data-testid with requirement id", () => {
    const html = renderToString(<RequirementCard requirement={HIGH_DRAFT} />);
    expect(html).toContain("requirement-card-req-001");
  });

  test("applies high priority styling", () => {
    const html = renderToString(<RequirementCard requirement={HIGH_DRAFT} />);
    expect(html).toContain("bg-red-100");
    expect(html).toContain("text-red-800");
  });

  test("applies medium priority styling", () => {
    const html = renderToString(<RequirementCard requirement={MEDIUM_REVIEW} />);
    expect(html).toContain("bg-yellow-100");
    expect(html).toContain("text-yellow-800");
  });

  test("applies low priority styling", () => {
    const html = renderToString(<RequirementCard requirement={LOW_APPROVED} />);
    expect(html).toContain("bg-green-100");
    expect(html).toContain("text-green-800");
  });

  test("applies draft status styling", () => {
    const html = renderToString(<RequirementCard requirement={HIGH_DRAFT} />);
    expect(html).toContain("bg-gray-100");
    expect(html).toContain("text-gray-700");
  });

  test("applies review status styling", () => {
    const html = renderToString(<RequirementCard requirement={MEDIUM_REVIEW} />);
    expect(html).toContain("bg-blue-100");
    expect(html).toContain("text-blue-800");
  });

  test("applies approved status styling", () => {
    const html = renderToString(<RequirementCard requirement={LOW_APPROVED} />);
    expect(html).toContain("bg-emerald-100");
    expect(html).toContain("text-emerald-800");
  });
});
