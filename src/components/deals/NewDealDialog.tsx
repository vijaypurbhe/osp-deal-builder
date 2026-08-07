import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDeal } from "@/context/DealContext";
import { useDeals } from "@/hooks/useDealData";
import { useCreateDeal, type LibrarySelection, type NewDealInput } from "@/hooks/useDealMutations";
import LibraryPicker from "@/components/deals/LibraryPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DEAL_STATUSES } from "@/types/deal";
import { toast } from "sonner";

const SOURCES: { value: NewDealInput["source"]; label: string; hint: string }[] = [
  { value: "blank", label: "Blank deal", hint: "Start with empty scenarios and add lines manually" },
  { value: "library", label: "Pick from the SKU library", hint: "Select Salesforce SKUs and quantities to seed the BOM" },
  { value: "clone", label: "Copy an existing deal", hint: "Clone scenarios, lines, towers, risks and discussion items" },
  { value: "import", label: "Import a workbook", hint: "Create the deal, then land on the import screen" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewDealDialog({ open, onOpenChange }: Props) {
  const { profile, setActiveDealId, canEdit } = useDeal();
  const { data: deals } = useDeals();
  const create = useCreateDeal();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    customer_name: "",
    partner_name: "Salesforce",
    currency: "USD",
    contract_start: "",
    contract_end: "",
    status: "Shaping",
    owner_name: "",
    notes: "",
  });
  const [source, setSource] = useState<NewDealInput["source"]>("blank");
  const [sourceDealId, setSourceDealId] = useState<string>("");
  const [selections, setSelections] = useState<LibrarySelection[]>([]);
  const [preset, setPreset] = useState<"default" | "single">("default");

  const reset = () => {
    setStep(1);
    setForm({ name: "", customer_name: "", partner_name: "Salesforce", currency: "USD", contract_start: "", contract_end: "", status: "Shaping", owner_name: "", notes: "" });
    setSource("blank");
    setSourceDealId("");
    setSelections([]);
    setPreset("default");
  };

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) reset();
  };

  const submit = () => {
    if (!form.name.trim() || !form.customer_name.trim()) return toast.error("Deal name and customer are required");
    if (source === "clone" && !sourceDealId) return toast.error("Choose the deal to copy");
    if (source === "library" && !selections.length) return toast.error("Select at least one SKU");

    create.mutate(
      {
        name: form.name.trim(),
        customer_name: form.customer_name.trim(),
        partner_name: form.partner_name.trim() || "Salesforce",
        currency: form.currency.toUpperCase() || "USD",
        contract_start: form.contract_start || null,
        contract_end: form.contract_end || null,
        status: form.status,
        owner_name: form.owner_name.trim() || profile?.display_name || profile?.email || null,
        notes: form.notes.trim() || null,
        source,
        librarySelections: selections,
        sourceDealId: sourceDealId || null,
        scenarioPreset: preset,
      },
      {
        onSuccess: (deal) => {
          setActiveDealId(deal.id);
          close(false);
          navigate(source === "import" ? "/import" : "/scenarios");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>New deal</DialogTitle>
          <DialogDescription>
            {step === 1 ? "Step 1 of 3 — deal details" : step === 2 ? "Step 2 of 3 — starting bill of materials" : "Step 3 of 3 — scenarios"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label>Deal name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Acme Salesforce OSP" />
            </div>
            <div className="space-y-1.5">
              <Label>Customer</Label>
              <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} placeholder="Acme Corporation" />
            </div>
            <div className="space-y-1.5">
              <Label>Partner / vendor</Label>
              <Input value={form.partner_name} onChange={(e) => setForm({ ...form, partner_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEAL_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Contract start</Label>
              <Input type="date" value={form.contract_start} onChange={(e) => setForm({ ...form, contract_start: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Contract end</Label>
              <Input type="date" value={form.contract_end} onChange={(e) => setForm({ ...form, contract_end: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Deal owner</Label>
              <Input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} placeholder={profile?.display_name ?? profile?.email ?? ""} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <RadioGroup value={source} onValueChange={(v) => setSource(v as NewDealInput["source"])} className="grid gap-2 md:grid-cols-2">
              {SOURCES.map((s) => (
                <label key={s.value} className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-muted">
                  <RadioGroupItem value={s.value} className="mt-0.5" />
                  <span>
                    <span className="block text-sm font-medium">{s.label}</span>
                    <span className="block text-xs text-muted-foreground">{s.hint}</span>
                  </span>
                </label>
              ))}
            </RadioGroup>

            {source === "clone" && (
              <div className="space-y-1.5">
                <Label>Deal to copy</Label>
                <Select value={sourceDealId} onValueChange={setSourceDealId}>
                  <SelectTrigger><SelectValue placeholder="Select a deal" /></SelectTrigger>
                  <SelectContent>
                    {(deals ?? []).map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Scenario structure, SKU lines, discount tiers, modeller assumptions, order forms, towers, discussion and risks are all copied.</p>
              </div>
            )}

            {source === "library" && <LibraryPicker value={selections} onChange={setSelections} />}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            {source === "clone" ? (
              <p className="text-sm text-muted-foreground">
                Scenarios come from the deal you are copying, so there is nothing to choose here.
              </p>
            ) : (
              <RadioGroup value={preset} onValueChange={(v) => setPreset(v as "default" | "single")} className="grid gap-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-muted">
                  <RadioGroupItem value="default" className="mt-0.5" />
                  <span>
                    <span className="block text-sm font-medium">Standard set (recommended)</span>
                    <span className="block text-xs text-muted-foreground">Current BOM Baseline (locked), Expected Landing Zone, Strategic Upside</span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-muted">
                  <RadioGroupItem value="single" className="mt-0.5" />
                  <span>
                    <span className="block text-sm font-medium">Single working scenario</span>
                    <span className="block text-xs text-muted-foreground">One scenario you can duplicate later</span>
                  </span>
                </label>
              </RadioGroup>
            )}
            <p className="text-xs text-muted-foreground">
              A generic tower structure (Core, Revenue, Data &amp; AI, Integration, Managed Ops) is created so dashboards and order forms group correctly.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>Back</Button>
          {step < 3 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={step === 1 && (!form.name.trim() || !form.customer_name.trim())}>Next</Button>
          ) : (
            <Button onClick={submit} disabled={!canEdit || create.isPending}>{create.isPending ? "Creating…" : "Create deal"}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
