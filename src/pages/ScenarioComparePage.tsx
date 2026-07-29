import { useMemo } from "react";
import { useAllSkuLines, useScenarios } from "@/hooks/useDealData";
import { computeScenario } from "@/lib/pricing";
import { compactCurrency, currency, number, percent } from "@/lib/format";
import SectionCard from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function ScenarioComparePage() {
  const { data: scenarios } = useScenarios();
  const { data: lines } = useAllSkuLines();

  const rows = useMemo(
    () =>
      (scenarios ?? []).map((s) => {
        const scoped = (lines ?? []).filter((l) => l.scenario_id === s.id);
        return { scenario: s, totals: computeScenario(scoped, s), lineCount: scoped.length };
      }),
    [scenarios, lines],
  );

  const baseline = rows.find((r) => r.scenario.is_baseline) ?? rows[0];
  const chartData = rows.map((r) => ({
    name: r.scenario.name,
    "Net ARR": Math.round(r.totals.netArr),
    "3-yr TCV": Math.round(r.totals.tcv),
  }));

  return (
    <div className="space-y-6">
      <SectionCard title="Scenario value comparison" description="Net ARR and three-year TCV for every modelled scenario">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={55} stroke="hsl(var(--muted-foreground))" />
              <YAxis tickFormatter={(v) => compactCurrency(Number(v))} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip formatter={(v) => currency(Number(v))} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Net ARR" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="3-yr TCV" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard title="Side-by-side detail" description={`Variance measured against ${baseline?.scenario.name ?? "the baseline"}`}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scenario</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Lines</TableHead>
                <TableHead className="text-right">List ARR</TableHead>
                <TableHead className="text-right">Net ARR</TableHead>
                <TableHead className="text-right">Eff. disc.</TableHead>
                <TableHead className="text-right">3-yr TCV</TableHead>
                <TableHead className="text-right">Δ vs baseline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ scenario, totals, lineCount }) => {
                const delta = totals.netArr - (baseline?.totals.netArr ?? 0);
                return (
                  <TableRow key={scenario.id}>
                    <TableCell>
                      <p className="font-medium">{scenario.name}</p>
                      <p className="text-xs text-muted-foreground">{scenario.description ?? ""}</p>
                    </TableCell>
                    <TableCell className="space-x-1">
                      <Badge variant="outline">{scenario.status}</Badge>
                      {scenario.is_recommended && <Badge>Recommended</Badge>}
                      {scenario.is_baseline && <Badge variant="secondary">Baseline</Badge>}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{number(lineCount)}</TableCell>
                    <TableCell className="text-right tabular-nums">{currency(totals.listArr)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{currency(totals.netArr)}</TableCell>
                    <TableCell className="text-right tabular-nums">{percent(totals.effectiveDiscountPct)}</TableCell>
                    <TableCell className="text-right tabular-nums">{currency(totals.tcv)}</TableCell>
                    <TableCell className={`text-right tabular-nums ${delta > 0 ? "text-secondary" : delta < 0 ? "text-destructive" : ""}`}>
                      {delta === 0 ? "—" : `${delta > 0 ? "+" : ""}${currency(delta)}`}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {rows.map(({ scenario, totals }) => (
          <SectionCard key={scenario.id} title={scenario.name} description={`Owner ${scenario.owner_name ?? "unassigned"}`}>
            <dl className="space-y-2 text-sm">
              {[
                ["Year 1", currency(totals.y1)],
                ["Year 2", currency(totals.y2)],
                ["Year 3", currency(totals.y3)],
                ["Incremental ACV", currency(totals.incrementalAcv)],
                ["Open assumptions", number(totals.openAssumptions)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b pb-1.5 last:border-0">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-medium tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
