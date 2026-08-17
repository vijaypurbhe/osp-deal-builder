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
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { compactCurrency, percent, shortDate } from "@/lib/format";
import { stageWeight } from "@/lib/economics";
import { DEAL_STAGES, DEAL_TYPES, INDUSTRIES, REGIONS } from "@/types/deal";
import { cn } from "@/lib/utils";
import {
  AlertTriangle, ArrowUpDown, Briefcase, ChevronDown, CloudCog, FlaskConical, Gauge, LayoutGrid, Landmark,
  Percent, Plus, Rows3, Search, ShieldCheck, SlidersHorizontal, Timer, TrendingUp, Wallet,
} from "lucide-react";

const ANY = "__any";

type SortKey = "customer" | "combined" | "gm" | "close" | "health";

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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState<"table" | "cards">("table");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "combined", dir: "desc" });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = (data?.summaries ?? []).filter((s) => {
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

    const dir = sort.dir === "asc" ? 1 : -1;
    const value = (s: (typeof filtered)[number]) => {
      switch (sort.key) {
        case "customer": return s.customerName ?? "";
        case "gm": return s.economics.blendedGmPct;
        case "health": return s.health.score;
        case "close": return s.deal.close_date ?? "";
        default: return s.economics.combinedTermValue;
      }
    };
    return [...filtered].sort((a, b) => {
      const av = value(a), bv = value(b);
      if (typeof av === "string" || typeof bv === "string") return String(av).localeCompare(String(bv)) * dir;
      return (Number(av) - Number(bv)) * dir;
    });
  }, [data, search, industry, region, stage, dealType, minTcv, minGm, marketplaceOnly, fundOnly, sort]);

  const t = data?.totals;

  const open = (dealId: string) => {
    setActiveDealId(dealId);
    navigate("/deal");
  };

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));

  const activeFilters = [
    industry !== ANY, region !== ANY, stage !== ANY, dealType !== ANY,
    Boolean(minTcv), Boolean(minGm), marketplaceOnly !== ANY, fundOnly !== ANY,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearch(""); setIndustry(ANY); setRegion(ANY); setStage(ANY); setDealType(ANY);
    setMinTcv(""); setMinGm(""); setMarketplaceOnly(ANY); setFundOnly(ANY);
  };

  const SortHead = ({ label, keyName, align = "left" }: { label: string; keyName: SortKey; align?: "left" | "right" }) => (
    <TableHead className={align === "right" ? "text-right" : undefined}>
      <button
        type="button"
        onClick={() => toggleSort(keyName)}
        className={cn(
          "inline-flex items-center gap-1 rounded-sm transition-colors hover:text-foreground",
          sort.key === keyName ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </button>
    </TableHead>
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              Tech Mahindra · Salesforce OSP
            </p>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Live opportunities and internal simulations, with licence, services and marketplace economics in one place.
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
        <Separator />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-5 py-3 text-xs text-muted-foreground">
          <span><span className="font-semibold text-foreground">{t?.deals ?? 0}</span> deals tracked</span>
          <span><span className="font-semibold text-foreground">{compactCurrency(t?.combinedTcv ?? 0)}</span> combined pipeline TCV</span>
          <span><span className="font-semibold text-foreground">{percent(t?.blendedGmPct ?? 0)}</span> blended gross margin</span>
          <span><span className="font-semibold text-foreground">{t?.closingThisQuarter ?? 0}</span> closing this quarter</span>
        </div>
      </div>

      {/* Pipeline KPIs */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pipeline &amp; value</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[104px] rounded-lg" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <KpiCard label="Active deals" value={String(t?.activeDeals ?? 0)} icon={Briefcase} hint={`${t?.deals ?? 0} total`} />
            <KpiCard label="In simulation" value={String(t?.simulations ?? 0)} icon={FlaskConical} hint="Internal what-ifs" />
            <KpiCard label="Licence TCV" value={compactCurrency(t?.licenseTcv ?? 0)} icon={TrendingUp} hint="3-year net" />
            <KpiCard label="Services TCV" value={compactCurrency(t?.servicesTcv ?? 0)} icon={Wallet} hint="Term fees" />
            <KpiCard label="Pipeline TCV" value={compactCurrency(t?.combinedTcv ?? 0)} icon={Gauge} hint={`${compactCurrency(t?.weightedTcv ?? 0)} weighted`} />
            <KpiCard label="Expected TechM GP" value={compactCurrency(t?.blendedGp ?? 0)} icon={Percent} hint={percent(t?.blendedGmPct ?? 0)} tone="positive" />
          </div>
        )}
      </section>

      {/* Governance & levers */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Governance &amp; commercial levers</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[104px] rounded-lg" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            <KpiCard label="Below margin floor" value={String(t?.belowFloor ?? 0)} icon={AlertTriangle} hint="Needs approval" tone={(t?.belowFloor ?? 0) > 0 ? "critical" : "default"} />
            <KpiCard label="Awaiting validation" value={String(t?.awaitingValidation ?? 0)} icon={ShieldCheck} hint="Salesforce review" tone={(t?.awaitingValidation ?? 0) > 0 ? "warning" : "default"} />
            <KpiCard label="Innovation Fund" value={String(t?.usingFund ?? 0)} icon={Landmark} hint={`${compactCurrency(t?.fundProposed ?? 0)} proposed`} />
            <KpiCard label="Cloud marketplace" value={String(t?.usingMarketplace ?? 0)} icon={CloudCog} hint="Routed deals" />
            <KpiCard label="Closing this quarter" value={String(t?.closingThisQuarter ?? 0)} icon={Timer} hint="Commit window" />
          </div>
        )}
      </section>

      <SectionCard
        title="Deal portfolio"
        description="Search, filter and open any customer transaction"
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="whitespace-nowrap">
              {rows.length} of {data?.summaries?.length ?? 0}
            </Badge>
            <ToggleGroup
              type="single"
              size="sm"
              value={view}
              onValueChange={(v) => v && setView(v as "table" | "cards")}
              className="hidden sm:flex"
            >
              <ToggleGroupItem value="table" aria-label="Table view"><Rows3 className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="cards" aria-label="Card view"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
            </ToggleGroup>
          </div>
        }
      >
        <div className="mb-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search customer, deal, opportunity, AE or owner"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} className="contents">
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="mr-1.5 h-4 w-4" />
                  Filters
                  {activeFilters > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[11px]">{activeFilters}</Badge>
                  )}
                  <ChevronDown className={cn("ml-1.5 h-4 w-4 transition-transform", filtersOpen && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              {(activeFilters > 0 || search) && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>Clear all</Button>
              )}
              <CollapsibleContent className="w-full">
                <div className="grid gap-2 rounded-lg border border-border bg-surface p-3 sm:grid-cols-2 xl:grid-cols-4">
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
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
          </div>
        ) : !rows.length ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-14 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Briefcase className="h-5 w-5" />
            </span>
            <div>
              <p className="font-medium">No deals match these filters</p>
              <p className="text-sm text-muted-foreground">Adjust the filters, or start a new OSP transaction.</p>
            </div>
            <div className="flex gap-2">
              {(activeFilters > 0 || search) && <Button variant="outline" size="sm" onClick={resetFilters}>Clear filters</Button>}
              <Button size="sm" disabled={!canEdit} onClick={() => setDialog({ open: true, simulation: false })}>
                <Plus className="mr-1.5 h-4 w-4" /> Create new deal
              </Button>
            </div>
          </div>
        ) : view === "cards" ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((s) => {
              const e = s.economics;
              return (
                <Card
                  key={s.deal.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => open(s.deal.id)}
                  onKeyDown={(ev) => ev.key === "Enter" && open(s.deal.id)}
                  className="cursor-pointer transition-shadow hover:shadow-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{s.customerName}</p>
                        <p className="truncate text-xs text-muted-foreground">{s.deal.name}</p>
                      </div>
                      <Badge variant={s.health.score >= 65 ? "secondary" : "destructive"} className="shrink-0">
                        {s.health.score}/100
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Combined TCV</p>
                        <p className="truncate font-medium tabular-nums">{compactCurrency(e.combinedTermValue, s.deal.currency)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Blended GM</p>
                        <p className={cn("font-medium tabular-nums", e.belowMarginFloor && "text-destructive")}>{percent(e.blendedGmPct)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Close</p>
                        <p className="font-medium">{shortDate(s.deal.close_date)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="text-[10px]">{s.deal.stage}</Badge>
                      <Badge variant="outline" className="text-[10px]">{s.deal.deal_type}</Badge>
                      {s.deal.is_simulation && <Badge variant="outline" className="text-[10px]">Simulation</Badge>}
                      {e.fund.total > 0 && <Badge variant="outline" className="text-[10px]">Innovation Fund</Badge>}
                      {e.marketplace.routedTermValue > 0 && <Badge variant="outline" className="text-[10px]">Marketplace</Badge>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader className="bg-muted/60 [&_th]:h-10 [&_th]:whitespace-nowrap [&_th]:text-xs [&_th]:font-semibold">
                <TableRow>
                  <SortHead label="Customer / deal" keyName="customer" />
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Industry / region</TableHead>
                  <TableHead>Owners</TableHead>
                  <TableHead>Type / stage</TableHead>
                  <TableHead className="text-right">Current ACV</TableHead>
                  <TableHead className="text-right">Proposed ACV</TableHead>
                  <TableHead className="text-right">Licence TCV</TableHead>
                  <TableHead className="text-right">Services TCV</TableHead>
                  <SortHead label="Combined TCV" keyName="combined" align="right" />
                  <TableHead className="text-right">Lic GM</TableHead>
                  <TableHead className="text-right">Svc GM</TableHead>
                  <SortHead label="Blended GM" keyName="gm" align="right" />
                  <TableHead className="text-right">Savings</TableHead>
                  <TableHead>Fund / marketplace</TableHead>
                  <SortHead label="Health / validation" keyName="health" />
                  <SortHead label="Close" keyName="close" />
                  <TableHead className="text-right">Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((s) => {
                  const e = s.economics;
                  return (
                    <TableRow
                      key={s.deal.id}
                      onClick={() => open(s.deal.id)}
                      className="cursor-pointer [&>td]:whitespace-nowrap"
                    >
                      <TableCell className="min-w-[200px] !whitespace-normal">
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
                      <TableCell className="text-right text-xs tabular-nums">{compactCurrency(s.deal.current_salesforce_acv, s.deal.currency)}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{compactCurrency(e.proposedAcv, s.deal.currency)}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{compactCurrency(e.license.netTermValue, s.deal.currency)}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{compactCurrency(e.services.termFee, s.deal.currency)}</TableCell>
                      <TableCell className="text-right text-xs font-medium tabular-nums">{compactCurrency(e.combinedTermValue, s.deal.currency)}</TableCell>
                      <TableCell className={cn("text-right text-xs tabular-nums", e.belowMarginFloor && "text-destructive")}>{percent(e.license.licenseGmPct)}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{percent(e.services.gmPct)}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{percent(e.blendedGmPct)}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{compactCurrency(e.customerSavingsTerm, s.deal.currency)}</TableCell>
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(ev) => { ev.stopPropagation(); open(s.deal.id); }}
                        >
                          Open
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
