import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDeal } from "@/context/DealContext";
import { useDeals } from "@/hooks/useDealData";
import { useCustomers, useDealTemplates, useGlobalDefaults } from "@/hooks/useCommercial";
import {
  DEFAULT_CLONE_OPTIONS,
  useCreateDeal,
  type CloneOptions,
  type LibrarySelection,
  type NewDealInput,
} from "@/hooks/useDealMutations";
import LibraryPicker from "@/components/deals/LibraryPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DEAL_STAGES, DEAL_TYPES, INDUSTRIES, REGIONS } from "@/types/deal";
import { toast } from "sonner";

const NEW_CUSTOMER = "__new";

const SOURCES: { value: NewDealInput["source"]; label: string; hint: string }[] = [
  { value: "blank", label: "Start from scratch", hint: "A clean OSP scenario you populate manually" },
  { value: "library", label: "Pick from the Salesforce SKU catalog", hint: "Select product families, SKUs and quantities" },
  { value: "clone", label: "Use an existing deal as a starting point", hint: "Choose exactly which parts of the construct to copy" },
  { value: "import", label: "Import an existing BOM", hint: "Excel, CSV or a Salesforce quote export" },
];

const CLONE_FIELDS: { key: keyof CloneOptions; label: string }[] = [
  { key: "commercialStructure", label: "Commercial structure (layers, displacement, value levers)" },
  { key: "marginAssumptions", label: "Margin assumptions" },
  { key: "servicesModel", label: "Services model" },
  { key: "innovationFund", label: "Innovation Fund rules" },
  { key: "marketplaceModel", label: "Cloud marketplace construct" },
  { key: "customerPrices", label: "Customer prices and discounts" },
  { key: "quantities", label: "Quantities" },
  { key: "customerSkus", label: "Customer-specific SKUs (incumbent estate lines)" },
  { key: "customerValidation", label: "Customer validation issues" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Opens the wizard in simulation mode — no real customer required. */
  simulation?: boolean;
}

export default function NewDealDialog({ open, onOpenChange, simulation = false }: Props) {
  const { profile, setActiveDealId, canEdit } = useDeal();
  const { data: deals } = useDeals();
  const { data: customers } = useCustomers();
  const { data: templates } = useDealTemplates();
  const { data: defaults } = useGlobalDefaults();
  const create = useCreateDeal();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [customerId, setCustomerId] = useState<string>(NEW_CUSTOMER);
  const [form, setForm] = useState({
    name: "",
    customer_name: "",
    industry: "",
    region: "",
    currency: "USD",
    opportunity_id: "",
    deal_type: "Renewal + Growth",
    stage: "Qualification",
    contract_start: "",
    contract_end: "",
    contract_years: "3",
    close_date: "",
    owner_name: "",
    salesforce_ae: "",
    techm_account_lead: "",
    techm_osp_lead: "",
    finance_owner: "",
    current_salesforce_acv: "",
    renewal_uplift_pct: "5",
    min_license_gm_pct: "5",
    services_gm_target_pct: "25",
    services_annual_fee: "",
    notes: "",
  });
  const [source, setSource] = useState<NewDealInput["source"]>("blank");
  const [sourceDealId, setSourceDealId] = useState<string>("");
  const [templateId, setTemplateId] = useState<string>("");
  const [cloneOptions, setCloneOptions] = useState<CloneOptions>(DEFAULT_CLONE_OPTIONS);
  const [selections, setSelections] = useState<LibrarySelection[]>([]);
  const [preset, setPreset] = useState<"default" | "single">("default");

  // Global defaults are starting assumptions only; every deal can override them.
  useEffect(() => {
    if (!defaults) return;
    setForm((f) => ({
      ...f,
      currency: defaults.currency ?? f.currency,
      contract_years: String(defaults.contract_years ?? 3),
      renewal_uplift_pct: String(defaults.renewal_uplift_pct ?? 5),
      min_license_gm_pct: String(defaults.min_license_gm_pct ?? 5),
      services_gm_target_pct: String(defaults.services_gm_target_pct ?? 25),
    }));
  }, [defaults]);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setForm((f) => ({
      ...f,
      stage: simulation ? "Simulation" : "Qualification",
      customer_name: simulation ? "Simulation / Anonymous" : f.customer_name,
    }));
    setCustomerId(NEW_CUSTOMER);
  }, [open, simulation]);

  const applyTemplate = (id: string) => {
    setTemplateId(id);
    const template = (templates ?? []).find((t) => t.id === id);
    if (!template) return;
    setForm((f) => ({ ...f, deal_type: template.deal_type || f.deal_type }));
    if (template.source_deal_id) {
      setSource("clone");
      setSourceDealId(template.source_deal_id);
    }
  };

  const chooseCustomer = (id: string) => {
    setCustomerId(id);
    const customer = (customers ?? []).find((c) => c.id === id);
    if (!customer) return;
    setForm((f) => ({
      ...f,
      customer_name: customer.name,
      industry: customer.industry ?? f.industry,
      region: customer.region ?? f.region,
      currency: customer.currency ?? f.currency,
      current_salesforce_acv: customer.current_salesforce_acv ? String(customer.current_salesforce_acv) : f.current_salesforce_acv,
    }));
  };

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setSource("blank");
      setSourceDealId("");
      setTemplateId("");
      setSelections([]);
      setPreset("default");
      setCloneOptions(DEFAULT_CLONE_OPTIONS);
    }
  };

  const submit = () => {
    if (!form.name.trim() || !form.customer_name.trim()) return toast.error("Deal name and customer are required");
    if (source === "clone" && !sourceDealId) return toast.error("Choose the deal to use as a starting point");
    if (source === "library" && !selections.length) return toast.error("Select at least one SKU");

    create.mutate(
      {
        name: form.name.trim(),
        customer_name: form.customer_name.trim(),
        customer_id: customerId === NEW_CUSTOMER ? null : customerId,
        industry: form.industry || null,
        region: form.region || null,
        partner_name: "Salesforce",
        currency: form.currency.toUpperCase() || "USD",
        contract_start: form.contract_start || null,
        contract_end: form.contract_end || null,
        contract_years: Number(form.contract_years) || 3,
        close_date: form.close_date || null,
        status: "Shaping",
        stage: form.stage,
        deal_type: form.deal_type,
        opportunity_id: form.opportunity_id.trim() || null,
        owner_name: form.owner_name.trim() || profile?.display_name || profile?.email || null,
        salesforce_ae: form.salesforce_ae.trim() || null,
        techm_account_lead: form.techm_account_lead.trim() || null,
        techm_osp_lead: form.techm_osp_lead.trim() || null,
        finance_owner: form.finance_owner.trim() || null,
        current_salesforce_acv: Number(form.current_salesforce_acv) || 0,
        renewal_uplift_pct: Number(form.renewal_uplift_pct) || 0,
        min_license_gm_pct: Number(form.min_license_gm_pct) || 0,
        services_gm_target_pct: Number(form.services_gm_target_pct) || 0,
        services_annual_fee: Number(form.services_annual_fee) || 0,
        is_simulation: simulation,
        notes: form.notes.trim() || null,
        source,
        librarySelections: selections,
        sourceDealId: sourceDealId || null,
        cloneOptions,
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
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{simulation ? "New deal simulation" : "Create new deal"}</DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Step 1 of 3 — customer and opportunity"
              : step === 2
                ? "Step 2 of 3 — commercial assumptions"
                : "Step 3 of 3 — starting bill of materials and scenarios"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label>Deal / opportunity name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={simulation ? "Large healthcare renewal simulation" : "FY27 Salesforce OSP renewal"}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Customer</Label>
              <Select value={customerId} onValueChange={chooseCustomer}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NEW_CUSTOMER}>{simulation ? "Anonymous / new" : "New customer…"}</SelectItem>
                  {(customers ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Customer name</Label>
              <Input
                value={form.customer_name}
                disabled={customerId !== NEW_CUSTOMER}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                placeholder="Acme Corporation"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Industry</Label>
              <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
                <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                <SelectContent>{INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Geography</Label>
              <Select value={form.region} onValueChange={(v) => setForm({ ...form, region: v })}>
                <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                <SelectContent>{REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Deal type</Label>
              <Select value={form.deal_type} onValueChange={(v) => setForm({ ...form, deal_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DEAL_TYPES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Stage</Label>
              <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DEAL_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Opportunity ID</Label>
              <Input value={form.opportunity_id} onChange={(e) => setForm({ ...form, opportunity_id: e.target.value })} placeholder="Optional" />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Salesforce AE</Label>
              <Input value={form.salesforce_ae} onChange={(e) => setForm({ ...form, salesforce_ae: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>TechM sales lead</Label>
              <Input value={form.techm_account_lead} onChange={(e) => setForm({ ...form, techm_account_lead: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>TechM OSP lead</Label>
              <Input value={form.techm_osp_lead} onChange={(e) => setForm({ ...form, techm_osp_lead: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Finance owner</Label>
              <Input value={form.finance_owner} onChange={(e) => setForm({ ...form, finance_owner: e.target.value })} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Contract term (years)</Label>
              <Input type="number" value={form.contract_years} onChange={(e) => setForm({ ...form, contract_years: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Target close date</Label>
              <Input type="date" value={form.close_date} onChange={(e) => setForm({ ...form, close_date: e.target.value })} />
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
              <Label>Current Salesforce spend (annual)</Label>
              <Input type="number" value={form.current_salesforce_acv} onChange={(e) => setForm({ ...form, current_salesforce_acv: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Renewal uplift assumption (%)</Label>
              <Input type="number" value={form.renewal_uplift_pct} onChange={(e) => setForm({ ...form, renewal_uplift_pct: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Minimum TechM licence GM (%)</Label>
              <Input type="number" value={form.min_license_gm_pct} onChange={(e) => setForm({ ...form, min_license_gm_pct: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Services GM target (%)</Label>
              <Input type="number" value={form.services_gm_target_pct} onChange={(e) => setForm({ ...form, services_gm_target_pct: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Services attachment (annual fee)</Label>
              <Input type="number" value={form.services_annual_fee} onChange={(e) => setForm({ ...form, services_annual_fee: e.target.value })} />
              <p className="text-xs text-muted-foreground">Creates the services construct with the GM target above; leave blank for licence-only.</p>
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

        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Deal template (optional)</Label>
              <Select value={templateId} onValueChange={applyTemplate}>
                <SelectTrigger><SelectValue placeholder="Start from a template" /></SelectTrigger>
                <SelectContent>
                  {(templates ?? []).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

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
              <div className="space-y-3 rounded-md border p-3">
                <div className="space-y-1.5">
                  <Label>Deal to start from</Label>
                  <Select value={sourceDealId} onValueChange={setSourceDealId}>
                    <SelectTrigger><SelectValue placeholder="Select a deal" /></SelectTrigger>
                    <SelectContent>
                      {(deals ?? []).map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.customer_name} — {d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {CLONE_FIELDS.map((f) => (
                    <label key={f.key} className="flex items-start gap-2 text-xs">
                      <Checkbox
                        checked={cloneOptions[f.key]}
                        onCheckedChange={(v) => setCloneOptions({ ...cloneOptions, [f.key]: !!v })}
                      />
                      <span>{f.label}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Opportunity IDs, approval statuses and validation confirmations are always reset on the new deal.
                </p>
              </div>
            )}

            {source === "library" && <LibraryPicker value={selections} onChange={setSelections} />}

            {source !== "clone" && (
              <RadioGroup value={preset} onValueChange={(v) => setPreset(v as "default" | "single")} className="grid gap-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-muted">
                  <RadioGroupItem value="default" className="mt-0.5" />
                  <span>
                    <span className="block text-sm font-medium">Standard scenario set (recommended)</span>
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
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>Back</Button>
          {step < 3 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={step === 1 && (!form.name.trim() || !form.customer_name.trim())}>Next</Button>
          ) : (
            <Button onClick={submit} disabled={!canEdit || create.isPending}>
              {create.isPending ? "Creating…" : simulation ? "Create simulation" : "Create deal"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
