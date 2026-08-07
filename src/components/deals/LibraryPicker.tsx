import { useMemo, useState } from "react";
import { useSkuLibrary } from "@/hooks/useDealData";
import { currency } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { LibrarySelection } from "@/hooks/useDealMutations";

interface Props {
  value: LibrarySelection[];
  onChange: (next: LibrarySelection[]) => void;
}

/** Searchable multi-select over the global SKU library with per-line quantities. */
export default function LibraryPicker({ value, onChange }: Props) {
  const { data: library, isLoading } = useSkuLibrary();
  const [term, setTerm] = useState("");

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

  const selected = new Map(value.map((v) => [v.libraryId, v.quantity]));

  const toggle = (id: string, on: boolean) =>
    onChange(on ? [...value, { libraryId: id, quantity: 1 }] : value.filter((v) => v.libraryId !== id));

  const setQty = (id: string, qty: number) =>
    onChange(value.map((v) => (v.libraryId === id ? { ...v, quantity: qty } : v)));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Input placeholder="Search SKU name, code, family or cloud" value={term} onChange={(e) => setTerm(e.target.value)} />
        <Badge variant="secondary" className="shrink-0">{value.length} selected</Badge>
      </div>
      <div className="max-h-[340px] overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>SKU</TableHead>
              <TableHead className="w-24">UoM</TableHead>
              <TableHead className="w-40 text-right">List (3-yr)</TableHead>
              <TableHead className="w-28">Qty</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-sm text-muted-foreground">Loading library…</TableCell>
              </TableRow>
            )}
            {!isLoading && !rows.length && (
              <TableRow>
                <TableCell colSpan={5} className="text-sm text-muted-foreground">No SKUs match that search.</TableCell>
              </TableRow>
            )}
            {rows.map((l) => {
              const on = selected.has(l.id);
              return (
                <TableRow key={l.id}>
                  <TableCell>
                    <Checkbox checked={on} onCheckedChange={(v) => toggle(l.id, !!v)} aria-label={`Select ${l.sku_name}`} />
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{l.sku_name}</p>
                    <p className="text-xs text-muted-foreground">{[l.sku_code, l.product_family, l.cloud].filter(Boolean).join(" · ") || "—"}</p>
                  </TableCell>
                  <TableCell className="text-sm">{l.unit_of_measure}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{currency(l.unit_list_price)}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      className="h-8"
                      disabled={!on}
                      value={on ? String(selected.get(l.id) ?? 1) : ""}
                      onChange={(e) => setQty(l.id, Number(e.target.value) || 0)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
