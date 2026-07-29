## Goal

Remove the existing Phoenix/GE Vernova demo entirely and rebuild the app as the **Smith+Nephew Salesforce OSP Deal Builder**, keeping the current Vite + React Router + Tailwind + shadcn SPA architecture and the Lovable Cloud backend.

## What gets removed

All demo pages (`Home`, `Clients`, `Projects`, `Analytics`, `Document Review`, `Search`), `PhoenixContext`, the `src/data/*` mock files, and the analytics component set. The shadcn UI primitives, Supabase client, and the app shell/auth patterns are kept and reworked.

## Visual direction

White canvas, dark navy `#101828` type, neutral gray `#667085`, orange `#FF6B00` primary accent, teal `#007C7A` secondary, with `#FFF1E6` / `#E8F7F6` tints for surfaces and status chips. All defined as semantic tokens in `index.css` + Tailwind config — no hardcoded colors in components. Text-only brand labels, no logos.

## Backend (Lovable Cloud)

New schema, all RLS-protected with explicit grants:

- `profiles` — display name, org (Tech Mahindra / Salesforce / Smith+Nephew), auto-created on signup
- `app_role` enum extended with: `deal_architect`, `salesforce_ae`, `tm_osp_lead`, `sn_reviewer`, `finance_reviewer`
- `user_roles` — reused; role checks via existing `has_role()` security-definer function
- `scenarios` — name, status, owner, locked, recommended, notes, scenario-level + bulk discount settings
- `sku_lines` — the full SKU catalog row spec from the document (codes, tower, family, classification, qty, UoM, list price, billing frequency, all discount levels, Y1–Y3 quantities and nets, dates, proration, approval status, owner, notes, source tab), scoped to a scenario
- `towers` — the five product towers with decision status, confidence, assumptions count
- `growth_model`, `sandbox_config`, `data360_model`, `agentforce_model`, `mulesoft_model`, `servicemax_model` — one config row per scenario each
- `discussion_items` — Shield / CPQ-CLM / Contact Center / South Africa Health Cloud cards
- `bulk_discount_tiers`, `order_forms`, `order_form_lines`, `risk_log`, `import_batches`
- Access rules: any signed-in member can read; editing gated by role (SKU base pricing editable by Deal Architect + Salesforce AE; scenario modeling by TM OSP Lead; S+N reviewer read + comment/approve; Finance reviewer read + approval flags)

Seed data: the known baselines from the document (4,073 Sales & Service, 80 Health Cloud, 2,275 CRM Analytics Plus, 625 Maps, 280 Platform Starter, 5 Integration users), the 8 default scenarios, five towers, seeded risk categories and discussion cards. All values editable — no pricing hardcoded as final.

## Auth

Email/password + Google sign-in on a rebuilt `/login` + `/signup`, `/reset-password` page included. Profile is created on signup; a role is assigned by an admin from Settings. Signed-out users are redirected to login.

## Screens (all 15, left-side nav)

1. **Executive Dashboard** — 13 KPI cards, current-vs-revised ACV by year, ACV by cloud, discount waterfall, user growth bridge, Data 360 and MuleSoft consumption projections, executive summary panel
2. **Current BOM Import** — .xlsx/.csv upload, tab detection, per-tab grid preview, column mapping UI with AI-suggested mapping (Lovable AI) and manual override, "Normalize BOM" action, validation report with all nine check categories
3. **SKU Catalog** — Excel-like inline-editable grid with filter/group/sort/duplicate detection/export
4. **Revised BOM Builder** — five tower panels with their SKU groups and per-tower rollups (current/revised/incremental ACV, TCV, effective discount, SKU count, open assumptions, confidence, decision status)
5. **Scenario Builder** — create/copy/rename/lock/notes/owner/status/recommend, 8 seeded scenarios
6. **Discount Engine** — 7 discount levels, waterfall visual, guardrail warnings, bulk discount tiers with SKU exclusions and one-time-vs-recurring modeling
7. **Data 360 & Agentforce Modeler** — Data Cloud/marketing expansion inputs plus the Agentforce Sales add-on and Flex Credits consumption models with ramp and buffer
8. **MuleSoft Capacity Modeler** — vCore/API/connector inputs, capacity by year, headroom %, under-sizing risk
9. **ServiceMax / Service Cloud Modeler** — incremental user derivation, add-ons, sandbox and integration dependencies, Y1–Y3 ACV
10. **CPQ / CLM & Discussion Items** — four card groups with status, owner, impacts, decision date, include/defer
11. **Order Form Builder** — 9 order form types, generated line tables, export
12. **Scenario Comparison** — side-by-side metrics, ACV bar chart, waterfall, stacked family costs, risk heatmap, top-10 cost drivers and savings tables
13. **Approval & Risk Log** — full risk/decision register with seeded categories
14. **Export Center** — Excel, CSV, PDF-style summary, copyable Markdown
15. **Settings** — user/role management, thresholds, currency, contract dates, assumptions defaults

Also included: the user growth model (with conservative/expected/upside sliders and bridge chart) inside the Revised BOM Builder, and the Sandbox Requirements card with the Data Mask / Shield flag.

## Calculation layer

A single typed pricing module implements the document's formulas exactly — List ARR → line discount → category discount → bulk discount → strategic override → net, effective discount %, 3-year TCV with proration — and is shared by every screen so numbers never diverge. Unit tests cover the waterfall and TCV math.

## Technical notes

- Vite SPA, React Router routes under one authenticated shell; TanStack Query stays only as the existing data-fetch layer already wired in the template
- Spreadsheet parsing via `xlsx` (SheetJS) client-side; exports via `xlsx` and a print-styled PDF summary view
- Charts with Recharts
- AI column-mapping suggestion runs through a Lovable Cloud edge function using the Lovable AI gateway (the existing `agent-chat` function is replaced)
- `index.html` metadata updated to the new product title and description

## Build order

Backend schema + auth/roles → design tokens and app shell/nav → pricing engine → SKU Catalog + Revised BOM Builder + Import → Scenario Builder/Comparison/Discount Engine → the four modelers + discussion items → Order Forms, Risk Log, Export Center, Settings → Executive Dashboard last (it aggregates everything).
