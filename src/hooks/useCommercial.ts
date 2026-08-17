import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDeal } from "@/context/DealContext";
import { toast } from "sonner";
import type {
  Customer,
  DealTemplate,
  DealVersion,
  GlobalDefaults,
  IncumbentPlatform,
  InnovationFund,
  MarketplaceModel,
  ServicesConstruct,
  ValidationItem,
  ValueLever,
} from "@/types/deal";

const fail = (e: unknown) => {
  const message = e instanceof Error ? e.message : String(e);
  toast.error(message.includes("row-level security") ? "You do not have edit rights for this area." : message);
};

/* ---------- Customers ---------- */

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").order("name");
      if (error) throw error;
      return data as unknown as Customer[];
    },
  });
}

/* ---------- Deal-scoped commercial modules ---------- */

function dealScoped<T>(table: string, key: string, order?: string) {
  return function useDealScoped(dealId?: string | null) {
    const { activeDealId } = useDeal();
    const id = dealId ?? activeDealId;
    return useQuery({
      queryKey: [key, id],
      enabled: !!id,
      queryFn: async () => {
        let q = supabase.from(table as never).select("*").eq("deal_id", id!);
        if (order) q = q.order(order) as never;
        const { data, error } = await q;
        if (error) throw error;
        return data as unknown as T[];
      },
    });
  };
}

export const useServicesConstructs = dealScoped<ServicesConstruct>("services_constructs", "services_constructs", "created_at");
export const useInnovationFunds = dealScoped<InnovationFund>("innovation_funds", "innovation_funds", "created_at");
export const useIncumbentPlatforms = dealScoped<IncumbentPlatform>("incumbent_platforms", "incumbent_platforms", "vendor");
export const useMarketplaceModels = dealScoped<MarketplaceModel>("marketplace_models", "marketplace_models", "provider");
export const useValidationItems = dealScoped<ValidationItem>("validation_items", "validation_items", "created_at");
export const useValueLevers = dealScoped<ValueLever>("value_levers", "value_levers", "created_at");

export function useDealVersions(dealId?: string | null) {
  const { activeDealId } = useDeal();
  const id = dealId ?? activeDealId;
  return useQuery({
    queryKey: ["deal_versions", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("deal_versions").select("*").eq("deal_id", id!).order("version_no", { ascending: false });
      if (error) throw error;
      return data as unknown as DealVersion[];
    },
  });
}

export function useDealTemplates() {
  return useQuery({
    queryKey: ["deal_templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("deal_templates").select("*").order("sort_order").order("name");
      if (error) throw error;
      return data as unknown as DealTemplate[];
    },
  });
}

export function useGlobalDefaults() {
  return useQuery({
    queryKey: ["global_defaults"],
    queryFn: async () => {
      const { data, error } = await supabase.from("global_defaults").select("*").eq("is_active", true).maybeSingle();
      if (error) throw error;
      return (data as unknown as GlobalDefaults) ?? null;
    },
  });
}

/* ---------- Generic writers for the new tables ---------- */

export type CommercialTable =
  | "customers"
  | "services_constructs"
  | "innovation_funds"
  | "incumbent_platforms"
  | "marketplace_models"
  | "validation_items"
  | "value_levers"
  | "deal_versions"
  | "deal_templates"
  | "global_defaults";

export function useSaveCommercialRow(table: CommercialTable, invalidate: unknown[][], successMessage?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Record<string, unknown>) => {
      const { data, error } = await supabase.from(table as never).upsert(row as never).select().maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate.forEach((k) => qc.invalidateQueries({ queryKey: k }));
      if (successMessage) toast.success(successMessage);
    },
    onError: fail,
  });
}

export function useDeleteCommercialRow(table: CommercialTable, invalidate: unknown[][]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate.forEach((k) => qc.invalidateQueries({ queryKey: k })),
    onError: fail,
  });
}

/** Convenience: the single active construct/fund/marketplace row for a deal. */
export function firstOrNull<T>(rows: T[] | undefined): T | null {
  return rows && rows.length ? rows[0] : null;
}
