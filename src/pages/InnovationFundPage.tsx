import { useDeal } from "@/context/DealContext";
import { useDealEconomics } from "@/hooks/useDealEconomics";
import { useInnovationFunds, useSaveCommercialRow } from "@/hooks/useCommercial";
import SectionCard from "@/components/common/SectionCard";
import KpiCard from "@/components/common/KpiCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { currency, percent } from "@/lib/format";
import { TIF_TEMPLATES } from "@/types/deal";
import { Landmark, Plus } from "lucide-react";

const TEMPLATE_SHAPES: Record<string, { salesforce: number; techm: number; customer: number }> = {
  "No Fund": { salesforce: 0, techm: 0, customer: 0 },
  "Margin-Floor Fund": { salesforce: 0.5, techm: 0.5, customer: 0 },
  "Balanced Fund": { salesforce: 0.4, techm: 0.4, customer: 0.2 },
  "Strategic Growth Fund": { salesforce: 0.6, techm: 0.3, customer: 0.1 },
  "Competitive Displacement Fund": { salesforce: 0.7, techm: 0.3, customer: 0 },
};

export default function InnovationFundPage() {
  const { canEdit } = useDeal();
  const view = useDealEconomics();
  const { data: funds } = useInnovationFunds();
  const save = useSaveCommercialRow("innovation_funds", [["innovation_funds"], ["portfolio"]], "Innovation Fund saved");

  if (!view) return <p className="text-sm text-muted-foreground">Open a deal to model its Transformation Innovation Fund.</p>;

  const { deal, economics: e } = view;
  const cur = deal.currency;
  const fund = (funds ?? [])[0] ?? null;

  const applyTemplate = (template: string) => {
    if (!fund) return;
    const shape = TEMPLATE_SHAPES[template];
    if (!shape) return save.mutate({ ...fund, template });
    save.mutate({
      ...fund,
      template,
      salesforce_funded: fund.total_fund * shape.salesforce,
      techm_funded: fund.total_fund * shape.techm,
      customer_funded: fund.total_fund * shape.customer,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Total fund" value={currency(e.fund.total, cur)} icon={Landmark} />
        <KpiCard label="Salesforce-funded" value={currency(e.fund.salesforceFunded, cur)} />
        <KpiCard label="TechM-funded" value={currency(e.fund.techmFunded, cur)} />
        <KpiCard label="Customer-funded" value={currency(e.fund.customerFunded, cur)} />
        <KpiCard label="Consumed" value={currency(e.fund.consumed, cur)} hint={`${currency(e.fund.available, cur)} available`} />
        <KpiCard label="Fund as % of licence TCV" value={percent(e.fund.pctOfTcv)} />
      </div>

      <SectionCard
        title="Transformation Innovation Fund"
        description="Reusable across every deal — pick a template, then tune the funding split and drawdown profile"
        actions={
          !fund && (
            <Button size="sm" disabled={!canEdit} onClick={() => save.mutate({ deal_id: deal.id, name: "Transformation Innovation Fund", template: "Balanced Fund" })}>
              <Plus className="mr-1.5 h-4 w-4" /> Create fund
            </Button>
          )
        }
      >
        {fund ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <label className="space-y-1 text-xs">
                <span className="text-muted-foreground">Fund name</span>
                <Input className="h-8" disabled={!canEdit} defaultValue={fund.name} onBlur={(ev) => save.mutate({ ...fund, name: ev.target.value })} />
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-muted-foreground">Template</span>
                <Select value={fund.template} disabled={!canEdit} onValueChange={applyTemplate}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{TIF_TEMPLATES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-muted-foreground">Status</span>
                <Select value={fund.status} disabled={!canEdit} onValueChange={(v) => save.mutate({ ...fund, status: v })}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Proposed", "Agreed", "Active", "Closed"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </label>
              {[
                { label: "Total fund", key: "total_fund" },
                { label: "Salesforce-funded", key: "salesforce_funded" },
                { label: "TechM-funded", key: "techm_funded" },
                { label: "Customer-funded", key: "customer_funded" },
                { label: "Year 1 drawdown", key: "drawdown_y1" },
                { label: "Year 2 drawdown", key: "drawdown_y2" },
                { label: "Year 3 drawdown", key: "drawdown_y3" },
                { label: "Consumed to date", key: "consumed" },
              ].map((f) => (
                <label key={f.key} className="space-y-1 text-xs">
                  <span className="text-muted-foreground">{f.label}</span>
                  <Input
                    className="h-8"
                    type="number"
                    disabled={!canEdit}
                    defaultValue={(fund as unknown as Record<string, number>)[f.key] ?? 0}
                    onBlur={(ev) => save.mutate({ ...fund, [f.key]: Number(ev.target.value) || 0 })}
                  />
                </label>
              ))}
              <label className="space-y-1 text-xs md:col-span-4">
                <span className="text-muted-foreground">Notes</span>
                <Textarea rows={2} disabled={!canEdit} defaultValue={fund.notes ?? ""} onBlur={(ev) => save.mutate({ ...fund, notes: ev.target.value || null })} />
              </label>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={e.fund.drawdown} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => currency(Number(v), cur)} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => currency(Number(v), cur)} />
                  <Bar dataKey="value" name="Planned drawdown" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {Math.abs(e.fund.drawdown.reduce((s, d) => s + d.value, 0) - e.fund.total) > 1 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Planned drawdown ({currency(e.fund.drawdown.reduce((s, d) => s + d.value, 0), cur)}) does not reconcile to the total fund
                ({currency(e.fund.total, cur)}).
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">This deal has no Innovation Fund — the construct is optional.</p>
        )}
      </SectionCard>
    </div>
  );
}
