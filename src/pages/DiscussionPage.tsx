import { useMemo, useState } from "react";
import { useDeal } from "@/context/DealContext";
import { useDiscussionItems, useUpsertRow } from "@/hooks/useDealData";
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MessageSquareWarning, Plus } from "lucide-react";

const STATUSES = ["Open", "In discussion", "Awaiting Salesforce", "Awaiting Smith+Nephew", "Closed"];
const INCLUSION = ["Include", "Exclude", "Optional", "Undecided"];

export default function DiscussionPage() {
  const { canEdit } = useDeal();
  const { data: items } = useDiscussionItems();
  const upsert = useUpsertRow("discussion_items", [["discussion_items"]]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ area: "Commercial", title: "", description: "", owner: "", status: "Open", order_form_inclusion: "Undecided" });
  const [filter, setFilter] = useState("all");

  const grouped = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const i of items ?? []) {
      if (filter !== "all" && i.status !== filter) continue;
      map.set(i.area, [...(map.get(i.area) ?? []), i]);
    }
    return [...map.entries()];
  }, [items, filter]);

  const openCount = (items ?? []).filter((i) => i.status !== "Closed").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total items" value={String((items ?? []).length)} icon={MessageSquareWarning} />
        <KpiCard label="Open" value={String(openCount)} tone={openCount ? "warning" : "positive"} />
        <KpiCard label="Awaiting Salesforce" value={String((items ?? []).filter((i) => i.status === "Awaiting Salesforce").length)} />
        <KpiCard label="Awaiting Smith+Nephew" value={String((items ?? []).filter((i) => i.status === "Awaiting Smith+Nephew").length)} />
      </div>

      <SectionCard
        title="Discussion log"
        description="Open questions that must be resolved before the order forms are signed"
        actions={
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[190px]" aria-label="Filter by status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={!canEdit}><Plus className="mr-1.5 h-4 w-4" /> Add item</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New discussion item</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5"><Label>Area</Label><Input value={draft.area} onChange={(e) => setDraft({ ...draft, area: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Title</Label><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Description</Label><Textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Owner</Label><Input value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} /></div>
                </div>
                <DialogFooter>
                  <Button onClick={() => { if (draft.title) { upsert.mutate(draft); setOpen(false); } }}>Add</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      >
        <Accordion type="multiple" className="w-full">
          {grouped.map(([area, list]) => (
            <AccordionItem key={area} value={area}>
              <AccordionTrigger className="text-sm font-medium">
                {area} <Badge variant="outline" className="ml-2">{list?.length ?? 0}</Badge>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {(list ?? []).map((item) => (
                    <div key={item.id} className="rounded-md border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium">{item.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                          <Select value={item.status} disabled={!canEdit} onValueChange={(v) => upsert.mutate({ ...item, status: v })}>
                            <SelectTrigger className="h-8 w-[190px]"><SelectValue /></SelectTrigger>
                            <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                          </Select>
                          <Select value={item.order_form_inclusion} disabled={!canEdit} onValueChange={(v) => upsert.mutate({ ...item, order_form_inclusion: v })}>
                            <SelectTrigger className="h-8 w-[150px]"><SelectValue /></SelectTrigger>
                            <SelectContent>{INCLUSION.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      <dl className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                        <div><dt className="font-medium text-foreground">Owner</dt><dd>{item.owner ?? "Unassigned"}</dd></div>
                        <div><dt className="font-medium text-foreground">Commercial impact</dt><dd>{item.commercial_impact ?? "—"}</dd></div>
                        <div><dt className="font-medium text-foreground">Technical impact</dt><dd>{item.technical_impact ?? "—"}</dd></div>
                        <div><dt className="font-medium text-foreground">Decision by</dt><dd>{shortDate(item.target_decision_date)}</dd></div>
                      </dl>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        {!grouped.length && <p className="text-sm text-muted-foreground">No items match this filter.</p>}
      </SectionCard>
    </div>
  );
}
