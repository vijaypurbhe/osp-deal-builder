import { usePortfolio } from "@/hooks/usePortfolio";
import SectionCard from "@/components/common/SectionCard";
import KpiCard from "@/components/common/KpiCard";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { compactCurrency, percent } from "@/lib/format";
import { AlertTriangle, Landmark, Percent, ShieldAlert, TrendingUp, Wallet } from "lucide-react";

export default function PortfolioAnalyticsPage() {
  const { data, isLoading } = usePortfolio();
  const t = data?.totals;

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading portfolio analytics…</p>;

  const riskRows = (data?.summaries ?? []).filter(
    (s) => s.economics.belowMarginFloor || s.criticalValidation > 0 || s.economics.totals.effectiveDiscountPct > 40,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">TechM OSP portfolio analytics</h1>
        <p className="text-sm text-muted-foreground">Leadership view across every customer transaction — pipeline, economics and risk.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Total OSP TCV" value={compactCurrency(t?.combinedTcv ?? 0)} icon={TrendingUp} />
        <KpiCard label="Licence TCV" value={compactCurrency(t?.licenseTcv ?? 0)} />
        <KpiCard label="Services TCV" value={compactCurrency(t?.servicesTcv ?? 0)} icon={Wallet} />
        <KpiCard label="Expected licence GP" value={compactCurrency(t?.licenseGp ?? 0)} tone="positive" />
        <KpiCard label="Expected services GP" value={compactCurrency(t?.servicesGp ?? 0)} tone="positive" />
        <KpiCard label="Blended GP" value={compactCurrency(t?.blendedGp ?? 0)} icon={Percent} hint={percent(t?.blendedGmPct ?? 0)} />
        <KpiCard label="Weighted pipeline GP" value={compactCurrency((t?.blendedGp ?? 0) * ((t?.weightedTcv ?? 0) / Math.max(1, t?.combinedTcv ?? 1)))} />
        <KpiCard label="Innovation Fund proposed" value={compactCurrency(t?.fundProposed ?? 0)} icon={Landmark} />
        <KpiCard label="Salesforce-funded" value={compactCurrency(t?.fundSalesforce ?? 0)} />
        <KpiCard label="TechM-funded" value={compactCurrency(t?.fundTechm ?? 0)} />
        <KpiCard label="Fund consumed" value={compactCurrency(t?.fundConsumed ?? 0)} hint={`${compactCurrency(t?.fundAvailable ?? 0)} available`} />
        <KpiCard label="Deals below margin floor" value={String(t?.belowFloor ?? 0)} icon={AlertTriangle} tone={(t?.belowFloor ?? 0) > 0 ? "critical" : "default"} />
      </div>

      <SectionCard title="Salesforce growth by product family" description="Net ARR across all deals in the portfolio">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={t?.familyAcv ?? []} margin={{ top: 8, right: 16, bottom: 60, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="family" angle={-25} textAnchor="end" interval={0} height={70} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => compactCurrency(Number(v))} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => compactCurrency(Number(v))} />
              <Bar dataKey="acv" name="Net ARR" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard title="Risk watchlist" description="Margin floor breaches, critical validation issues and exceptional discounting">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer / deal</TableHead>
              <TableHead className="text-right">Licence GM</TableHead>
              <TableHead className="text-right">Effective discount</TableHead>
              <TableHead className="text-right">Critical validation</TableHead>
              <TableHead>Flags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {riskRows.map((s) => (
              <TableRow key={s.deal.id}>
                <TableCell className="text-sm">
                  {s.customerName}
                  <span className="block text-xs text-muted-foreground">{s.deal.name}</span>
                </TableCell>
                <TableCell className={`text-right text-xs ${s.economics.belowMarginFloor ? "text-destructive" : ""}`}>
                  {percent(s.economics.license.licenseGmPct)}
                </TableCell>
                <TableCell className="text-right text-xs">{percent(s.economics.totals.effectiveDiscountPct)}</TableCell>
                <TableCell className="text-right text-xs">{s.criticalValidation}</TableCell>
                <TableCell className="space-x-1">
                  {s.economics.belowMarginFloor && <Badge variant="destructive">Below floor</Badge>}
                  {s.economics.totals.effectiveDiscountPct > 40 && <Badge variant="outline">Exceptional discount</Badge>}
                  {s.economics.marketplace.routedTermValue > 0 && !s.economics.marketplace.coversRouted && (
                    <Badge variant="outline">Marketplace commitment short</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!riskRows.length && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  <ShieldAlert className="mr-1.5 inline h-4 w-4" /> No portfolio risks flagged.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
