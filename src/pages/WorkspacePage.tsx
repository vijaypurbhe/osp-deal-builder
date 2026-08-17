import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDeal } from "@/context/DealContext";
import { usePortfolio } from "@/hooks/usePortfolio";
import NewDealDialog from "@/components/deals/NewDealDialog";
import SectionCard from "@/components/common/SectionCard";
import KpiCard from "@/components/common/KpiCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { compactCurrency, percent, shortDate } from "@/lib/format";
import { stageWeight } from "@/lib/economics";
import { DEAL_STAGES, DEAL_TYPES, INDUSTRIES, REGIONS } from "@/types/deal";
import {
  AlertTriangle, Briefcase, CloudCog, FlaskConical, Gauge, Landmark, Percent, Plus, ShieldCheck, Timer, TrendingUp, Wallet,
} from "lucide-react";

const ANY = "__any";

export default function WorkspacePage() {
  const { canEdit, setActiveDealId } = useDeal();
  const { data, isLoading } = usePortfolio();
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<{ open: boolean; simulation: boolean }>({ open: false, simulation: false });

  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState(ANY);
  const [region, setRegion] = useState(ANY);
  const [stage, setStage] = useState(ANY);
  const [dealType, setDealType] = useState(ANY);
  const [minTcv, setMinTcv] = useState("");
  const [minGm, setMinGm] = useState("");
  const [marketplaceOnly, setMarketplaceOnly] = useState(ANY);
  const [fundOnly, setFundOnly] = useState(ANY);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.summaries ?? []).filter((s) => {
      const haystack = [
        s.customerName, s.deal.name, s.deal.opportunity_id, s.deal.salesforce_ae, s.deal.techm_osp_lead, s.deal.techm_account_lead,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (q && !haystack.includes(q)) return false;
      if (industry !== ANY && s.industry !== industry) return false;
      if (region !== ANY && s.region !== region) return false;
      if (stage !== ANY && s.deal.stage !== stage) return false;
      if (dealType !== ANY && s.deal.deal_type !== dealType) return false;
      if (minTcv && s.economics.combinedTermValue < Number(minTcv)) return false;
      if (minGm && s.economics.blendedGmPct < Number(minGm)) return false;
      if (marketplaceOnly !== ANY && (s.economics.marketplace.routedTermValue > 0) !== (marketplaceOnly === "yes")) return false;
      if (fundOnly !== ANY && (s.economics.fund.total > 0) !== (fundOnly === "yes")) return false;
      return true;
    });
  }, [data, search, industry, region, stage, dealType, minTcv, minGm, marketplaceOnly, fundOnly]);

  const t = data?.totals;

  const open = (dealId: string) => {
    setActiveDealId(dealId);
    navigate("/deal");
  };

  const activeFilters = [
    industry !== ANY, region !== ANY, stage !== ANY, dealType !== ANY,
    Boolean(minTcv), Boolean(minGm), marketplaceOnly !== ANY, fundOnly !== ANY, Boolean(search.trim()),
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearch(""); setIndustry(ANY); setRegion(ANY); setStage(ANY); setDealType(ANY);
    setMinTcv(""); setMinGm(""); setMarketplaceOnly(ANY); setFundOnly(ANY);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight">OSP Deal Workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every Tech Mahindra Salesforce OSP transaction — live opportunities and internal simulations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={!canEdit} onClick={() => setDialog({ open: true, simulation: true })}>
            <FlaskConical className="mr-1.5 h-4 w-4" /> New deal simulation
          </Button>
          <Button size="sm" disabled={!canEdit} onClick={() => setDialog({ open: true, simulation: false })}>
            <Plus className="mr-1.5 h-4 w-4" /> Create new deal
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <KpiCard label="Active deals" value={String(t?.activeDeals ?? 0)} icon={Briefcase} hint={`${t?.deals ?? 0} total`} />
        <KpiCard label="In simulation" value={String(t?.simulations ?? 0)} icon={FlaskConical} />
        <KpiCard label="Licence TCV" value={compactCurrency(t?.licenseTcv ?? 0)} icon={TrendingUp} hint="3-year net" />
        <KpiCard label="Services TCV" value={compactCurrency(t?.servicesTcv ?? 0)} icon={Wallet} />
        <KpiCard label="Pipeline TCV" value={compactCurrency(t?.combinedTcv ?? 0)} icon={Gauge} hint={`${compactCurrency(t?.weightedTcv ?? 0)} weighted`} />
        <KpiCard label="Expected TechM GP" value={compactCurrency(t?.blendedGp ?? 0)} icon={Percent} hint={percent(t?.blendedGmPct ?? 0)} tone="positive" />
        <KpiCard label="Below margin floor" value={String(t?.belowFloor ?? 0)} icon={AlertTriangle} tone={(t?.belowFloor ?? 0) > 0 ? "critical" : "default"} />
        <KpiCard label="Awaiting validation" value={String(t?.awaitingValidation ?? 0)} icon={ShieldCheck} hint="Salesforce review" tone={(t?.awaitingValidation ?? 0) > 0 ? "warning" : "default"} />
        <KpiCard label="Innovation Fund" value={String(t?.usingFund ?? 0)} icon={Landmark} hint={`${compactCurrency(t?.fundProposed ?? 0)} proposed`} />
        <KpiCard label="Cloud marketplace" value={String(t?.usingMarketplace ?? 0)} icon={CloudCog} hint="Routed deals" />
        <KpiCard label="Closing this quarter" value={String(t?.closingThisQuarter ?? 0)} icon={Timer} />
      </div>

      <SectionCard
        title="Deal portfolio"
        description="Search, filter and open any customer transaction"
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="whitespace-nowrap">
              {rows.length} of {data?.summaries?.length ?? 0} deals
            </Badge>
            {activeFilters > 0 && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>Clear filters</Button>
            )}
          </div>
        }
      >
        <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <Input
            className="sm:col-span-2 xl:col-span-2"
            placeholder="Search customer, deal, opportunity, AE or owner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger><SelectValue placeholder="Industry" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>All industries</SelectItem>
              {INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger><SelectValue placeholder="Geography" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>All geographies</SelectItem>
              {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={stage} onValueChange={setStage}>
            <SelectTrigger><SelectValue placeholder="Stage" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>All stages</SelectItem>
              {DEAL_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={dealType} onValueChange={setDealType}>
            <SelectTrigger><SelectValue placeholder="Deal type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>All deal types</SelectItem>
              {DEAL_TYPES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="number" placeholder="Min combined TCV" value={minTcv} onChange={(e) => setMinTcv(e.target.value)} />
          <Input type="number" placeholder="Min blended GM %" value={minGm} onChange={(e) => setMinGm(e.target.value)} />
          <Select value={marketplaceOnly} onValueChange={setMarketplaceOnly}>
            <SelectTrigger><SelectValue placeholder="Marketplace route" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any marketplace route</SelectItem>
              <SelectItem value="yes">Routed via marketplace</SelectItem>
              <SelectItem value="no">Direct only</SelectItem>
            </SelectContent>
          </Select>
          <Select value={fundOnly} onValueChange={setFundOnly}>
            <SelectTrigger><SelectValue placeholder="Innovation Fund" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any fund status</SelectItem>
              <SelectItem value="yes">Uses Innovation Fund</SelectItem>
              <SelectItem value="no">No fund</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading portfolio…</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader className="bg-muted/60 [&_th]:h-10 [&_th]:whitespace-nowrap [&_th]:text-xs [&_th]:font-semibold">
                <TableRow>
                  <TableHead className="min-w-[200px]">Customer / deal</TableHead>
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Industry / region</TableHead>
                  <TableHead>Owners</TableHead>
                  <TableHead>Type / stage</TableHead>
                  <TableHead className="text-right">Current ACV</TableHead>
                  <TableHead className="text-right">Proposed ACV</TableHead>
                  <TableHead className="text-right">Licence TCV</TableHead>
                  <TableHead className="text-right">Services TCV</TableHead>
                  <TableHead className="text-right">Combined TCV</TableHead>
                  <TableHead className="text-right">Lic GM</TableHead>
                  <TableHead className="text-right">Svc GM</TableHead>
                  <TableHead className="text-right">Blended GM</TableHead>
                  <TableHead className="text-right">Savings</TableHead>
                  <TableHead>Fund / marketplace</TableHead>
                  <TableHead>Health / validation</TableHead>
                  <TableHead>Close</TableHead>
                  <TableHead className="text-right">Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((s) => {
                  const e = s.economics;
                  return (
                    <TableRow key={s.deal.id}>
                      <TableCell>
                        <p className="font-medium">{s.customerName}</p>
                        <p className="text-xs text-muted-foreground">{s.deal.name}</p>
                        {s.deal.is_simulation && <Badge variant="outline" className="mt-1 text-[10px]">Simulation</Badge>}
                      </TableCell>
                      <TableCell className="text-xs">{s.deal.opportunity_id ?? "—"}</TableCell>
                      <TableCell className="text-xs">
                        {s.industry ?? "—"}
                        <span className="block text-muted-foreground">{s.region ?? "—"}</span>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="block">AE: {s.deal.salesforce_ae ?? "—"}</span>
                        <span className="block text-muted-foreground">TechM: {s.deal.techm_osp_lead ?? s.deal.techm_account_lead ?? "—"}</span>
                      </TableCell>
                      <TableCell className="text-xs">
                        {s.deal.deal_type}
                        <span className="block text-muted-foreground">{s.deal.stage} · {percent(stageWeight(s.deal.stage) * 100, 0)}</span>
                      </TableCell>
                      <TableCell className="text-right text-xs">{compactCurrency(s.deal.current_salesforce_acv, s.deal.currency)}</TableCell>
                      <TableCell className="text-right text-xs">{compactCurrency(e.proposedAcv, s.deal.currency)}</TableCell>
                      <TableCell className="text-right text-xs">{compactCurrency(e.license.netTermValue, s.deal.currency)}</TableCell>
                      <TableCell className="text-right text-xs">{compactCurrency(e.services.termFee, s.deal.currency)}</TableCell>
                      <TableCell className="text-right text-xs font-medium">{compactCurrency(e.combinedTermValue, s.deal.currency)}</TableCell>
                      <TableCell className={`text-right text-xs ${e.belowMarginFloor ? "text-destructive" : ""}`}>{percent(e.license.licenseGmPct)}</TableCell>
                      <TableCell className="text-right text-xs">{percent(e.services.gmPct)}</TableCell>
                      <TableCell className="text-right text-xs">{percent(e.blendedGmPct)}</TableCell>
                      <TableCell className="text-right text-xs">{compactCurrency(e.customerSavingsTerm, s.deal.currency)}</TableCell>
                      <TableCell className="text-xs">
                        {e.fund.total > 0 ? compactCurrency(e.fund.total, s.deal.currency) : "No fund"}
                        <span className="block text-muted-foreground">
                          {e.marketplace.routedTermValue > 0 ? `${s.deal.currency} via marketplace` : "Direct"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant={s.health.score >= 65 ? "secondary" : "destructive"}>{s.health.score}/100</Badge>
                        <span className="block text-muted-foreground">{s.openValidation} open · {s.criticalValidation} critical</span>
                      </TableCell>
                      <TableCell className="text-xs">{shortDate(s.deal.close_date)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => open(s.deal.id)}>Open</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!rows.length && (
                  <TableRow>
                    <TableCell colSpan={18} className="text-center text-sm text-muted-foreground">No deals match these filters.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      <NewDealDialog
        open={dialog.open}
        simulation={dialog.simulation}
        onOpenChange={(v) => setDialog((d) => ({ ...d, open: v }))}
      />
    </div>
  );
}
