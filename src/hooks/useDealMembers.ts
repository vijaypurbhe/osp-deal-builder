import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { shareSchema } from "@/lib/validation";

export interface DealMember {
  id: string;
  deal_id: string;
  user_id: string | null;
  invited_email: string;
  role: "viewer" | "editor";
  created_at: string;
}

export function useDealMembers(dealId: string | null | undefined) {
  return useQuery({
    queryKey: ["deal_members", dealId],
    enabled: !!dealId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_members")
        .select("*")
        .eq("deal_id", dealId!)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as DealMember[];
    },
  });
}

export function useInviteMember(dealId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { email: string; role: "viewer" | "editor" }) => {
      if (!dealId) throw new Error("Select a deal first");
      const parsed = shareSchema.parse(input);
      const { error } = await supabase
        .from("deal_members")
        .upsert(
          { deal_id: dealId, invited_email: parsed.email, role: parsed.role } as never,
          { onConflict: "deal_id,invited_email" },
        );
      if (error) throw error;
      return parsed;
    },
    onSuccess: (parsed) => {
      qc.invalidateQueries({ queryKey: ["deal_members"] });
      qc.invalidateQueries({ queryKey: ["deal_access"] });
      toast.success(`${parsed.email} can now ${parsed.role === "editor" ? "edit" : "view"} this deal`);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deal_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deal_members"] });
      qc.invalidateQueries({ queryKey: ["deal_access"] });
      toast.success("Access removed");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
  });
}
