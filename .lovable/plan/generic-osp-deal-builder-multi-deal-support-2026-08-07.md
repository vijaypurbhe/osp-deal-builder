# Generic OSP Deal Builder — multi-deal support

Turn the single-customer tool into a multi-deal workspace. The current Smith+Nephew configuration is preserved intact as the first deal; users can create new deals from scratch, from a SKU library, by cloning an existing deal's BOM, or by importing a workbook.

## What changes for the user

**Deal switcher (header)**
- A new deal selector sits above the existing scenario selector: pick a deal, then a scenario within it.
- "New deal" opens a short wizard.

**New deal wizard**
1. Deal details — deal name, customer name, partner name, currency, contract start/end, owner.
2. Starting BOM — choose one:
   - Blank (add lines manually later)
   - Pick SKUs from the global Salesforce SKU library (searchable, multi-select with quantities)
   - Clone an existing deal (copies its scenarios, SKU lines, towers, tiers)
   - Import a workbook (routes into the existing import screen, pre-bound to the new deal)
3. Scenarios — create a default set (Baseline / Expected / Upside) or start with one scenario.

**Global SKU library**
- New "SKU library" screen: the master catalogue of Salesforce SKUs (name, code, family, cloud, UoM, list price, default tower), seeded from the current Smith+Nephew 63-SKU set.
- Editable, and any deal's lines can be added to the library ("promote to library").
- The existing "SKU catalogue" screen stays as the per-deal view of lines in use.

**Per-deal branding**
- Customer/partner names, currency and contract dates come from the deal record. Headers, order forms and Excel exports read them instead of hardcoded "Smith+Nephew" / "Salesforce".

**Everything scoped to the deal**
- Scenarios, SKU lines, towers, bulk tiers, order forms, discussion log and risk register all belong to a deal. Switching deals switches all of them.

**Access**
- Every signed-in user can see all deals; editing stays gated by the existing role check. Deal create/delete is limited to editor roles.

## Technical section

**Schema (migration)**
- New `deals` table: `name`, `customer_name`, `partner_name`, `currency`, `contract_start`, `contract_end`, `status`, `owner_id`, `owner_name`, `notes`, `is_archived`, `sort_order`. GRANTs to `authenticated` + `service_role`; RLS: read for authenticated, write via `can_edit_deal()`.
- New `sku_library` table: `sku_code`, `sku_name`, `description`, `product_family`, `product_category`, `cloud`, `unit_of_measure`, `unit_list_price` (3-yr term), `billing_frequency`, `default_tower_key`, `is_active`. Same GRANT/RLS shape.
- Add `deal_id uuid not null references public.deals(id) on delete cascade` to `scenarios`, `towers`, `discussion_items`, `risk_log`. (`sku_lines`, `bulk_discount_tiers`, `order_forms`, `import_batches` inherit scope through `scenario_id`.)
- Backfill: insert one deal "Smith+Nephew Salesforce OSP" and set `deal_id` on all existing rows to it; then apply NOT NULL. Indexes on all new `deal_id` columns.
- Seed `sku_library` from the distinct SKUs of the existing baseline scenario.
- Keep `is_locked` on the Current BOM Baseline scenario as-is.

**Frontend**
- `DealContext`: add `deals`, `activeDealId` (persisted to localStorage), `activeDeal`; `activeScenarioId` resets/auto-selects when the deal changes.
- `useDealData.ts`: add `useDeals`, `useSkuLibrary`, `useCreateDeal`, `useCloneDeal`; filter `useScenarios`/`useTowers`/`useDiscussionItems`/`useRiskLog` by `deal_id` and add `deal_id` to their query keys.
- `AppShell.tsx`: deal selector + "New deal" button next to the scenario selector; show `activeDeal.customer_name` in the header.
- New `src/pages/DealsPage.tsx` (list/manage deals, archive, duplicate) and `src/components/deals/NewDealDialog.tsx` (the wizard).
- New `src/pages/SkuLibraryPage.tsx` plus an "Add from library" dialog wired into `ScenarioBuilderPage`.
- Clone logic runs client-side in a single mutation: copy scenarios → map old scenario ids to new → copy sku_lines, bulk tiers, scenario_models, order forms; copy towers/discussion/risks at deal level.
- Replace hardcoded customer/partner strings in `OrderFormPage.tsx`, `Dashboard.tsx`, `SettingsPage.tsx` and exports with deal fields; `order_forms` defaults come from the deal.
- `navigation.ts`: add "Deals" and "SKU library" entries; `App.tsx` gets `/deals` and `/sku-library` routes.
- Pricing engine (`src/lib/pricing.ts`) is unchanged — 3-year term basis stays.
