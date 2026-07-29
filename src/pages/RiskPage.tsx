import { useMemo, useState } from "react";
import { useDeal } from "@/context/DealContext";
import { useRiskLog, useUpsertRow } from "@/hooks/useDealData";
import { shortDate } from "@/lib/format";
import SectionCard from "@/components/common/SectionCard";
import KpiCard from "@/components/common/KpiCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Plus, ShieldAlert } from "lucide-react";

const LEVELS = ["Low", "Medium", "High"] as const;
const STATUSES = ["Open", "Mitigating", "Accepted", "Closed"];

export default function RiskPage() {
  const { canEdit } = useDeal();
  const { data: risks } = useRiskLog();
  const upsert = useUpsertRow("risk_log", [["risk_log"]]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ ref_code: "", category: "Commercial", description: "", owner: "", impact: "Medium", probability: "Medium", status: "Open" });

  const matrix = useMemo(() => {
    const grid: Record<string, number> = {};
    for (const r of risks ?? []) {
      if (r.status === "Closed") continue;
      grid[`${r.probability}|${r.impact}`] = (grid[`${r.probability}|${r.impact}`] ?? 0) + 1;
    }
    return grid;
  }, [risks]);

  const openRisks = (risks ?? []).filter((r) => r.status !== "Closed");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total risks" value={String((risks ?? []).length)} icon={ShieldAlert} />
        <KpiCard label="Open" value={String(openRisks.length)} tone={openRisks.length ? "warning" : "positive"} />
        <KpiCard label="High impact" value={String(openRisks.filter((r) => r.impact === "High").length)} tone="critical" />
        <KpiCard label="Mitigating" value={String((risks ?? []).filter((r) => r.status === "Mitigating").length)} />
      </div>

      <SectionCard title="Probability / impact matrix" description="Open risks plotted by likelihood and commercial impact">
        <div className="grid grid-cols-[auto_repeat(3,1fr)] gap-2 text-center text-sm">
          <div />
          {LEVELS.map((i) => <div key={i} className="pb-1 text-xs font-medium text-muted-foreground">Impact {i}</div>)}
          {LEVELS.slice().reverse().map((p) => (
            <>
              <div key={`label-${p}`} className="flex items-center justify-end pr-2 text-xs font-medium text-muted-foreground">Prob. {p}</div>
              {LEVELS.map((i) => {
                const count = matrix[`${p}|${i}`] ?? 0;
                const severity = LEVELS.indexOf(p) + LEVELS.indexOf(i);
                return (
                  <div
                    key={`${p}-${i}`}
                    className={cn(
                      "flex h-16 items-center justify-center rounded-md border font-display text-lg font-semibold",
                      severity >= 3 ? "border-destructive/40 bg-destructive/10 text-destructive" : severity >= 2 ? "border-amber-500/40 bg-amber-500/10 text-amber-600" : "border-secondary/40 bg-secondary/10 text-secondary",
                    )}
                  >
                    {count || "—"}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Risk register"
        description="Commercial, technical and legal exposure with owners and decision dates"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" disabled={!canEdit}><Plus className="mr-1.5 h-4 w-4" /> Add risk</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New risk</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5"><Label>Reference</Label><Input value={draft.ref_code} onChange={(e) => setDraft({ ...draft, ref_code: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Category</Label><Input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Description</Label><Textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Owner</Label><Input value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={() => { if (draft.description) { upsert.mutate(draft); setOpen(false); } }}>Add</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Risk</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="w-32">Impact</TableHead>
                <TableHead className="w-32">Probability</TableHead>
                <TableHead className="w-36">Status</TableHead>
                <TableHead>Decision by</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(risks ?? []).map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className="font-medium">{r.description}</p>
                    <p className="text-xs text-muted-foreground">{r.ref_code ?? "—"}</p>
                  </TableCell>
                  <TableCell><Badge variant="outline">{r.category}</Badge></TableCell>
                  <TableCell className="text-sm">{r.owner ?? "Unassigned"}</TableCell>
                  <TableCell>
                    <Select value={r.impact} disabled={!canEdit} onValueChange={(v) => upsert.mutate({ ...r, impact: v })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={r.probability} disabled={!canEdit} onValueChange={(v) => upsert.mutate({ ...r, probability: v })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={r.status} disabled={!canEdit} onValueChange={(v) => upsert.mutate({ ...r, status: v })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm">{shortDate(r.decision_needed_by)}</TableCell>
                </TableRow>
              ))}
              {!(risks ?? []).length && <TableRow><TableCell colSpan={7} className="text-muted-foreground">No risks logged.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  );
}
