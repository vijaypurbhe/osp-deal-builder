import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useDeal } from "@/context/DealContext";
import { useInsertRows, useScenarios, useSkuLines } from "@/hooks/useDealData";
import SectionCard from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload } from "lucide-react";
import { toast } from "sonner";

interface ParsedRow {
  sku_name: string;
  sku_code: string | null;
  quantity: number;
  unit_list_price: number;
  classification: string;
  unit_of_measure: string;
  billing_frequency: string;
  valid: boolean;
  issue?: string;
}

const pick = (row: Record<string, unknown>, keys: string[]) => {
  for (const k of Object.keys(row)) {
    if (keys.some((c) => k.trim().toLowerCase() === c)) return row[k];
  }
  return undefined;
};

export default function ImportPage() {
  const { activeScenarioId, canEdit } = useDeal();
  const { data: scenarios } = useScenarios();
  const { data: lines } = useSkuLines(activeScenarioId);
  const insert = useInsertRows("sku_lines", [["sku_lines", activeScenarioId], ["sku_lines_all"]]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scenario = scenarios?.find((s) => s.id === activeScenarioId);

  const handleFile = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    const parsed: ParsedRow[] = json.map((r) => {
      const name = String(pick(r, ["sku name", "sku", "product", "product name"]) ?? "").trim();
      const qty = Number(pick(r, ["quantity", "qty", "units"]) ?? 0);
      const price = Number(pick(r, ["unit list price", "list price", "price", "unit price"]) ?? 0);
      const valid = !!name && qty > 0;
      return {
        sku_name: name,
        sku_code: String(pick(r, ["sku code", "code", "product code"]) ?? "").trim() || null,
        quantity: qty,
        unit_list_price: Number.isFinite(price) ? price : 0,
        classification: String(pick(r, ["classification", "type"]) ?? "Incremental"),
        unit_of_measure: String(pick(r, ["uom", "unit of measure"]) ?? "User"),
        billing_frequency: String(pick(r, ["billing frequency", "billing"]) ?? "Annual"),
        valid,
        issue: !name ? "Missing SKU name" : qty <= 0 ? "Quantity must be greater than zero" : undefined,
      };
    });
    setRows(parsed);
    setFileName(file.name);
    toast.success(`Parsed ${parsed.length} rows from ${file.name}`);
  };

  const commit = () => {
    if (!activeScenarioId) return;
    const valid = rows.filter((r) => r.valid);
    if (!valid.length) return toast.error("No valid rows to import");
    insert.mutate(
      valid.map((r) => ({
        scenario_id: activeScenarioId,
        sku_name: r.sku_name,
        sku_code: r.sku_code,
        quantity: r.quantity,
        unit_list_price: r.unit_list_price,
        classification: r.classification,
        unit_of_measure: r.unit_of_measure,
        billing_frequency: r.billing_frequency,
        bom_type: "revised",
        approval_status: "Draft",
        source_file: fileName,
      })),
      { onSuccess: () => { toast.success(`Imported ${valid.length} lines`); setRows([]); } },
    );
  };

  if (!scenario) return <p className="text-sm text-muted-foreground">Select a scenario before importing data.</p>;

  return (
    <div className="space-y-6">
      <SectionCard
        title="Upload a pricing workbook"
        description="Accepts .xlsx or .csv extracts — the first sheet is parsed and mapped by column heading"
      >
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) void handleFile(f);
          }}
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Drag a workbook here, or choose a file</p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && void handleFile(e.target.files[0])}
          />
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={!canEdit}>Choose file</Button>
          <p className="text-xs text-muted-foreground">Recognised headings: SKU name, SKU code, Quantity, Unit list price, Classification, UoM, Billing frequency</p>
        </div>
      </SectionCard>

      {!!rows.length && (
        <SectionCard
          title="Preview"
          description={`${rows.filter((r) => r.valid).length} of ${rows.length} rows are ready to import into ${scenario.name}`}
          actions={<Button size="sm" onClick={commit} disabled={!canEdit || insert.isPending}>Import valid rows</Button>}
        >
          <div className="max-h-[480px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">List price</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={`${r.sku_name}-${i}`}>
                    <TableCell>
                      <p className="font-medium">{r.sku_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{r.sku_code ?? ""}</p>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{r.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.unit_list_price}</TableCell>
                    <TableCell>{r.classification}</TableCell>
                    <TableCell>
                      {r.valid ? <Badge variant="secondary">Ready</Badge> : <Badge variant="destructive">{r.issue}</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      )}

      <SectionCard title="Current scenario contents" description={`${(lines ?? []).length} lines already loaded in ${scenario.name}`}>
        <div className="flex flex-wrap gap-2">
          {[...new Set((lines ?? []).map((l) => l.source_file ?? "manual entry"))].map((src) => (
            <Badge key={src} variant="outline">{src}</Badge>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
