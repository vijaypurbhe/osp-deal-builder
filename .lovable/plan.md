# Tech Mahindra Salesforce OSP Deal Builder — full genericization

Convert the app from a Smith+Nephew tool into a reusable multi-customer OSP commercial platform. All S+N work is preserved and becomes Customer #1 / Deal #1. Delivered in one pass across six work blocks; expect a couple of follow-up rounds for polish.

## Block 1 — Platform identity and hierarchy

- Rename globally to "Tech Mahindra Salesforce OSP Deal Builder" (nav title "OSP Deal Builder"): page title, meta tags, login screen, sidebar, exports. No customer branding in the core shell.
- New three-level hierarchy: Customer → Deal → Scenario. Breadcrumbs reflect scope (`OSP Workspace > Smith+Nephew > FY27 Renewal > Scenario`).
- New home screen **OSP Deal Workspace** (replaces the current per-deal dashboard as `/`):
  - Portfolio KPI cards: Active deals, In simulation, License TCV, Services TCV, Pipeline TCV, Expected TechM GP, Below margin floor, Awaiting Salesforce validation, Using Innovation Fund, Using Marketplace, Closing this quarter.
  - Searchable/filterable **Deal Portfolio** table with every column listed in the brief (customer, opportunity ID, industry, region, AE/leads, deal type, stage, close date, current vs proposed ACV, license/services/combined TCV, license/services/blended GM, customer savings, Innovation Fund, Marketplace, risk, validation, last modified).
  - Filters: customer, industry, geography, stage, deal type, product family, TCV range, margin, close quarter, marketplace route, Innovation Fund, validation status.
- Persistent **deal context header** inside a deal: customer + deal name, type, term, currency, close date, plus actions — back to workspace, switch customer, switch deal, clone, create scenario, compare, export.
- Existing per-deal dashboard moves to `/deal` (deal economics scope); scenario economics stay scenario-scoped. Scopes never mixed.
- Global search across customers, deals, opportunities, SKUs, Salesforce AEs and TechM owners.

## Block 2 — Data model

- **customers**: name, industry, sub-industry, region, country, currency, employee count, revenue, Salesforce customer since, current Salesforce ACV, AWS/Azure/GCP commitments, strategic platforms, incumbent vendors, logo/primary/secondary colour (deal-specific branding), notes.
- **deals** (extend existing): customer_id, opportunity_id, deal_type, stage, region, contract_years, close_date, salesforce_ae, techm_account_lead, techm_osp_lead, finance_owner, source_deal_id, is_simulation, current_scenario_id, health_score fields.
- Deal types: Renewal, Renewal + Growth, Net New, Expansion, Competitive Displacement, Platform Consolidation, OSP Pre-Buy, Transformation Bundle, Marketplace Transaction, License Optimization, Mixed/Custom.
- Stages: Simulation → Qualification → Discovery → BOM Analysis → Commercial Design → Salesforce Negotiation → Customer Negotiation → Finance Approval → Contracting → Closed Won / Closed Lost / On Hold.
- **sku_lines** gains commercial-layer + economics fields: commercial_layer (A protected / B committed growth / C future transformation), wholesale/acquisition price, customer price, current contract price, edition, metric, growth category, margin.
- **sku_library** extended to a master Salesforce catalog: product family (Sales, Service, Agentforce, Data 360, Revenue Cloud, Field Service, Industry Clouds, MuleSoft, Tableau, Slack, Marketing, Experience, Platform, Shield, Sandboxes, Success Plans, Maps, Other), edition, metric, billing unit, list/wholesale price. Admin-extendable.
- New tables: **services_constructs** (annual fee, cost, GM, attach %, scope), **innovation_funds** (TransformationInnovationFund per deal, template, sizing, funded-by split, drawdown), **incumbent_platforms** / **replacement_platforms** (generic displacement), **marketplace_models** (AWS/Azure/GCP, EDP/PPA, CPPO, fees, drawdown), **deal_versions** (snapshot JSON, label, author, timestamp), **validation_items** (scope: universal / salesforce-commercial / customer-specific), **value_levers** (customer value framework selections), **deal_templates**, **global_defaults** (admin).
- Every new table: GRANTs to authenticated + service_role, RLS read for signed-in, writes via `can_edit_deal()`. Existing rows backfilled to the S+N customer/deal; no data loss.

## Block 3 — Deal creation, simulation, cloning

- **+ Create New Deal** wizard with three paths:
  - From scratch: customer (new or existing), industry, geography, currency, owners, AE, opportunity name, deal type, term, close date, current Salesforce spend, renewal uplift, minimum TechM margin, services attach.
  - Import existing BOM: extends the current Excel/CSV import (adds Salesforce quote/order export shape and manual entry) with the existing preview step.
  - Clone existing deal: checkbox scope — everything, structure only, SKU categories without quantities, discount assumptions, services construct, TIF construct, marketplace construct. Resets customer name, contract/opportunity IDs, selected prices, approvals, validation confirmations.
- **Simulation mode**: deals with `is_simulation = true`, customer optional (anonymous or user-named). Full commercial engine available. "Convert simulation to live deal" attaches a real customer and stage without rebuilding.
- **Deal template library** with the seeded templates: Enterprise Renewal + Growth, Agentforce Transformation, Revenue Cloud Displacement, Field Service Consolidation, Platform Consolidation, AWS Marketplace OSP, License + Services Bundle, Transformation Innovation Fund, plus "Smith+Nephew FY27 Deal".
- **Global default assumptions** admin screen: 3-year term, 5% renewal uplift, 5% minimum license GM, 25% services GM, USD. Deals override freely.

## Block 4 — Commercial engines (platform logic, customer-agnostic)

- Layered BOM: classify each line into Layer A/B/C; totals and waterfall reported per layer (Layer A = 0 supported for net-new).
- Buy/sell economics: Salesforce acquisition cost vs customer price → license GP and GM per line, tower, layer, scenario and deal; margin-floor breach flags.
- Services economics: annual fee, cost, GM, attach % → services TCV/GP, blended GM.
- Transformation Innovation Fund: templates (No Fund, Margin-Floor, Balanced, Strategic Growth, Competitive Displacement, Custom), sizing as % of TCV, funded-by split, drawdown schedule.
- Competitive displacement engine: generic incumbent → replacement pairs (PROS→Revenue Cloud, ServiceMax→Field Service, Dynamics/SAP/Oracle CPQ/Adobe/Boomi/Qlik and custom legacy), savings and TCO comparison.
- Cloud Marketplace Optimizer (renamed): full AWS (Marketplace, EDP/PPA, CPPO, fees, commitment drawdown); Azure/GCP as extensible placeholders.
- Customer value framework: selectable levers per deal (avoided uplift, consolidation, rationalization, displacement, TIF, AWS optimization, managed-services savings, implementation efficiency, productivity, revenue uplift, cost avoidance, vendor consolidation) rolling into customer savings.
- **Deal Health Score** 0–100 from customer value, Salesforce value, TechM economics, commercial readiness and risk — with driver breakdown.
- Existing pricing engine (3-year term basis, discount waterfall) stays intact and gains the layer/GM extensions; the current test suite is extended.

## Block 5 — Governance, analytics, partner view

- **Validation Center** split into Universal checks (TCV reconciliation, annual totals, co-terming, price recurrence, quantity discrepancies, margin floor), Salesforce Commercial checks (discount, entitlements, product swap, Innovation Fund, marketplace eligibility) and Customer-Specific checks (per-deal only, so S+N items never leak into other deals).
- **Deal versioning**: snapshot on significant commercial revisions; list, compare, restore, and attribute changes.
- **Portfolio analytics** dashboard for TechM leadership: pipeline (total/license/services TCV), economics (license/services/blended/weighted GP), Salesforce growth by cloud (Agentforce, Data 360, Revenue Cloud, Field Service, MuleSoft ACV), Innovation Funds (proposed, Salesforce-funded, TechM-funded, available, consumed), risk (below margin floor, critical validation, exceptional discount, AWS eligibility pending).
- **Salesforce Partner View**: per-deal aggregate for account planning (current/protected/growth/new-product ACV, 3-yr TCV, displacement, cloud growth, TIF request, requested Salesforce economics, close date).
- **Cross-deal benchmarking**: anonymized aggregates only (avg license GM, Salesforce discount, customer savings, services attach, TIF % of TCV, Agentforce penetration, marketplace adoption, deal cycle, services GM) with "compare this deal to similar transactions". No other customer's identifiable data exposed.

## Block 6 — Seed data

- **Customer: Smith+Nephew**, deal **FY27 Salesforce OSP Renewal & Transformation** (Renewal + Growth / Transformation Bundle). Existing 63-SKU BOM, 8 scenarios, towers, discussion log and risk register re-parented unchanged, plus the brief's figures seeded as deal data: $6.260M normalized BOM, 5% uplift, $6M protected base, $2.009M/$1.665M/$1.665M growth, $23.340M license TCV, $22.222M modeled acquisition cost, $2M/yr services at 25% GM, 5% minimum license GM, PROS ($2.5M, 1,100 CPQ users) → Revenue Cloud, ServiceMax/FSL 300-user opportunity, Agentforce growth, TIF scenarios, AWS Marketplace scenario, and the customer-specific validation items (Partial Copy, Agentforce 1,000 vs 4,557, Digital/Data 360, Shield).
- **Customer: Demo Manufacturing Company**, deal **New OSP Simulation** — generic sample values only, proving no S+N coupling.
- No S+N value becomes a global default; global defaults come only from the admin defaults table.

## Technical notes

- Stack unchanged: Vite + React Router + Tailwind + shadcn + TanStack Query + Lovable Cloud. No SSR, no new framework.
- Schema arrives as sequenced migrations (create + GRANT + RLS + policies, then backfill, then NOT NULL) so existing S+N data is never dropped.
- Query layer: `useDealData.ts` gains customer/portfolio hooks; every query key includes `customer_id`/`deal_id` so switching context refetches cleanly. `DealContext` grows `activeCustomerId` alongside `activeDealId`/`activeScenarioId`.
- Economics live in `src/lib/` modules (`pricing.ts`, new `economics.ts`, `innovationFund.ts`, `displacement.ts`, `marketplace.ts`, `health.ts`) as pure functions with vitest coverage — platform logic separated from deal data.
- Confidentiality: RLS keeps reads to signed-in TechM users; benchmarking queries return aggregates only.
- Navigation reorganized into Workspace / Deal / Modelers / Economics / Governance / Admin groups.
