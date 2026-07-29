import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { useDeal } from "@/context/DealContext";
import { useDeleteRow, useOrderForms, useScenarios, useSkuLines, useUpsertRow } from "@/hooks/useDealData";
import { computeLine, computeScenario } from "@/lib/pricing";
import { currency, percent, shortDate } from "@/lib/format";
import SectionCard from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { APPROVAL_STATUSES, ORDER_FORM_TYPES } from "@/types/deal";
import { Download, Plus, Trash2 } from "lucide-react";

export default function OrderFormPage() {
  const { activeScenarioId, canEdit } = useDeal();
  const { data: scenarios } = useScenarios();
  const { data: forms } = useOrderForms(activeScenarioId);
  const { data: lines } = useSkuLines(activeScenarioId);
  const upsertForm = useUpsertRow("order_forms", [["order_forms", activeScenarioId]]);
  const deleteForm = useDeleteRow("order_forms", [["order_forms", activeScenarioId]]);
  const scenario = scenarios?.find((s) => s.id === activeScenarioId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const locked = scenario?.is_locked || !canEdit;

  const selected = forms?.find((f) => f.id === selectedId) ?? forms?.[0];
  const includedLines = useMemo(
    () => (lines ?? []).filter((l) => l.approval_status === "Approved for order form"),
    [lines],
  );
  const totals = useMemo(() => computeScenario(includedLines, scenario), [includedLines, scenario]);

  const exportXlsx = () => {
    if (!selected) return;
    const rows = includedLines.map((l) => {
      const m = computeLine(l, scenario);
      return {
        "SKU code": l.sku_code ?? "",
        "SKU name": l.sku_name,
        Classification: l.classification,
        Quantity: l.quantity,
        UoM: l.unit_of_measure,
        "Unit list price": l.unit_list_price,
        "Billing frequency": l.billing_frequency,
        "Effective discount %": Number(m.effectiveDiscountPct.toFixed(2)),
        "Net ARR": Number(m.netArr.toFixed(2)),
        "Year 1": Number(m.y1.toFixed(2)),
        "Year 2": Number(m.y2.toFixed(2)),
        "Year 3": Number(m.y3.toFixed(2)),
        "3-year TCV": Number(m.tcv.toFixed(2)),
      };
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Order form");
    XLSX.writeFile(wb, `${selected.form_type.replace(/[^\w]+/g, "_")}.xlsx`);
  };

  if (!scenario) return <p className="text-sm text-muted-foreground">Select a scenario to assemble order forms.</p>;

  return (
    <div className="space-y-6">
      <SectionCard
        title="Order forms"
        description="Each order form packages approved lines for signature"
        actions={
          <Button
            size="sm"
            disabled={locked}
            onClick={() =>
              upsertForm.mutate({
                scenario_id: scenario.id,
                form_type: ORDER_FORM_TYPES[0],
                customer_name: "Smith+Nephew",
                partner_name: "Tech Mahindra",
                billing_frequency: "Annual",
                currency: scenario.currency,
                approval_status: "Draft",
              })
            }
          >
            <Plus className="mr-1.5 h-4 w-4" /> New order form
          </Button>
        }
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(forms ?? []).map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedId(f.id)}
              className={`rounded-md border p-3 text-left transition-colors ${selected?.id === f.id ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
            >
              <p className="text-sm font-medium">{f.form_type}</p>
              <p className="text-xs text-muted-foreground">{f.form_number ?? "No reference"} · {shortDate(f.contract_start)}</p>
              <Badge variant="outline" className="mt-2 text-[10px]">{f.approval_status}</Badge>
            </button>
          ))}
          {!(forms ?? []).length && <p className="text-sm text-muted-foreground">No order forms yet.</p>}
        </div>
      </SectionCard>

      {selected && (
        <>
          <SectionCard
            title="Form header"
            description="Contract parties, term and commercial terms"
            actions={
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={exportXlsx}><Download className="mr-1.5 h-4 w-4" /> Export</Button>
                <Button size="sm" variant="ghost" disabled={locked} onClick={() => deleteForm.mutate(selected.id)} aria-label="Delete order form"><Trash2 className="h-4 w-4" /></Button>
              </div>
            }
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Form type</Label>
                <Select value={selected.form_type} disabled={locked} onValueChange={(v) => upsertForm.mutate({ ...selected, form_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ORDER_FORM_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Form number</Label>
                <Input defaultValue={selected.form_number ?? ""} disabled={locked} onBlur={(e) => upsertForm.mutate({ ...selected, form_number: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Approval status</Label>
                <Select value={selected.approval_status} disabled={locked} onValueChange={(v) => upsertForm.mutate({ ...selected, approval_status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{APPROVAL_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Customer</Label>
                <Input defaultValue={selected.customer_name} disabled={locked} onBlur={(e) => upsertForm.mutate({ ...selected, customer_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Contract start</Label>
                <Input type="date" defaultValue={selected.contract_start ?? ""} disabled={locked} onBlur={(e) => upsertForm.mutate({ ...selected, contract_start: e.target.value || null })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Contract end</Label>
                <Input type="date" defaultValue={selected.contract_end ?? ""} disabled={locked} onBlur={(e) => upsertForm.mutate({ ...selected, contract_end: e.target.value || null })} />
              </div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Assumptions</Label>
                <Textarea defaultValue={selected.assumptions ?? ""} disabled={locked} onBlur={(e) => upsertForm.mutate({ ...selected, assumptions: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Open items</Label>
                <Textarea defaultValue={selected.open_items ?? ""} disabled={locked} onBlur={(e) => upsertForm.mutate({ ...selected, open_items: e.target.value })} />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Approved lines" description="Only lines marked “Approved for order form” are included">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">List price</TableHead>
                    <TableHead className="text-right">Eff. disc.</TableHead>
                    <TableHead className="text-right">Net ARR</TableHead>
                    <TableHead className="text-right">3-yr TCV</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {includedLines.map((l) => {
                    const m = computeLine(l, scenario);
                    return (
                      <TableRow key={l.id}>
                        <TableCell>
                          <p className="font-medium">{l.sku_name}</p>
                          <p className="text-xs text-muted-foreground">{l.sku_code ?? "—"}</p>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{l.quantity}</TableCell>
                        <TableCell className="text-right tabular-nums">{currency(l.unit_list_price, selected.currency, 2)}</TableCell>
                        <TableCell className="text-right tabular-nums">{percent(m.effectiveDiscountPct)}</TableCell>
                        <TableCell className="text-right tabular-nums">{currency(m.netArr, selected.currency)}</TableCell>
                        <TableCell className="text-right tabular-nums">{currency(m.tcv, selected.currency)}</TableCell>
                      </TableRow>
                    );
                  })}
                  {!includedLines.length && <TableRow><TableCell colSpan={6} className="text-muted-foreground">No approved lines yet.</TableCell></TableRow>}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4}>Order form total</TableCell>
                    <TableCell className="text-right tabular-nums">{currency(totals.netArr, selected.currency)}</TableCell>
                    <TableCell className="text-right tabular-nums">{currency(totals.tcv, selected.currency)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
