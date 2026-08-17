import { usePortfolio } from "@/hooks/usePortfolio";
import SectionCard from "@/components/common/SectionCard";
import KpiCard from "@/components/common/KpiCard";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { compactCurrency, shortDate } from "@/lib/format";
import { Handshake } from "lucide-react";

const FOCUS_FAMILIES = ["Agentforce", "Data 360", "Revenue Cloud", "Field Service", "MuleSoft"];

export default function PartnerViewPage() {
  const { data, isLoading } = usePortfolio();
  const rows = (data?.summaries ?? []).filter((s) => !s.deal.is_archived);

  const sum = (fn: (s: (typeof rows)[number]) => number) => rows.reduce((acc, s) => acc + fn(s), 0);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading partner view…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Salesforce partner view</h1>
        <p className="text-sm text-muted-foreground">
          Aggregate account-planning view to discuss the OSP portfolio with Salesforce leadership.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Protected ACV" value={compactCurrency(sum((s) => s.economics.license.layers[0].netArr))} icon={Handshake} />
        <KpiCard label="Growth ACV" value={compactCurrency(sum((s) => s.economics.license.layers[1].netArr + s.economics.license.layers[2].netArr))} />
        <KpiCard label="3-year licence TCV" value={compactCurrency(sum((s) => s.economics.license.netTermValue))} />
        <KpiCard label="Innovation Fund requested" value={compactCurrency(sum((s) => s.economics.fund.total))} />
      </div>

      <SectionCard title="Deal-by-deal Salesforce economics" description="Retained base, growth by strategic cloud, displacement and requested support">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Current ACV</TableHead>
                <TableHead className="text-right">Protected ACV</TableHead>
                <TableHead className="text-right">Growth ACV</TableHead>
                <TableHead className="text-right">New product ACV</TableHead>
                <TableHead className="text-right">3-yr TCV</TableHead>
                {FOCUS_FAMILIES.map((f) => <TableHead key={f} className="text-right">{f}</TableHead>)}
                <TableHead className="text-right">Displacement</TableHead>
                <TableHead className="text-right">Fund request</TableHead>
                <TableHead>Target close</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => {
                const layers = s.economics.license.layers;
                const displacement = s.economics.displacement.reduce((acc, d) => acc + d.incrementalSalesforceAcv, 0);
                return (
                  <TableRow key={s.deal.id}>
                    <TableCell className="text-sm">
                      {s.customerName}
                      <span className="block text-xs text-muted-foreground">{s.deal.name}</span>
                    </TableCell>
                    <TableCell className="text-right text-xs">{compactCurrency(s.deal.current_salesforce_acv, s.deal.currency)}</TableCell>
                    <TableCell className="text-right text-xs">{compactCurrency(layers[0].netArr, s.deal.currency)}</TableCell>
                    <TableCell className="text-right text-xs">{compactCurrency(layers[1].netArr, s.deal.currency)}</TableCell>
                    <TableCell className="text-right text-xs">{compactCurrency(layers[2].netArr, s.deal.currency)}</TableCell>
                    <TableCell className="text-right text-xs font-medium">{compactCurrency(s.economics.license.netTermValue, s.deal.currency)}</TableCell>
                    {FOCUS_FAMILIES.map((f) => (
                      <TableCell key={f} className="text-right text-xs">{compactCurrency(s.familyAcv[f] ?? 0, s.deal.currency)}</TableCell>
                    ))}
                    <TableCell className="text-right text-xs">{compactCurrency(displacement, s.deal.currency)}</TableCell>
                    <TableCell className="text-right text-xs">{compactCurrency(s.economics.fund.total, s.deal.currency)}</TableCell>
                    <TableCell className="text-xs">{shortDate(s.deal.close_date)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="text-xs font-semibold">Portfolio</TableCell>
                <TableCell className="text-right text-xs">{compactCurrency(sum((s) => s.deal.current_salesforce_acv))}</TableCell>
                <TableCell className="text-right text-xs">{compactCurrency(sum((s) => s.economics.license.layers[0].netArr))}</TableCell>
                <TableCell className="text-right text-xs">{compactCurrency(sum((s) => s.economics.license.layers[1].netArr))}</TableCell>
                <TableCell className="text-right text-xs">{compactCurrency(sum((s) => s.economics.license.layers[2].netArr))}</TableCell>
                <TableCell className="text-right text-xs">{compactCurrency(sum((s) => s.economics.license.netTermValue))}</TableCell>
                {FOCUS_FAMILIES.map((f) => (
                  <TableCell key={f} className="text-right text-xs">{compactCurrency(sum((s) => s.familyAcv[f] ?? 0))}</TableCell>
                ))}
                <TableCell className="text-right text-xs">
                  {compactCurrency(sum((s) => s.economics.displacement.reduce((a, d) => a + d.incrementalSalesforceAcv, 0)))}
                </TableCell>
                <TableCell className="text-right text-xs">{compactCurrency(sum((s) => s.economics.fund.total))}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </SectionCard>
    </div>
  );
}
