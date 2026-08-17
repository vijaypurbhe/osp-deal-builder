import { useDeal } from "@/context/DealContext";
import { useDealEconomics } from "@/hooks/useDealEconomics";
import { useMarketplaceModels, useSaveCommercialRow } from "@/hooks/useCommercial";
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
import { CloudCog, Plus } from "lucide-react";

export default function MarketplacePage() {
  const { canEdit } = useDeal();
  const view = useDealEconomics();
  const { data: models } = useMarketplaceModels();
  const save = useSaveCommercialRow("marketplace_models", [["marketplace_models"], ["portfolio"]], "Marketplace model saved");

  if (!view) return <p className="text-sm text-muted-foreground">Open a deal to run the Cloud Marketplace Optimizer.</p>;

  const { deal, economics: e } = view;
  const cur = deal.currency;
  const rows = models ?? [];
  const active = rows.find((m) => m.is_enabled) ?? rows[0] ?? null;

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
