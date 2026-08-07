import { useMemo, useState } from "react";
import { useDeal } from "@/context/DealContext";
import { useAllSkuLines, useDeleteRow, useInsertRows, useSkuLibrary, useUpsertRow } from "@/hooks/useDealData";
import SectionCard from "@/components/common/SectionCard";
import KpiCard from "@/components/common/KpiCard";
import { NumberCell } from "@/components/common/NumberCell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { currency } from "@/lib/format";
import { BILLING_FREQUENCIES, UNITS_OF_MEASURE } from "@/types/deal";
import { Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

export default function SkuLibraryPage() {
  const { canEdit } = useDeal();
  const { data: library, isLoading } = useSkuLibrary();
  const { data: dealLines } = useAllSkuLines();
  const upsert = useUpsertRow("sku_library", [["sku_library"]]);
  const remove = useDeleteRow("sku_library", [["sku_library"]]);
  const insert = useInsertRows("sku_library", [["sku_library"]]);
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    sku_name: "",
    sku_code: "",
    product_family: "",
    cloud: "",
    unit_of_measure: "User",
    unit_list_price: 0,
    billing_frequency: "Annual",
  });

  const rows = useMemo(() => {
    const q = term.trim().toLowerCase();
    return (library ?? []).filter(
      (l) =>
        !q ||
        l.sku_name.toLowerCase().includes(q) ||
        (l.sku_code ?? "").toLowerCase().includes(q) ||
        (l.product_family ?? "").toLowerCase().includes(q) ||
        (l.cloud ?? "").toLowerCase().includes(q),
    );
  }, [library, term]);

  /** Lines in the current deal that are not yet represented in the library. */
  const missing = useMemo(() => {
    const known = new Set((library ?? []).map((l) => `${l.sku_name}|${l.unit_list_price}|${l.unit_of_measure}`));
    const map = new Map<string, (typeof dealLines)[number]>();
    for (const line of dealLines ?? []) {
      const key = `${line.sku_name}|${line.unit_list_price}|${line.unit_of_measure}`;
      if (!known.has(key)) map.set(key, line);
    }
    return [...map.values()];
  }, [library, dealLines]);

  const promote = () => {
    if (!missing.length) return;
    insert.mutate(
      missing.map((l) => ({
        sku_code: l.sku_code,
        sku_name: l.sku_name,
        description: l.description,
        product_family: l.product_family,
        product_category: l.product_category,
        cloud: l.cloud,
        unit_of_measure: l.unit_of_measure,
        unit_list_price: l.unit_list_price,
        billing_frequency: l.billing_frequency,
        default_tower_key: l.tower_key,
      })),
      { onSuccess: () => toast.success(`Added ${missing.length} SKUs to the library`) },
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Library SKUs" value={String((library ?? []).length)} />
        <KpiCard label="Active" value={String((library ?? []).filter((l) => l.is_active).length)} />
        <KpiCard label="Not yet in library (this deal)" value={String(missing.length)} />
      </div>

      <SectionCard
        title="Salesforce SKU library"
        description="Reusable master list any deal can be built from — prices are 3-year term values"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={!canEdit || !missing.length || insert.isPending} onClick={promote}>
              <Upload className="mr-1.5 h-4 w-4" /> Promote deal SKUs ({missing.length})
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={!canEdit}><Plus className="mr-1.5 h-4 w-4" /> Add SKU</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add SKU to library</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div className="space-y-1.5">
                    <Label>SKU name</Label>
                    <Input value={draft.sku_name} onChange={(e) => setDraft({ ...draft, sku_name: e.target.value })} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>SKU code</Label>
                      <Input value={draft.sku_code} onChange={(e) => setDraft({ ...draft, sku_code: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Product family</Label>
                      <Input value={draft.product_family} onChange={(e) => setDraft({ ...draft, product_family: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Cloud</Label>
                      <Input value={draft.cloud} onChange={(e) => setDraft({ ...draft, cloud: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Unit of measure</Label>
                      <Select value={draft.unit_of_measure} onValueChange={(v) => setDraft({ ...draft, unit_of_measure: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {UNITS_OF_MEASURE.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>List price (3-yr term)</Label>
                      <Input
                        type="number"
                        value={draft.unit_list_price === 0 ? "" : String(draft.unit_list_price)}
                        placeholder="0.00"
                        onChange={(e) => setDraft({ ...draft, unit_list_price: Number(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Billing frequency</Label>
                      <Select value={draft.billing_frequency} onValueChange={(v) => setDraft({ ...draft, billing_frequency: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {BILLING_FREQUENCIES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      if (!draft.sku_name.trim()) return toast.error("SKU name is required");
                      upsert.mutate(
                        { ...draft, sku_code: draft.sku_code || null, product_family: draft.product_family || null, cloud: draft.cloud || null },
                        {
                          onSuccess: () => {
                            setOpen(false);
                            setDraft({ sku_name: "", sku_code: "", product_family: "", cloud: "", unit_of_measure: "User", unit_list_price: 0, billing_frequency: "Annual" });
                            toast.success("SKU added to the library");
                          },
                        },
                      );
                    }}
                  >
                    Add
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      >
        <div className="mb-3 max-w-sm">
          <Input placeholder="Search the library" value={term} onChange={(e) => setTerm(e.target.value)} />
        </div>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading library…</p>
        ) : (
          <div className="max-h-[560px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead className="w-28">UoM</TableHead>
                  <TableHead className="w-44">List price (3-yr)</TableHead>
                  <TableHead className="w-32">Annualised</TableHead>
                  <TableHead className="w-24">Active</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <Input
                        className="h-8 min-w-[220px]"
                        disabled={!canEdit}
                        defaultValue={l.sku_name}
                        onBlur={(e) => e.target.value !== l.sku_name && upsert.mutate({ ...l, sku_name: e.target.value })}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {[l.sku_code, l.product_family, l.cloud].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Select value={l.unit_of_measure} disabled={!canEdit} onValueChange={(v) => upsert.mutate({ ...l, unit_of_measure: v })}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {UNITS_OF_MEASURE.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <NumberCell
                        className="h-8 min-w-[150px] text-right"
                        value={l.unit_list_price}
                        disabled={!canEdit}
                        step="0.01"
                        onCommit={(v) => upsert.mutate({ ...l, unit_list_price: v })}
                      />
                    </TableCell>
                    <TableCell className="text-sm tabular-nums text-muted-foreground">{currency(l.unit_list_price / 3)}</TableCell>
                    <TableCell>
                      <Switch checked={l.is_active} disabled={!canEdit} onCheckedChange={(v) => upsert.mutate({ ...l, is_active: v })} />
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" disabled={!canEdit} onClick={() => remove.mutate(l.id)} aria-label={`Remove ${l.sku_name}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!rows.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-sm text-muted-foreground">
                      No SKUs yet. Add one, or promote the SKUs already used in this deal.
                      <Badge variant="outline" className="ml-2">{missing.length} available</Badge>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
