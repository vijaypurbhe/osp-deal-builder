import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MODEL_DEFAULTS, type ModelKey } from "@/types/deal";
import type { BulkTier, DiscussionItem, OrderForm, RiskEntry, Scenario, SkuLine, Tower } from "@/types/deal";
import { toast } from "sonner";

const fail = (e: unknown) => {
  const message = e instanceof Error ? e.message : String(e);
  toast.error(message.includes("row-level security") ? "You do not have edit rights for this area." : message);
};

export function useScenarios() {
  return useQuery({
    queryKey: ["scenarios"],
    queryFn: async () => {
      const { data, error } = await supabase.from("scenarios").select("*").order("sort_order");
      if (error) throw error;
      return data as unknown as Scenario[];
    },
  });
}

export function useTowers() {
  return useQuery({
    queryKey: ["towers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("towers").select("*").order("sort_order");
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

export function useAllSkuLines() {
  return useQuery({
    queryKey: ["sku_lines_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sku_lines").select("*");
      if (error) throw error;
      return data as unknown as SkuLine[];
    },
  });
}

export function useDiscussionItems() {
  return useQuery({
    queryKey: ["discussion_items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("discussion_items").select("*").order("area").order("title");
      if (error) throw error;
      return data as unknown as DiscussionItem[];
    },
  });
}

export function useRiskLog() {
  return useQuery({
    queryKey: ["risk_log"],
    queryFn: async () => {
      const { data, error } = await supabase.from("risk_log").select("*").order("ref_code");
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

type TableName = "scenarios" | "sku_lines" | "towers" | "discussion_items" | "risk_log" | "order_forms" | "bulk_discount_tiers" | "import_batches";

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
