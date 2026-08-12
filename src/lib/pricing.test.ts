import { describe, it, expect } from "vitest";
import {
  computeLine,
  computeScenario,
  billingMultiplier,
  TERM_YEARS,
  agentforceProjection,
  data360Projection,
  mulesoftProjection,
  servicemaxProjection,
  growthBridge,
  revisedUserCount,
} from "@/lib/pricing";
import type { Scenario, SkuLine } from "@/types/deal";

const line = (over: Partial<SkuLine> = {}): SkuLine =>
  ({
    id: "l1",
    scenario_id: "s1",
    tower_key: "core",
    sku_code: "SKU-1",
    sku_name: "Sales Cloud",
    description: null,
    product_family: null,
    product_category: null,
    cloud: null,
    classification: "Current baseline",
    bom_type: "revised",
    quantity: 100,
    unit_of_measure: "User",
    unit_list_price: 900,
    billing_frequency: "Annual",
    line_discount_pct: 0,
    category_discount_pct: 0,
    bulk_eligible: true,
    discountable: true,
    max_discount_pct: 60,
    approval_threshold_pct: 40,
    discount_reason: null,
    year1_qty: null,
    year2_qty: null,
    year3_qty: null,
    start_date: null,
    end_date: null,
    coterm_date: null,
    proration_method: "None",
    approval_status: "Draft",
    assumption_owner: null,
    needs_salesforce_confirmation: false,
    needs_sn_confirmation: false,
    notes: null,
    source_tab: null,
    source_file: null,
    ...over,
  }) as unknown as SkuLine;

const scenario = (over: Partial<Scenario> = {}): Scenario =>
  ({
    id: "s1",
    deal_id: "d1",
    name: "Test",
    description: null,
    status: "Draft",
    owner_name: null,
    owner_id: null,
    is_locked: false,
    is_baseline: false,
    is_recommended: false,
    notes: null,
    currency: "USD",
    contract_start: null,
    contract_end: null,
    scenario_discount_pct: 0,
    bulk_discount_pct: 0,
    bulk_discount_mode: "recurring",
    strategic_override_pct: 0,
    approval_threshold_pct: 40,
    sort_order: 0,
    ...over,
  }) as unknown as Scenario;

describe("billing frequency handling", () => {
  it("annualises monthly prices and excludes one-time from ARR", () => {
    expect(billingMultiplier("Annual")).toBe(1);
    expect(billingMultiplier("Monthly")).toBe(12);
    expect(billingMultiplier("One-time")).toBe(0);
  });

  it("tracks one-time value separately with zero ARR", () => {
    const m = computeLine(line({ billing_frequency: "One-time", quantity: 2, unit_list_price: 5000 }));
    expect(m.listArr).toBe(0);
    expect(m.netArr).toBe(0);
    expect(m.oneTimeValue).toBe(10_000);
  });
});

describe("term vs annual value", () => {
  it("treats list price as the 3-year term value", () => {
    const m = computeLine(line({ quantity: 100, unit_list_price: 900 }));
    expect(m.listTermValue).toBe(90_000);
    expect(m.listArr).toBeCloseTo(30_000, 6);
    expect(TERM_YEARS).toBe(3);
  });

  it("keeps net term value = net ARR x 3", () => {
    const m = computeLine(line({ line_discount_pct: 10 }), scenario());
    expect(m.netTermValue).toBeCloseTo(m.netArr * 3, 6);
    expect(m.netTermValue).toBeCloseTo(81_000, 6);
  });
});

describe("discount waterfall order", () => {
  it("compounds line, category, bulk, scenario and override multiplicatively", () => {
    const m = computeLine(
      line({ line_discount_pct: 10, category_discount_pct: 5 }),
      scenario({ bulk_discount_pct: 4, scenario_discount_pct: 3, strategic_override_pct: 2 }),
    );
    const listArr = 30_000;
    expect(m.afterLine).toBeCloseTo(listArr * 0.9, 6);
    expect(m.afterCategory).toBeCloseTo(listArr * 0.9 * 0.95, 6);
    expect(m.afterBulk).toBeCloseTo(listArr * 0.9 * 0.95 * 0.96, 6);
    expect(m.afterScenario).toBeCloseTo(listArr * 0.9 * 0.95 * 0.96 * 0.97, 6);
    expect(m.netArr).toBeCloseTo(listArr * 0.9 * 0.95 * 0.96 * 0.97 * 0.98, 6);
    expect(m.effectiveDiscountPct).toBeCloseTo((1 - m.netArr / listArr) * 100, 6);
    // compounded, not additive (24% would be additive)
    expect(m.effectiveDiscountPct).toBeLessThan(24);
    expect(m.effectiveDiscountPct).toBeGreaterThan(21);
  });

  it("changing a lever moves net value in the right direction", () => {
    const before = computeLine(line(), scenario({ scenario_discount_pct: 0 }));
    const after = computeLine(line(), scenario({ scenario_discount_pct: 15 }));
    expect(after.netArr).toBeCloseTo(before.netArr * 0.85, 6);
    expect(after.effectiveDiscountPct).toBeCloseTo(15, 6);
  });

  it("clamps out-of-range percentages", () => {
    expect(computeLine(line({ line_discount_pct: 150 })).netArr).toBe(0);
    expect(computeLine(line({ line_discount_pct: -20 })).netArr).toBeCloseTo(30_000, 6);
  });
});

describe("eligibility flags", () => {
  it("ignores line discount on non-discountable SKUs and warns", () => {
    const m = computeLine(line({ discountable: false, line_discount_pct: 20 }));
    expect(m.netArr).toBeCloseTo(30_000, 6);
    expect(m.warnings.join(" ")).toMatch(/non-discountable/i);
  });

  it("excludes bulk-ineligible SKUs from bulk discount and warns", () => {
    const m = computeLine(line({ bulk_eligible: false }), scenario({ bulk_discount_pct: 10 }));
    expect(m.netArr).toBeCloseTo(30_000, 6);
    expect(m.warnings.join(" ")).toMatch(/bulk/i);
  });
});

describe("approval thresholds and floors", () => {
  it("flags breaches of the approval threshold", () => {
    const m = computeLine(line({ line_discount_pct: 50, approval_threshold_pct: 40 }));
    expect(m.warnings.some((w) => /approval threshold/.test(w))).toBe(true);
  });

  it("flags discounts below the SKU floor", () => {
    const m = computeLine(line({ line_discount_pct: 70, max_discount_pct: 60 }));
    expect(m.warnings.some((w) => /floor/.test(w))).toBe(true);
  });

  it("stays clean inside policy", () => {
    expect(computeLine(line({ line_discount_pct: 20 })).warnings).toHaveLength(0);
  });
});

describe("multi-year quantities, TCV and proration", () => {
  it("uses per-year quantities for the TCV ramp", () => {
    const m = computeLine(line({ quantity: 100, year1_qty: 100, year2_qty: 120, year3_qty: 150 }));
    const unitNet = 30_000 / 100;
    expect(m.y1).toBeCloseTo(unitNet * 100, 6);
    expect(m.y2).toBeCloseTo(unitNet * 120, 6);
    expect(m.y3).toBeCloseTo(unitNet * 150, 6);
    expect(m.tcv).toBeCloseTo(m.y1 + m.y2 + m.y3, 6);
  });

  it("falls back to flat quantity so TCV equals net term value", () => {
    const m = computeLine(line(), scenario({ scenario_discount_pct: 12 }));
    expect(m.tcv).toBeCloseTo(m.netTermValue, 4);
  });

  it("prorates year 1 when a mid-year start date is set", () => {
    const m = computeLine(line({ proration_method: "Daily", start_date: "2026-07-01" }));
    expect(m.y1).toBeLessThan(m.y2);
    expect(m.y1 / m.y2).toBeLessThan(0.6);
    expect(m.y1 / m.y2).toBeGreaterThan(0.4);
  });
});

describe("scenario aggregation", () => {
  const lines = [
    line({ id: "a", quantity: 100, unit_list_price: 900, line_discount_pct: 10, bom_type: "revised", classification: "Growth" }),
    line({ id: "b", quantity: 50, unit_list_price: 600, bom_type: "current", classification: "Current baseline" }),
    line({ id: "c", quantity: 10, unit_list_price: 3000, bom_type: "revised", classification: "Retire / rationalize", needs_salesforce_confirmation: true }),
  ];
  const s = scenario({ bulk_discount_pct: 5, scenario_discount_pct: 2 });

  it("totals equal the sum of line math", () => {
    const t = computeScenario(lines, s);
    const sum = lines.map((l) => computeLine(l, s));
    expect(t.listArr).toBeCloseTo(sum.reduce((a, m) => a + m.listArr, 0), 6);
    expect(t.netArr).toBeCloseTo(sum.reduce((a, m) => a + m.netArr, 0), 6);
    expect(t.tcv).toBeCloseTo(sum.reduce((a, m) => a + m.tcv, 0), 6);
    expect(t.netTermValue).toBeCloseTo(t.netArr * 3, 4);
  });

  it("reconciles discount buckets against list minus net", () => {
    const t = computeScenario(lines, s);
    const buckets = t.lineDiscountValue + t.categoryDiscountValue + t.bulkDiscountValue + t.overrideDiscountValue;
    expect(buckets).toBeCloseTo(t.listArr - t.netArr, 4);
  });

  it("splits current vs revised ACV and counts flags", () => {
    const t = computeScenario(lines, s);
    expect(t.currentAcv).toBeGreaterThan(0);
    expect(t.revisedAcv).toBeGreaterThan(0);
    expect(t.incrementalAcv).toBeCloseTo(t.revisedAcv - t.currentAcv, 6);
    expect(t.netNewSkus).toBe(1);
    expect(t.rationalizedSkus).toBe(1);
    expect(t.needsSalesforce).toBe(1);
    expect(t.openAssumptions).toBe(3);
  });

  it("handles an empty scenario without dividing by zero", () => {
    const t = computeScenario([], s);
    expect(t.effectiveDiscountPct).toBe(0);
    expect(t.netArr).toBe(0);
  });
});

describe("model projections", () => {
  it("growth bridge sums to the revised user count", () => {
    const m = {
      growth_case: "expected",
      conservative_factor: 0.5,
      expected_factor: 1,
      upside_factor: 1.5,
      baseline_users: 1000,
      us_ortho_growth: 100,
      international_growth: 50,
      servicemax_increment: 30,
      south_africa_health: 20,
      other_growth: 10,
      retired_users: 60,
    } as never;
    const bridge = growthBridge(m);
    const parts = bridge.slice(0, -1).reduce((a, b) => a + b.value, 0);
    expect(bridge[bridge.length - 1].value).toBe(revisedUserCount(m));
    expect(parts).toBe(revisedUserCount(m));
  });

  it("data 360 applies buffer and adoption ramp", () => {
    const p = data360Projection({
      monthly_credits: 1000,
      buffer_pct: 20,
      credit_unit_price: 2,
      marketing_business_units: 1,
      marketing_bu_price: 10_000,
      mci_expansion_cost: 5_000,
      adoption_y1: 50,
      adoption_y2: 100,
      adoption_y3: 100,
    } as never);
    expect(p.annualCredits).toBeCloseTo(14_400, 6);
    expect(p.years[0].total).toBeCloseTo(p.years[1].total / 2, 6);
    expect(p.overageRisk).toBe("Low");
  });

  it("agentforce nets add-on price and scales credits", () => {
    const p = agentforceProjection({
      eligible_population: 1000,
      excluded_users: 100,
      addon_unit_price: 500,
      addon_discount_pct: 10,
      cases_per_month: 1000,
      actions_per_transaction: 2,
      credits_per_action: 3,
      buffer_pct: 20,
      credit_unit_price: 0.1,
      adoption_y1: 100,
      adoption_y2: 100,
      adoption_y3: 100,
      data_ready: true,
    } as never);
    expect(p.quantity).toBe(900);
    expect(p.perUser).toBeCloseTo(450, 6);
    expect(p.monthlyCredits).toBe(6000);
    expect(p.annualCredits).toBeCloseTo(86_400, 6);
    expect(p.years[0].addon).toBeCloseTo(405_000, 6);
  });

  it("mulesoft flags undersizing when headroom is negative", () => {
    const p = mulesoftProjection({
      current_prod_vcores: 10,
      current_preprod_vcores: 5,
      servicemax_growth: 5,
      data_ai_growth: 5,
      order_automation_growth: 5,
      transaction_growth_pct: 20,
      y1_increment: 1,
      y2_increment: 1,
      y3_increment: 1,
      vcore_price: 10_000,
    } as never);
    expect(p.current).toBe(15);
    expect(p.years[2].capacity).toBe(18);
    expect(p.headroom).toBeLessThan(0);
    expect(p.undersizingRisk).toBe("High");
  });

  it("servicemax ramps ACV from the chosen year", () => {
    const p = servicemaxProjection({
      full_service_users: 50,
      dispatcher_users: 10,
      internal_support_users: 5,
      partner_users: 3,
      integration_users: 2,
      unit_price: 1000,
      discount_pct: 20,
      ramp_year: 2,
    } as never);
    expect(p.incremental).toBe(65);
    expect(p.netUnitPrice).toBeCloseTo(800, 6);
    expect(p.annual).toBeCloseTo(52_000, 6);
    expect(p.years[0].acv).toBe(0);
    expect(p.years[1].acv).toBeCloseTo(52_000, 6);
    expect(p.years[2].acv).toBeCloseTo(52_000, 6);
  });
});
