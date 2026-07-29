import { useMemo } from "react";
import { useDeal } from "@/context/DealContext";
import { useBulkTiers, useDeleteRow, useScenarios, useSkuLines, useUpsertRow } from "@/hooks/useDealData";
import { computeLine, computeScenario } from "@/lib/pricing";
import { compactCurrency, currency, percent } from "@/lib/format";
import SectionCard from "@/components/common/SectionCard";
import KpiCard from "@/components/common/KpiCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Plus, Trash2 } from "lucide-react";

export default function DiscountWorkbenchPage() {
  const { activeScenarioId, canEdit } = useDeal();
  const { data: scenarios } = useScenarios();
  const { data: lines } = useSkuLines(activeScenarioId);
  const { data: tiers } = useBulkTiers(activeScenarioId);
  const upsertScenario = useUpsertRow("scenarios", [["scenarios"]]);
  const upsertTier = useUpsertRow("bulk_discount_tiers", [["bulk_tiers", activeScenarioId]]);
  const deleteTier = useDeleteRow("bulk_discount_tiers", [["bulk_tiers", activeScenarioId]]);

  const scenario = scenarios?.find((s) => s.id === activeScenarioId);
  const totals = useMemo(() => computeScenario(lines ?? [], scenario), [lines, scenario]);
  const locked = scenario?.is_locked || !canEdit;

  const waterfall = [
    { stage: "List ARR", value: totals.listArr, type: "total" },
    { stage: "Line discounts", value: -totals.lineDiscountValue, type: "cut" },
    { stage: "Category discounts", value: -totals.categoryDiscountValue, type: "cut" },
    { stage: "Bulk discount", value: -totals.bulkDiscountValue, type: "cut" },
    { stage: "Scenario / override", value: -totals.overrideDiscountValue, type: "cut" },
    { stage: "Net ARR", value: totals.netArr, type: "total" },
  ];

  const breaches = (lines ?? [])
    .map((l) => ({ line: l, m: computeLine(l, scenario) }))
    .filter(({ m }) => m.warnings.length > 0);

  if (!scenario) return <p className="text-sm text-muted-foreground">Select a scenario to open the discount workbench.</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="List ARR" value={currency(totals.listArr)} />
        <KpiCard label="Total discount value" value={currency(totals.listArr - totals.netArr)} tone="warning" />
        <KpiCard label="Effective discount" value={percent(totals.effectiveDiscountPct)} tone={totals.effectiveDiscountPct > scenario.approval_threshold_pct ? "critical" : "positive"} />
        <KpiCard label="Lines breaching policy" value={String(breaches.length)} tone={breaches.length ? "critical" : "positive"} />
      </div>

      <SectionCard title="Discount waterfall" description="List price through to net recurring value">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={waterfall} margin={{ left: 8, right: 8, top: 16 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="stage" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tickFormatter={(v) => compactCurrency(Number(v))} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="value" position="top" formatter={(v: number) => compactCurrency(v)} style={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                {waterfall.map((d) => (
                  <Cell key={d.stage} fill={d.type === "total" ? "hsl(var(--primary))" : "hsl(var(--destructive))"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Scenario levers" description="Applied after line and category discounts">
          <div className="space-y-6">
            {([
              ["scenario_discount_pct", "Scenario discount"],
              ["bulk_discount_pct", "Bulk discount"],
              ["strategic_override_pct", "Strategic override"],
              ["approval_threshold_pct", "Approval threshold"],
            ] as const).map(([field, label]) => (
              <div key={field} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{label}</Label>
                  <span className="text-sm font-medium tabular-nums">{percent(scenario[field])}</span>
                </div>
                <Slider
                  disabled={locked}
                  value={[Number(scenario[field])]}
                  min={0}
                  max={80}
                  step={0.5}
                  onValueCommit={(v) => upsertScenario.mutate({ ...scenario, [field]: v[0] })}
                />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Bulk discount tiers"
          description="Threshold-based uplift applied to bulk-eligible SKUs"
          actions={
            <Button
              size="sm"
              variant="outline"
              disabled={locked}
              onClick={() => upsertTier.mutate({ scenario_id: scenario.id, tier_name: "New tier", tcv_threshold: 1000000, discount_pct: 5, sort_order: (tiers?.length ?? 0) + 1 })}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add tier
            </Button>
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">TCV threshold</TableHead>
                <TableHead className="text-right">Discount %</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(tiers ?? []).map((t) => (
                <TableRow key={t.id}>
                  <TableCell><Input className="h-8" disabled={locked} defaultValue={t.tier_name} onBlur={(e) => upsertTier.mutate({ ...t, tier_name: e.target.value })} /></TableCell>
                  <TableCell><Input className="h-8 text-right" type="number" disabled={locked} defaultValue={t.tcv_threshold} onBlur={(e) => upsertTier.mutate({ ...t, tcv_threshold: Number(e.target.value) })} /></TableCell>
                  <TableCell><Input className="h-8 text-right" type="number" step="0.5" disabled={locked} defaultValue={t.discount_pct} onBlur={(e) => upsertTier.mutate({ ...t, discount_pct: Number(e.target.value) })} /></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" disabled={locked} onClick={() => deleteTier.mutate(t.id)} aria-label="Delete tier"><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {!(tiers ?? []).length && <TableRow><TableCell colSpan={4} className="text-muted-foreground">No tiers defined.</TableCell></TableRow>}
            </TableBody>
          </Table>
          <p className="mt-3 text-xs text-muted-foreground">
            Current 3-year TCV of {currency(totals.tcv)} qualifies for the{" "}
            {[...(tiers ?? [])].filter((t) => totals.tcv >= t.tcv_threshold).sort((a, b) => b.tcv_threshold - a.tcv_threshold)[0]?.tier_name ?? "base"} tier.
          </p>
        </SectionCard>
      </div>

      <SectionCard title="Policy exceptions" description="Lines exceeding thresholds, floors or eligibility rules">
        {breaches.length ? (
          <div className="space-y-2">
            {breaches.map(({ line, m }) => (
              <div key={line.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-3">
                <div>
                  <p className="text-sm font-medium">{line.sku_name}</p>
                  <p className="text-xs text-muted-foreground">{m.warnings.join(" · ")}</p>
                </div>
                <Badge variant="destructive">{percent(m.effectiveDiscountPct)}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">All lines sit inside the approved discount policy.</p>
        )}
      </SectionCard>
    </div>
  );
}
