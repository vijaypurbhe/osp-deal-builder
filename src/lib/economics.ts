/**
 * Platform commercial logic — customer agnostic.
 *
 * Everything in this module is methodology: OSP buy/sell economics, layered
 * BOM separation, services attach, Innovation Fund, competitive displacement,
 * marketplace routing and the deal health score. No customer-specific values
 * live here; they all arrive as arguments.
 */
import { computeLine, computeScenario, TERM_YEARS, pct } from "@/lib/pricing";
import type {
  Deal,
  IncumbentPlatform,
  InnovationFund,
  MarketplaceModel,
  Scenario,
  ServicesConstruct,
  SkuLine,
  ValidationItem,
  ValueLever,
} from "@/types/deal";

export const LAYER_LABEL: Record<string, string> = {
  A: "Layer A — protected estate",
  B: "Layer B — committed growth",
  C: "Layer C — future transformation",
};

export interface LayerTotals {
  layer: string;
  label: string;
  lines: number;
  listArr: number;
  netArr: number;
  netTermValue: number;
  acquisitionArr: number;
  gp: number;
  gmPct: number;
}

/** Salesforce acquisition (buy) cost of a line, annualised on the term basis. */
export function acquisitionArr(line: SkuLine): number {
  const qty = Number(line.quantity) || 0;
  const acq = Number(line.acquisition_unit_price) || 0;
  return (qty * acq) / TERM_YEARS;
}

export interface LicenseEconomics {
  listArr: number;
  netArr: number;
  netTermValue: number;
  acquisitionArr: number;
  acquisitionTermValue: number;
  licenseGp: number;
  licenseGpTerm: number;
  licenseGmPct: number;
  linesWithoutCost: number;
  belowFloorLines: number;
  layers: LayerTotals[];
}

/** Buy/sell economics for a set of lines under a scenario posture. */
export function licenseEconomics(lines: SkuLine[], scenario?: Scenario, minGmPct = 5): LicenseEconomics {
  const byLayer = new Map<string, LayerTotals>();
  let listArr = 0;
  let netArr = 0;
  let acqArr = 0;
  let linesWithoutCost = 0;
  let belowFloorLines = 0;

  for (const line of lines) {
    const m = computeLine(line, scenario);
    const acq = acquisitionArr(line);
    if (acq <= 0) linesWithoutCost += 1;
    else if (m.netArr > 0 && ((m.netArr - acq) / m.netArr) * 100 < minGmPct) belowFloorLines += 1;

    listArr += m.listArr;
    netArr += m.netArr;
    acqArr += acq;

    const key = (line.commercial_layer || "A").toUpperCase();
    const bucket =
      byLayer.get(key) ??
      { layer: key, label: LAYER_LABEL[key] ?? key, lines: 0, listArr: 0, netArr: 0, netTermValue: 0, acquisitionArr: 0, gp: 0, gmPct: 0 };
    bucket.lines += 1;
    bucket.listArr += m.listArr;
    bucket.netArr += m.netArr;
    bucket.netTermValue += m.netTermValue;
    bucket.acquisitionArr += acq;
    byLayer.set(key, bucket);
  }

  const layers = ["A", "B", "C"].map(
    (k) => byLayer.get(k) ?? { layer: k, label: LAYER_LABEL[k], lines: 0, listArr: 0, netArr: 0, netTermValue: 0, acquisitionArr: 0, gp: 0, gmPct: 0 },
  );
  for (const l of layers) {
    l.gp = l.netArr - l.acquisitionArr;
    l.gmPct = l.netArr > 0 ? (l.gp / l.netArr) * 100 : 0;
  }

  const licenseGp = netArr - acqArr;
  return {
    listArr,
    netArr,
    netTermValue: netArr * TERM_YEARS,
    acquisitionArr: acqArr,
    acquisitionTermValue: acqArr * TERM_YEARS,
    licenseGp,
    licenseGpTerm: licenseGp * TERM_YEARS,
    licenseGmPct: netArr > 0 ? (licenseGp / netArr) * 100 : 0,
    linesWithoutCost,
    belowFloorLines,
    layers,
  };
}

export interface ServicesEconomics {
  annualFee: number;
  annualCost: number;
  annualGp: number;
  gmPct: number;
  years: number;
  termFee: number;
  termCost: number;
  termGp: number;
  implementationGp: number;
  attachPct: number;
}

export function servicesEconomics(construct: ServicesConstruct | null | undefined, licenseNetArr = 0): ServicesEconomics {
  const annualFee = Number(construct?.annual_fee) || 0;
  const annualCost = Number(construct?.annual_cost) || 0;
  const years = Number(construct?.years) || TERM_YEARS;
  const implGp = (Number(construct?.implementation_fee) || 0) - (Number(construct?.implementation_cost) || 0);
  const annualGp = annualFee - annualCost;
  return {
    annualFee,
    annualCost,
    annualGp,
    gmPct: annualFee > 0 ? (annualGp / annualFee) * 100 : 0,
    years,
    termFee: annualFee * years + (Number(construct?.implementation_fee) || 0),
    termCost: annualCost * years + (Number(construct?.implementation_cost) || 0),
    termGp: annualGp * years + implGp,
    implementationGp: implGp,
    attachPct: licenseNetArr > 0 ? (annualFee / licenseNetArr) * 100 : 0,
  };
}

export interface FundEconomics {
  total: number;
  salesforceFunded: number;
  techmFunded: number;
  customerFunded: number;
  consumed: number;
  available: number;
  drawdown: { year: string; value: number }[];
  pctOfTcv: number;
}

export function fundEconomics(fund: InnovationFund | null | undefined, licenseTermValue = 0): FundEconomics {
  const total = Number(fund?.total_fund) || 0;
  const consumed = Number(fund?.consumed) || 0;
  return {
    total,
    salesforceFunded: Number(fund?.salesforce_funded) || 0,
    techmFunded: Number(fund?.techm_funded) || 0,
    customerFunded: Number(fund?.customer_funded) || 0,
    consumed,
    available: Math.max(0, total - consumed),
    drawdown: [
      { year: "Year 1", value: Number(fund?.drawdown_y1) || 0 },
      { year: "Year 2", value: Number(fund?.drawdown_y2) || 0 },
      { year: "Year 3", value: Number(fund?.drawdown_y3) || 0 },
    ],
    pctOfTcv: licenseTermValue > 0 ? (total / licenseTermValue) * 100 : 0,
  };
}

export interface DisplacementMath {
  incumbentAnnual: number;
  replacementAnnual: number;
  annualSaving: number;
  savingPct: number;
  oneTimeCost: number;
  termSaving: number;
  paybackMonths: number;
  incrementalSalesforceAcv: number;
}

export function displacementMath(row: IncumbentPlatform): DisplacementMath {
  const incumbentAnnual = (Number(row.annual_license_spend) || 0) + (Number(row.annual_services_spend) || 0);
  const replacementAnnual = (Number(row.replacement_annual_license_cost) || 0) + (Number(row.replacement_managed_services_cost) || 0);
  const oneTimeCost = Number(row.replacement_implementation_cost) || 0;
  const annualSaving = incumbentAnnual - replacementAnnual;
  return {
    incumbentAnnual,
    replacementAnnual,
    annualSaving,
    savingPct: incumbentAnnual > 0 ? (annualSaving / incumbentAnnual) * 100 : 0,
    oneTimeCost,
    termSaving: annualSaving * TERM_YEARS - oneTimeCost,
    paybackMonths: annualSaving > 0 ? (oneTimeCost / annualSaving) * 12 : 0,
    incrementalSalesforceAcv: Number(row.replacement_annual_license_cost) || 0,
  };
}

export interface MarketplaceMath {
  routedTermValue: number;
  fee: number;
  netToSalesforce: number;
  commitmentDrawdown: number;
  commitmentAfter: number;
  coversRouted: boolean;
}

export function marketplaceMath(model: MarketplaceModel | null | undefined, licenseTermValue: number): MarketplaceMath {
  const enabled = !!model?.is_enabled;
  const routed = enabled ? licenseTermValue * pct(Number(model?.drawdown_pct) || 0) : 0;
  const fee = routed * pct(Number(model?.marketplace_fee_pct) || 0);
  const remaining = Number(model?.commitment_remaining) || 0;
  const drawdown = Math.min(routed, remaining);
  return {
    routedTermValue: routed,
    fee,
    netToSalesforce: routed - fee,
    commitmentDrawdown: drawdown,
    commitmentAfter: Math.max(0, remaining - drawdown),
    coversRouted: remaining >= routed,
  };
}

/* ---------- Cloud Marketplace Optimizer: eligibility + recommendations ---------- */

export type MarketplaceProvider = "AWS" | "Azure" | "GCP";
export type CheckStatus = "pass" | "warn" | "fail";

export interface MarketplaceCheck {
  label: string;
  status: CheckStatus;
  detail: string;
}

export interface MarketplaceRecommendation {
  provider: MarketplaceProvider;
  commitment: number;
  /** Provider maturity of the marketplace motion on the platform. */
  supported: boolean;
  eligibility: "Eligible" | "Pending" | "Not eligible" | "Not applicable";
  checks: MarketplaceCheck[];
  recommendedRoute: string;
  recommendedRoutePct: number;
  recommendedFeePct: number;
  recommendCppo: boolean;
  routedTermValue: number;
  fee: number;
  netToSalesforce: number;
  commitmentDrawdown: number;
  commitmentAfter: number;
  coversRouted: boolean;
  /** Predicted incremental licence TCV unlocked by transacting on the marketplace. */
  incrementalTermValue: number;
  incrementalAcv: number;
  /** Incremental TCV net of the marketplace listing fee. */
  netIncrementalTermValue: number;
  upliftPct: number;
  confidence: "High" | "Medium" | "Low";
  rationale: string;
  isConfigured: boolean;
  isActive: boolean;
}

/** Committed-spend drawdown converts pre-approved cloud budget into licence spend. */
const MARKETPLACE_UPLIFT: Record<MarketplaceProvider, number> = { AWS: 12, Azure: 9, GCP: 7 };
const MARKETPLACE_DEFAULT_FEE: Record<MarketplaceProvider, number> = { AWS: 3, Azure: 3, GCP: 3 };
/** Share of licence TCV that is realistically routable through committed spend. */
const MARKETPLACE_TARGET_ROUTE_PCT = 100;

export interface MarketplaceOptimizerInput {
  licenseTermValue: number;
  customer?: {
    aws_customer?: boolean;
    aws_commitment?: number;
    azure_commitment?: number;
    gcp_commitment?: number;
    strategic_platforms?: string[];
  } | null;
  models?: MarketplaceModel[];
  /** Partner (TechM) is on the private-offer paper — enables CPPO recommendation. */
  partnerName?: string | null;
}

function providerCommitment(provider: MarketplaceProvider, c: MarketplaceOptimizerInput["customer"]): number {
  if (!c) return 0;
  if (provider === "AWS") return Number(c.aws_commitment) || 0;
  if (provider === "Azure") return Number(c.azure_commitment) || 0;
  return Number(c.gcp_commitment) || 0;
}

/**
 * Ranks every cloud provider for the active deal: runs eligibility checks against
 * the customer's committed spend and predicts the incremental licence revenue a
 * marketplace private offer would unlock.
 */
export function marketplaceRecommendations(input: MarketplaceOptimizerInput): MarketplaceRecommendation[] {
  const licenseTermValue = Math.max(0, Number(input.licenseTermValue) || 0);
  const providers: MarketplaceProvider[] = ["AWS", "Azure", "GCP"];

  const recs = providers.map<MarketplaceRecommendation>((provider) => {
    const model = (input.models ?? []).find((m) => m.provider === provider) ?? null;
    const commitment = providerCommitment(provider, input.customer) || Number(model?.commitment_total) || 0;
    const remaining = Number(model?.commitment_remaining) || commitment;
    const strategic = (input.customer?.strategic_platforms ?? []).some((p) => p.toLowerCase().includes(provider.toLowerCase()));
    const isCloudCustomer = provider === "AWS" ? !!input.customer?.aws_customer || commitment > 0 : commitment > 0;

    const checks: MarketplaceCheck[] = [
      {
        label: `${provider} customer relationship`,
        status: isCloudCustomer ? "pass" : strategic ? "warn" : "fail",
        detail: isCloudCustomer
          ? `Active ${provider} spend on record`
          : strategic
            ? `${provider} listed as a strategic platform but no commitment captured`
            : `No ${provider} relationship captured on the customer profile`,
      },
      {
        label: "Committed spend available",
        status: remaining > 0 ? (remaining >= licenseTermValue ? "pass" : "warn") : "fail",
        detail: remaining > 0
          ? `${remaining >= licenseTermValue ? "Covers" : "Partially covers"} the licence TCV in scope`
          : "No remaining commitment to draw down against",
      },
      {
        label: "Licence TCV in scope",
        status: licenseTermValue > 0 ? "pass" : "fail",
        detail: licenseTermValue > 0 ? "Priced licence BOM available to route" : "Price the licence BOM before routing",
      },
      {
        label: "Private offer paper",
        status: input.partnerName ? "pass" : "warn",
        detail: input.partnerName ? `${input.partnerName} can transact the private offer (CPPO)` : "Confirm which entity issues the private offer",
      },
    ];

    const failed = checks.filter((c) => c.status === "fail").length;
    const warned = checks.filter((c) => c.status === "warn").length;
    const eligibility: MarketplaceRecommendation["eligibility"] =
      failed > 1 ? "Not eligible" : failed === 1 ? "Pending" : warned ? "Pending" : "Eligible";

    const routePct = remaining > 0 && licenseTermValue > 0
      ? Math.min(MARKETPLACE_TARGET_ROUTE_PCT, Math.round((Math.min(remaining, licenseTermValue) / licenseTermValue) * 100))
      : 0;
    const feePct = Number(model?.marketplace_fee_pct) || MARKETPLACE_DEFAULT_FEE[provider];
    const recommendCppo = !!input.partnerName;
    const recommendedRoute = routePct === 0
      ? "Direct (no marketplace)"
      : recommendCppo
        ? "Marketplace private offer (CPPO)"
        : "Marketplace private offer";

    const routed = licenseTermValue * pct(routePct);
    const fee = routed * pct(feePct);
    const drawdown = Math.min(routed, remaining);
    const upliftPct = MARKETPLACE_UPLIFT[provider];
    const incrementalTermValue = eligibility === "Not eligible" ? 0 : drawdown * pct(upliftPct);

    return {
      provider,
      commitment,
      supported: provider === "AWS",
      eligibility: licenseTermValue === 0 && commitment === 0 ? "Not applicable" : eligibility,
      checks,
      recommendedRoute,
      recommendedRoutePct: routePct,
      recommendedFeePct: feePct,
      recommendCppo,
      routedTermValue: routed,
      fee,
      netToSalesforce: routed - fee,
      commitmentDrawdown: drawdown,
      commitmentAfter: Math.max(0, remaining - drawdown),
      coversRouted: remaining >= routed,
      incrementalTermValue,
      incrementalAcv: incrementalTermValue / TERM_YEARS,
      netIncrementalTermValue: incrementalTermValue - fee,
      upliftPct,
      confidence: failed ? "Low" : warned ? "Medium" : "High",
      rationale: routePct > 0
        ? `Route ${routePct}% of licence TCV through ${provider} committed spend; drawdown converts pre-approved cloud budget, historically unlocking ~${upliftPct}% incremental licence scope.`
        : `Insufficient ${provider} committed spend to justify a marketplace route — transact direct.`,
      isConfigured: !!model,
      isActive: !!model?.is_enabled,
    };
  });

  return recs.sort((a, b) => b.netIncrementalTermValue - a.netIncrementalTermValue || b.routedTermValue - a.routedTermValue);
}


export interface DealEconomics {
  scenario?: Scenario;
  totals: ReturnType<typeof computeScenario>;
  license: LicenseEconomics;
  services: ServicesEconomics;
  fund: FundEconomics;
  marketplace: MarketplaceMath;
  displacement: DisplacementMath[];
  customerSavingsAnnual: number;
  customerSavingsTerm: number;
  combinedTermValue: number;
  blendedGp: number;
  blendedGmPct: number;
  proposedAcv: number;
  belowMarginFloor: boolean;
}

export interface DealEconomicsInput {
  deal: Deal;
  scenario?: Scenario;
  lines: SkuLine[];
  services?: ServicesConstruct | null;
  fund?: InnovationFund | null;
  marketplace?: MarketplaceModel | null;
  incumbents?: IncumbentPlatform[];
  levers?: ValueLever[];
}

/** Full deal-level economics: licence + services + fund + marketplace + value. */
export function dealEconomics(input: DealEconomicsInput): DealEconomics {
  const { deal, scenario, lines } = input;
  const totals = computeScenario(lines, scenario);
  const license = licenseEconomics(lines, scenario, Number(deal.min_license_gm_pct) || 0);
  const services = servicesEconomics(input.services, license.netArr);
  const fund = fundEconomics(input.fund, license.netTermValue);
  const marketplace = marketplaceMath(input.marketplace, license.netTermValue);
  const displacement = (input.incumbents ?? []).map(displacementMath);

  const leverAnnual = (input.levers ?? []).filter((l) => l.is_included).reduce((sum, l) => sum + (Number(l.annual_value) || 0), 0);
  const leverTerm = (input.levers ?? []).filter((l) => l.is_included).reduce((sum, l) => sum + (Number(l.term_value) || 0), 0);
  const displacementAnnual = displacement.reduce((sum, d) => sum + Math.max(0, d.annualSaving), 0);

  const blendedGp = license.licenseGpTerm + services.termGp;
  const combinedTermValue = license.netTermValue + services.termFee;

  return {
    scenario,
    totals,
    license,
    services,
    fund,
    marketplace,
    displacement,
    customerSavingsAnnual: leverAnnual + displacementAnnual,
    customerSavingsTerm: leverTerm + displacementAnnual * TERM_YEARS,
    combinedTermValue,
    blendedGp,
    blendedGmPct: combinedTermValue > 0 ? (blendedGp / combinedTermValue) * 100 : 0,
    proposedAcv: license.netArr,
    belowMarginFloor: license.netArr > 0 && license.licenseGmPct < (Number(deal.min_license_gm_pct) || 0),
  };
}

/* ---------- Deal health score ---------- */

export interface HealthDriver {
  label: string;
  score: number;
  weight: number;
  detail: string;
}

export interface HealthScore {
  score: number;
  band: "Strong" | "Healthy" | "At risk" | "Critical";
  drivers: HealthDriver[];
}

const clamp = (v: number) => Math.max(0, Math.min(100, v));

export function dealHealthScore(
  economics: DealEconomics,
  deal: Deal,
  validation: ValidationItem[] = [],
): HealthScore {
  const savingsPct = economics.license.listArr > 0 ? (economics.customerSavingsAnnual / economics.license.listArr) * 100 : 0;
  const customerValue = clamp(savingsPct * 5);

  const growthArr = economics.license.layers.filter((l) => l.layer !== "A").reduce((s, l) => s + l.netArr, 0);
  const growthShare = economics.license.netArr > 0 ? (growthArr / economics.license.netArr) * 100 : 0;
  const salesforceValue = clamp(40 + growthShare * 1.5);

  const floor = Number(deal.min_license_gm_pct) || 0;
  const marginHeadroom = economics.license.licenseGmPct - floor;
  const techmEconomics = clamp(50 + marginHeadroom * 4 + Math.min(20, economics.services.attachPct));

  const openValidation = validation.filter((v) => v.status !== "Closed" && v.status !== "Resolved").length;
  const criticalValidation = validation.filter((v) => v.severity === "High" && v.status !== "Closed" && v.status !== "Resolved").length;
  const readiness = clamp(100 - openValidation * 6 - criticalValidation * 6 - economics.totals.openAssumptions * 0.5);

  const risk = clamp(
    100 -
      (economics.belowMarginFloor ? 35 : 0) -
      economics.license.linesWithoutCost * 0.5 -
      (economics.marketplace.routedTermValue > 0 && !economics.marketplace.coversRouted ? 15 : 0) -
      economics.totals.warnings * 0.5,
  );

  const drivers: HealthDriver[] = [
    { label: "Customer value", score: customerValue, weight: 0.2, detail: `${savingsPct.toFixed(1)}% of list ARR returned as savings` },
    { label: "Salesforce value", score: salesforceValue, weight: 0.2, detail: `${growthShare.toFixed(0)}% of net ARR from growth layers` },
    { label: "TechM economics", score: techmEconomics, weight: 0.25, detail: `Licence GM ${economics.license.licenseGmPct.toFixed(1)}% vs ${floor}% floor` },
    { label: "Commercial readiness", score: readiness, weight: 0.2, detail: `${openValidation} open validation item(s)` },
    { label: "Risk", score: risk, weight: 0.15, detail: economics.belowMarginFloor ? "Below margin floor" : "No margin breach" },
  ];

  const score = Math.round(drivers.reduce((sum, d) => sum + d.score * d.weight, 0));
  const band: HealthScore["band"] = score >= 80 ? "Strong" : score >= 65 ? "Healthy" : score >= 45 ? "At risk" : "Critical";
  return { score, band, drivers };
}

/* ---------- Portfolio + benchmarks ---------- */

export interface PortfolioTotals {
  deals: number;
  activeDeals: number;
  simulations: number;
  licenseTcv: number;
  servicesTcv: number;
  combinedTcv: number;
  weightedTcv: number;
  licenseGp: number;
  servicesGp: number;
  blendedGp: number;
  blendedGmPct: number;
  belowFloor: number;
  awaitingValidation: number;
  usingFund: number;
  usingMarketplace: number;
  closingThisQuarter: number;
  fundProposed: number;
  fundSalesforce: number;
  fundTechm: number;
  fundConsumed: number;
  fundAvailable: number;
  familyAcv: { family: string; acv: number }[];
}

export interface DealSummary {
  deal: Deal;
  customerName: string;
  industry: string | null;
  region: string | null;
  economics: DealEconomics;
  health: HealthScore;
  openValidation: number;
  criticalValidation: number;
  familyAcv: Record<string, number>;
}

const STAGE_WEIGHT: Record<string, number> = {
  Simulation: 0.05,
  Qualification: 0.1,
  Discovery: 0.2,
  "BOM Analysis": 0.3,
  "Commercial Design": 0.4,
  "Salesforce Negotiation": 0.6,
  "Customer Negotiation": 0.7,
  "Finance Approval": 0.85,
  Contracting: 0.9,
  "Closed Won": 1,
  "Closed Lost": 0,
  "On Hold": 0.1,
};

export const stageWeight = (stage: string) => STAGE_WEIGHT[stage] ?? 0.25;

const sameQuarter = (iso: string | null) => {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && Math.floor(d.getMonth() / 3) === Math.floor(now.getMonth() / 3);
};

export function portfolioTotals(summaries: DealSummary[]): PortfolioTotals {
  const families = new Map<string, number>();
  const t: PortfolioTotals = {
    deals: summaries.length,
    activeDeals: 0,
    simulations: 0,
    licenseTcv: 0,
    servicesTcv: 0,
    combinedTcv: 0,
    weightedTcv: 0,
    licenseGp: 0,
    servicesGp: 0,
    blendedGp: 0,
    blendedGmPct: 0,
    belowFloor: 0,
    awaitingValidation: 0,
    usingFund: 0,
    usingMarketplace: 0,
    closingThisQuarter: 0,
    fundProposed: 0,
    fundSalesforce: 0,
    fundTechm: 0,
    fundConsumed: 0,
    fundAvailable: 0,
    familyAcv: [],
  };

  for (const s of summaries) {
    const e = s.economics;
    if (s.deal.is_simulation) t.simulations += 1;
    else if (!s.deal.is_archived && !s.deal.stage.startsWith("Closed")) t.activeDeals += 1;
    t.licenseTcv += e.license.netTermValue;
    t.servicesTcv += e.services.termFee;
    t.combinedTcv += e.combinedTermValue;
    t.weightedTcv += e.combinedTermValue * stageWeight(s.deal.stage);
    t.licenseGp += e.license.licenseGpTerm;
    t.servicesGp += e.services.termGp;
    if (e.belowMarginFloor) t.belowFloor += 1;
    if (s.criticalValidation > 0) t.awaitingValidation += 1;
    if (e.fund.total > 0) t.usingFund += 1;
    if (e.marketplace.routedTermValue > 0) t.usingMarketplace += 1;
    if (sameQuarter(s.deal.close_date)) t.closingThisQuarter += 1;
    t.fundProposed += e.fund.total;
    t.fundSalesforce += e.fund.salesforceFunded;
    t.fundTechm += e.fund.techmFunded;
    t.fundConsumed += e.fund.consumed;
    t.fundAvailable += e.fund.available;
    for (const [family, acv] of Object.entries(s.familyAcv)) families.set(family, (families.get(family) ?? 0) + acv);
  }

  t.blendedGp = t.licenseGp + t.servicesGp;
  t.blendedGmPct = t.combinedTcv > 0 ? (t.blendedGp / t.combinedTcv) * 100 : 0;
  t.familyAcv = [...families.entries()].map(([family, acv]) => ({ family, acv })).sort((a, b) => b.acv - a.acv);
  return t;
}

export interface Benchmarks {
  sampleSize: number;
  avgLicenseGmPct: number;
  avgSalesforceDiscountPct: number;
  avgCustomerSavingsPct: number;
  avgServicesAttachPct: number;
  avgFundPctOfTcv: number;
  agentforcePenetrationPct: number;
  marketplaceAdoptionPct: number;
  avgServicesGmPct: number;
  avgCombinedTcv: number;
}

const mean = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);

/** Anonymised aggregates only — never exposes an individual customer's data. */
export function benchmarks(summaries: DealSummary[]): Benchmarks {
  const withValue = summaries.filter((s) => s.economics.license.netArr > 0);
  return {
    sampleSize: withValue.length,
    avgLicenseGmPct: mean(withValue.map((s) => s.economics.license.licenseGmPct)),
    avgSalesforceDiscountPct: mean(withValue.map((s) => s.economics.totals.effectiveDiscountPct)),
    avgCustomerSavingsPct: mean(
      withValue.map((s) => (s.economics.license.listArr > 0 ? (s.economics.customerSavingsAnnual / s.economics.license.listArr) * 100 : 0)),
    ),
    avgServicesAttachPct: mean(withValue.map((s) => s.economics.services.attachPct)),
    avgFundPctOfTcv: mean(withValue.map((s) => s.economics.fund.pctOfTcv)),
    agentforcePenetrationPct: withValue.length
      ? (withValue.filter((s) => (s.familyAcv["Agentforce"] ?? 0) > 0).length / withValue.length) * 100
      : 0,
    marketplaceAdoptionPct: withValue.length
      ? (withValue.filter((s) => s.economics.marketplace.routedTermValue > 0).length / withValue.length) * 100
      : 0,
    avgServicesGmPct: mean(withValue.filter((s) => s.economics.services.annualFee > 0).map((s) => s.economics.services.gmPct)),
    avgCombinedTcv: mean(withValue.map((s) => s.economics.combinedTermValue)),
  };
}

/** Net ARR by Salesforce product family for a scenario's lines. */
export function familyAcv(lines: SkuLine[], scenario?: Scenario): Record<string, number> {
  const out: Record<string, number> = {};
  for (const line of lines) {
    const key = line.product_family || "Other";
    out[key] = (out[key] ?? 0) + computeLine(line, scenario).netArr;
  }
  return out;
}
