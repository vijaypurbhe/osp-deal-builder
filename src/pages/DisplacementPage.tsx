import { useDeal } from "@/context/DealContext";
import { useDealEconomics } from "@/hooks/useDealEconomics";
import { useDeleteCommercialRow, useIncumbentPlatforms, useSaveCommercialRow } from "@/hooks/useCommercial";
import SectionCard from "@/components/common/SectionCard";
import KpiCard from "@/components/common/KpiCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { currency, number, percent, shortDate } from "@/lib/format";
import { INCUMBENT_PRESETS } from "@/types/deal";
import { Plus, Swords, Trash2 } from "lucide-react";

const STATUSES = ["Identified", "Qualified", "Business case built", "In negotiation", "Won", "Parked"];

export default function DisplacementPage() {
  const { canEdit } = useDeal();
  const view = useDealEconomics();
  const { data: rows } = useIncumbentPlatforms();
  const save = useSaveCommercialRow("incumbent_platforms", [["incumbent_platforms"], ["portfolio"]]);
  const remove = useDeleteCommercialRow("incumbent_platforms", [["incumbent_platforms"], ["portfolio"]]);

  if (!view) return <p className="text-sm text-muted-foreground">Open a deal to model competitive displacement.</p>;

  const { deal, economics: e } = view;
  const cur = deal.currency;
  const list = rows ?? [];

  const totals = e.displacement.reduce(
    (acc, d) => ({
      incumbent: acc.incumbent + d.incumbentAnnual,
      replacement: acc.replacement + d.replacementAnnual,
      saving: acc.saving + d.annualSaving,
      acv: acc.acv + d.incrementalSalesforceAcv,
    }),
    { incumbent: 0, replacement: 0, saving: 0, acv: 0 },
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Incumbent annual spend" value={currency(totals.incumbent, cur)} icon={Swords} />
        <KpiCard label="Salesforce replacement cost" value={currency(totals.replacement, cur)} />
        <KpiCard label="Annual customer saving" value={currency(totals.saving, cur)} tone="positive" />
        <KpiCard label="Incremental Salesforce ACV" value={currency(totals.acv, cur)} />
      </div>

      <SectionCard
        title="Competitive displacement"
        description="Any incumbent platform can be modelled against any Salesforce replacement"
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" disabled={!canEdit}><Plus className="mr-1.5 h-4 w-4" /> Add platform</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
              <DropdownMenuItem onClick={() => save.mutate({ deal_id: deal.id, vendor: "New vendor" })}>Blank row</DropdownMenuItem>
              {INCUMBENT_PRESETS.map((p) => (
                <DropdownMenuItem
                  key={`${p.vendor}-${p.product}`}
                  onClick={() =>
                    save.mutate({
                      deal_id: deal.id,
                      vendor: p.vendor,
                      product: p.product,
                      replacement_salesforce_product: p.replacement,
                    })
                  }
                >
                  {p.vendor}: {p.product} → {p.replacement}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        }
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">Vendor</TableHead>
                <TableHead className="w-44">Incumbent product</TableHead>
                <TableHead className="w-32 text-right">Licence spend</TableHead>
                <TableHead className="w-32 text-right">Services spend</TableHead>
                <TableHead className="w-24 text-right">Users</TableHead>
                <TableHead className="w-32">Renewal</TableHead>
                <TableHead className="w-48">Salesforce replacement</TableHead>
                <TableHead className="w-32 text-right">Replacement licence</TableHead>
                <TableHead className="w-32 text-right">Implementation</TableHead>
                <TableHead className="w-32 text-right">AMS</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><Input className="h-8" disabled={!canEdit} defaultValue={r.vendor} onBlur={(ev) => save.mutate({ ...r, vendor: ev.target.value })} /></TableCell>
                  <TableCell><Input className="h-8" disabled={!canEdit} defaultValue={r.product ?? ""} onBlur={(ev) => save.mutate({ ...r, product: ev.target.value || null })} /></TableCell>
                  <TableCell><Input className="h-8 text-right" type="number" disabled={!canEdit} defaultValue={r.annual_license_spend} onBlur={(ev) => save.mutate({ ...r, annual_license_spend: Number(ev.target.value) || 0 })} /></TableCell>
                  <TableCell><Input className="h-8 text-right" type="number" disabled={!canEdit} defaultValue={r.annual_services_spend} onBlur={(ev) => save.mutate({ ...r, annual_services_spend: Number(ev.target.value) || 0 })} /></TableCell>
                  <TableCell><Input className="h-8 text-right" type="number" disabled={!canEdit} defaultValue={r.users} onBlur={(ev) => save.mutate({ ...r, users: Number(ev.target.value) || 0 })} /></TableCell>
                  <TableCell><Input className="h-8" type="date" disabled={!canEdit} defaultValue={r.renewal_date ?? ""} onBlur={(ev) => save.mutate({ ...r, renewal_date: ev.target.value || null })} /></TableCell>
                  <TableCell><Input className="h-8" disabled={!canEdit} defaultValue={r.replacement_salesforce_product ?? ""} onBlur={(ev) => save.mutate({ ...r, replacement_salesforce_product: ev.target.value || null })} /></TableCell>
                  <TableCell><Input className="h-8 text-right" type="number" disabled={!canEdit} defaultValue={r.replacement_annual_license_cost} onBlur={(ev) => save.mutate({ ...r, replacement_annual_license_cost: Number(ev.target.value) || 0 })} /></TableCell>
                  <TableCell><Input className="h-8 text-right" type="number" disabled={!canEdit} defaultValue={r.replacement_implementation_cost} onBlur={(ev) => save.mutate({ ...r, replacement_implementation_cost: Number(ev.target.value) || 0 })} /></TableCell>
                  <TableCell><Input className="h-8 text-right" type="number" disabled={!canEdit} defaultValue={r.replacement_managed_services_cost} onBlur={(ev) => save.mutate({ ...r, replacement_managed_services_cost: Number(ev.target.value) || 0 })} /></TableCell>
                  <TableCell>
                    <Select value={r.status} disabled={!canEdit} onValueChange={(v) => save.mutate({ ...r, status: v })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" disabled={!canEdit} onClick={() => remove.mutate(r.id)} aria-label={`Delete ${r.vendor}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!list.length && (
                <TableRow><TableCell colSpan={12} className="text-center text-sm text-muted-foreground">No incumbent platforms modelled for this deal.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <SectionCard title="Displacement business case" description="Savings, payback and incremental Salesforce ACV per platform">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Platform</TableHead>
              <TableHead className="text-right">Incumbent annual</TableHead>
              <TableHead className="text-right">Replacement annual</TableHead>
              <TableHead className="text-right">Annual saving</TableHead>
              <TableHead className="text-right">Saving %</TableHead>
              <TableHead className="text-right">One-time cost</TableHead>
              <TableHead className="text-right">3-year net saving</TableHead>
              <TableHead className="text-right">Payback</TableHead>
              <TableHead>Contract end</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((r, i) => {
              const d = e.displacement[i];
              return (
                <TableRow key={r.id}>
                  <TableCell className="text-sm">
                    {r.vendor}
                    <span className="block text-xs text-muted-foreground">{r.product} → {r.replacement_salesforce_product ?? "—"}</span>
                  </TableCell>
                  <TableCell className="text-right text-xs">{currency(d.incumbentAnnual, cur)}</TableCell>
                  <TableCell className="text-right text-xs">{currency(d.replacementAnnual, cur)}</TableCell>
                  <TableCell className={`text-right text-xs ${d.annualSaving < 0 ? "text-destructive" : ""}`}>{currency(d.annualSaving, cur)}</TableCell>
                  <TableCell className="text-right text-xs">{percent(d.savingPct)}</TableCell>
                  <TableCell className="text-right text-xs">{currency(d.oneTimeCost, cur)}</TableCell>
                  <TableCell className="text-right text-xs">{currency(d.termSaving, cur)}</TableCell>
                  <TableCell className="text-right text-xs">
                    {d.paybackMonths > 0 ? `${number(d.paybackMonths, 1)} mo` : <Badge variant="outline">No payback</Badge>}
                  </TableCell>
                  <TableCell className="text-xs">{shortDate(r.contract_end_date)}</TableCell>
                </TableRow>
              );
            })}
            {!list.length && (
              <TableRow><TableCell colSpan={9} className="text-center text-sm text-muted-foreground">Add a platform above to build the business case.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
