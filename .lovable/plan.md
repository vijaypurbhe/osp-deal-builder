# Production Hardening: Per-User Deals, Admin Roles, Salesforce Blue

## 1. Access model

Today every signed-in user can read *and* edit every deal — the database policies allow read for all authenticated users, and write for anyone holding the `deal_architect` role (which is granted automatically to every new sign-up). That is the main production gap.

New model:

```text
admin            -> sees and edits every deal, every customer, every simulation
deal owner       -> full control of the deals they created
collaborator     -> per-deal invite: viewer (read) or editor (read + write)
any signed-in    -> read-only access to the shared simulation template
```

- Add an `osp_admin` role to the role enum. Your account (`vijaypralhad.purbhe@techmahindra.com`) is seeded as `osp_admin`.
- New `deal_members` table: `deal_id`, `user_id`, `role` (`viewer` | `editor`), invited by owner or admin.
- Existing "FY27 Salesforce OSP Renewal & Transformation" deal is assigned to you as owner.
- The "New OSP Simulation" deal becomes the shared read-only template: every login can open and explore it; "Use as my simulation" clones it into a private deal they own.
- Remove the automatic `deal_architect` grant on sign-up; new users start with no deals and create their own.

## 2. Access enforcement

Every deal-scoped table (scenarios, sku_lines, towers, order_forms, risk_log, discussion_items, validation_items, services_constructs, innovation_funds, marketplace_models, incumbent_platforms, value_levers, bulk_discount_tiers, deal_versions, import_batches, scenario_models, order_form_lines) gets policies derived from the parent deal via security-definer helpers:

- `can_read_deal(deal_id)` — owner, member, admin, or the shared simulation template
- `can_write_deal(deal_id)` — owner, editor member, or admin (and never on a locked/read-only scenario)

Customers become owner-scoped the same way (visible if you own or collaborate on a deal for that customer, or you are an admin).

## 3. UI changes

- **Deal ownership** shown on the workspace/portfolio: owner name, "Shared with N", simulation badge.
- **Share dialog** on a deal: invite by email, pick viewer/editor, revoke access. Owner + admin only.
- **Admin console** (new page, admin-only): all deals across all users, all members, role assignment for users.
- **Simulation sandbox**: banner on the shared template explaining it is read-only, with a one-click "Create my simulation" clone.
- Write-blocked UI: inputs disable and show a clear "read-only" reason (not owner / viewer / locked scenario) instead of failing silently.

## 4. Validation hardening

- Central `zod` schemas for every editable entity (deal, scenario, SKU line, risk, discussion, fund, marketplace, services, customer) with numeric bounds: quantities >= 0, discount percentages 0–100, dates ordered (contract start < end), string length caps, currency whitelist.
- Wire them into the create/edit dialogs and the mutation hooks so invalid values never reach the database, with inline field-level error messages.
- Mirror the critical invariants as database CHECK/trigger validation (percentages in range, quantity non-negative, contract dates ordered).
- BOM import: validate parsed rows against the same schemas and show a per-row error report before the deal is created; block import when required columns are missing.

## 5. Testing

- Extend `src/lib/pricing.test.ts` and add unit tests for `src/lib/economics.ts` (buy/sell margin, deal health, marketplace recommendations, portfolio aggregation).
- Add validation-schema tests covering boundary and rejection cases.
- Add access-model tests: a helper-function test suite run against the database confirming owner / collaborator / admin / other-user visibility for each deal-scoped table.
- Run the full suite plus a type check and report results.

## 6. Salesforce blue colour scheme

Rework the design tokens in `src/index.css` (light + dark) and `tailwind.config.ts` so the primary brand is Salesforce blue instead of orange:

```text
primary        #0176D3  (Salesforce blue)
primary dark   #032D60  (deep navy blue, headers/sidebar)
accent tint    #EAF5FE  (light blue surfaces)
secondary      #0B827C  (teal, retained for contrast)
success        #2E844A
warning        #FE9339
destructive    #EA001E
```

Charts, sidebar, focus rings, badges and KPI tones all re-derive from these tokens, so no component-level colour edits are needed beyond replacing any leftover hardcoded orange. Typography and layout stay as-is.

## Technical notes

- Role checks use `SECURITY DEFINER` helper functions (`is_osp_admin()`, `can_read_deal(uuid)`, `can_write_deal(uuid)`) to avoid recursive policy evaluation.
- Every new table gets explicit `GRANT`s alongside RLS.
- Collaborator invites resolve email -> user id through a definer function against `profiles`; invites for unknown emails are stored as pending and bind on first sign-in.
- `deals.owner_id` becomes `NOT NULL` with a default of `auth.uid()` for new rows; existing rows backfilled to your account.
