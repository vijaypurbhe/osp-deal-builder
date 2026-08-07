import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MODEL_DEFAULTS, type ModelKey } from "@/types/deal";
import { useDeal } from "@/context/DealContext";
import type { BulkTier, Deal, DiscussionItem, OrderForm, RiskEntry, Scenario, SkuLibraryItem, SkuLine, Tower } from "@/types/deal";
import { toast } from "sonner";

const fail = (e: unknown) => {
  const message = e instanceof Error ? e.message : String(e);
  toast.error(message.includes("row-level security") ? "You do not have edit rights for this area." : message);
};

/* ---------- Deals ---------- */

export function useDeals() {
  return useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("deals").select("*").order("sort_order").order("created_at");
      if (error) throw error;
      return data as unknown as Deal[];
    },
  });
}

export function useSkuLibrary() {
  return useQuery({
    queryKey: ["sku_library"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sku_library").select("*").order("sku_name");
      if (error) throw error;
      return data as unknown as SkuLibraryItem[];
    },
  });
}

export function useScenarios() {
  const { activeDealId } = useDeal();
  return useQuery({
    queryKey: ["scenarios", activeDealId],
    enabled: !!activeDealId,
    queryFn: async () => {
      const { data, error } = await supabase.from("scenarios").select("*").eq("deal_id", activeDealId!).order("sort_order");
      if (error) throw error;
      return data as unknown as Scenario[];
    },
  });
}

export function useTowers() {
  const { activeDealId } = useDeal();
  return useQuery({
    queryKey: ["towers", activeDealId],
    enabled: !!activeDealId,
    queryFn: async () => {
      const { data, error } = await supabase.from("towers").select("*").eq("deal_id", activeDealId!).order("sort_order");
      if (error) throw error;
      return data as unknown as Tower[];
    },
  });
}

export function useSkuLines(scenarioId?: string | null) {
  return useQuery({
    queryKey: ["sku_lines", scenarioId],
    enabled: !!scenarioId,
    queryFn: async () => {
      const { data, error } = await supabase.from("sku_lines").select("*").eq("scenario_id", scenarioId!).order("created_at");
      if (error) throw error;
      return data as unknown as SkuLine[];
    },
  });
}

/** Every line across the scenarios of the active deal. */
export function useAllSkuLines() {
  const { activeDealId } = useDeal();
  return useQuery({
    queryKey: ["sku_lines_all", activeDealId],
    enabled: !!activeDealId,
    queryFn: async () => {
      const { data: scenarioRows, error: scenarioError } = await supabase
        .from("scenarios")
        .select("id")
        .eq("deal_id", activeDealId!);
      if (scenarioError) throw scenarioError;
      const ids = (scenarioRows ?? []).map((s) => s.id);
      if (!ids.length) return [] as SkuLine[];
      const { data, error } = await supabase.from("sku_lines").select("*").in("scenario_id", ids);
      if (error) throw error;
      return data as unknown as SkuLine[];
    },
  });
}

export function useDiscussionItems() {
  const { activeDealId } = useDeal();
  return useQuery({
    queryKey: ["discussion_items", activeDealId],
    enabled: !!activeDealId,
    queryFn: async () => {
      const { data, error } = await supabase.from("discussion_items").select("*").eq("deal_id", activeDealId!).order("area").order("title");
      if (error) throw error;
      return data as unknown as DiscussionItem[];
    },
  });
}

export function useRiskLog() {
  const { activeDealId } = useDeal();
  return useQuery({
    queryKey: ["risk_log", activeDealId],
    enabled: !!activeDealId,
    queryFn: async () => {
      const { data, error } = await supabase.from("risk_log").select("*").eq("deal_id", activeDealId!).order("ref_code");
      if (error) throw error;
      return data as unknown as RiskEntry[];
    },
  });
}

export function useOrderForms(scenarioId?: string | null) {
  return useQuery({
    queryKey: ["order_forms", scenarioId],
    enabled: !!scenarioId,
    queryFn: async () => {
      const { data, error } = await supabase.from("order_forms").select("*").eq("scenario_id", scenarioId!).order("created_at");
      if (error) throw error;
      return data as unknown as OrderForm[];
    },
  });
}

export function useBulkTiers(scenarioId?: string | null) {
  return useQuery({
    queryKey: ["bulk_tiers", scenarioId],
    enabled: !!scenarioId,
    queryFn: async () => {
      const { data, error } = await supabase.from("bulk_discount_tiers").select("*").eq("scenario_id", scenarioId!).order("sort_order");
      if (error) throw error;
      return data as unknown as BulkTier[];
    },
  });
}

export function useScenarioModel<T>(scenarioId: string | null | undefined, key: ModelKey) {
  return useQuery({
    queryKey: ["scenario_model", scenarioId, key],
    enabled: !!scenarioId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scenario_models")
        .select("config")
        .eq("scenario_id", scenarioId!)
        .eq("model_key", key)
        .maybeSingle();
      if (error) throw error;
      return { ...(MODEL_DEFAULTS[key] as object), ...((data?.config as object) ?? {}) } as T;
    },
  });
}

export function useSaveScenarioModel(scenarioId: string | null | undefined, key: ModelKey) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config: unknown) => {
      const { error } = await supabase
        .from("scenario_models")
        .upsert({ scenario_id: scenarioId!, model_key: key, config: config as never }, { onConflict: "scenario_id,model_key" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scenario_model", scenarioId, key] });
      toast.success("Assumptions saved");
    },
    onError: fail,
  });
}

type TableName =
  | "deals"
  | "sku_library"
  | "scenarios"
  | "sku_lines"
  | "towers"
  | "discussion_items"
  | "risk_log"
  | "order_forms"
  | "bulk_discount_tiers"
  | "import_batches";

export function useUpsertRow(table: TableName, invalidate: unknown[][]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Record<string, unknown>) => {
      const { data, error } = await supabase.from(table).upsert(row as never).select().maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidate.forEach((k) => qc.invalidateQueries({ queryKey: k })),
    onError: fail,
  });
}

export function useInsertRows(table: TableName, invalidate: unknown[][]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: Record<string, unknown>[]) => {
      const { error } = await supabase.from(table).insert(rows as never);
      if (error) throw error;
    },
    onSuccess: () => invalidate.forEach((k) => qc.invalidateQueries({ queryKey: k })),
    onError: fail,
  });
}

export function useDeleteRow(table: TableName, invalidate: unknown[][]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate.forEach((k) => qc.invalidateQueries({ queryKey: k })),
    onError: fail,
  });
}

/** The currently selected deal record (or null while deals load). */
export function useActiveDeal() {
  const { activeDealId } = useDeal();
  const { data } = useDeals();
  return (data ?? []).find((d) => d.id === activeDealId) ?? null;
}
