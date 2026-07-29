import { useModelEditor } from "@/hooks/useModelEditor";
import { growthBridge, revisedUserCount } from "@/lib/pricing";
import { number } from "@/lib/format";
import type { GrowthModel } from "@/types/deal";
import SectionCard from "@/components/common/SectionCard";
import KpiCard from "@/components/common/KpiCard";
import AssumptionField from "@/components/common/AssumptionField";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Users } from "lucide-react";

export default function GrowthModelPage() {
  const { model, update, isLoading, canEdit, dirty, save, saving } = useModelEditor<GrowthModel>("growth");
  if (isLoading || !model) return <p className="text-sm text-muted-foreground">Loading growth assumptions…</p>;

  const bridge = growthBridge(model);
  const revised = revisedUserCount(model);
  const delta = revised - model.baseline_users;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Current users" value={number(model.baseline_users)} icon={Users} />
        <KpiCard label="Revised quantity" value={number(revised)} tone="positive" />
        <KpiCard label="Net movement" value={`${delta >= 0 ? "+" : ""}${number(delta)}`} tone={delta >= 0 ? "positive" : "critical"} />
        <KpiCard label="Growth case" value={model.growth_case} hint="Applied to all growth drivers" />
      </div>

      <SectionCard
        title="Growth bridge"
        description="Movement from the current baseline to the revised licence quantity"
        actions={
          <Tabs value={model.growth_case} onValueChange={(v) => update({ growth_case: v as GrowthModel["growth_case"] })}>
            <TabsList>
              <TabsTrigger value="conservative" disabled={!canEdit}>Conservative</TabsTrigger>
              <TabsTrigger value="expected" disabled={!canEdit}>Expected</TabsTrigger>
              <TabsTrigger value="upside" disabled={!canEdit}>Upside</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      >
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bridge} margin={{ top: 20, left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={70} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="value" position="top" style={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                {bridge.map((d) => (
                  <Cell key={d.label} fill={d.value < 0 ? "hsl(var(--destructive))" : d.label.includes("users") || d.label.includes("quantity") ? "hsl(var(--primary))" : "hsl(var(--secondary))"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard
        title="Assumptions"
        description="Drivers behind the revised Sales & Service Cloud quantity"
        actions={<Button size="sm" disabled={!canEdit || !dirty || saving} onClick={save}>Save assumptions</Button>}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AssumptionField label="Baseline users" value={model.baseline_users} onChange={(v) => update({ baseline_users: v })} disabled={!canEdit} />
          <AssumptionField label="US Ortho growth" value={model.us_ortho_growth} onChange={(v) => update({ us_ortho_growth: v })} disabled={!canEdit} />
          <AssumptionField label="International growth" value={model.international_growth} onChange={(v) => update({ international_growth: v })} disabled={!canEdit} />
          <AssumptionField label="ServiceMax increment" value={model.servicemax_increment} onChange={(v) => update({ servicemax_increment: v })} disabled={!canEdit} />
          <AssumptionField label="South Africa health" value={model.south_africa_health} onChange={(v) => update({ south_africa_health: v })} disabled={!canEdit} />
          <AssumptionField label="Other growth" value={model.other_growth} onChange={(v) => update({ other_growth: v })} disabled={!canEdit} />
          <AssumptionField label="Retired users" value={model.retired_users} onChange={(v) => update({ retired_users: v })} disabled={!canEdit} hint="Rationalised licences removed" />
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <AssumptionField label="Conservative factor" value={model.conservative_factor} step={0.05} onChange={(v) => update({ conservative_factor: v })} disabled={!canEdit} />
          <AssumptionField label="Expected factor" value={model.expected_factor} step={0.05} onChange={(v) => update({ expected_factor: v })} disabled={!canEdit} />
          <AssumptionField label="Upside factor" value={model.upside_factor} step={0.05} onChange={(v) => update({ upside_factor: v })} disabled={!canEdit} />
        </div>
      </SectionCard>
    </div>
  );
}
