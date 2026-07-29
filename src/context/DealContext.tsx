import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { DealRole } from "@/types/deal";

interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  organisation: string | null;
  job_title: string | null;
}

interface DealContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: DealRole[];
  canEdit: boolean;
  isArchitect: boolean;
  loading: boolean;
  activeScenarioId: string | null;
  setActiveScenarioId: (id: string) => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const DealContext = createContext<DealContextValue | undefined>(undefined);

const EDIT_ROLES: DealRole[] = ["deal_architect", "salesforce_ae", "tm_osp_lead"];
const SCENARIO_KEY = "osp.activeScenario";

export function DealProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<DealRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeScenarioId, setActive] = useState<string | null>(() => localStorage.getItem(SCENARIO_KEY));

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
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) void loadProfile(data.session.user);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const setActiveScenarioId = useCallback((id: string) => {
    localStorage.setItem(SCENARIO_KEY, id);
    setActive(id);
  }, []);

  const value = useMemo<DealContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      roles,
      canEdit: roles.some((r) => EDIT_ROLES.includes(r)),
      isArchitect: roles.includes("deal_architect"),
      loading,
      activeScenarioId,
      setActiveScenarioId,
      refreshProfile: async () => {
        if (session?.user) await loadProfile(session.user);
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, profile, roles, loading, activeScenarioId, setActiveScenarioId, loadProfile],
  );

  return <DealContext.Provider value={value}>{children}</DealContext.Provider>;
}

export function useDeal() {
  const ctx = useContext(DealContext);
  if (!ctx) throw new Error("useDeal must be used inside DealProvider");
  return ctx;
}
