import { useDeal } from "@/context/DealContext";
import { useDealEconomics } from "@/hooks/useDealEconomics";
import { useServicesConstructs, useSaveCommercialRow, useValueLevers, useDeleteCommercialRow } from "@/hooks/useCommercial";
import SectionCard from "@/components/common/SectionCard";
import KpiCard from "@/components/common/KpiCard";
import DealHealthCard from "@/components/deals/DealHealthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { currency, percent } from "@/lib/format";
import { VALUE_CATEGORIES } from "@/types/deal";
import { Plus, Trash2 } from "lucide-react";

export default function EconomicsPage() {
  const { canEdit } = useDeal();
  const view = useDealEconomics();
  const { data: services } = useServicesConstructs();
  const { data: levers } = useValueLevers();
  const saveServices = useSaveCommercialRow("services_constructs", [["services_constructs"], ["portfolio"]], "Services construct saved");
  const saveLever = useSaveCommercialRow("value_levers", [["value_levers"], ["portfolio"]]);
  const deleteLever = useDeleteCommercialRow("value_levers", [["value_levers"], ["portfolio"]]);

  if (!view) return <p className="text-sm text-muted-foreground">Open a deal to see its economics.</p>;

  const { deal, economics: e } = view;
  const cur = deal.currency;
  const construct = (services ?? [])[0] ?? null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Net licence ARR" value={currency(e.license.netArr, cur)} hint={`${currency(e.license.netTermValue, cur)} over term`} />
        <KpiCard label="Salesforce acquisition cost" value={currency(e.license.acquisitionArr, cur)} hint="Annualised buy price" />
        <KpiCard label="Licence GP" value={currency(e.license.licenseGp, cur)} tone="positive" hint={`${currency(e.license.licenseGpTerm, cur)} over term`} />
        <KpiCard
          label="Licence GM"
          value={percent(e.license.licenseGmPct)}
          tone={e.belowMarginFloor ? "critical" : "positive"}
          hint={`Floor ${percent(deal.min_license_gm_pct)}`}
        />
        <KpiCard label="Services GP (term)" value={currency(e.services.termGp, cur)} hint={percent(e.services.gmPct)} />
        <KpiCard label="Blended GM" value={percent(e.blendedGmPct)} hint={currency(e.combinedTermValue, cur)} />
      </div>

      <DealHealthCard health={view.health} />

      <SectionCard
        title="Layered commercial construct"
        description="Layer A protected estate, Layer B committed growth, Layer C future transformation growth"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Layer</TableHead>
              <TableHead className="text-right">Lines</TableHead>
              <TableHead className="text-right">List ARR</TableHead>
              <TableHead className="text-right">Net ARR</TableHead>
              <TableHead className="text-right">Net term value</TableHead>
              <TableHead className="text-right">Acquisition ARR</TableHead>
              <TableHead className="text-right">GP</TableHead>
              <TableHead className="text-right">GM</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {e.license.layers.map((l) => (
              <TableRow key={l.layer}>
                <TableCell className="text-sm">{l.label}</TableCell>
                <TableCell className="text-right text-xs">{l.lines}</TableCell>
                <TableCell className="text-right text-xs">{currency(l.listArr, cur)}</TableCell>
                <TableCell className="text-right text-xs">{currency(l.netArr, cur)}</TableCell>
                <TableCell className="text-right text-xs">{currency(l.netTermValue, cur)}</TableCell>
                <TableCell className="text-right text-xs">{currency(l.acquisitionArr, cur)}</TableCell>
                <TableCell className="text-right text-xs">{currency(l.gp, cur)}</TableCell>
                <TableCell className="text-right text-xs">{percent(l.gmPct)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="text-xs font-semibold">Deal total</TableCell>
              <TableCell className="text-right text-xs">{e.license.layers.reduce((s, l) => s + l.lines, 0)}</TableCell>
              <TableCell className="text-right text-xs">{currency(e.license.listArr, cur)}</TableCell>
              <TableCell className="text-right text-xs">{currency(e.license.netArr, cur)}</TableCell>
              <TableCell className="text-right text-xs">{currency(e.license.netTermValue, cur)}</TableCell>
              <TableCell className="text-right text-xs">{currency(e.license.acquisitionArr, cur)}</TableCell>
              <TableCell className="text-right text-xs">{currency(e.license.licenseGp, cur)}</TableCell>
              <TableCell className="text-right text-xs">{percent(e.license.licenseGmPct)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
        {e.license.linesWithoutCost > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            {e.license.linesWithoutCost} line(s) have no Salesforce acquisition price set — margin is understated until those are entered in the scenario builder.
          </p>
        )}
      </SectionCard>

      <SectionCard
        title="Services construct"
        description="Implementation and managed services economics attached to this deal"
        actions={
          !construct && (
            <Button size="sm" disabled={!canEdit} onClick={() => saveServices.mutate({ deal_id: deal.id, name: "Managed services", years: deal.contract_years })}>
              <Plus className="mr-1.5 h-4 w-4" /> Add construct
            </Button>
          )
        }
      >
        {construct ? (
          <div className="grid gap-3 md:grid-cols-4">
            {[
              { label: "Name", key: "name", type: "text" },
              { label: "Annual fee", key: "annual_fee", type: "number" },
              { label: "Annual cost", key: "annual_cost", type: "number" },
              { label: "Years", key: "years", type: "number" },
              { label: "Implementation fee", key: "implementation_fee", type: "number" },
              { label: "Implementation cost", key: "implementation_cost", type: "number" },
              { label: "Attach target %", key: "attach_target_pct", type: "number" },
              { label: "Scope", key: "scope", type: "text" },
            ].map((f) => (
              <label key={f.key} className="space-y-1 text-xs">
                <span className="text-muted-foreground">{f.label}</span>
                <Input
                  className="h-8"
                  type={f.type}
                  disabled={!canEdit}
                  defaultValue={(construct as unknown as Record<string, string | number | null>)[f.key] ?? ""}
                  onBlur={(e2) =>
                    saveServices.mutate({
                      ...construct,
                      [f.key]: f.type === "number" ? Number(e2.target.value) || 0 : e2.target.value || null,
                    })
                  }
                />
              </label>
            ))}
            <div className="md:col-span-4 grid gap-4 sm:grid-cols-4">
              <KpiCard label="Annual services GP" value={currency(e.services.annualGp, cur)} hint={percent(e.services.gmPct)} />
              <KpiCard label="Term services fee" value={currency(e.services.termFee, cur)} />
              <KpiCard label="Term services GP" value={currency(e.services.termGp, cur)} tone="positive" />
              <KpiCard
                label="Services attach"
                value={percent(e.services.attachPct)}
                hint={`Target ${percent(construct.attach_target_pct)}`}
                tone={e.services.attachPct >= construct.attach_target_pct ? "positive" : "warning"}
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No services construct on this deal — it is modelled as licence-only.</p>
        )}
      </SectionCard>

      <SectionCard
        title="Customer value framework"
        description="Select only the value categories that apply to this deal"
        actions={
          <Button size="sm" disabled={!canEdit} onClick={() => saveLever.mutate({ deal_id: deal.id, category: VALUE_CATEGORIES[0], is_included: true })}>
            <Plus className="mr-1.5 h-4 w-4" /> Add lever
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-56">Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-36 text-right">Annual value</TableHead>
              <TableHead className="w-36 text-right">Term value</TableHead>
              <TableHead className="w-28">Confidence</TableHead>
              <TableHead className="w-24">Included</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(levers ?? []).map((l) => (
              <TableRow key={l.id}>
                <TableCell>
                  <Select value={l.category} disabled={!canEdit} onValueChange={(v) => saveLever.mutate({ ...l, category: v })}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>{VALUE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input className="h-8" disabled={!canEdit} defaultValue={l.description ?? ""} onBlur={(ev) => saveLever.mutate({ ...l, description: ev.target.value || null })} />
                </TableCell>
                <TableCell>
                  <Input className="h-8 text-right" type="number" disabled={!canEdit} defaultValue={l.annual_value} onBlur={(ev) => saveLever.mutate({ ...l, annual_value: Number(ev.target.value) || 0 })} />
                </TableCell>
                <TableCell>
                  <Input className="h-8 text-right" type="number" disabled={!canEdit} defaultValue={l.term_value} onBlur={(ev) => saveLever.mutate({ ...l, term_value: Number(ev.target.value) || 0 })} />
                </TableCell>
                <TableCell>
                  <Select value={l.confidence} disabled={!canEdit} onValueChange={(v) => saveLever.mutate({ ...l, confidence: v })}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>{["High", "Medium", "Low"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Switch checked={l.is_included} disabled={!canEdit} onCheckedChange={(v) => saveLever.mutate({ ...l, is_included: v })} />
                </TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" disabled={!canEdit} onClick={() => deleteLever.mutate(l.id)} aria-label="Delete lever">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!(levers ?? []).length && (
              <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground">No value levers captured yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        <div className="mt-4 flex flex-wrap gap-3">
          <Badge variant="secondary">Annual customer savings {currency(e.customerSavingsAnnual, cur)}</Badge>
          <Badge variant="secondary">Term customer savings {currency(e.customerSavingsTerm, cur)}</Badge>
        </div>
      </SectionCard>
    </div>
  );
}
