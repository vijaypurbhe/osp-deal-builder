import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { benchmarks, dealEconomics, dealHealthScore, familyAcv, portfolioTotals, type DealSummary } from "@/lib/economics";
import type {
  Customer,
  Deal,
  IncumbentPlatform,
  InnovationFund,
  MarketplaceModel,
  Scenario,
  ServicesConstruct,
  SkuLine,
  ValidationItem,
  ValueLever,
} from "@/types/deal";

const group = <T extends { deal_id: string }>(rows: T[]) => {
  const map = new Map<string, T[]>();
  for (const r of rows) map.set(r.deal_id, [...(map.get(r.deal_id) ?? []), r]);
  return map;
};

/** Pick the scenario that represents the deal commercially. */
function primaryScenario(deal: Deal, scenarios: Scenario[]): Scenario | undefined {
  if (deal.current_scenario_id) {
    const pinned = scenarios.find((s) => s.id === deal.current_scenario_id);
    if (pinned) return pinned;
  }
  return scenarios.find((s) => s.is_recommended) ?? scenarios.find((s) => !s.is_baseline) ?? scenarios[0];
}

export interface PortfolioData {
  summaries: DealSummary[];
  totals: ReturnType<typeof portfolioTotals>;
  benchmarks: ReturnType<typeof benchmarks>;
  customers: Customer[];
}

/**
 * Portfolio-level roll-up: every deal's economics computed from its primary
 * scenario, plus anonymised cross-deal benchmarks.
 */
export function usePortfolio() {
  return useQuery({
    queryKey: ["portfolio"],
    queryFn: async (): Promise<PortfolioData> => {
      const [dealsRes, customersRes, scenariosRes, servicesRes, fundsRes, marketRes, incumbentsRes, validationRes, leversRes] =
        await Promise.all([
          supabase.from("deals").select("*").order("sort_order").order("created_at"),
          supabase.from("customers").select("*").order("name"),
          supabase.from("scenarios").select("*").order("sort_order"),
          supabase.from("services_constructs").select("*"),
          supabase.from("innovation_funds").select("*"),
          supabase.from("marketplace_models").select("*"),
          supabase.from("incumbent_platforms").select("*"),
          supabase.from("validation_items").select("*"),
          supabase.from("value_levers").select("*"),
        ]);

      for (const res of [dealsRes, customersRes, scenariosRes, servicesRes, fundsRes, marketRes, incumbentsRes, validationRes, leversRes]) {
        if (res.error) throw res.error;
      }

      const deals = (dealsRes.data ?? []) as unknown as Deal[];
      const customers = (customersRes.data ?? []) as unknown as Customer[];
      const scenarios = (scenariosRes.data ?? []) as unknown as Scenario[];

      const scenariosByDeal = group(scenarios as unknown as (Scenario & { deal_id: string })[]);
      const servicesByDeal = group((servicesRes.data ?? []) as unknown as ServicesConstruct[]);
      const fundsByDeal = group((fundsRes.data ?? []) as unknown as InnovationFund[]);
      const marketByDeal = group((marketRes.data ?? []) as unknown as MarketplaceModel[]);
      const incumbentsByDeal = group((incumbentsRes.data ?? []) as unknown as IncumbentPlatform[]);
      const validationByDeal = group((validationRes.data ?? []) as unknown as ValidationItem[]);
      const leversByDeal = group((leversRes.data ?? []) as unknown as ValueLever[]);

      // Only the primary scenario of each deal drives portfolio economics.
      const primaryIds: string[] = [];
      const primaryByDeal = new Map<string, Scenario | undefined>();
      for (const deal of deals) {
        const scenario = primaryScenario(deal, scenariosByDeal.get(deal.id) ?? []);
        primaryByDeal.set(deal.id, scenario);
        if (scenario) primaryIds.push(scenario.id);
      }

      let lines: SkuLine[] = [];
      if (primaryIds.length) {
        const { data, error } = await supabase.from("sku_lines").select("*").in("scenario_id", primaryIds);
        if (error) throw error;
        lines = (data ?? []) as unknown as SkuLine[];
      }
      const linesByScenario = new Map<string, SkuLine[]>();
      for (const line of lines) linesByScenario.set(line.scenario_id, [...(linesByScenario.get(line.scenario_id) ?? []), line]);

      const summaries: DealSummary[] = deals.map((deal) => {
        const scenario = primaryByDeal.get(deal.id);
        const dealLines = scenario ? linesByScenario.get(scenario.id) ?? [] : [];
        const validation = validationByDeal.get(deal.id) ?? [];
        const economics = dealEconomics({
          deal,
          scenario,
          lines: dealLines,
          services: (servicesByDeal.get(deal.id) ?? [])[0] ?? null,
          fund: (fundsByDeal.get(deal.id) ?? [])[0] ?? null,
          marketplace: (marketByDeal.get(deal.id) ?? []).find((m) => m.is_enabled) ?? (marketByDeal.get(deal.id) ?? [])[0] ?? null,
          incumbents: incumbentsByDeal.get(deal.id) ?? [],
          levers: leversByDeal.get(deal.id) ?? [],
        });
        const customer = customers.find((c) => c.id === deal.customer_id);
        return {
          deal,
          customerName: customer?.name ?? deal.customer_name,
          industry: customer?.industry ?? null,
          region: customer?.region ?? deal.region,
          economics,
          health: dealHealthScore(economics, deal, validation),
          openValidation: validation.filter((v) => v.status !== "Closed" && v.status !== "Resolved").length,
          criticalValidation: validation.filter((v) => v.severity === "High" && v.status !== "Closed" && v.status !== "Resolved").length,
          familyAcv: familyAcv(dealLines, scenario),
        };
      });

      return { summaries, totals: portfolioTotals(summaries), benchmarks: benchmarks(summaries), customers };
    },
  });
}
