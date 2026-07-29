import { useModelEditor } from "@/hooks/useModelEditor";
import { mulesoftProjection } from "@/lib/pricing";
import { compactCurrency, currency, number, percent } from "@/lib/format";
import type { MuleSoftModel } from "@/types/deal";
import SectionCard from "@/components/common/SectionCard";
import KpiCard from "@/components/common/KpiCard";
import AssumptionField from "@/components/common/AssumptionField";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Network } from "lucide-react";

export default function MuleSoftPage() {
  const { model, update, isLoading, canEdit, dirty, save, saving } = useModelEditor<MuleSoftModel>("mulesoft");
  if (isLoading || !model) return <p className="text-sm text-muted-foreground">Loading MuleSoft assumptions…</p>;

  const p = mulesoftProjection(model);
  const totalCost = p.years.reduce((s, y) => s + y.cost, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Current vCores" value={number(p.current)} icon={Network} hint="Production + pre-production" />
        <KpiCard label="Demand-driven requirement" value={number(p.required, 1)} />
        <KpiCard label="Year 3 headroom" value={percent(p.headroom)} tone={p.headroom < 0 ? "critical" : p.headroom < 10 ? "warning" : "positive"} />
        <KpiCard label="3-year expansion cost" value={currency(totalCost)} />
      </div>

      <SectionCard title="Capacity vs demand" description="Planned vCore capacity compared with modelled requirement">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={p.years} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine y={p.required} stroke="hsl(var(--destructive))" strokeDasharray="4 4" label={{ value: "Required", fontSize: 11, fill: "hsl(var(--destructive))" }} />
              <Line type="monotone" dataKey="capacity" name="Planned capacity" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Current estate"
          description="Baseline platform footprint"
          actions={<Button size="sm" disabled={!canEdit || !dirty || saving} onClick={save}>Save</Button>}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <AssumptionField label="Production vCores" value={model.current_prod_vcores} onChange={(v) => update({ current_prod_vcores: v })} disabled={!canEdit} />
            <AssumptionField label="Pre-production vCores" value={model.current_preprod_vcores} onChange={(v) => update({ current_preprod_vcores: v })} disabled={!canEdit} />
            <AssumptionField label="API Manager" value={model.api_manager_qty} onChange={(v) => update({ api_manager_qty: v })} disabled={!canEdit} />
            <AssumptionField label="Premium connectors" value={model.premium_connectors} onChange={(v) => update({ premium_connectors: v })} disabled={!canEdit} />
            <AssumptionField label="SAP connectors" value={model.sap_connector} onChange={(v) => update({ sap_connector: v })} disabled={!canEdit} />
            <AssumptionField label="Flows" value={model.flows} onChange={(v) => update({ flows: v })} disabled={!canEdit} />
            <AssumptionField label="Messages" suffix="millions" value={model.messages_millions} onChange={(v) => update({ messages_millions: v })} disabled={!canEdit} />
            <AssumptionField label="Current APIs" value={model.current_api_count} onChange={(v) => update({ current_api_count: v })} disabled={!canEdit} />
          </div>
          <label className="mt-4 flex items-center justify-between rounded-md border p-3 text-sm">
            Anypoint Monitoring required
            <Switch checked={model.monitoring_required} disabled={!canEdit} onCheckedChange={(v) => update({ monitoring_required: v })} />
          </label>
        </SectionCard>

        <SectionCard title="Growth drivers and expansion" description="Incremental vCores required by programme demand">
          <div className="grid gap-4 sm:grid-cols-2">
            <AssumptionField label="Expected new APIs" value={model.expected_new_apis} onChange={(v) => update({ expected_new_apis: v })} disabled={!canEdit} />
            <AssumptionField label="Transaction growth" suffix="%" value={model.transaction_growth_pct} onChange={(v) => update({ transaction_growth_pct: v })} disabled={!canEdit} />
            <AssumptionField label="ServiceMax demand" suffix="vCores" value={model.servicemax_growth} onChange={(v) => update({ servicemax_growth: v })} disabled={!canEdit} />
            <AssumptionField label="Data / AI demand" suffix="vCores" value={model.data_ai_growth} onChange={(v) => update({ data_ai_growth: v })} disabled={!canEdit} />
            <AssumptionField label="Order automation demand" suffix="vCores" value={model.order_automation_growth} onChange={(v) => update({ order_automation_growth: v })} disabled={!canEdit} />
            <AssumptionField label="vCore price" value={model.vcore_price} step={1000} onChange={(v) => update({ vcore_price: v })} disabled={!canEdit} />
            <AssumptionField label="Year 1 increment" value={model.y1_increment} onChange={(v) => update({ y1_increment: v })} disabled={!canEdit} />
            <AssumptionField label="Year 2 increment" value={model.y2_increment} onChange={(v) => update({ y2_increment: v })} disabled={!canEdit} />
            <AssumptionField label="Year 3 increment" value={model.y3_increment} onChange={(v) => update({ y3_increment: v })} disabled={!canEdit} />
          </div>

          <Table className="mt-6">
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead className="text-right">Capacity (vCores)</TableHead>
                <TableHead className="text-right">Expansion cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {p.years.map((y) => (
                <TableRow key={y.year}>
                  <TableCell>{y.year}</TableCell>
                  <TableCell className="text-right tabular-nums">{number(y.capacity, 1)}</TableCell>
                  <TableCell className="text-right tabular-nums">{compactCurrency(y.cost)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-3 text-xs text-muted-foreground">Undersizing risk: {p.undersizingRisk}</p>
        </SectionCard>
      </div>
    </div>
  );
}
