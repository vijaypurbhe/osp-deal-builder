export type Classification =
  | "Current baseline"
  | "Growth"
  | "Replacement"
  | "Incremental"
  | "Optional"
  | "Further discussion"
  | "Retire / rationalize";

export const CLASSIFICATIONS: Classification[] = [
  "Current baseline",
  "Growth",
  "Replacement",
  "Incremental",
  "Optional",
  "Further discussion",
  "Retire / rationalize",
];

export const UNITS_OF_MEASURE = [
  "User",
  "Org",
  "Login",
  "Credit",
  "Conversation",
  "GB",
  "vCore",
  "Flow",
  "Message",
  "Connector",
  "Sandbox",
  "Add-on",
  "Other",
] as const;

export const BILLING_FREQUENCIES = ["Monthly", "Annual", "One-time", "Usage-based"] as const;

export const PRORATION_METHODS = ["None", "Daily", "Monthly", "Co-term"] as const;

export const APPROVAL_STATUSES = [
  "Draft",
  "Under review",
  "Salesforce validation needed",
  "S+N validation needed",
  "Approved for order form",
] as const;

export const DECISION_STATUSES = APPROVAL_STATUSES;

export const CONFIDENCE_LEVELS = ["Low", "Medium", "High"] as const;

export const ORDER_FORM_TYPES = [
  "Initial OSP Order Form",
  "Incremental Year 1 Order Form",
  "Year 2 Expansion Order Form",
  "Year 3 Expansion / Renewal Order Form",
  "Agentforce Flex Credit Order Form",
  "Data 360 / Marketing Expansion Order Form",
  "MuleSoft Capacity Expansion Order Form",
  "ServiceMax / Service Cloud Order Form",
  "Further Discussion / Optional SKUs Order Form",
] as const;

export const DEAL_ROLES = [
  { key: "deal_architect", label: "Deal Architect / Admin", canEdit: true },
  { key: "salesforce_ae", label: "Salesforce AE / Commercial", canEdit: true },
  { key: "tm_osp_lead", label: "Tech Mahindra OSP Lead", canEdit: true },
  { key: "sn_reviewer", label: "Smith+Nephew Reviewer", canEdit: false },
  { key: "finance_reviewer", label: "Finance / Deal Desk Reviewer", canEdit: false },
] as const;

export type DealRole = (typeof DEAL_ROLES)[number]["key"];

export interface Deal {
  id: string;
  name: string;
  customer_id: string | null;
  customer_name: string;
  partner_name: string;
  currency: string;
  contract_start: string | null;
  contract_end: string | null;
  status: string;
  owner_id: string | null;
  owner_name: string | null;
  notes: string | null;
  is_archived: boolean;
  sort_order: number;
  opportunity_id: string | null;
  deal_type: string;
  stage: string;
  region: string | null;
  contract_years: number;
  close_date: string | null;
  salesforce_ae: string | null;
  techm_account_lead: string | null;
  techm_osp_lead: string | null;
  finance_owner: string | null;
  source_deal_id: string | null;
  is_simulation: boolean;
  current_scenario_id: string | null;
  current_salesforce_acv: number;
  renewal_uplift_pct: number;
  min_license_gm_pct: number;
  services_gm_target_pct: number;
  use_customer_branding: boolean;
  updated_at?: string;
}


export interface SkuLibraryItem {
  id: string;
  sku_code: string | null;
  sku_name: string;
  description: string | null;
  product_family: string | null;
  product_category: string | null;
  cloud: string | null;
  unit_of_measure: string;
  unit_list_price: number;
  billing_frequency: string;
  default_tower_key: string | null;
  is_active: boolean;
  edition: string | null;
  metric: string | null;
  billing_unit: string | null;
  wholesale_unit_price: number;
  default_commercial_layer: string;
}

export const DEAL_STATUSES = ["Active", "Shaping", "Submitted", "Won", "Lost", "On hold"] as const;

export interface Scenario {
  id: string;
  deal_id: string;
  name: string;
  description: string | null;
  status: string;
  owner_name: string | null;
  owner_id: string | null;
  is_locked: boolean;
  is_baseline: boolean;
  is_recommended: boolean;
  notes: string | null;
  currency: string;
  contract_start: string | null;
  contract_end: string | null;
  scenario_discount_pct: number;
  bulk_discount_pct: number;
  bulk_discount_mode: string;
  strategic_override_pct: number;
  approval_threshold_pct: number;
  sort_order: number;
}

export interface SkuLine {
  id: string;
  scenario_id: string;
  tower_key: string | null;
  sku_code: string | null;
  sku_name: string;
  description: string | null;
  product_family: string | null;
  product_category: string | null;
  cloud: string | null;
  classification: string;
  commercial_layer: string;
  edition: string | null;
  metric: string | null;
  growth_category: string | null;
  acquisition_unit_price: number;
  current_contract_unit_price: number;
  bom_type: string;
  quantity: number;
  unit_of_measure: string;
  unit_list_price: number;
  billing_frequency: string;
  line_discount_pct: number;
  category_discount_pct: number;
  bulk_eligible: boolean;
  discountable: boolean;
  max_discount_pct: number;
  approval_threshold_pct: number;
  discount_reason: string | null;
  year1_qty: number | null;
  year2_qty: number | null;
  year3_qty: number | null;
  start_date: string | null;
  end_date: string | null;
  coterm_date: string | null;
  proration_method: string;
  approval_status: string;
  assumption_owner: string | null;
  needs_salesforce_confirmation: boolean;
  needs_sn_confirmation: boolean;
  notes: string | null;
  source_tab: string | null;
  source_file: string | null;
}

export interface Tower {
  id: string;
  deal_id: string;
  key: string;
  name: string;
  description: string | null;
  sort_order: number;
  decision_status: string;
  confidence: string;
}

export interface DiscussionItem {
  id: string;
  deal_id: string;
  area: string;
  title: string;
  description: string | null;
  status: string;
  owner: string | null;
  commercial_impact: string | null;
  technical_impact: string | null;
  decision_needed: string | null;
  target_decision_date: string | null;
  order_form_inclusion: string;
}

export interface RiskEntry {
  id: string;
  deal_id: string;
  ref_code: string | null;
  category: string;
  description: string;
  owner: string | null;
  impact: string;
  probability: string;
  status: string;
  decision_needed_by: string | null;
  commercial_impact: string | null;
  technical_impact: string | null;
  legal_impact: string | null;
  notes: string | null;
}

export interface OrderForm {
  id: string;
  scenario_id: string;
  form_type: string;
  form_number: string | null;
  customer_name: string;
  partner_name: string;
  contract_start: string | null;
  contract_end: string | null;
  billing_frequency: string;
  currency: string;
  notes: string | null;
  assumptions: string | null;
  open_items: string | null;
  approval_status: string;
}

export interface BulkTier {
  id: string;
  scenario_id: string;
  tier_name: string;
  tcv_threshold: number;
  discount_pct: number;
  sort_order: number;
}

/* ---------- Model configs ---------- */

export interface GrowthModel {
  baseline_users: number;
  us_ortho_growth: number;
  international_growth: number;
  servicemax_increment: number;
  south_africa_health: number;
  other_growth: number;
  retired_users: number;
  growth_case: "conservative" | "expected" | "upside";
  conservative_factor: number;
  expected_factor: number;
  upside_factor: number;
}

export const DEFAULT_GROWTH: GrowthModel = {
  baseline_users: 4073,
  us_ortho_growth: 250,
  international_growth: 400,
  servicemax_increment: 300,
  south_africa_health: 60,
  other_growth: 100,
  retired_users: 150,
  growth_case: "expected",
  conservative_factor: 0.6,
  expected_factor: 1,
  upside_factor: 1.35,
};

export interface SandboxModel {
  sandbox_type: "Developer" | "Developer Pro" | "Partial Copy" | "Full Copy";
  quantity: number;
  included_in_contract: "yes" | "no" | "unknown";
  required_for: string[];
  refresh_frequency: string;
  data_masking_required: boolean;
  compliance_notes: string;
}

export const DEFAULT_SANDBOX: SandboxModel = {
  sandbox_type: "Partial Copy",
  quantity: 1,
  included_in_contract: "unknown",
  required_for: ["Development", "SIT", "UAT", "ServiceMax project"],
  refresh_frequency: "Every 5 days",
  data_masking_required: true,
  compliance_notes: "Partial Copy selected — Data Mask / Shield should be evaluated.",
};

export interface Data360Model {
  unified_profiles: number;
  data_sources: number;
  activations_per_month: number;
  refresh_frequency: string;
  monthly_credits: number;
  buffer_pct: number;
  adoption_y1: number;
  adoption_y2: number;
  adoption_y3: number;
  credit_unit_price: number;
  pricing_option: "Profile-based" | "Flex Credits" | "Hybrid";
  marketing_business_units: number;
  marketing_bu_price: number;
  mci_expansion_cost: number;
  governance_status: string;
}

export const DEFAULT_DATA360: Data360Model = {
  unified_profiles: 12000000,
  data_sources: 18,
  activations_per_month: 120,
  refresh_frequency: "Daily",
  monthly_credits: 850000,
  buffer_pct: 15,
  adoption_y1: 40,
  adoption_y2: 75,
  adoption_y3: 100,
  credit_unit_price: 0.0009,
  pricing_option: "Flex Credits",
  marketing_business_units: 3,
  marketing_bu_price: 45000,
  mci_expansion_cost: 120000,
  governance_status: "Defining",
};

export interface AgentforceModel {
  eligible_population: number;
  excluded_users: number;
  addon_unit_price: number;
  addon_discount_pct: number;
  adoption_y1: number;
  adoption_y2: number;
  adoption_y3: number;
  use_cases: string[];
  flex_use_case: string;
  cases_per_month: number;
  actions_per_transaction: number;
  credits_per_action: number;
  credit_unit_price: number;
  buffer_pct: number;
  overrun_threshold: number;
  ramp_start: string;
  quote_needed: boolean;
  human_in_loop: boolean;
  data_ready: boolean;
}

export const DEFAULT_AGENTFORCE: AgentforceModel = {
  eligible_population: 4956,
  excluded_users: 400,
  addon_unit_price: 600,
  addon_discount_pct: 20,
  adoption_y1: 50,
  adoption_y2: 85,
  adoption_y3: 100,
  use_cases: ["Account planning", "Opportunity coaching", "Sales activity summaries", "Pipeline hygiene"],
  flex_use_case: "Customer Care order automation",
  cases_per_month: 45000,
  actions_per_transaction: 6,
  credits_per_action: 2,
  credit_unit_price: 0.0018,
  buffer_pct: 20,
  overrun_threshold: 110,
  ramp_start: "2026-04-01",
  quote_needed: true,
  human_in_loop: true,
  data_ready: false,
};

export interface MuleSoftModel {
  current_prod_vcores: number;
  current_preprod_vcores: number;
  api_manager_qty: number;
  premium_connectors: number;
  sap_connector: number;
  flows: number;
  messages_millions: number;
  current_api_count: number;
  expected_new_apis: number;
  transaction_growth_pct: number;
  servicemax_growth: number;
  data_ai_growth: number;
  order_automation_growth: number;
  monitoring_required: boolean;
  y1_increment: number;
  y2_increment: number;
  y3_increment: number;
  vcore_price: number;
}

export const DEFAULT_MULESOFT: MuleSoftModel = {
  current_prod_vcores: 16,
  current_preprod_vcores: 8,
  api_manager_qty: 1,
  premium_connectors: 4,
  sap_connector: 1,
  flows: 240,
  messages_millions: 180,
  current_api_count: 210,
  expected_new_apis: 90,
  transaction_growth_pct: 35,
  servicemax_growth: 4,
  data_ai_growth: 6,
  order_automation_growth: 3,
  monitoring_required: true,
  y1_increment: 6,
  y2_increment: 5,
  y3_increment: 4,
  vcore_price: 42000,
};

export interface ServiceMaxModel {
  current_service_baseline: number;
  project_population: number;
  full_service_users: number;
  dispatcher_users: number;
  internal_support_users: number;
  partner_users: number;
  integration_users: number;
  required_sandboxes: number;
  required_addons: string;
  go_live_date: string;
  ramp_year: 1 | 2 | 3;
  discount_pct: number;
  unit_price: number;
  notes: string;
}

export const DEFAULT_SERVICEMAX: ServiceMaxModel = {
  current_service_baseline: 900,
  project_population: 620,
  full_service_users: 420,
  dispatcher_users: 60,
  internal_support_users: 90,
  partner_users: 40,
  integration_users: 5,
  required_sandboxes: 1,
  required_addons: "Field Service, Service Cloud Voice (under review)",
  go_live_date: "2026-07-01",
  ramp_year: 1,
  discount_pct: 25,
  unit_price: 1800,
  notes: "Incremental Service Cloud licensing to support the ServiceMax programme.",
};

export const MODEL_DEFAULTS = {
  growth: DEFAULT_GROWTH,
  sandbox: DEFAULT_SANDBOX,
  data360: DEFAULT_DATA360,
  agentforce: DEFAULT_AGENTFORCE,
  mulesoft: DEFAULT_MULESOFT,
  servicemax: DEFAULT_SERVICEMAX,
} as const;

export type ModelKey = keyof typeof MODEL_DEFAULTS;

/* =========================================================================
   Platform-level (customer-agnostic) taxonomy
   ========================================================================= */

export const DEAL_TYPES = [
  "Renewal",
  "Renewal + Growth",
  "Net New",
  "Expansion",
  "Competitive Displacement",
  "Platform Consolidation",
  "OSP Pre-Buy",
  "Transformation Bundle",
  "Marketplace Transaction",
  "License Optimization",
  "Mixed / Custom",
] as const;
export type DealType = (typeof DEAL_TYPES)[number];

export const DEAL_STAGES = [
  "Simulation",
  "Qualification",
  "Discovery",
  "BOM Analysis",
  "Commercial Design",
  "Salesforce Negotiation",
  "Customer Negotiation",
  "Finance Approval",
  "Contracting",
  "Closed Won",
  "Closed Lost",
  "On Hold",
] as const;
export type DealStage = (typeof DEAL_STAGES)[number];

export const OPEN_STAGES: string[] = DEAL_STAGES.filter((s) => !s.startsWith("Closed"));

export const COMMERCIAL_LAYERS = [
  { key: "A", label: "Layer A — Incumbent / protected estate" },
  { key: "B", label: "Layer B — Known / committed growth" },
  { key: "C", label: "Layer C — Future transformation growth" },
] as const;
export type CommercialLayer = "A" | "B" | "C";

export const PRODUCT_FAMILIES = [
  "Sales Cloud", "Service Cloud", "Agentforce", "Data 360", "Revenue Cloud", "Field Service",
  "Industry Clouds", "MuleSoft", "Tableau", "Slack", "Marketing Cloud", "Experience Cloud",
  "Platform", "Shield", "Sandboxes", "Success Plans", "Maps", "Other",
] as const;

export const INDUSTRIES = [
  "Life Sciences & Healthcare", "Manufacturing", "Retail & Consumer", "Banking & Financial Services",
  "Insurance", "Communications & Media", "Energy & Utilities", "Technology", "Public Sector",
  "Travel & Transport", "Professional Services", "Other",
] as const;

export const REGIONS = ["Global", "North America", "LATAM", "UK & Ireland", "Europe", "Middle East & Africa", "APAC", "ANZ", "India"] as const;

export const TIF_TEMPLATES = [
  "No Fund", "Margin-Floor Fund", "Balanced Fund", "Strategic Growth Fund", "Competitive Displacement Fund", "Custom",
] as const;

export const VALUE_CATEGORIES = [
  "Avoided renewal uplift", "License consolidation", "SKU rationalization", "Platform displacement",
  "Innovation Fund", "AWS commitment optimization", "Managed-services savings", "Implementation efficiency",
  "Productivity", "Revenue uplift", "Cost avoidance", "Vendor consolidation",
] as const;

export const MARKETPLACE_PROVIDERS = ["AWS", "Azure", "GCP"] as const;
export const MARKETPLACE_ROUTES = [
  "Direct (no marketplace)", "Marketplace private offer", "Marketplace private offer (CPPO)", "EDP / PPA drawdown", "MACC drawdown",
] as const;
export const MARKETPLACE_ELIGIBILITY = ["Pending", "Eligible", "Not eligible", "Not applicable"] as const;

export const VALIDATION_SCOPES = [
  { key: "universal", label: "Universal checks" },
  { key: "salesforce", label: "Salesforce commercial checks" },
  { key: "customer", label: "Customer-specific checks" },
] as const;

export const INCUMBENT_PRESETS = [
  { vendor: "PROS", product: "PROS pricing & CPQ", replacement: "Revenue Cloud Advanced" },
  { vendor: "ServiceMax", product: "ServiceMax field service", replacement: "Salesforce Field Service" },
  { vendor: "Microsoft", product: "Dynamics 365", replacement: "Sales Cloud / Service Cloud" },
  { vendor: "SAP", product: "SAP CRM", replacement: "Sales Cloud" },
  { vendor: "Oracle", product: "Oracle CPQ", replacement: "Revenue Cloud Advanced" },
  { vendor: "Adobe", product: "Adobe Marketing", replacement: "Marketing Cloud" },
  { vendor: "Boomi", product: "Boomi integration", replacement: "MuleSoft" },
  { vendor: "Qlik / Microsoft", product: "Qlik / Power BI", replacement: "Tableau" },
  { vendor: "In-house", product: "Custom legacy system", replacement: "Salesforce Platform" },
] as const;

export interface Customer {
  id: string;
  name: string;
  industry: string | null;
  sub_industry: string | null;
  region: string | null;
  country: string | null;
  currency: string;
  employee_count: number | null;
  annual_revenue: number | null;
  salesforce_customer_since: string | null;
  current_salesforce_acv: number;
  aws_customer: boolean;
  aws_commitment: number;
  azure_commitment: number;
  gcp_commitment: number;
  strategic_platforms: string[];
  incumbent_vendors: string[];
  logo_url: string | null;
  brand_primary: string | null;
  brand_secondary: string | null;
  notes: string | null;
  is_simulation: boolean;
}

export interface ServicesConstruct {
  id: string;
  deal_id: string;
  name: string;
  scope: string | null;
  annual_fee: number;
  annual_cost: number;
  years: number;
  implementation_fee: number;
  implementation_cost: number;
  attach_target_pct: number;
  notes: string | null;
}

export interface InnovationFund {
  id: string;
  deal_id: string;
  name: string;
  template: string;
  total_fund: number;
  salesforce_funded: number;
  techm_funded: number;
  customer_funded: number;
  drawdown_y1: number;
  drawdown_y2: number;
  drawdown_y3: number;
  consumed: number;
  status: string;
  notes: string | null;
}

export interface IncumbentPlatform {
  id: string;
  deal_id: string;
  vendor: string;
  product: string | null;
  annual_license_spend: number;
  annual_services_spend: number;
  users: number;
  renewal_date: string | null;
  contract_end_date: string | null;
  notes: string | null;
  replacement_salesforce_product: string | null;
  replacement_users: number;
  replacement_annual_license_cost: number;
  replacement_implementation_cost: number;
  replacement_managed_services_cost: number;
  status: string;
}

export interface MarketplaceModel {
  id: string;
  deal_id: string;
  provider: string;
  route: string;
  is_enabled: boolean;
  commitment_total: number;
  commitment_remaining: number;
  drawdown_pct: number;
  marketplace_fee_pct: number;
  cppo: boolean;
  eligibility_status: string;
  notes: string | null;
}

export interface ValidationItem {
  id: string;
  deal_id: string;
  scope: string;
  check_key: string | null;
  title: string;
  detail: string | null;
  severity: string;
  status: string;
  owner: string | null;
  resolution: string | null;
}

export interface ValueLever {
  id: string;
  deal_id: string;
  category: string;
  description: string | null;
  annual_value: number;
  term_value: number;
  is_included: boolean;
  confidence: string;
}

export interface DealVersion {
  id: string;
  deal_id: string;
  version_no: number;
  label: string;
  summary: string | null;
  snapshot: unknown;
  author_id: string | null;
  author_name: string | null;
  created_at: string;
}

export interface DealTemplate {
  id: string;
  name: string;
  description: string | null;
  deal_type: string;
  config: unknown;
  source_deal_id: string | null;
  is_seed: boolean;
  sort_order: number;
}

export interface GlobalDefaults {
  id: string;
  is_active: boolean;
  contract_years: number;
  renewal_uplift_pct: number;
  min_license_gm_pct: number;
  services_gm_target_pct: number;
  services_attach_pct: number;
  currency: string;
  approval_threshold_pct: number;
  marketplace_fee_pct: number;
}
