import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Deal } from "@/types/deal";

/** Generic tower structure used when a deal is created from scratch or from the SKU library. */
export const DEFAULT_TOWER_SEED = [
  {
    key: "core",
    name: "Core Commercial Platform",
    description: "Sales Cloud, Service Cloud, platform licences, sandboxes and productivity tools",
    sort_order: 1,
  },
  {
    key: "revenue",
    name: "Commercial Productivity & Revenue Lifecycle",
    description: "CPQ, Revenue Cloud, CLM, pricing governance and approvals",
    sort_order: 2,
  },
  {
    key: "data_ai",
    name: "Data, Analytics & AI",
    description: "Data 360, marketing expansion, CRM Analytics and Agentforce",
    sort_order: 3,
  },
  {
    key: "integration",
    name: "Integration & Enterprise Connectivity",
    description: "MuleSoft capacity, API management and enterprise connectors",
    sort_order: 4,
  },
  {
    key: "managed_ops",
    name: "Managed Operations & Optimization",
    description: "AMS, licence management, FinOps governance and environment support",
    sort_order: 5,
  },
];

const DEFAULT_SCENARIOS = [
  { name: "Current BOM Baseline", is_baseline: true, is_recommended: false, is_locked: true, scenario_discount_pct: 0, bulk_discount_pct: 0, strategic_override_pct: 0, sort_order: 0, description: "Reference bill of materials — read only" },
  { name: "Expected Landing Zone", is_baseline: false, is_recommended: true, is_locked: false, scenario_discount_pct: 12, bulk_discount_pct: 6, strategic_override_pct: 2, sort_order: 1, description: "Most likely commercial landing point" },
  { name: "Strategic Upside", is_baseline: false, is_recommended: false, is_locked: false, scenario_discount_pct: 18, bulk_discount_pct: 8, strategic_override_pct: 4, sort_order: 2, description: "Expanded scope with deeper discount posture" },
];

const SINGLE_SCENARIO = [
  { name: "Working Scenario", is_baseline: true, is_recommended: true, is_locked: false, scenario_discount_pct: 0, bulk_discount_pct: 0, strategic_override_pct: 0, sort_order: 0, description: "Primary working scenario" },
];

export interface LibrarySelection {
  libraryId: string;
  quantity: number;
}

/** A BOM row parsed from an uploaded workbook, ready to become a sku_lines record. */
export interface ImportedLine {
  sku_name: string;
  sku_code: string | null;
  description: string | null;
  product_family: string | null;
  cloud: string | null;
  tower_key: string | null;
  classification: string;
  quantity: number;
  unit_of_measure: string;
  unit_list_price: number;
  billing_frequency: string;
  line_discount_pct: number;
  source_tab: string | null;
  source_file: string | null;
}

export interface NewDealInput {
  name: string;
  customer_name: string;
  partner_name: string;
  currency: string;
  contract_start: string | null;
  contract_end: string | null;
  status: string;
  owner_name: string | null;
  notes: string | null;
  /** How the starting bill of materials is populated. */
  source: "blank" | "library" | "clone" | "import";
  librarySelections?: LibrarySelection[];
  /** Rows parsed from an uploaded BOM workbook (source === "import"). */
  importLines?: ImportedLine[];
  sourceDealId?: string | null;
  scenarioPreset: "default" | "single";
}


const strip = <T extends { id: string }>(row: T) => {
  const { id, ...rest } = row as Record<string, unknown> & { id: string };
  void id;
  delete rest.created_at;
  delete rest.updated_at;
  return rest;
};

async function insertRows(table: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return [] as { id: string }[];
  const { data, error } = await supabase.from(table as never).insert(rows as never).select("id");
  if (error) throw error;
  return (data ?? []) as { id: string }[];
}

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewDealInput): Promise<Deal> => {
      const { data: dealRow, error: dealError } = await supabase
        .from("deals")
        .insert({
          name: input.name,
          customer_name: input.customer_name,
          partner_name: input.partner_name,
          currency: input.currency,
          contract_start: input.contract_start,
          contract_end: input.contract_end,
          status: input.status,
          owner_name: input.owner_name,
          notes: input.notes,
          owner_id: (await supabase.auth.getUser()).data.user?.id ?? null,
        })
        .select()
        .single();
      if (dealError) throw dealError;
      const deal = dealRow as unknown as Deal;

      if (input.source === "clone" && input.sourceDealId) {
        await cloneDealContents(input.sourceDealId, deal);
      } else {
        // Towers
        await insertRows(
          "towers",
          DEFAULT_TOWER_SEED.map((t) => ({ ...t, deal_id: deal.id })),
        );

        // Scenarios
        const preset = input.scenarioPreset === "single" ? SINGLE_SCENARIO : DEFAULT_SCENARIOS;
        const { data: created, error: scenarioError } = await supabase
          .from("scenarios")
          .insert(
            preset.map((s) => ({
              ...s,
              deal_id: deal.id,
              currency: input.currency,
              contract_start: input.contract_start,
              contract_end: input.contract_end,
              owner_name: input.owner_name,
              status: "Draft",
            })) as never,
          )
          .select("id");
        if (scenarioError) throw scenarioError;
        const scenarioIds = (created ?? []).map((s: { id: string }) => s.id);

        // Starting BOM from the SKU library
        if (input.source === "library" && input.librarySelections?.length) {
          const ids = input.librarySelections.map((s) => s.libraryId);
          const { data: libRows, error: libError } = await supabase.from("sku_library").select("*").in("id", ids);
          if (libError) throw libError;
          const byId = new Map((libRows ?? []).map((r: { id: string }) => [r.id, r]));
          const lines: Record<string, unknown>[] = [];
          for (const scenarioId of scenarioIds) {
            for (const sel of input.librarySelections) {
              const lib = byId.get(sel.libraryId) as Record<string, unknown> | undefined;
              if (!lib) continue;
              lines.push({
                scenario_id: scenarioId,
                tower_key: lib.default_tower_key,
                sku_code: lib.sku_code,
                sku_name: lib.sku_name,
                description: lib.description,
                product_family: lib.product_family,
                product_category: lib.product_category,
                cloud: lib.cloud,
                unit_of_measure: lib.unit_of_measure,
                unit_list_price: lib.unit_list_price,
                billing_frequency: lib.billing_frequency,
                quantity: sel.quantity,
                classification: "Current baseline",
                bom_type: "revised",
                approval_status: "Draft",
                source_file: "SKU library",
              });
            }
          }
          await insertRows("sku_lines", lines);
        }

        // Starting BOM from an uploaded workbook
        if (input.source === "import" && input.importLines?.length) {
          const lines: Record<string, unknown>[] = [];
          for (const scenarioId of scenarioIds) {
            for (const line of input.importLines) {
              lines.push({ ...line, scenario_id: scenarioId, bom_type: "revised", approval_status: "Draft" });
            }
          }
          await insertRows("sku_lines", lines);
        }
      }

      return deal;
    },
    onSuccess: (deal) => {
      qc.invalidateQueries();
      toast.success(`Deal "${deal.name}" created`);
    },
    onError: (e: unknown) => {
      const message =
        e instanceof Error
          ? e.message
          : typeof e === "object" && e && "message" in e
            ? String((e as { message: unknown }).message)
            : String(e);
      toast.error(message.includes("row-level security") ? "You do not have rights to create deals." : message);
    },
  });
}

/** Copies scenarios, lines, tiers, models, order forms, towers, discussion and risks into a new deal. */
async function cloneDealContents(sourceDealId: string, deal: Deal) {
  const [towers, scenarios, discussion, risks] = await Promise.all([
    supabase.from("towers").select("*").eq("deal_id", sourceDealId),
    supabase.from("scenarios").select("*").eq("deal_id", sourceDealId).order("sort_order"),
    supabase.from("discussion_items").select("*").eq("deal_id", sourceDealId),
    supabase.from("risk_log").select("*").eq("deal_id", sourceDealId),
  ]);
  for (const r of [towers, scenarios, discussion, risks]) if (r.error) throw r.error;

  await insertRows(
    "towers",
    (towers.data ?? []).map((t) => ({ ...strip(t as never), deal_id: deal.id })),
  );
  await insertRows(
    "discussion_items",
    (discussion.data ?? []).map((d) => ({ ...strip(d as never), deal_id: deal.id })),
  );
  await insertRows(
    "risk_log",
    (risks.data ?? []).map((r) => ({ ...strip(r as never), deal_id: deal.id })),
  );

  const sourceScenarios = (scenarios.data ?? []) as { id: string }[];
  const idMap = new Map<string, string>();
  for (const src of sourceScenarios) {
    const { data, error } = await supabase
      .from("scenarios")
      .insert({
        ...strip(src as never),
        deal_id: deal.id,
        currency: deal.currency,
        contract_start: deal.contract_start,
        contract_end: deal.contract_end,
        owner_name: deal.owner_name,
      } as never)
      .select("id")
      .single();
    if (error) throw error;
    idMap.set(src.id, (data as { id: string }).id);
  }

  const sourceIds = sourceScenarios.map((s) => s.id);
  if (!sourceIds.length) return;

  const [lines, tiers, models, forms] = await Promise.all([
    supabase.from("sku_lines").select("*").in("scenario_id", sourceIds),
    supabase.from("bulk_discount_tiers").select("*").in("scenario_id", sourceIds),
    supabase.from("scenario_models").select("*").in("scenario_id", sourceIds),
    supabase.from("order_forms").select("*").in("scenario_id", sourceIds),
  ]);
  for (const r of [lines, tiers, models, forms]) if (r.error) throw r.error;

  const remap = (rows: unknown[] | null) =>
    (rows ?? [])
      .map((row) => {
        const rest = strip(row as never) as Record<string, unknown>;
        const mapped = idMap.get(rest.scenario_id as string);
        if (!mapped) return null;
        return { ...rest, scenario_id: mapped };
      })
      .filter(Boolean) as Record<string, unknown>[];

  await insertRows("sku_lines", remap(lines.data));
  await insertRows("bulk_discount_tiers", remap(tiers.data));
  await insertRows("scenario_models", remap(models.data));
  await insertRows(
    "order_forms",
    remap(forms.data).map((f) => ({ ...f, customer_name: deal.customer_name, partner_name: deal.partner_name })),
  );
}

/** Duplicate an existing deal in place (used from the deals list). */
export function useDuplicateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (source: Deal) => {
      const { data, error } = await supabase
        .from("deals")
        .insert({
          name: `${source.name} (copy)`,
          customer_name: source.customer_name,
          partner_name: source.partner_name,
          currency: source.currency,
          contract_start: source.contract_start,
          contract_end: source.contract_end,
          status: "Shaping",
          owner_name: source.owner_name,
          notes: source.notes,
          owner_id: (await supabase.auth.getUser()).data.user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      const deal = data as unknown as Deal;
      await cloneDealContents(source.id, deal);
      return deal;
    },
    onSuccess: (deal) => {
      qc.invalidateQueries();
      toast.success(`Duplicated into "${deal.name}"`);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
  });
}

/** Adds SKU library items as lines on a scenario. */
export function useAddLibraryLines(scenarioId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (selections: LibrarySelection[]) => {
      if (!scenarioId || !selections.length) return;
      const { data: libRows, error } = await supabase
        .from("sku_library")
        .select("*")
        .in("id", selections.map((s) => s.libraryId));
      if (error) throw error;
      const byId = new Map((libRows ?? []).map((r: { id: string }) => [r.id, r as Record<string, unknown>]));
      const rows = selections
        .map((sel) => {
          const lib = byId.get(sel.libraryId);
          if (!lib) return null;
          return {
            scenario_id: scenarioId,
            tower_key: lib.default_tower_key,
            sku_code: lib.sku_code,
            sku_name: lib.sku_name,
            description: lib.description,
            product_family: lib.product_family,
            product_category: lib.product_category,
            cloud: lib.cloud,
            unit_of_measure: lib.unit_of_measure,
            unit_list_price: lib.unit_list_price,
            billing_frequency: lib.billing_frequency,
            quantity: sel.quantity,
            classification: "Incremental",
            bom_type: "revised",
            approval_status: "Draft",
            source_file: "SKU library",
          };
        })
        .filter(Boolean) as Record<string, unknown>[];
      await insertRows("sku_lines", rows);
      return rows.length;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ["sku_lines"] });
      qc.invalidateQueries({ queryKey: ["sku_lines_all"] });
      if (count) toast.success(`Added ${count} line${count === 1 ? "" : "s"} from the library`);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
  });
}
