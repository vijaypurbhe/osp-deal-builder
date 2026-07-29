import { useModelEditor } from "@/hooks/useModelEditor";
import { data360Projection } from "@/lib/pricing";
import { compactCurrency, currency, number } from "@/lib/format";
import type { Data360Model } from "@/types/deal";
import SectionCard from "@/components/common/SectionCard";
import KpiCard from "@/components/common/KpiCard";
import AssumptionField from "@/components/common/AssumptionField";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Database } from "lucide-react";

export default function Data360Page() {
  const { model, update, isLoading, canEdit, dirty, save, saving } = useModelEditor<Data360Model>("data360");
  if (isLoading || !model) return <p className="text-sm text-muted-foreground">Loading Data 360 assumptions…</p>;

  const p = data360Projection(model);
  const threeYear = p.years.reduce((sum, y) => sum + y.total, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Annual credits (with buffer)" value={number(p.annualCredits)} icon={Database} />
        <KpiCard label="Year 1 cost" value={currency(p.years[0].total)} />
        <KpiCard label="3-year Data 360 cost" value={currency(threeYear)} />
        <KpiCard label="Overage risk" value={p.overageRisk} tone={p.overageRisk === "High" ? "critical" : p.overageRisk === "Medium" ? "warning" : "positive"} />
      </div>

      <SectionCard title="Cost ramp by adoption" description="Credits and marketing expansion phased by adoption curve">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={p.years} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tickFormatter={(v) => compactCurrency(Number(v))} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip formatter={(v) => currency(Number(v))} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="data360" name="Data 360 credits" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.35)" />
              <Area type="monotone" dataKey="marketing" name="Marketing expansion" stackId="1" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary) / 0.35)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Consumption assumptions"
          description="Credit demand drivers and safety buffer"
          actions={<Button size="sm" disabled={!canEdit || !dirty || saving} onClick={save}>Save</Button>}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <AssumptionField label="Unified profiles" value={model.unified_profiles} step={100000} onChange={(v) => update({ unified_profiles: v })} disabled={!canEdit} />
            <AssumptionField label="Data sources" value={model.data_sources} onChange={(v) => update({ data_sources: v })} disabled={!canEdit} />
            <AssumptionField label="Activations per month" value={model.activations_per_month} onChange={(v) => update({ activations_per_month: v })} disabled={!canEdit} />
            <AssumptionField label="Monthly credits" value={model.monthly_credits} step={10000} onChange={(v) => update({ monthly_credits: v })} disabled={!canEdit} />
            <AssumptionField label="Buffer" suffix="%" value={model.buffer_pct} onChange={(v) => update({ buffer_pct: v })} disabled={!canEdit} hint="Protects against consumption overage" />
            <AssumptionField label="Credit unit price" value={model.credit_unit_price} step={0.0001} onChange={(v) => update({ credit_unit_price: v })} disabled={!canEdit} />
            <AssumptionField label="Adoption Y1" suffix="%" value={model.adoption_y1} onChange={(v) => update({ adoption_y1: v })} disabled={!canEdit} />
            <AssumptionField label="Adoption Y2" suffix="%" value={model.adoption_y2} onChange={(v) => update({ adoption_y2: v })} disabled={!canEdit} />
            <AssumptionField label="Adoption Y3" suffix="%" value={model.adoption_y3} onChange={(v) => update({ adoption_y3: v })} disabled={!canEdit} />
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Pricing option</Label>
              <Select value={model.pricing_option} disabled={!canEdit} onValueChange={(v) => update({ pricing_option: v as Data360Model["pricing_option"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Profile-based">Profile-based</SelectItem>
                  <SelectItem value="Flex Credits">Flex Credits</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Refresh frequency</Label>
              <Input value={model.refresh_frequency} disabled={!canEdit} onChange={(e) => update({ refresh_frequency: e.target.value })} />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Marketing & governance" description="Marketing Cloud expansion and data governance readiness">
          <div className="grid gap-4 sm:grid-cols-2">
            <AssumptionField label="Marketing business units" value={model.marketing_business_units} onChange={(v) => update({ marketing_business_units: v })} disabled={!canEdit} />
            <AssumptionField label="Price per business unit" value={model.marketing_bu_price} step={1000} onChange={(v) => update({ marketing_bu_price: v })} disabled={!canEdit} />
            <AssumptionField label="MCI expansion cost" value={model.mci_expansion_cost} step={1000} onChange={(v) => update({ mci_expansion_cost: v })} disabled={!canEdit} />
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Governance status</Label>
              <Input value={model.governance_status} disabled={!canEdit} onChange={(e) => update({ governance_status: e.target.value })} />
            </div>
          </div>

          <Table className="mt-6">
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead className="text-right">Credits consumed</TableHead>
                <TableHead className="text-right">Total cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {p.years.map((y) => (
                <TableRow key={y.year}>
                  <TableCell>{y.year}</TableCell>
                  <TableCell className="text-right tabular-nums">{number(y.credits)}</TableCell>
                  <TableCell className="text-right tabular-nums">{currency(y.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Badge variant="outline" className="mt-4">Overage risk: {p.overageRisk}</Badge>
        </SectionCard>
      </div>
    </div>
  );
}
