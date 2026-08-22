import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DealRole } from "@/types/deal";

interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  organisation: string | null;
  job_title: string | null;
}

export type DealAccess = "owner" | "editor" | "viewer" | "none";

interface DealContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: DealRole[];
  /** True when the signed-in user may edit the *active* deal. */
  canEdit: boolean;
  /** Every signed-in user may create their own deals and simulations. */
  canCreateDeals: boolean;
  isAdmin: boolean;
  isArchitect: boolean;
  accessFor: (dealId: string | null | undefined) => DealAccess;
  canEditDeal: (dealId: string | null | undefined) => boolean;
  activeDealAccess: DealAccess;
  /** Human-readable reason the active deal is read-only, or null when editable. */
  readOnlyReason: string | null;
  loading: boolean;
  activeDealId: string | null;
  setActiveDealId: (id: string) => void;
  activeScenarioId: string | null;
  setActiveScenarioId: (id: string) => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const DealContext = createContext<DealContextValue | undefined>(undefined);

const SCENARIO_KEY = "osp.activeScenario";
const DEAL_KEY = "osp.activeDeal";

interface AccessRow {
  id: string;
  owner_id: string | null;
  is_simulation: boolean;
}

export function DealProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<DealRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeScenarioId, setActive] = useState<string | null>(() => localStorage.getItem(SCENARIO_KEY));
  const [activeDealId, setDeal] = useState<string | null>(() => localStorage.getItem(DEAL_KEY));

  const loadProfile = useCallback(async (u: User) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", u.id).maybeSingle();
    if (!data) {
      const inserted = await supabase
        .from("profiles")
        .insert({ id: u.id, email: u.email ?? "", display_name: (u.user_metadata?.full_name as string) ?? u.email?.split("@")[0] ?? null })
        .select()
        .maybeSingle();
      setProfile((inserted.data as Profile) ?? null);
    } else {
      setProfile(data as Profile);
    }
    const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", u.id);
    setRoles(((roleRows ?? []) as { role: string }[]).map((r) => r.role as DealRole));
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next?.user) {
        setTimeout(() => void loadProfile(next.user), 0);
      } else {
        setProfile(null);
        setRoles([]);
        qc.clear();
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) void loadProfile(data.session.user);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile, qc]);

  const userId = session?.user?.id ?? null;
  const email = (session?.user?.email ?? "").toLowerCase();

  // Which deals this login owns, collaborates on, or may only read.
  const { data: access } = useQuery({
    queryKey: ["deal_access", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [dealsRes, membersRes] = await Promise.all([
        supabase.from("deals").select("id,owner_id,is_simulation"),
        supabase.from("deal_members").select("deal_id,role,user_id,invited_email"),
      ]);
      if (dealsRes.error) throw dealsRes.error;
      const mine = ((membersRes.data ?? []) as { deal_id: string; role: string; user_id: string | null; invited_email: string }[]).filter(
        (m) => m.user_id === userId || m.invited_email.toLowerCase() === email,
      );
      const memberRole = new Map(mine.map((m) => [m.deal_id, m.role as "viewer" | "editor"]));
      const map = new Map<string, DealAccess>();
      for (const row of (dealsRes.data ?? []) as AccessRow[]) {
        if (row.owner_id === userId) map.set(row.id, "owner");
        else if (memberRole.get(row.id) === "editor") map.set(row.id, "editor");
        else if (memberRole.get(row.id) === "viewer") map.set(row.id, "viewer");
        else if (row.is_simulation && !row.owner_id) map.set(row.id, "viewer");
        else map.set(row.id, "none");
      }
      return map;
    },
  });

  const isAdmin = roles.includes("osp_admin" as DealRole);

  const accessFor = useCallback(
    (dealId: string | null | undefined): DealAccess => {
      if (!dealId) return "none";
      if (isAdmin) return "owner";
      return access?.get(dealId) ?? "none";
    },
    [access, isAdmin],
  );

  const canEditDeal = useCallback(
    (dealId: string | null | undefined) => {
      const level = accessFor(dealId);
      return level === "owner" || level === "editor";
    },
    [accessFor],
  );

  const setActiveScenarioId = useCallback((id: string) => {
    localStorage.setItem(SCENARIO_KEY, id);
    setActive(id);
  }, []);

  const setActiveDealId = useCallback((id: string) => {
    setDeal((prev) => {
      if (prev === id) return prev;
      localStorage.setItem(DEAL_KEY, id);
      // A scenario belongs to a single deal, so clear it when the deal changes.
      localStorage.removeItem(SCENARIO_KEY);
      setActive(null);
      return id;
    });
  }, []);

  const activeDealAccess = accessFor(activeDealId);
  const canEdit = canEditDeal(activeDealId);
  const readOnlyReason = canEdit
    ? null
    : activeDealAccess === "viewer"
      ? "You have view-only access to this deal. Ask the owner for editor rights."
      : activeDealId
        ? "This deal is not shared with you."
        : "Select a deal to start editing.";

  const value = useMemo<DealContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      roles,
      canEdit,
      canCreateDeals: !!session,
      isAdmin,
      isArchitect: roles.includes("deal_architect"),
      accessFor,
      canEditDeal,
      activeDealAccess,
      readOnlyReason,
      loading,
      activeDealId,
      setActiveDealId,
      activeScenarioId,
      setActiveScenarioId,
      refreshProfile: async () => {
        if (session?.user) await loadProfile(session.user);
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [
      session,
      profile,
      roles,
      canEdit,
      isAdmin,
      accessFor,
      canEditDeal,
      activeDealAccess,
      readOnlyReason,
      loading,
      activeDealId,
      setActiveDealId,
      activeScenarioId,
      setActiveScenarioId,
      loadProfile,
    ],
  );

  return <DealContext.Provider value={value}>{children}</DealContext.Provider>;
}

export function useDeal() {
  const ctx = useContext(DealContext);
  if (!ctx) throw new Error("useDeal must be used inside DealProvider");
  return ctx;
}
