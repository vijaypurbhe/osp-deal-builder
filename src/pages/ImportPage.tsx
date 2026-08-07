import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import { useDeal } from "@/context/DealContext";
import { useInsertRows, useScenarios, useSkuLines } from "@/hooks/useDealData";
import { useCreateDeal, DEFAULT_TOWER_SEED, type ImportedLine } from "@/hooks/useDealMutations";
import SectionCard from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { currency, number } from "@/lib/format";
import { CLASSIFICATIONS, DEAL_STATUSES } from "@/types/deal";
import { Upload } from "lucide-react";
import { toast } from "sonner";

interface ParsedRow extends ImportedLine {
  valid: boolean;
  issue?: string;
}

const pick = (row: Record<string, unknown>, keys: string[]) => {
  for (const k of Object.keys(row)) {
    if (keys.some((c) => k.trim().toLowerCase() === c)) return row[k];
  }
  return undefined;
};

const text = (v: unknown) => String(v ?? "").trim();

const num = (v: unknown) => {
  const n = Number(String(v ?? "").replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

/** Best-effort mapping of a free-text tower / workstream label onto the seeded tower keys. */
const towerKeyFor = (label: string) => {
  const l = label.toLowerCase();
  if (!l) return null;
  const direct = DEFAULT_TOWER_SEED.find((t) => t.key === l || t.name.toLowerCase() === l);
  if (direct) return direct.key;
  if (/mule|integrat|api/.test(l)) return "integration";
  if (/data|analytic|ai|agentforce|marketing/.test(l)) return "data_ai";
  if (/cpq|revenue|quote|clm|pricing/.test(l)) return "revenue";
  if (/managed|ams|ops|support|finops/.test(l)) return "managed_ops";
  return "core";
};

const classificationFor = (label: string) => {
  const match = CLASSIFICATIONS.find((c) => c.toLowerCase() === label.trim().toLowerCase());
  return match ?? (label.trim() ? label.trim() : "Current baseline");
};

export default function ImportPage() {
  const { activeScenarioId, activeDealId, canEdit, profile, setActiveDealId } = useDeal();
  const { data: scenarios } = useScenarios();
  const { data: lines } = useSkuLines(activeScenarioId);
  const insert = useInsertRows("sku_lines", [["sku_lines", activeScenarioId], ["sku_lines_all"]]);
  const createDeal = useCreateDeal();
  const navigate = useNavigate();

  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [tabs, setTabs] = useState<string[]>([]);
  const [activeTabs, setActiveTabs] = useState<string[]>([]);
  const [targetScenarioId, setTargetScenarioId] = useState<string>("");
  const [dealOpen, setDealOpen] = useState(false);
  const [dealStep, setDealStep] = useState<"details" | "preview">("details");
  const [dealForm, setDealForm] = useState({
    name: "",
    customer_name: "",
    partner_name: "Salesforce",
    currency: "USD",
    contract_start: "",
    contract_end: "",
    status: "Shaping",
    preset: "default" as "default" | "single",
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const scenario = scenarios?.find((s) => s.id === (targetScenarioId || activeScenarioId));
  const selected = useMemo(() => rows.filter((r) => activeTabs.includes(r.source_tab ?? "")), [rows, activeTabs]);
  const validRows = useMemo(() => selected.filter((r) => r.valid), [selected]);
  const totalTermValue = useMemo(
    () => validRows.reduce((sum, r) => sum + r.quantity * r.unit_list_price, 0),
    [validRows],
  );

  /** Grouped preview of the towers and lines that the new deal will be seeded with. */
  const towerPreview = useMemo(() => {
    const map = new Map<string, { key: string; name: string; lines: ParsedRow[]; value: number }>();
    for (const r of validRows) {
      const key = r.tower_key ?? "core";
      const name = DEFAULT_TOWER_SEED.find((t) => t.key === key)?.name ?? key;
      const entry = map.get(key) ?? { key, name, lines: [], value: 0 };
      entry.lines.push(r);
      entry.value += r.quantity * r.unit_list_price;
      map.set(key, entry);
    }
    return [...map.values()].sort((a, b) => b.value - a.value);
  }, [validRows]);

  const parseSheet = (sheet: XLSX.WorkSheet, tab: string, file: string): ParsedRow[] => {
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    return json
      .map((r) => {
        const name = text(pick(r, ["sku name", "sku", "product", "product name", "line item", "description of sku"]));
        const qty = num(pick(r, ["quantity", "qty", "units", "user count", "licences", "licenses"]));
        const price = num(pick(r, ["unit list price", "list price", "price", "unit price", "3 year list price", "term price"]));
        const valid = !!name && qty > 0 && price > 0;
        return {
          sku_name: name,
          sku_code: text(pick(r, ["sku code", "code", "product code", "part number"])) || null,
          description: text(pick(r, ["description", "notes", "detail"])) || null,
          product_family: text(pick(r, ["product family", "family", "product category"])) || null,
          cloud: text(pick(r, ["cloud", "edition", "platform"])) || null,
          tower_key: towerKeyFor(text(pick(r, ["tower", "workstream", "capability", "pillar"]))),
          classification: classificationFor(text(pick(r, ["classification", "type", "line type"]))),
          quantity: qty,
          unit_of_measure: text(pick(r, ["uom", "unit of measure", "metric"])) || "User",
          unit_list_price: price,
          billing_frequency: text(pick(r, ["billing frequency", "billing", "term"])) || "Annual",
          line_discount_pct: num(pick(r, ["discount %", "discount", "line discount %"])),
          source_tab: tab,
          source_file: file,
          valid,
          issue: !name
            ? "Missing SKU name"
            : qty <= 0
              ? "Quantity must be greater than zero"
              : price <= 0
                ? "Missing list price"
                : undefined,
        } satisfies ParsedRow;
      })
      .filter((r) => r.sku_name || r.quantity || r.unit_list_price);
  };

  const handleFile = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer);
    const parsed: ParsedRow[] = [];
    const sheetNames: string[] = [];
    for (const name of wb.SheetNames) {
      const sheetRows = parseSheet(wb.Sheets[name], name, file.name);
      if (!sheetRows.length) continue;
      sheetNames.push(name);
      parsed.push(...sheetRows);
    }
    if (!parsed.length) return toast.error("No BOM rows recognised in this workbook");
    setRows(parsed);
    setTabs(sheetNames);
    setActiveTabs(sheetNames);
    setFileName(file.name);
    setDealForm((f) => ({ ...f, name: f.name || file.name.replace(/\.(xlsx|xls|csv)$/i, "") }));
    toast.success(`Parsed ${parsed.length} rows across ${sheetNames.length} tab${sheetNames.length === 1 ? "" : "s"}`);
  };

  const asImportedLines = (): ImportedLine[] =>
    validRows.map(({ valid, issue, ...line }) => {
      void valid;
      void issue;
      return line;
    });

  const commitToScenario = () => {
    const scenarioId = targetScenarioId || activeScenarioId;
    if (!scenarioId) return toast.error("Choose a scenario to import into");
    if (!validRows.length) return toast.error("No valid rows to import");
    insert.mutate(
      asImportedLines().map((l) => ({ ...l, scenario_id: scenarioId, bom_type: "revised", approval_status: "Draft" })),
      {
        onSuccess: () => {
          toast.success(`Imported ${validRows.length} lines`);
          setRows([]);
          setTabs([]);
          setActiveTabs([]);
        },
      },
    );
  };

  const createDealFromBom = () => {
    if (!dealForm.name.trim() || !dealForm.customer_name.trim()) return toast.error("Deal name and customer are required");
    if (!validRows.length) return toast.error("No valid rows to import");
    createDeal.mutate(
      {
        name: dealForm.name.trim(),
        customer_name: dealForm.customer_name.trim(),
        partner_name: dealForm.partner_name.trim() || "Salesforce",
        currency: dealForm.currency.toUpperCase() || "USD",
        contract_start: dealForm.contract_start || null,
        contract_end: dealForm.contract_end || null,
        status: dealForm.status,
        owner_name: profile?.display_name ?? profile?.email ?? null,
        notes: fileName ? `Seeded from ${fileName}` : null,
        source: "import",
        importLines: asImportedLines(),
        scenarioPreset: dealForm.preset,
      },
      {
        onSuccess: (deal) => {
          setActiveDealId(deal.id);
          setDealOpen(false);
          setRows([]);
          setTabs([]);
          setActiveTabs([]);
          navigate("/scenarios");
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title="Upload the current BOM"
        description="Accepts .xlsx, .xls or .csv extracts — every sheet is parsed and mapped by column heading"
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
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={!canEdit}>
            Choose file
          </Button>
          <p className="text-xs text-muted-foreground">
            Recognised headings: SKU name, SKU code, Quantity, Unit list price, Classification, Tower, UoM, Billing
            frequency, Discount %
          </p>
        </div>
      </SectionCard>

      {!!rows.length && (
        <SectionCard
          title="Review and load"
          description={`${number(validRows.length)} of ${number(selected.length)} selected rows are ready · list term value ${currency(totalTermValue)}`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Select value={targetScenarioId || activeScenarioId || ""} onValueChange={setTargetScenarioId}>
                <SelectTrigger className="h-9 w-56"><SelectValue placeholder="Target scenario" /></SelectTrigger>
                <SelectContent>
                  {(scenarios ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id} disabled={s.is_locked}>
                      {s.name}{s.is_locked ? " (locked)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                onClick={commitToScenario}
                disabled={!canEdit || insert.isPending || !activeDealId || scenario?.is_locked}
              >
                Add to {scenario?.name ?? "scenario"}
              </Button>
              <Button size="sm" onClick={() => setDealOpen(true)} disabled={!canEdit || !validRows.length}>
                Create new deal from this BOM
              </Button>
            </div>
          }
        >
          {tabs.length > 1 && (
            <div className="mb-4 flex flex-wrap gap-3 rounded-md border bg-muted/30 p-3">
              {tabs.map((tab) => {
                const count = rows.filter((r) => r.source_tab === tab && r.valid).length;
                return (
                  <label key={tab} className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={activeTabs.includes(tab)}
                      onCheckedChange={(c) =>
                        setActiveTabs((prev) => (c ? [...prev, tab] : prev.filter((t) => t !== tab)))
                      }
                    />
                    {tab}
                    <Badge variant="outline">{count}</Badge>
                  </label>
                );
              })}
            </div>
          )}

          <div className="max-h-[520px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">SKU</TableHead>
                  <TableHead>Tab</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">List price</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selected.map((r, i) => (
                  <TableRow key={`${r.source_tab}-${r.sku_name}-${i}`}>
                    <TableCell>
                      <p className="font-medium">{r.sku_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{r.sku_code ?? ""}</p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.source_tab}</TableCell>
                    <TableCell className="text-right tabular-nums">{number(r.quantity)}</TableCell>
                    <TableCell className="text-right tabular-nums">{currency(r.unit_list_price)}</TableCell>
                    <TableCell className="text-xs">{r.classification}</TableCell>
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

      {!!activeScenarioId && (
        <SectionCard
          title="Current scenario contents"
          description={`${number((lines ?? []).length)} lines already loaded in ${scenarios?.find((s) => s.id === activeScenarioId)?.name ?? "this scenario"}`}
        >
          <div className="flex flex-wrap gap-2">
            {[...new Set((lines ?? []).map((l) => l.source_file ?? "manual entry"))].map((src) => (
              <Badge key={src} variant="outline">{src}</Badge>
            ))}
          </div>
        </SectionCard>
      )}

      <Dialog open={dealOpen} onOpenChange={setDealOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create a deal from this BOM</DialogTitle>
            <DialogDescription>
              {number(validRows.length)} lines will be loaded into every scenario of the new deal.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label>Deal name</Label>
              <Input value={dealForm.name} onChange={(e) => setDealForm({ ...dealForm, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Customer</Label>
              <Input value={dealForm.customer_name} onChange={(e) => setDealForm({ ...dealForm, customer_name: e.target.value })} placeholder="Acme Corporation" />
            </div>
            <div className="space-y-1.5">
              <Label>Partner / vendor</Label>
              <Input value={dealForm.partner_name} onChange={(e) => setDealForm({ ...dealForm, partner_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Input value={dealForm.currency} onChange={(e) => setDealForm({ ...dealForm, currency: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={dealForm.status} onValueChange={(v) => setDealForm({ ...dealForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEAL_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Contract start</Label>
              <Input type="date" value={dealForm.contract_start} onChange={(e) => setDealForm({ ...dealForm, contract_start: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Contract end</Label>
              <Input type="date" value={dealForm.contract_end} onChange={(e) => setDealForm({ ...dealForm, contract_end: e.target.value })} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Scenarios</Label>
              <Select value={dealForm.preset} onValueChange={(v) => setDealForm({ ...dealForm, preset: v as "default" | "single" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Baseline (locked) + Expected + Upside</SelectItem>
                  <SelectItem value="single">Single working scenario</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDealOpen(false)}>Cancel</Button>
            <Button onClick={createDealFromBom} disabled={createDeal.isPending}>Create deal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
