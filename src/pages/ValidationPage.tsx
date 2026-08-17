import { useMemo } from "react";
import { useDeal } from "@/context/DealContext";
import { useDealEconomics } from "@/hooks/useDealEconomics";
import { useDeleteCommercialRow, useSaveCommercialRow, useValidationItems } from "@/hooks/useCommercial";
import SectionCard from "@/components/common/SectionCard";
import KpiCard from "@/components/common/KpiCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { currency } from "@/lib/format";
import { VALIDATION_SCOPES } from "@/types/deal";
import { CheckCircle2, Plus, ShieldAlert, Trash2, XCircle } from "lucide-react";

const SEVERITIES = ["High", "Medium", "Low"];
const STATUSES = ["Open", "In review", "With Salesforce", "With customer", "Resolved", "Closed"];

export default function ValidationPage() {
  const { canEdit } = useDeal();
  const view = useDealEconomics();
  const { data: items } = useValidationItems();
  const save = useSaveCommercialRow("validation_items", [["validation_items"], ["portfolio"]]);
  const remove = useDeleteCommercialRow("validation_items", [["validation_items"], ["portfolio"]]);

  /** Universal checks are derived from the model, not stored — they always reflect live numbers. */
  const derived = useMemo(() => {
    if (!view) return [];
    const e = view.economics;
    const cur = view.deal.currency;
    const termCheck = Math.abs(e.license.netTermValue - e.totals.netArr * 3) < 1;
    const rampCheck = Math.abs(e.totals.tcv - e.license.netTermValue) < 1;
    const waterfall =
      Math.abs(
        e.totals.listArr -
          e.totals.netArr -
          (e.totals.lineDiscountValue + e.totals.categoryDiscountValue + e.totals.bulkDiscountValue + e.totals.overrideDiscountValue),
      ) < 1;
    return [
      { title: "TCV reconciliation", pass: termCheck, detail: `Net term value ${currency(e.license.netTermValue, cur)} = net ARR × 3` },
      { title: "Annual totals / ramp", pass: rampCheck, detail: rampCheck ? "Year 1–3 ramp equals net term value" : "Quantity ramp or proration changes the term total" },
      { title: "Discount waterfall reconciliation", pass: waterfall, detail: "Discount buckets reconcile to list minus net ARR" },
      { title: "Price recurrence", pass: e.license.linesWithoutCost === 0, detail: `${e.license.linesWithoutCost} line(s) missing a Salesforce acquisition price` },
      { title: "Quantity completeness", pass: e.totals.listArr > 0, detail: e.totals.listArr > 0 ? "Quantities and prices produce list value" : "No priced quantities on the scenario" },
      { title: "Margin floor", pass: !e.belowMarginFloor, detail: `Licence GM ${e.license.licenseGmPct.toFixed(1)}% vs ${view.deal.min_license_gm_pct}% floor` },
      { title: "Approval thresholds", pass: e.totals.warnings === 0, detail: `${e.totals.warnings} line-level policy warning(s)` },
      {
        title: "Marketplace eligibility",
        pass: e.marketplace.routedTermValue === 0 || e.marketplace.coversRouted,
        detail: e.marketplace.routedTermValue === 0 ? "Not routed via marketplace" : "Commitment covers the routed value",
      },
    ];
  }, [view]);

  if (!view) return <p className="text-sm text-muted-foreground">Open a deal to run its validation centre.</p>;

  const list = items ?? [];
  const openCount = list.filter((i) => i.status !== "Closed" && i.status !== "Resolved").length;
  const failed = derived.filter((d) => !d.pass).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Universal checks failing" value={String(failed)} icon={ShieldAlert} tone={failed > 0 ? "critical" : "positive"} />
        <KpiCard label="Open issues" value={String(openCount)} />
        <KpiCard label="Salesforce commercial issues" value={String(list.filter((i) => i.scope === "salesforce").length)} />
        <KpiCard label="Customer-specific issues" value={String(list.filter((i) => i.scope === "customer").length)} />
      </div>

      <SectionCard title="Universal checks" description="Platform logic applied to every deal — computed live from the active scenario">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-64">Check</TableHead>
              <TableHead>Detail</TableHead>
              <TableHead className="w-28 text-right">Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {derived.map((d) => (
              <TableRow key={d.title}>
                <TableCell className="text-sm">{d.title}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{d.detail}</TableCell>
                <TableCell className="text-right">
                  {d.pass ? (
                    <Badge variant="secondary"><CheckCircle2 className="mr-1 h-3 w-3" /> Pass</Badge>
                  ) : (
                    <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Review</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      {VALIDATION_SCOPES.filter((s) => s.key !== "universal").map((scope) => (
        <SectionCard
          key={scope.key}
          title={scope.label}
          description={
            scope.key === "salesforce"
              ? "Discount, entitlement, product swap, Innovation Fund and marketplace eligibility items"
              : "Issues that belong to this customer only — they never appear on other deals"
          }
          actions={
            <Button size="sm" disabled={!canEdit} onClick={() => save.mutate({ deal_id: view.deal.id, scope: scope.key, title: "New item" })}>
              <Plus className="mr-1.5 h-4 w-4" /> Add item
            </Button>
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-56">Title</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead className="w-28">Severity</TableHead>
                <TableHead className="w-40">Status</TableHead>
                <TableHead className="w-36">Owner</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.filter((i) => i.scope === scope.key).map((i) => (
                <TableRow key={i.id}>
                  <TableCell><Input className="h-8" disabled={!canEdit} defaultValue={i.title} onBlur={(ev) => save.mutate({ ...i, title: ev.target.value })} /></TableCell>
                  <TableCell><Input className="h-8" disabled={!canEdit} defaultValue={i.detail ?? ""} onBlur={(ev) => save.mutate({ ...i, detail: ev.target.value || null })} /></TableCell>
                  <TableCell>
                    <Select value={i.severity} disabled={!canEdit} onValueChange={(v) => save.mutate({ ...i, severity: v })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={i.status} disabled={!canEdit} onValueChange={(v) => save.mutate({ ...i, status: v })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Input className="h-8" disabled={!canEdit} defaultValue={i.owner ?? ""} onBlur={(ev) => save.mutate({ ...i, owner: ev.target.value || null })} /></TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" disabled={!canEdit} onClick={() => remove.mutate(i.id)} aria-label="Delete validation item">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!list.filter((i) => i.scope === scope.key).length && (
                <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">Nothing logged in this category.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </SectionCard>
      ))}
    </div>
  );
}
