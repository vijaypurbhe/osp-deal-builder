import { useMemo } from "react";
import { useDeal } from "@/context/DealContext";
import { useActiveDeal, useScenarios, useSkuLines } from "@/hooks/useDealData";
import {
  useIncumbentPlatforms,
  useInnovationFunds,
  useMarketplaceModels,
  useServicesConstructs,
  useValidationItems,
  useValueLevers,
} from "@/hooks/useCommercial";
import { dealEconomics, dealHealthScore, familyAcv } from "@/lib/economics";
import type { Scenario } from "@/types/deal";

/**
 * Deal-scope economics for the active deal + active scenario: licence buy/sell,
 * services, Innovation Fund, marketplace, displacement, value and health score.
 */
export function useDealEconomics() {
  const { activeScenarioId } = useDeal();
  const deal = useActiveDeal();
  const { data: scenarios } = useScenarios();
  const { data: lines } = useSkuLines(activeScenarioId);
  const { data: services } = useServicesConstructs();
  const { data: funds } = useInnovationFunds();
  const { data: marketplace } = useMarketplaceModels();
  const { data: incumbents } = useIncumbentPlatforms();
  const { data: validation } = useValidationItems();
  const { data: levers } = useValueLevers();

  const scenario: Scenario | undefined = (scenarios ?? []).find((s) => s.id === activeScenarioId);

  return useMemo(() => {
    if (!deal) return null;
    const economics = dealEconomics({
      deal,
      scenario,
      lines: lines ?? [],
      services: (services ?? [])[0] ?? null,
      fund: (funds ?? [])[0] ?? null,
      marketplace: (marketplace ?? []).find((m) => m.is_enabled) ?? (marketplace ?? [])[0] ?? null,
      incumbents: incumbents ?? [],
      levers: levers ?? [],
    });
    return {
      deal,
      scenario,
      economics,
      health: dealHealthScore(economics, deal, validation ?? []),
      familyAcv: familyAcv(lines ?? [], scenario),
      validation: validation ?? [],
    };
  }, [deal, scenario, lines, services, funds, marketplace, incumbents, levers, validation]);
}
