import { useDeal } from "@/context/DealContext";
import { usePortfolio } from "@/hooks/usePortfolio";
import SectionCard from "@/components/common/SectionCard";
import KpiCard from "@/components/common/KpiCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { compactCurrency, percent } from "@/lib/format";
import { BarChart3 } from "lucide-react";

export default function BenchmarksPage() {
  const { activeDealId } = useDeal();
  const { data, isLoading } = usePortfolio();
  const b = data?.benchmarks;
  const current = (data?.summaries ?? []).find((s) => s.deal.id === activeDealId);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading benchmarks…</p>;

  const rows: { metric: string; deal: number; benchmark: number; format: "pct" | "money" }[] = [
    { metric: "Licence gross margin", deal: current?.economics.license.licenseGmPct ?? 0, benchmark: b?.avgLicenseGmPct ?? 0, format: "pct" },
    { metric: "Effective Salesforce discount", deal: current?.economics.totals.effectiveDiscountPct ?? 0, benchmark: b?.avgSalesforceDiscountPct ?? 0, format: "pct" },
    {
      metric: "Customer savings (% of list ARR)",
      deal: current && current.economics.license.listArr > 0 ? (current.economics.customerSavingsAnnual / current.economics.license.listArr) * 100 : 0,
      benchmark: b?.avgCustomerSavingsPct ?? 0,
      format: "pct",
    },
    { metric: "Services attach", deal: current?.economics.services.attachPct ?? 0, benchmark: b?.avgServicesAttachPct ?? 0, format: "pct" },
    { metric: "Services gross margin", deal: current?.economics.services.gmPct ?? 0, benchmark: b?.avgServicesGmPct ?? 0, format: "pct" },
    { metric: "Innovation Fund as % of TCV", deal: current?.economics.fund.pctOfTcv ?? 0, benchmark: b?.avgFundPctOfTcv ?? 0, format: "pct" },
    { metric: "Combined TCV", deal: current?.economics.combinedTermValue ?? 0, benchmark: b?.avgCombinedTcv ?? 0, format: "money" },
  ];

  const fmt = (v: number, f: "pct" | "money") => (f === "pct" ? percent(v) : compactCurrency(v));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Cross-deal benchmarks</h1>
        <p className="text-sm text-muted-foreground">
          Anonymised aggregates across the TechM OSP portfolio. No individual customer's confidential data is exposed.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Deals in sample" value={String(b?.sampleSize ?? 0)} icon={BarChart3} />
        <KpiCard label="Avg licence GM" value={percent(b?.avgLicenseGmPct ?? 0)} />
        <KpiCard label="Agentforce penetration" value={percent(b?.agentforcePenetrationPct ?? 0)} />
        <KpiCard label="Marketplace adoption" value={percent(b?.marketplaceAdoptionPct ?? 0)} />
      </div>

      <SectionCard
        title="This deal vs similar TechM OSP transactions"
        description={current ? `${current.customerName} — ${current.deal.name}` : "Open a deal to compare it against the portfolio"}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric</TableHead>
              <TableHead className="text-right">This deal</TableHead>
              <TableHead className="text-right">Portfolio average</TableHead>
              <TableHead className="text-right">Variance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const delta = r.deal - r.benchmark;
              return (
                <TableRow key={r.metric}>
                  <TableCell className="text-sm">{r.metric}</TableCell>
                  <TableCell className="text-right text-xs">{fmt(r.deal, r.format)}</TableCell>
                  <TableCell className="text-right text-xs">{fmt(r.benchmark, r.format)}</TableCell>
                  <TableCell className="text-right text-xs">
                    <Badge variant={delta >= 0 ? "secondary" : "outline"}>
                      {delta >= 0 ? "+" : ""}
                      {fmt(delta, r.format)}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
