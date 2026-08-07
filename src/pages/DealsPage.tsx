import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDeal } from "@/context/DealContext";
import { useDeals, useUpsertRow } from "@/hooks/useDealData";
import { useDuplicateDeal } from "@/hooks/useDealMutations";
import NewDealDialog from "@/components/deals/NewDealDialog";
import SectionCard from "@/components/common/SectionCard";
import KpiCard from "@/components/common/KpiCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { shortDate } from "@/lib/format";
import { DEAL_STATUSES } from "@/types/deal";
import { Briefcase, Copy, Plus } from "lucide-react";

export default function DealsPage() {
  const { canEdit, activeDealId, setActiveDealId } = useDeal();
  const { data: deals, isLoading } = useDeals();
  const upsert = useUpsertRow("deals", [["deals"]]);
  const duplicate = useDuplicateDeal();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const active = (deals ?? []).filter((d) => !d.is_archived);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Deals" value={String((deals ?? []).length)} />
        <KpiCard label="Active" value={String(active.length)} />
        <KpiCard label="Archived" value={String((deals ?? []).length - active.length)} />
      </div>

      <SectionCard
        title="Deal portfolio"
        description="Each deal carries its own scenarios, SKU lines, towers, discussion log and risk register"
        actions={
          <Button size="sm" onClick={() => setOpen(true)} disabled={!canEdit}>
            <Plus className="mr-1.5 h-4 w-4" /> New deal
          </Button>
        }
      >
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading deals…</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal</TableHead>
                <TableHead className="w-44">Customer</TableHead>
                <TableHead className="w-40">Partner</TableHead>
                <TableHead className="w-24">Currency</TableHead>
                <TableHead className="w-44">Status</TableHead>
                <TableHead className="w-40">Term</TableHead>
                <TableHead className="w-24">Archived</TableHead>
                <TableHead className="w-44 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(deals ?? []).map((d) => (
                <TableRow key={d.id} className={d.id === activeDealId ? "bg-primary/5" : undefined}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Input
                          className="h-8 min-w-[200px]"
                          disabled={!canEdit}
                          defaultValue={d.name}
                          onBlur={(e) => e.target.value !== d.name && upsert.mutate({ ...d, name: e.target.value })}
                        />
                        {d.id === activeDealId && <Badge variant="secondary" className="mt-1 text-[10px]">Active</Badge>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input className="h-8" disabled={!canEdit} defaultValue={d.customer_name} onBlur={(e) => e.target.value !== d.customer_name && upsert.mutate({ ...d, customer_name: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Input className="h-8" disabled={!canEdit} defaultValue={d.partner_name} onBlur={(e) => e.target.value !== d.partner_name && upsert.mutate({ ...d, partner_name: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Input className="h-8" disabled={!canEdit} defaultValue={d.currency} onBlur={(e) => e.target.value.toUpperCase() !== d.currency && upsert.mutate({ ...d, currency: e.target.value.toUpperCase() })} />
                  </TableCell>
                  <TableCell>
                    <Select value={d.status} disabled={!canEdit} onValueChange={(v) => upsert.mutate({ ...d, status: v })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DEAL_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {shortDate(d.contract_start)} → {shortDate(d.contract_end)}
                  </TableCell>
                  <TableCell>
                    <Switch checked={d.is_archived} disabled={!canEdit} onCheckedChange={(v) => upsert.mutate({ ...d, is_archived: v })} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant={d.id === activeDealId ? "secondary" : "outline"}
                        onClick={() => {
                          setActiveDealId(d.id);
                          navigate("/");
                        }}
                      >
                        Open
                      </Button>
                      <Button size="sm" variant="ghost" disabled={!canEdit || duplicate.isPending} onClick={() => duplicate.mutate(d)} aria-label={`Duplicate ${d.name}`}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>

      <NewDealDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
