import { useMemo, useState } from "react";
import { NumberCell } from "@/components/common/NumberCell";
import { useDeal } from "@/context/DealContext";
import { useDeleteRow, useScenarios, useSkuLines, useTowers, useUpsertRow } from "@/hooks/useDealData";
import { computeLine, computeScenario } from "@/lib/pricing";
import { currency, number, percent } from "@/lib/format";
import SectionCard from "@/components/common/SectionCard";
import KpiCard from "@/components/common/KpiCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { APPROVAL_STATUSES, BILLING_FREQUENCIES, CLASSIFICATIONS, UNITS_OF_MEASURE, type SkuLine } from "@/types/deal";
import { AlertTriangle, Lock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import LeverInput from "@/components/common/LeverInput";

const emptyLine = (scenarioId: string): Partial<SkuLine> => ({
  scenario_id: scenarioId,
  sku_name: "",
  sku_code: "",
  tower_key: "core",
  classification: "Incremental",
  bom_type: "revised",
  quantity: 1,
  unit_of_measure: "User",
  unit_list_price: 0,
  billing_frequency: "Annual",
  line_discount_pct: 0,
  category_discount_pct: 0,
  bulk_eligible: true,
  discountable: true,
  max_discount_pct: 60,
  approval_threshold_pct: 40,
  proration_method: "None",
  approval_status: "Draft",
  needs_salesforce_confirmation: false,
  needs_sn_confirmation: false,
});

export default function ScenarioBuilderPage() {
  const { activeScenarioId, canEdit } = useDeal();
  const { data: scenarios } = useScenarios();
  const { data: towers } = useTowers();
  const { data: lines } = useSkuLines(activeScenarioId);
  const upsertLine = useUpsertRow("sku_lines", [["sku_lines", activeScenarioId], ["sku_lines_all"]]);
  const upsertScenario = useUpsertRow("scenarios", [["scenarios"]]);
  const deleteLine = useDeleteRow("sku_lines", [["sku_lines", activeScenarioId], ["sku_lines_all"]]);

  const scenario = scenarios?.find((s) => s.id === activeScenarioId);
  const totals = useMemo(() => computeScenario(lines ?? [], scenario), [lines, scenario]);
  const [draft, setDraft] = useState<Partial<SkuLine> | null>(null);
  const locked = scenario?.is_locked || !canEdit;

  const patch = (line: SkuLine, changes: Partial<SkuLine>) => upsertLine.mutate({ ...line, ...changes });

  if (!scenario) return <p className="text-sm text-muted-foreground">Select a scenario from the header to begin.</p>;

  return (
    <div className="space-y-6">
      {locked && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          {scenario.is_locked
            ? `${scenario.name} is locked — it is the reference baseline and is read-only.`
            : "You do not have edit rights for this scenario."}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="List ARR (annual)" value={currency(totals.listArr)} hint={`3-yr list ${currency(totals.listTermValue)}`} />
        <KpiCard label="Net ARR (annual)" value={currency(totals.netArr)} hint={`3-yr net ${currency(totals.netTermValue)}`} tone="positive" />
        <KpiCard label="Effective discount" value={percent(totals.effectiveDiscountPct)} tone={totals.effectiveDiscountPct > scenario.approval_threshold_pct ? "critical" : "default"} />
        <KpiCard label="3-year TCV" value={currency(totals.tcv)} />

      </div>

      <SectionCard title="Scenario settings" description={scenario.description ?? "Commercial levers applied to every eligible line"}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {([
            ["scenario_discount_pct", "Scenario discount %", "Applied to every line after line and category discounts"],
            ["bulk_discount_pct", "Bulk discount %", "Applied only to bulk-eligible lines"],
            ["strategic_override_pct", "Strategic override %", "Final executive discount on top of the waterfall"],
            ["approval_threshold_pct", "Approval threshold %", "Flags lines above this effective discount"],
          ] as const).map(([field, label, hint]) => (
            <LeverInput
              key={field}
              label={label}
              hint={hint}
              value={Number(scenario[field])}
              disabled={locked}
              onCommit={(v) =>
                upsertScenario.mutate(
                  { ...scenario, [field]: v },
                  { onSuccess: () => toast.success(`${label.replace(" %", "")} set to ${v}% — totals updated`) },
                )
              }
            />
          ))}
        </div>
        <div className="mt-4 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Scenario notes</Label>
          <Textarea key={scenario.id} defaultValue={scenario.notes ?? ""} disabled={locked} onBlur={(e) => upsertScenario.mutate({ ...scenario, notes: e.target.value })} />
        </div>
      </SectionCard>

      <SectionCard
        title="Bill of materials"
        description={`${number((lines ?? []).length)} lines · ${number(totals.warnings)} pricing warnings`}
        actions={
          <Dialog open={!!draft} onOpenChange={(o) => setDraft(o ? emptyLine(scenario.id) : null)}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={locked}><Plus className="mr-1.5 h-4 w-4" /> Add SKU line</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Add SKU line</DialogTitle></DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>SKU name</Label>
                  <Input value={draft?.sku_name ?? ""} onChange={(e) => setDraft({ ...draft, sku_name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>SKU code</Label>
                  <Input value={draft?.sku_code ?? ""} onChange={(e) => setDraft({ ...draft, sku_code: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Tower</Label>
                  <Select value={draft?.tower_key ?? "core"} onValueChange={(v) => setDraft({ ...draft, tower_key: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{(towers ?? []).map((t) => <SelectItem key={t.key} value={t.key}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Quantity</Label>
                  <Input type="number" value={draft?.quantity ?? 1} onChange={(e) => setDraft({ ...draft, quantity: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Unit list price (3-year term)</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={draft?.unit_list_price || ""} onChange={(e) => setDraft({ ...draft, unit_list_price: e.target.value === "" ? 0 : Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Unit of measure</Label>
                  <Select value={draft?.unit_of_measure ?? "User"} onValueChange={(v) => setDraft({ ...draft, unit_of_measure: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{UNITS_OF_MEASURE.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Classification</Label>
                  <Select value={draft?.classification ?? "Incremental"} onValueChange={(v) => setDraft({ ...draft, classification: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CLASSIFICATIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    if (!draft?.sku_name) return;
                    upsertLine.mutate(draft as Record<string, unknown>);
                    setDraft(null);
                  }}
                >
                  Add line
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[220px]">SKU</TableHead>
                <TableHead className="w-28 min-w-[96px]">Qty</TableHead>
                <TableHead className="w-40 min-w-[150px]">List price (3-yr)</TableHead>
                <TableHead className="w-24 min-w-[88px]">Line %</TableHead>
                <TableHead className="w-36">Billing</TableHead>
                <TableHead className="text-right min-w-[130px]">Net ARR (annual)</TableHead>
                <TableHead className="text-right min-w-[130px]">Net 3-yr TCV</TableHead>
                <TableHead className="w-44">Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(lines ?? []).map((line) => {
                const m = computeLine(line, scenario);
                return (
                  <TableRow key={`${line.scenario_id}-${line.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium">{line.sku_name}</p>
                          <p className="text-xs text-muted-foreground">{line.sku_code ?? "—"} · {line.classification}</p>
                        </div>
                        {!!m.warnings.length && (
                          <Tooltip>
                            <TooltipTrigger><AlertTriangle className="h-4 w-4 text-amber-500" /></TooltipTrigger>
                            <TooltipContent className="max-w-xs">{m.warnings.join(" · ")}</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <NumberCell className="h-8 min-w-[80px]" value={line.quantity} disabled={locked} onCommit={(v) => patch(line, { quantity: v })} />
                    </TableCell>
                    <TableCell>
                      <NumberCell className="h-8" step="0.01" value={line.unit_list_price} disabled={locked} onCommit={(v) => patch(line, { unit_list_price: v })} />
                    </TableCell>
                    <TableCell>
                      <NumberCell className="h-8 min-w-[72px]" step="0.5" value={line.line_discount_pct} disabled={locked || !line.discountable} onCommit={(v) => patch(line, { line_discount_pct: v })} />
                    </TableCell>
                    <TableCell>
                      <Select value={line.billing_frequency} disabled={locked} onValueChange={(v) => patch(line, { billing_frequency: v })}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>{BILLING_FREQUENCIES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{currency(m.netArr)}</TableCell>
                    <TableCell className="text-right tabular-nums">{currency(m.tcv)}</TableCell>
                    <TableCell>
                      <Select value={line.approval_status} disabled={locked} onValueChange={(v) => patch(line, { approval_status: v })}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>{APPROVAL_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" disabled={locked} onClick={() => deleteLine.mutate(line.id)} aria-label="Delete line">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!(lines ?? []).length && <TableRow><TableCell colSpan={9} className="text-muted-foreground">No lines yet — add the first SKU.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <SectionCard title="Confirmation flags" description="Track who still needs to validate each assumption">
        <div className="grid gap-3 md:grid-cols-2">
          {(lines ?? []).filter((l) => l.needs_salesforce_confirmation || l.needs_sn_confirmation || l.approval_status !== "Approved for order form").map((line) => (
            <div key={line.id} className="flex items-center justify-between gap-4 rounded-md border p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{line.sku_name}</p>
                <Badge variant="outline" className="mt-1 text-[10px]">{line.approval_status}</Badge>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <label className="flex items-center gap-2 text-xs">
                  <Switch checked={line.needs_salesforce_confirmation} disabled={locked} onCheckedChange={(v) => patch(line, { needs_salesforce_confirmation: v })} /> SFDC
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <Switch checked={line.needs_sn_confirmation} disabled={locked} onCheckedChange={(v) => patch(line, { needs_sn_confirmation: v })} /> Customer
                </label>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
