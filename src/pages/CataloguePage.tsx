import { useMemo, useState } from "react";
import { useDeal } from "@/context/DealContext";
import { useAllSkuLines, useTowers } from "@/hooks/useDealData";
import { computeLine } from "@/lib/pricing";
import { currency, number, percent } from "@/lib/format";
import SectionCard from "@/components/common/SectionCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CLASSIFICATIONS } from "@/types/deal";

export default function CataloguePage() {
  const { activeScenarioId } = useDeal();
  const { data: lines, isLoading } = useAllSkuLines();
  const { data: towers } = useTowers();
  const [search, setSearch] = useState("");
  const [tower, setTower] = useState("all");
  const [classification, setClassification] = useState("all");

  const catalogue = useMemo(() => {
    const byKey = new Map<string, { line: (typeof lines)[number]; scenarios: number }>();
    for (const line of lines ?? []) {
      const key = `${line.sku_code ?? line.sku_name}`.toLowerCase();
      const existing = byKey.get(key);
      if (existing) existing.scenarios += 1;
      else byKey.set(key, { line, scenarios: 1 });
    }
    return [...byKey.values()]
      .filter(({ line }) => (tower === "all" ? true : line.tower_key === tower))
      .filter(({ line }) => (classification === "all" ? true : line.classification === classification))
      .filter(({ line }) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return [line.sku_name, line.sku_code, line.product_family, line.cloud].some((v) => v?.toLowerCase().includes(q));
      })
      .sort((a, b) => a.line.sku_name.localeCompare(b.line.sku_name));
  }, [lines, tower, classification, search]);

  return (
    <div className="space-y-6">
      <SectionCard
        title="Master SKU catalogue"
        description="Every SKU referenced across scenarios, with list price, discount floor and eligibility flags"
      >
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <Input placeholder="Search SKU, code, cloud…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search catalogue" />
          <Select value={tower} onValueChange={setTower}>
            <SelectTrigger aria-label="Filter by tower"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All towers</SelectItem>
              {(towers ?? []).map((t) => (
                <SelectItem key={t.key} value={t.key}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={classification} onValueChange={setClassification}>
            <SelectTrigger aria-label="Filter by classification"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classifications</SelectItem>
              {CLASSIFICATIONS.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Cloud / family</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>UoM</TableHead>
                <TableHead className="text-right">List price (3-yr)</TableHead>
                <TableHead className="text-right">Annualised</TableHead>
                <TableHead className="text-right">Floor</TableHead>
                <TableHead className="text-right">Eff. discount</TableHead>
                <TableHead>Flags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={9} className="text-muted-foreground">Loading catalogue…</TableCell></TableRow>
              )}
              {!isLoading && !catalogue.length && (
                <TableRow><TableCell colSpan={9} className="text-muted-foreground">No SKUs match the current filters.</TableCell></TableRow>
              )}
              {catalogue.map(({ line, scenarios }) => {
                const m = computeLine(line);
                return (
                  <TableRow key={line.id}>
                    <TableCell>
                      <p className="font-medium">{line.sku_name}</p>
                      <p className="text-xs text-muted-foreground">{line.sku_code ?? "—"} · used in {number(scenarios)} scenario(s)</p>
                    </TableCell>
                    <TableCell className="text-sm">{line.cloud ?? "—"}<span className="block text-xs text-muted-foreground">{line.product_family ?? ""}</span></TableCell>
                    <TableCell><Badge variant="outline">{line.classification}</Badge></TableCell>
                    <TableCell className="text-sm">{line.unit_of_measure}</TableCell>
                    <TableCell className="text-right tabular-nums">{currency(line.unit_list_price, "USD", 2)}</TableCell>
                    <TableCell className="text-right tabular-nums">{percent(line.max_discount_pct, 0)}</TableCell>
                    <TableCell className="text-right tabular-nums">{percent(m.effectiveDiscountPct)}</TableCell>
                    <TableCell className="space-x-1">
                      {!line.discountable && <Badge variant="destructive" className="text-[10px]">No discount</Badge>}
                      {line.bulk_eligible && <Badge variant="secondary" className="text-[10px]">Bulk</Badge>}
                      {line.billing_frequency === "Usage-based" && <Badge variant="outline" className="text-[10px]">Usage</Badge>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
      {!activeScenarioId && <p className="text-sm text-muted-foreground">Select a scenario in the header to price these SKUs.</p>}
    </div>
  );
}
