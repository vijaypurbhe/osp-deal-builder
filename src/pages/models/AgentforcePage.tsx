import { useModelEditor } from "@/hooks/useModelEditor";
import { agentforceProjection } from "@/lib/pricing";
import { compactCurrency, currency, number } from "@/lib/format";
import type { AgentforceModel } from "@/types/deal";
import SectionCard from "@/components/common/SectionCard";
import KpiCard from "@/components/common/KpiCard";
import AssumptionField from "@/components/common/AssumptionField";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Bot } from "lucide-react";

export default function AgentforcePage() {
  const { model, update, isLoading, canEdit, dirty, save, saving } = useModelEditor<AgentforceModel>("agentforce");
  if (isLoading || !model) return <p className="text-sm text-muted-foreground">Loading Agentforce assumptions…</p>;

  const p = agentforceProjection(model);
  const threeYear = p.years.reduce((s, y) => s + y.total, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Eligible seats" value={number(p.quantity)} icon={Bot} hint={`Net unit price ${currency(p.perUser, "USD", 0)}`} />
        <KpiCard label="Annual Flex credits" value={number(p.annualCredits)} hint={`${number(p.monthlyCredits)} per month`} />
        <KpiCard label="Year 1 cost" value={currency(p.years[0].total)} />
        <KpiCard label="Consumption risk" value={p.consumptionRisk} tone={p.consumptionRisk === "High" ? "critical" : p.consumptionRisk === "Medium" ? "warning" : "positive"} />
      </div>

      <SectionCard title="Agentforce cost ramp" description={`Add-on seats and Flex credits — three-year total ${currency(threeYear)}`}>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={p.years} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tickFormatter={(v) => compactCurrency(Number(v))} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip formatter={(v) => currency(Number(v))} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="addon" name="Add-on seats" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
              <Bar dataKey="flex" name="Flex credits" stackId="a" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Seat assumptions"
          description="Population eligible for the Agentforce add-on"
          actions={<Button size="sm" disabled={!canEdit || !dirty || saving} onClick={save}>Save</Button>}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <AssumptionField label="Eligible population" value={model.eligible_population} onChange={(v) => update({ eligible_population: v })} disabled={!canEdit} />
            <AssumptionField label="Excluded users" value={model.excluded_users} onChange={(v) => update({ excluded_users: v })} disabled={!canEdit} />
            <AssumptionField label="Add-on unit price" value={model.addon_unit_price} step={10} onChange={(v) => update({ addon_unit_price: v })} disabled={!canEdit} />
            <AssumptionField label="Add-on discount" suffix="%" value={model.addon_discount_pct} onChange={(v) => update({ addon_discount_pct: v })} disabled={!canEdit} />
            <AssumptionField label="Adoption Y1" suffix="%" value={model.adoption_y1} onChange={(v) => update({ adoption_y1: v })} disabled={!canEdit} />
            <AssumptionField label="Adoption Y2" suffix="%" value={model.adoption_y2} onChange={(v) => update({ adoption_y2: v })} disabled={!canEdit} />
            <AssumptionField label="Adoption Y3" suffix="%" value={model.adoption_y3} onChange={(v) => update({ adoption_y3: v })} disabled={!canEdit} />
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Ramp start</Label>
              <Input type="date" value={model.ramp_start} disabled={!canEdit} onChange={(e) => update({ ramp_start: e.target.value })} />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {model.use_cases.map((u) => <Badge key={u} variant="outline">{u}</Badge>)}
          </div>
        </SectionCard>

        <SectionCard title="Flex credit consumption" description="Transaction-driven credit demand for the Customer Care use case">
          <div className="grid gap-4 sm:grid-cols-2">
            <AssumptionField label="Cases per month" value={model.cases_per_month} step={1000} onChange={(v) => update({ cases_per_month: v })} disabled={!canEdit} />
            <AssumptionField label="Actions per transaction" value={model.actions_per_transaction} onChange={(v) => update({ actions_per_transaction: v })} disabled={!canEdit} />
            <AssumptionField label="Credits per action" value={model.credits_per_action} step={0.5} onChange={(v) => update({ credits_per_action: v })} disabled={!canEdit} />
            <AssumptionField label="Credit unit price" value={model.credit_unit_price} step={0.0001} onChange={(v) => update({ credit_unit_price: v })} disabled={!canEdit} />
            <AssumptionField label="Buffer" suffix="%" value={model.buffer_pct} onChange={(v) => update({ buffer_pct: v })} disabled={!canEdit} />
            <AssumptionField label="Overrun alert threshold" suffix="%" value={model.overrun_threshold} onChange={(v) => update({ overrun_threshold: v })} disabled={!canEdit} />
          </div>
          <div className="mt-5 space-y-3">
            {([
              ["quote_needed", "Salesforce quote still required"],
              ["human_in_loop", "Human-in-the-loop review in scope"],
              ["data_ready", "Data foundation ready for agents"],
            ] as const).map(([field, label]) => (
              <label key={field} className="flex items-center justify-between rounded-md border p-3 text-sm">
                {label}
                <Switch checked={model[field]} disabled={!canEdit} onCheckedChange={(v) => update({ [field]: v } as Partial<AgentforceModel>)} />
              </label>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
