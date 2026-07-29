## PHOENIX 360 — AI-Powered Client, Project & Relationship Platform

Full replacement of the existing "Unified Financial Services Engagement Hub" demo with a World Bank Group / IFC-style investment operations prototype. Same Vite + React Router + Tailwind + shadcn SPA architecture; all data mock-seeded and deterministic, no auth required.

### Removal
Delete all current pages (Client360, PolicyDetail, AccountDetail, CaseWorkspace, ClaimWorkspace, WorkPage, KnowledgePage, DocumentsPage, AnalyticsPage, AdminPage, SelfService, Login, SearchPage, Home), the insurance seed data, types, services, and insurance-specific common components. Keep `src/components/ui/*` (shadcn), hooks, utils, and the Vite/Tailwind/test config.

### Design system
Rewrite `index.css` + `tailwind.config.ts` tokens to the institutional palette: navy `#0B3B60` primary, institutional blue `#185F8C`, teal `#3E7F8F`, light teal `#DDEFF2`, green `#16866B`, gold `#C79A4B`, red `#C53A4A`, surface `#F5F7F9`, border `#D8E2EA`, text `#1D2939`/`#526078`. White background, minimal gradients, 8–12px radii, subtle shadows, Inter typography, large KPI numerals. All values as HSL semantic tokens — no hardcoded colors in components.

### Data layer (`src/data/`)
Typed seed modules covering the full entity model: Client, ClientGroup, Contact, Relationship, CoverageTeam, Opportunity, InvestmentProject, ProjectStage, ProjectTeam, Review, Approval, Condition, Exposure, Covenant, RiskSignal, ComplianceRequirement, DevelopmentOutcome, Interaction, Commitment, Task, Case, Document, DocumentVersion, IntegrationEvent, DataQualityIssue, AIRecommendation, AuditEvent.

Volumes: 8 named clients, 25 projects, 20+ contacts, 40 documents, 30 interactions, 20 risk signals, 25 conditions, 20 approvals, 15 cases, 50 tasks, 12 integration events — cross-referenced by stable IDs. A thin service layer (async, simulated latency) sits between seeds and UI so a backend can replace it later.

### Application shell
- Header: PHOENIX 360 wordmark, persona switcher (7 personas), global search (⌘K across clients/projects/contacts/documents/cases/approvals), Ask Phoenix AI, notifications, help, profile.
- Left nav: Home, Clients, Relationships, Projects, Pipeline, Due Diligence, Portfolio, Exposure & Compliance, Service & Operations, Documents, Analytics, Integration Center, Migration Factory, Platform Governance.
- Breadcrumbs, contextual page actions, quick-create menu, right-side Phoenix AI panel.
- Global state via a Phoenix context (persona, recents, notifications, AI panel, audit log) persisted to localStorage.

### Modules (routes)
1. **Home / Command Center** — persona-aware greeting + summary, 8 KPI cards, executive charts (pipeline by stage, projects by region, portfolio by sector, exposure by risk, cycle time, conditions due, engagement trend, development outcomes), AI-ranked priority work with Take Action, AI Daily Briefing.
2. **Clients + Client 360** — full header metrics, 10 tabs, AI client summary, relationship graph (SVG/force layout, filterable, internal vs external, click-through), Prepare for Meeting briefing modal.
3. **Relationship Intelligence** — coverage map, strength/sentiment/influence, gaps, key-person dependency, AI summary, action buttons (briefing, agenda, attendees, follow-up, commitment, task, plan).
4. **Projects + Project 360** — GreenGrid PHX-2026-1048 as flagship, header health/readiness metrics, 11-stage lifecycle tracker with entry/exit criteria and predicted delay risk, 12 tabs.
5. **Pipeline** — table / kanban / lifecycle view switcher with filters.
6. **New Investment Project** — 10-step guided origination wizard with simulated document extraction, AI suggestions with confidence scores and accept/edit/reject/feedback, validation, no silent AI commits.
7. **Due Diligence Command Center** — metrics, 10 workstream cards, dependency map, document review screen (preview, extracted data, findings, source-page references, confidence, comments, accept/reject, audit history).
8. **Reviews, Approvals & Conditions** — visual branching approval path with node detail, conditions register with AI extraction/owner/due-date suggestions and escalation drafts.
9. **Exposure & Compliance** — exposure waterfall, by entity/country, risk heatmap, covenant calendar, concentration; Early Warning Center with evidence, confidence, recommended action, dismiss/escalate.
10. **Service & Operations** — omnichannel queue, SLA countdowns, AI routing/response/dedupe/sentiment, case detail workspace.
11. **Documents** — categories, search, preview, version compare, metadata, security/retention, AI summary and extracted terms; grounded knowledge assistant with sources, page refs, confidence, coverage disclaimer.
12. **Analytics** — filter bar plus pipeline, processing, portfolio, relationship and operations sections; AI insight panel with drill-through to supporting records.
13. **Integration Center** — architectural node graph (Salesforce fabric ↔ Azure ↔ legacy systems), health metrics, event list and event detail with payload, error, retry, correlation ID.
14. **Migration Factory** — 9-stage lifecycle, object cards, quality metrics, cutover readiness score with contributing factors.
15. **Platform Governance** — IAM, Shield, data governance, audit, observability, DevOps, release, AI governance dashboard, role-based access demos.

### Phoenix AI assistant
Persistent right-side panel, context-aware of the current record. Deterministic scripted responses keyed to client/project/document/case/signal, streamed with a typing indicator. Suggested prompt chips, follow-ups, confirmation preview modal for consequential actions, and a trust panel (grounding, confidence, explain, audit, report, data boundary).

### Reusable components
PersonaSwitcher, GlobalSearch, KPIGrid, StatusBadge, RiskBadge, AIInsightCard, NextBestActionCard, RelationshipGraph, LifecycleTracker, ApprovalPath, DueDiligenceWorkstream, DocumentIntelligencePanel, RiskSignalCard, ExposureChart, ProjectHealthCard, IntegrationNode, SystemHealthCard, AuditTimeline, AITrustPanel, PhoenixAIAssistant, DataQualityIndicator, SourceReference, ConfirmationModal.

### Technical notes
- Charts: existing `recharts`. Graphs/diagrams: custom SVG + `framer-motion` (avoids adding React Flow and keeps the bundle lean); can swap later if you prefer React Flow.
- No external LLM calls; the existing `agent-chat` edge function stays untouched and unused so a live model can be wired in later.
- Metadata in `index.html` updated to PHOENIX 360 title/description/OG tags.
- Build order: design tokens → seed data + services → shell → Home → Client 360 → Project 360 → Phoenix AI → due diligence → approvals/conditions → risk → analytics → integration → migration → governance → polish pass (loading/empty states, toasts, micro-interactions).

This is a large multi-step build; expect it to run across several implementation rounds.
