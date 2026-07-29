import type { SkuLine, Scenario, GrowthModel, Data360Model, AgentforceModel, MuleSoftModel, ServiceMaxModel } from "@/types/deal";

export const pct = (v: number) => Math.max(0, Math.min(100, Number(v) || 0)) / 100;

/** Annualisation multiplier applied to a unit list price for a billing frequency. */
export function billingMultiplier(frequency: string): number {
  switch (frequency) {
    case "Monthly":
      return 12;
    case "One-time":
      return 0; // excluded from ARR, tracked separately as one-time value
    default:
      return 1;
  }
}

/** Contracted term length. SKU list prices in the deal book are stated for the full term. */
export const TERM_YEARS = 3;

export interface LineMath {
  /** Term (3-year) list value as stated on the SKU. */
  listTermValue: number;
  /** Term (3-year) net value after the full discount waterfall. */
  netTermValue: number;
  listArr: number;
  afterLine: number;
  afterCategory: number;
  afterBulk: number;
  afterScenario: number;
  netArr: number;
  oneTimeValue: number;
  y1: number;
  y2: number;
  y3: number;
  tcv: number;
  effectiveDiscountPct: number;
  warnings: string[];

}

const prorationFactor = (line: SkuLine): number => {
  if (line.proration_method === "None" || !line.start_date) return 1;
  const start = new Date(line.start_date);
  if (Number.isNaN(start.getTime())) return 1;
  const yearEnd = new Date(start.getFullYear(), 11, 31);
  const days = Math.max(0, (yearEnd.getTime() - start.getTime()) / 86_400_000);
  return Math.min(1, days / 365);
};

/**
 * Implements the deal document's discount waterfall:
 * List ARR -> Line discount -> Category discount -> Bulk discount -> Strategic override -> Net
 */
export function computeLine(line: SkuLine, scenario?: Pick<Scenario, "scenario_discount_pct" | "bulk_discount_pct" | "strategic_override_pct" | "approval_threshold_pct">): LineMath {
  const warnings: string[] = [];
  const multiplier = billingMultiplier(line.billing_frequency);
  const gross = (Number(line.quantity) || 0) * (Number(line.unit_list_price) || 0);
  // SKU list prices are stated for the full contracted term, so annualise them.
  const listTermValue = gross * multiplier;
  const listArr = listTermValue / TERM_YEARS;
  const oneTimeValue = line.billing_frequency === "One-time" ? gross : 0;

  const lineDisc = line.discountable ? pct(line.line_discount_pct) : 0;
  if (!line.discountable && Number(line.line_discount_pct) > 0) {
    warnings.push("Discount applied to a non-discountable SKU");
  }
  const afterLine = listArr * (1 - lineDisc);
  const afterCategory = afterLine * (1 - pct(line.category_discount_pct));

  const bulkPct = line.bulk_eligible ? pct(scenario?.bulk_discount_pct ?? 0) : 0;
  if (!line.bulk_eligible && (scenario?.bulk_discount_pct ?? 0) > 0) {
    warnings.push("SKU excluded from the additional bulk discount");
  }
  const afterBulk = afterCategory * (1 - bulkPct);
  const afterScenario = afterBulk * (1 - pct(scenario?.scenario_discount_pct ?? 0));
  const netArr = afterScenario * (1 - pct(scenario?.strategic_override_pct ?? 0));
  const netTermValue = netArr * TERM_YEARS;

  const unitNet = listArr > 0 ? netArr / (Number(line.quantity) || 1) : 0;
  const q1 = line.year1_qty ?? line.quantity;
  const q2 = line.year2_qty ?? line.quantity;
  const q3 = line.year3_qty ?? line.quantity;

  const y1 = unitNet * (Number(q1) || 0) * prorationFactor(line);
  const y2 = unitNet * (Number(q2) || 0);
  const y3 = unitNet * (Number(q3) || 0);
  const tcv = y1 + y2 + y3;

  const effectiveDiscountPct = listArr > 0 ? (1 - netArr / listArr) * 100 : 0;

  const threshold = Number(line.approval_threshold_pct) || Number(scenario?.approval_threshold_pct) || 40;
  if (effectiveDiscountPct > threshold) warnings.push(`Effective discount ${effectiveDiscountPct.toFixed(1)}% exceeds the ${threshold}% approval threshold`);
  if (effectiveDiscountPct > (Number(line.max_discount_pct) || 100)) warnings.push("Net price is below the SKU discount floor");

  return { listTermValue, netTermValue, listArr, afterLine, afterCategory, afterBulk, afterScenario, netArr, oneTimeValue, y1, y2, y3, tcv, effectiveDiscountPct, warnings };
}


export interface ScenarioTotals {
  listTermValue: number;
  netTermValue: number;
  listArr: number;
  netArr: number;
  y1: number;
  y2: number;
  y3: number;
  tcv: number;
  effectiveDiscountPct: number;
  lineDiscountValue: number;
  categoryDiscountValue: number;
  bulkDiscountValue: number;
  overrideDiscountValue: number;
  currentAcv: number;
  revisedAcv: number;
  incrementalAcv: number;
  netNewSkus: number;
  rationalizedSkus: number;
  needsSalesforce: number;
  needsSn: number;
  openAssumptions: number;
  warnings: number;
}

export function computeScenario(lines: SkuLine[], scenario?: Scenario): ScenarioTotals {
  const t: ScenarioTotals = {
    listTermValue: 0, netTermValue: 0,
    listArr: 0, netArr: 0, y1: 0, y2: 0, y3: 0, tcv: 0, effectiveDiscountPct: 0,
    lineDiscountValue: 0, categoryDiscountValue: 0, bulkDiscountValue: 0, overrideDiscountValue: 0,
    currentAcv: 0, revisedAcv: 0, incrementalAcv: 0, netNewSkus: 0, rationalizedSkus: 0,
    needsSalesforce: 0, needsSn: 0, openAssumptions: 0, warnings: 0,
  };

  for (const line of lines) {
    const m = computeLine(line, scenario);
    t.listTermValue += m.listTermValue;
    t.netTermValue += m.netTermValue;
    t.listArr += m.listArr;
    t.netArr += m.netArr;
    t.y1 += m.y1;
    t.y2 += m.y2;
    t.y3 += m.y3;
    t.tcv += m.tcv;
    t.lineDiscountValue += m.listArr - m.afterLine;
    t.categoryDiscountValue += m.afterLine - m.afterCategory;
    t.bulkDiscountValue += m.afterCategory - m.afterBulk;
    t.overrideDiscountValue += m.afterBulk - m.netArr;
    if (line.bom_type === "current") t.currentAcv += m.netArr;
    else t.revisedAcv += m.netArr;
    if (line.classification === "Incremental" || line.classification === "Growth") t.netNewSkus += 1;
    if (line.classification === "Retire / rationalize") t.rationalizedSkus += 1;
    if (line.needs_salesforce_confirmation) t.needsSalesforce += 1;
    if (line.needs_sn_confirmation) t.needsSn += 1;
    if (line.approval_status !== "Approved for order form") t.openAssumptions += 1;
    t.warnings += m.warnings.length;
  }
  t.incrementalAcv = t.revisedAcv - t.currentAcv;
  t.effectiveDiscountPct = t.listArr > 0 ? (1 - t.netArr / t.listArr) * 100 : 0;
  return t;
}

/* ---------- Model derivations ---------- */

export function growthFactor(m: GrowthModel): number {
  if (m.growth_case === "conservative") return m.conservative_factor;
  if (m.growth_case === "upside") return m.upside_factor;
  return m.expected_factor;
}

export function revisedUserCount(m: GrowthModel): number {
  const f = growthFactor(m);
  return Math.round(
    m.baseline_users +
      (m.us_ortho_growth + m.international_growth + m.servicemax_increment + m.south_africa_health + m.other_growth) * f -
      m.retired_users,
  );
}

export function growthBridge(m: GrowthModel) {
  const f = growthFactor(m);
  return [
    { label: "Current users", value: m.baseline_users },
    { label: "US Ortho", value: Math.round(m.us_ortho_growth * f) },
    { label: "International", value: Math.round(m.international_growth * f) },
    { label: "ServiceMax", value: Math.round(m.servicemax_increment * f) },
    { label: "South Africa", value: Math.round(m.south_africa_health * f) },
    { label: "Other growth", value: Math.round(m.other_growth * f) },
    { label: "Rationalisation", value: -m.retired_users },
    { label: "Revised quantity", value: revisedUserCount(m) },
  ];
}

export function data360Projection(m: Data360Model) {
  const annualCredits = m.monthly_credits * 12 * (1 + pct(m.buffer_pct));
  const base = annualCredits * m.credit_unit_price;
  const marketing = m.marketing_business_units * m.marketing_bu_price + m.mci_expansion_cost;
  const years = [m.adoption_y1, m.adoption_y2, m.adoption_y3].map((a) => pct(a));
  return {
    annualCredits,
    years: years.map((a, i) => ({
      year: `Year ${i + 1}`,
      data360: base * a,
      marketing: marketing * a,
      credits: annualCredits * a,
      total: (base + marketing) * a,
    })),
    overageRisk: m.buffer_pct < 10 ? "High" : m.buffer_pct < 20 ? "Medium" : "Low",
  };
}

export function agentforceProjection(m: AgentforceModel) {
  const qty = Math.max(0, m.eligible_population - m.excluded_users);
  const perUser = m.addon_unit_price * (1 - pct(m.addon_discount_pct));
  const monthlyCredits = m.cases_per_month * m.actions_per_transaction * m.credits_per_action;
  const annualCredits = monthlyCredits * 12 * (1 + pct(m.buffer_pct));
  const flexAnnualCost = annualCredits * m.credit_unit_price;
  const adoption = [m.adoption_y1, m.adoption_y2, m.adoption_y3].map((a) => pct(a));
  return {
    quantity: qty,
    perUser,
    monthlyCredits,
    annualCredits,
    years: adoption.map((a, i) => ({
      year: `Year ${i + 1}`,
      addon: qty * perUser * a,
      flex: flexAnnualCost * a,
      total: qty * perUser * a + flexAnnualCost * a,
    })),
    consumptionRisk: m.buffer_pct < 15 ? "High" : m.data_ready ? "Low" : "Medium",
  };
}

export function mulesoftProjection(m: MuleSoftModel) {
  const current = m.current_prod_vcores + m.current_preprod_vcores;
  const demandDriven = m.servicemax_growth + m.data_ai_growth + m.order_automation_growth;
  const growthDriven = current * pct(m.transaction_growth_pct);
  const y1 = current + m.y1_increment;
  const y2 = y1 + m.y2_increment;
  const y3 = y2 + m.y3_increment;
  const required = current + demandDriven + growthDriven;
  const headroom = y3 > 0 ? ((y3 - required) / y3) * 100 : 0;
  return {
    current,
    required,
    years: [
      { year: "Year 1", capacity: y1, cost: m.y1_increment * m.vcore_price },
      { year: "Year 2", capacity: y2, cost: m.y2_increment * m.vcore_price },
      { year: "Year 3", capacity: y3, cost: m.y3_increment * m.vcore_price },
    ],
    headroom,
    undersizingRisk: headroom < 0 ? "High" : headroom < 10 ? "Medium" : "Low",
  };
}

export function servicemaxProjection(m: ServiceMaxModel) {
  const incremental = m.full_service_users + m.dispatcher_users + m.internal_support_users;
  const net = m.unit_price * (1 - pct(m.discount_pct));
  const annual = incremental * net;
  const ramp = [0, 0, 0];
  ramp[m.ramp_year - 1] = 1;
  let cumulative = 0;
  const years = ramp.map((r, i) => {
    cumulative = Math.max(cumulative, r);
    return { year: `Year ${i + 1}`, acv: annual * cumulative };
  });
  return { incremental, netUnitPrice: net, annual, years, partnerUsers: m.partner_users, integrationUsers: m.integration_users };
}
