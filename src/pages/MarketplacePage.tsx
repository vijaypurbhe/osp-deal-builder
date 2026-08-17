import { useMemo } from "react";
import { useDeal } from "@/context/DealContext";
import { useDealEconomics } from "@/hooks/useDealEconomics";
import { useCustomers, useMarketplaceModels, useSaveCommercialRow } from "@/hooks/useCommercial";
import { marketplaceRecommendations, type MarketplaceRecommendation } from "@/lib/economics";
import SectionCard from "@/components/common/SectionCard";
import KpiCard from "@/components/common/KpiCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { currency, percent } from "@/lib/format";
import { MARKETPLACE_ELIGIBILITY, MARKETPLACE_PROVIDERS, MARKETPLACE_ROUTES } from "@/types/deal";
import { CheckCircle2, CloudCog, Plus, Sparkles, TriangleAlert, XCircle } from "lucide-react";

const checkIcon = {
  pass: CheckCircle2,
  warn: TriangleAlert,
  fail: XCircle,
} as const;

const checkTone = {
  pass: "text-secondary",
  warn: "text-amber-600 dark:text-amber-400",
  fail: "text-destructive",
} as const;

const eligibilityVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  Eligible: "secondary",
  Pending: "outline",
  "Not eligible": "destructive",
  "Not applicable": "outline",
};

export default function MarketplacePage() {
  const { canEdit } = useDeal();
  const view = useDealEconomics();
  const { data: models } = useMarketplaceModels();
  const { data: customers } = useCustomers();
  const save = useSaveCommercialRow("marketplace_models", [["marketplace_models"], ["portfolio"]], "Marketplace model saved");

  const deal = view?.deal ?? null;
  const customer = useMemo(
    () => (customers ?? []).find((c) => c.id === deal?.customer_id) ?? null,
    [customers, deal?.customer_id],
  );

  const recommendations = useMemo<MarketplaceRecommendation[]>(() => {
    if (!view) return [];
    return marketplaceRecommendations({
      licenseTermValue: view.economics.license.netTermValue,
      customer,
      models: models ?? [],
      partnerName: view.deal.partner_name,
    });
  }, [view, customer, models]);

  if (!view || !deal) return <p className="text-sm text-muted-foreground">Open a deal to run the Cloud Marketplace Optimizer.</p>;

  const { economics: e } = view;
  const cur = deal.currency;
  const rows = models ?? [];
  const active = rows.find((m) => m.is_enabled) ?? rows[0] ?? null;
  const best = recommendations.find((r) => r.recommendedRoutePct > 0 && r.eligibility !== "Not eligible") ?? null;

  const applyRecommendation = (r: MarketplaceRecommendation) => {
    const existing = rows.find((m) => m.provider === r.provider);
    save.mutate({
      ...(existing ?? {}),
      deal_id: deal.id,
      provider: r.provider,
      route: r.recommendedRoute,
      is_enabled: true,
      commitment_total: r.commitment,
      commitment_remaining: existing ? existing.commitment_remaining : r.commitment,
      drawdown_pct: r.recommendedRoutePct,
      marketplace_fee_pct: r.recommendedFeePct,
      cppo: r.recommendCppo,
      eligibility_status: r.eligibility === "Not applicable" ? "Pending" : r.eligibility,
    });
  };


  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Licence TCV routed" value={currency(e.marketplace.routedTermValue, cur)} icon={CloudCog} />
        <KpiCard label="Marketplace fee" value={currency(e.marketplace.fee, cur)} tone={e.marketplace.fee > 0 ? "warning" : "default"} />
        <KpiCard label="Commitment drawdown" value={currency(e.marketplace.commitmentDrawdown, cur)} hint={`${currency(e.marketplace.commitmentAfter, cur)} remaining`} />
        <KpiCard
          label="Commitment coverage"
          value={e.marketplace.routedTermValue > 0 ? (e.marketplace.coversRouted ? "Covered" : "Short") : "n/a"}
          tone={e.marketplace.routedTermValue > 0 && !e.marketplace.coversRouted ? "critical" : "positive"}
        />
      </div>

      <SectionCard
        title="Marketplace readiness recommendation"
        description={
          best
            ? `${best.provider} is the strongest route for this deal — predicted incremental licence TCV of ${currency(best.netIncrementalTermValue, cur)} net of listing fees`
            : "No provider currently clears the eligibility checks — this deal should transact direct"
        }
        actions={
          best && (
            <Button size="sm" disabled={!canEdit} onClick={() => applyRecommendation(best)}>
              <Sparkles className="mr-1.5 h-4 w-4" /> Apply {best.provider} recommendation
            </Button>
          )
        }
      >
        {!customer && (
          <p className="mb-3 text-xs text-muted-foreground">
            No customer profile linked to this deal — eligibility is inferred from the configured provider models only. Link a customer to use their committed cloud spend.
          </p>
        )}
        <div className="grid gap-4 lg:grid-cols-3">
          {recommendations.map((r) => (
            <div key={r.provider} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-sm font-semibold">{r.provider}</p>
                  <p className="text-xs text-muted-foreground">{r.recommendedRoute}</p>
                </div>
                <Badge variant={eligibilityVariant[r.eligibility]}>{r.eligibility}</Badge>
              </div>

              <dl className="mt-3 space-y-1.5 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Committed spend</dt>
                  <dd className="tabular-nums">{currency(r.commitment, cur)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Recommended routing</dt>
                  <dd className="tabular-nums">{percent(r.recommendedRoutePct, 0)} · {currency(r.routedTermValue, cur)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Listing fee ({percent(r.recommendedFeePct, 1)})</dt>
                  <dd className="tabular-nums">{currency(r.fee, cur)}</dd>
                </div>
                <div className="flex justify-between gap-2 font-medium">
                  <dt>Predicted incremental TCV</dt>
                  <dd className="tabular-nums">{currency(r.netIncrementalTermValue, cur)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Incremental ACV</dt>
                  <dd className="tabular-nums">{currency(r.incrementalAcv, cur)}</dd>
                </div>
              </dl>

              <ul className="mt-3 space-y-1.5">
                {r.checks.map((c) => {
                  const Icon = checkIcon[c.status];
                  return (
                    <li key={c.label} className="flex items-start gap-2 text-xs">
                      <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${checkTone[c.status]}`} />
                      <span>
                        <span className="font-medium">{c.label}</span>
                        <span className="block text-muted-foreground">{c.detail}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>

              <p className="mt-3 text-xs text-muted-foreground">{r.rationale}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-[10px]">Confidence {r.confidence}</Badge>
                {r.isActive && <Badge variant="secondary" className="text-[10px]">Active model</Badge>}
                {!r.supported && <Badge variant="outline" className="text-[10px]">Extensible route</Badge>}
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto h-7 text-xs"
                  disabled={!canEdit || r.recommendedRoutePct === 0 || r.eligibility === "Not eligible"}
                  onClick={() => applyRecommendation(r)}
                >
                  Apply
                </Button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>



      <SectionCard
        title="Cloud Marketplace Optimizer"
        description="AWS is fully modelled today; Azure and GCP are supported as extensible placeholders"
        actions={
          <Button
            size="sm"
            disabled={!canEdit}
            onClick={() => save.mutate({ deal_id: deal.id, provider: "AWS", route: MARKETPLACE_ROUTES[1], is_enabled: rows.length === 0 })}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add provider model
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Provider</TableHead>
              <TableHead className="w-56">Route</TableHead>
              <TableHead className="w-36 text-right">Commitment</TableHead>
              <TableHead className="w-36 text-right">Remaining</TableHead>
              <TableHead className="w-28 text-right">Route %</TableHead>
              <TableHead className="w-28 text-right">Fee %</TableHead>
              <TableHead className="w-24">CPPO</TableHead>
              <TableHead className="w-40">Eligibility</TableHead>
              <TableHead className="w-24">Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <Select value={m.provider} disabled={!canEdit} onValueChange={(v) => save.mutate({ ...m, provider: v })}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>{MARKETPLACE_PROVIDERS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select value={m.route} disabled={!canEdit} onValueChange={(v) => save.mutate({ ...m, route: v })}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>{MARKETPLACE_ROUTES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell><Input className="h-8 text-right" type="number" disabled={!canEdit} defaultValue={m.commitment_total} onBlur={(ev) => save.mutate({ ...m, commitment_total: Number(ev.target.value) || 0 })} /></TableCell>
                <TableCell><Input className="h-8 text-right" type="number" disabled={!canEdit} defaultValue={m.commitment_remaining} onBlur={(ev) => save.mutate({ ...m, commitment_remaining: Number(ev.target.value) || 0 })} /></TableCell>
                <TableCell><Input className="h-8 text-right" type="number" disabled={!canEdit} defaultValue={m.drawdown_pct} onBlur={(ev) => save.mutate({ ...m, drawdown_pct: Number(ev.target.value) || 0 })} /></TableCell>
                <TableCell><Input className="h-8 text-right" type="number" step="0.1" disabled={!canEdit} defaultValue={m.marketplace_fee_pct} onBlur={(ev) => save.mutate({ ...m, marketplace_fee_pct: Number(ev.target.value) || 0 })} /></TableCell>
                <TableCell><Switch checked={m.cppo} disabled={!canEdit} onCheckedChange={(v) => save.mutate({ ...m, cppo: v })} /></TableCell>
                <TableCell>
                  <Select value={m.eligibility_status} disabled={!canEdit} onValueChange={(v) => save.mutate({ ...m, eligibility_status: v })}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>{MARKETPLACE_ELIGIBILITY.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={m.is_enabled}
                    disabled={!canEdit}
                    onCheckedChange={(v) => save.mutate({ ...m, is_enabled: v })}
                  />
                </TableCell>
              </TableRow>
            ))}
            {!rows.length && (
              <TableRow><TableCell colSpan={9} className="text-center text-sm text-muted-foreground">This deal transacts direct — no marketplace model configured.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>

        {active && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{active.provider} · {active.route}</Badge>
              <Badge variant="outline">Routing {percent(active.drawdown_pct, 0)} of licence TCV</Badge>
              <Badge variant="outline">Net to Salesforce {currency(e.marketplace.netToSalesforce, cur)}</Badge>
            </div>
            <label className="block space-y-1 text-xs">
              <span className="text-muted-foreground">Notes</span>
              <Textarea rows={2} disabled={!canEdit} defaultValue={active.notes ?? ""} onBlur={(ev) => save.mutate({ ...active, notes: ev.target.value || null })} />
            </label>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
