import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useDeal } from "@/context/DealContext";
import { useDiscussionItems, useRiskLog, useScenarios, useSkuLines, useTowers } from "@/hooks/useDealData";
import { computeScenario } from "@/lib/pricing";
import { compactCurrency, currency, number, percent } from "@/lib/format";
import KpiCard from "@/components/common/KpiCard";
import SectionCard from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, CircleDollarSign, Layers, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { activeScenarioId, setActiveScenarioId } = useDeal();
  const { data: scenarios } = useScenarios();
  const { data: towers } = useTowers();
  const { data: lines } = useSkuLines(activeScenarioId);
  const { data: discussion } = useDiscussionItems();
  const { data: risks } = useRiskLog();

  const scenario = scenarios?.find((s) => s.id === activeScenarioId) ?? scenarios?.[0];
  if (scenarios?.length && !activeScenarioId) setActiveScenarioId(scenarios[0].id);

  const totals = useMemo(() => computeScenario(lines ?? [], scenario), [lines, scenario]);

  const towerData = useMemo(() => {
    const map = new Map<string, number>();
    for (const line of lines ?? []) {
      const t = line.tower_key ?? "unassigned";
      map.set(t, (map.get(t) ?? 0) + computeScenario([line], scenario).netArr);
    }
    return (towers ?? []).map((t) => ({ name: t.name, value: map.get(t.key) ?? 0, decision: t.decision_status, confidence: t.confidence }));
  }, [lines, towers, scenario]);

  const openDiscussion = (discussion ?? []).filter((d) => d.status !== "Closed").length;
  const highRisks = (risks ?? []).filter((r) => r.impact === "High" && r.status !== "Closed").length;
  const coverage = (lines ?? []).length ? Math.round((((lines ?? []).length - totals.openAssumptions) / (lines ?? []).length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Net ARR (annual)" value={currency(totals.netArr)} hint={`Annual list ${compactCurrency(totals.listArr)} · 3-yr net ${compactCurrency(totals.netTermValue)}`} icon={CircleDollarSign} />
        <KpiCard label="3-year TCV" value={currency(totals.tcv)} hint={`Y1 ${compactCurrency(totals.y1)} · Y3 ${compactCurrency(totals.y3)}`} icon={TrendingUp} />
        <KpiCard
          label="Effective discount"
          value={percent(totals.effectiveDiscountPct)}
          hint={`Threshold ${percent(scenario?.approval_threshold_pct ?? 40, 0)}`}
          tone={totals.effectiveDiscountPct > (scenario?.approval_threshold_pct ?? 40) ? "critical" : "positive"}
          icon={Layers}
        />
        <KpiCard
          label="Open items"
          value={number(openDiscussion + highRisks)}
          hint={`${openDiscussion} discussion · ${highRisks} high risks`}
          tone={openDiscussion + highRisks > 0 ? "warning" : "positive"}
          icon={AlertTriangle}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Net ARR by tower" description="Annualised recurring value in the current scenario" className="lg:col-span-2">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={towerData} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} textAnchor="middle" height={40} stroke="hsl(var(--muted-foreground))" />
                <YAxis tickFormatter={(v) => compactCurrency(Number(v))} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={(v) => currency(Number(v))} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {towerData.map((entry, i) => (
                    <Cell key={entry.name} fill={i % 2 === 0 ? "hsl(var(--primary))" : "hsl(var(--secondary))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Deal readiness" description="Confirmation coverage across the bill of materials">
          <div className="space-y-5">
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span>Lines approved for order form</span>
                <span className="font-medium">{coverage}%</span>
              </div>
              <Progress value={coverage} />
            </div>
            <dl className="space-y-2 text-sm">
              {[
                ["SKU lines", number((lines ?? []).length)],
                ["Awaiting Salesforce confirmation", number(totals.needsSalesforce)],
                ["Awaiting Smith+Nephew confirmation", number(totals.needsSn)],
                ["Incremental / growth SKUs", number(totals.netNewSkus)],
                ["Rationalised SKUs", number(totals.rationalizedSkus)],
                ["Pricing warnings", number(totals.warnings)],
              ].map(([k, v]) => (
                <div key={k as string} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Tower decision status" description="Confidence and outstanding decisions by commercial tower">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tower</TableHead>
                <TableHead>Decision status</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead className="text-right">Net ARR (annual)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {towerData.map((t) => (
                <TableRow key={t.name}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>
                    <Badge variant={t.decision === "Approved for order form" ? "default" : "secondary"}>{t.decision}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.confidence === "High" ? "default" : t.confidence === "Low" ? "destructive" : "outline"}>{t.confidence}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{currency(t.value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Top open discussion points" description="Items blocking order form assembly" actions={<Link className="text-sm text-primary hover:underline" to="/discussion">View all</Link>}>
          <ul className="space-y-3">
            {(discussion ?? []).filter((d) => d.status !== "Closed").slice(0, 5).map((d) => (
              <li key={d.id} className="rounded-md border p-3">
                <p className="text-sm font-medium">{d.title}</p>
                <p className="text-xs text-muted-foreground">{d.area} · owner {d.owner ?? "unassigned"}</p>
              </li>
            ))}
            {!(discussion ?? []).filter((d) => d.status !== "Closed").length && <p className="text-sm text-muted-foreground">No open discussion items.</p>}
          </ul>
        </SectionCard>

        <SectionCard title="Highest exposure risks" description="Commercial and delivery risk register" actions={<Link className="text-sm text-primary hover:underline" to="/risks">View all</Link>}>
          <ul className="space-y-3">
            {(risks ?? []).filter((r) => r.status !== "Closed").slice(0, 5).map((r) => (
              <li key={r.id} className="rounded-md border p-3">
                <p className="text-sm font-medium">{r.ref_code ? `${r.ref_code} · ` : ""}{r.description}</p>
                <p className="text-xs text-muted-foreground">{r.category} · impact {r.impact} · probability {r.probability}</p>
              </li>
            ))}
            {!(risks ?? []).filter((r) => r.status !== "Closed").length && <p className="text-sm text-muted-foreground">No open risks.</p>}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
