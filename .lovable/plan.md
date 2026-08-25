# Seller enablement pack: screenshot guide + launch email

Two deliverables for internal sellers, both generated as downloadable artifacts. No changes to the application itself.

## 1. Screenshot walkthrough (PDF)

A branded PDF guide — Salesforce blue / deep navy, OSP logo on the cover — with one screen per page: a framed screenshot on the left/top and text annotations alongside it (what this screen is for, what to do here, what to watch out for).

Structure, ordered as a seller journey and covering every screen:

1. **Getting started** — cover page, "what this tool is", how to sign in, password reset.
2. **Workspace & portfolio** — OSP deal workspace, Customers, Deals list, creating a new deal (wizard incl. BOM import), SKU library.
3. **Building the deal** — Deal dashboard, Commercial economics, SKU catalogue, Scenario builder (manual lines, confirm/reopen baseline), Scenario comparison, Discount workbench.
4. **Value plays** — Innovation fund, Cloud marketplace, Competitive displacement, Order form builder.
5. **Modelers** — Growth, Data 360, Agentforce, MuleSoft, ServiceMax.
6. **Portfolio & governance** — Portfolio analytics, Benchmarks, Partner view, Validation centre, Data import, Discussion log, Risk register, Settings, Admin console (marked admin-only).
7. **Closing** — quick-reference cheat sheet (key terms: list vs net ARR, 3-year term basis, buy/sell GM, approval thresholds) and a "your first deal in 10 minutes" checklist.

**Screenshot data:** a neutral sample deal is created in the app first (e.g. "Northwind Manufacturing — Salesforce OSP") with representative towers, SKU lines, discounts and services so every screen shows populated, realistic-looking numbers without exposing Smith+Nephew data. The sample deal stays in the workspace as a training deal unless you want it removed afterwards.

## 2. Launch email

A structured, ready-to-send email signed by Vijay Purbhe, professional tone:

- Subject line plus a one-line summary.
- **Why** — why OSP deals need consistent commercial modelling; the cost of ad-hoc spreadsheets.
- **What** — what the tool is and what it covers (multi-deal workspace, buy/sell economics, scenarios, discount governance, marketplace and innovation-fund plays, order forms, validation).
- **How** — how to get access, build your first deal in five steps, where the guide lives, who to contact.
- Short closing with a call to action.

Delivered as text in chat (ready to paste into Outlook) plus a clean copy inside the artifacts folder.

## Technical section

- Screenshots captured with Playwright against the running preview at 1440-wide viewport, authenticated as a signed-in user, one PNG per route from `src/lib/navigation.ts` plus login/reset and the new-deal wizard dialogs; each image is framed with a light window chrome before placement.
- Sample deal seeded through the app's own mutations/SQL so pricing math and health scores compute normally (3-year term basis preserved).
- PDF built with ReportLab (Platypus) using brand tokens from `src/index.css`; every page converted to JPEG and visually QA'd for clipping, overlap and missing images before delivery.
- Output: `/mnt/documents/osp-deal-builder-seller-guide.pdf` and `/mnt/documents/osp-seller-launch-email.md`.
