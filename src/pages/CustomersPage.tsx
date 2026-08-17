import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDeal } from "@/context/DealContext";
import { useCustomers, useSaveCommercialRow } from "@/hooks/useCommercial";
import { usePortfolio } from "@/hooks/usePortfolio";
import SectionCard from "@/components/common/SectionCard";
import KpiCard from "@/components/common/KpiCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { compactCurrency } from "@/lib/format";
import { INDUSTRIES, REGIONS } from "@/types/deal";
import { Building2, Plus, Users } from "lucide-react";

export default function CustomersPage() {
  const { canEdit, setActiveDealId } = useDeal();
  const { data: customers } = useCustomers();
  const { data: portfolio } = usePortfolio();
  const save = useSaveCommercialRow("customers", [["customers"], ["portfolio"]], "Customer saved");
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (customers ?? []).filter((c) => !q || c.name.toLowerCase().includes(q));
  }, [customers, search]);

  const dealsFor = (customerId: string) => (portfolio?.summaries ?? []).filter((s) => s.deal.customer_id === customerId);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Customers" value={String((customers ?? []).length)} icon={Building2} />
        <KpiCard label="Simulated accounts" value={String((customers ?? []).filter((c) => c.is_simulation).length)} icon={Users} />
        <KpiCard
          label="Combined current Salesforce ACV"
          value={compactCurrency((customers ?? []).reduce((s, c) => s + (Number(c.current_salesforce_acv) || 0), 0))}
        />
      </div>

      <SectionCard
        title="Customer accounts"
        description="One customer can carry many OSP deals — renewals, expansions, displacements and simulations"
        actions={
          <Button
            size="sm"
            disabled={!canEdit}
            onClick={() => save.mutate({ name: "New customer", currency: "USD" })}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add customer
          </Button>
        }
      >
        <Input className="mb-4 max-w-sm" placeholder="Search customers" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Accordion type="multiple" className="space-y-2">
          {rows.map((c) => {
            const deals = dealsFor(c.id);
            return (
              <AccordionItem key={c.id} value={c.id} className="rounded-md border px-3">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex flex-1 items-center justify-between gap-3 pr-3 text-left">
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.industry ?? "Industry not set"} · {c.region ?? "Region not set"} · {deals.length} deal(s)
                      </p>
                    </div>
                    {c.is_simulation && <Badge variant="outline">Simulation</Badge>}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  <div className="grid gap-3 md:grid-cols-4">
                    <label className="space-y-1 text-xs">
                      <span className="text-muted-foreground">Customer name</span>
                      <Input className="h-8" disabled={!canEdit} defaultValue={c.name} onBlur={(e) => e.target.value !== c.name && save.mutate({ ...c, name: e.target.value })} />
                    </label>
                    <label className="space-y-1 text-xs">
                      <span className="text-muted-foreground">Industry</span>
                      <Select value={c.industry ?? ""} disabled={!canEdit} onValueChange={(v) => save.mutate({ ...c, industry: v })}>
                        <SelectTrigger className="h-8"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                      </Select>
                    </label>
                    <label className="space-y-1 text-xs">
                      <span className="text-muted-foreground">Sub-industry</span>
                      <Input className="h-8" disabled={!canEdit} defaultValue={c.sub_industry ?? ""} onBlur={(e) => save.mutate({ ...c, sub_industry: e.target.value || null })} />
                    </label>
                    <label className="space-y-1 text-xs">
                      <span className="text-muted-foreground">Region</span>
                      <Select value={c.region ?? ""} disabled={!canEdit} onValueChange={(v) => save.mutate({ ...c, region: v })}>
                        <SelectTrigger className="h-8"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                      </Select>
                    </label>
                    <label className="space-y-1 text-xs">
                      <span className="text-muted-foreground">Country</span>
                      <Input className="h-8" disabled={!canEdit} defaultValue={c.country ?? ""} onBlur={(e) => save.mutate({ ...c, country: e.target.value || null })} />
                    </label>
                    <label className="space-y-1 text-xs">
                      <span className="text-muted-foreground">Currency</span>
                      <Input className="h-8" disabled={!canEdit} defaultValue={c.currency} onBlur={(e) => save.mutate({ ...c, currency: e.target.value.toUpperCase() })} />
                    </label>
                    <label className="space-y-1 text-xs">
                      <span className="text-muted-foreground">Employees</span>
                      <Input className="h-8" type="number" disabled={!canEdit} defaultValue={c.employee_count ?? 0} onBlur={(e) => save.mutate({ ...c, employee_count: Number(e.target.value) || null })} />
                    </label>
                    <label className="space-y-1 text-xs">
                      <span className="text-muted-foreground">Annual revenue</span>
                      <Input className="h-8" type="number" disabled={!canEdit} defaultValue={c.annual_revenue ?? 0} onBlur={(e) => save.mutate({ ...c, annual_revenue: Number(e.target.value) || null })} />
                    </label>
                    <label className="space-y-1 text-xs">
                      <span className="text-muted-foreground">Current Salesforce ACV</span>
                      <Input className="h-8" type="number" disabled={!canEdit} defaultValue={c.current_salesforce_acv} onBlur={(e) => save.mutate({ ...c, current_salesforce_acv: Number(e.target.value) || 0 })} />
                    </label>
                    <label className="space-y-1 text-xs">
                      <span className="text-muted-foreground">AWS commitment</span>
                      <Input className="h-8" type="number" disabled={!canEdit} defaultValue={c.aws_commitment} onBlur={(e) => save.mutate({ ...c, aws_commitment: Number(e.target.value) || 0, aws_customer: Number(e.target.value) > 0 })} />
                    </label>
                    <label className="space-y-1 text-xs">
                      <span className="text-muted-foreground">Brand primary (hex)</span>
                      <Input className="h-8" disabled={!canEdit} defaultValue={c.brand_primary ?? ""} onBlur={(e) => save.mutate({ ...c, brand_primary: e.target.value || null })} />
                    </label>
                    <label className="space-y-1 text-xs">
                      <span className="text-muted-foreground">Logo URL</span>
                      <Input className="h-8" disabled={!canEdit} defaultValue={c.logo_url ?? ""} onBlur={(e) => save.mutate({ ...c, logo_url: e.target.value || null })} />
                    </label>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Deal</TableHead>
                        <TableHead>Type / stage</TableHead>
                        <TableHead className="text-right">Combined TCV</TableHead>
                        <TableHead className="text-right">Blended GM</TableHead>
                        <TableHead className="text-right">Open</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deals.map((s) => (
                        <TableRow key={s.deal.id}>
                          <TableCell className="text-sm">{s.deal.name}</TableCell>
                          <TableCell className="text-xs">{s.deal.deal_type} · {s.deal.stage}</TableCell>
                          <TableCell className="text-right text-xs">{compactCurrency(s.economics.combinedTermValue, s.deal.currency)}</TableCell>
                          <TableCell className="text-right text-xs">{s.economics.blendedGmPct.toFixed(1)}%</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" onClick={() => { setActiveDealId(s.deal.id); navigate("/deal"); }}>Open</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!deals.length && (
                        <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground">No deals yet for this customer.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </SectionCard>
    </div>
  );
}
