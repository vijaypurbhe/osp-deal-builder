import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDeal } from "@/context/DealContext";
import SectionCard from "@/components/common/SectionCard";
import KpiCard from "@/components/common/KpiCard";
import ShareDealDialog from "@/components/deals/ShareDealDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEAL_ROLES } from "@/types/deal";
import { toast } from "sonner";
import { ShieldCheck, Users2 } from "lucide-react";

interface AdminDeal {
  id: string;
  name: string;
  customer_name: string;
  owner_id: string | null;
  owner_name: string | null;
  is_simulation: boolean;
  is_archived: boolean;
  status: string;
}

interface AdminProfile {
  id: string;
  email: string;
  display_name: string | null;
}

export default function AdminPage() {
  const { isAdmin } = useDeal();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [shareDeal, setShareDeal] = useState<AdminDeal | null>(null);
  const [newRole, setNewRole] = useState<Record<string, string>>({});

  const deals = useQuery({
    queryKey: ["admin_deals"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("id,name,customer_name,owner_id,owner_name,is_simulation,is_archived,status")
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as AdminDeal[];
    },
  });

  const people = useQuery({
    queryKey: ["admin_people"],
    enabled: isAdmin,
    queryFn: async () => {
      const [profilesRes, rolesRes, membersRes] = await Promise.all([
        supabase.from("profiles").select("id,email,display_name").order("email"),
        supabase.from("user_roles").select("user_id,role"),
        supabase.from("deal_members").select("deal_id,invited_email,role"),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      return {
        profiles: (profilesRes.data ?? []) as unknown as AdminProfile[],
        roles: (rolesRes.data ?? []) as { user_id: string; role: string }[],
        members: (membersRes.data ?? []) as { deal_id: string; invited_email: string; role: string }[],
      };
    },
  });

  const memberCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of people.data?.members ?? []) map.set(m.deal_id, (map.get(m.deal_id) ?? 0) + 1);
    return map;
  }, [people.data]);

  const filtered = (deals.data ?? []).filter((d) =>
    `${d.name} ${d.customer_name} ${d.owner_name ?? ""}`.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const grantRole = async (userId: string, role: string) => {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: role as never });
    if (error) toast.error(error.message);
    else {
      toast.success("Role granted");
      void qc.invalidateQueries({ queryKey: ["admin_people"] });
    }
  };

  const revokeRole = async (userId: string, role: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as never);
    if (error) toast.error(error.message);
    else {
      toast.success("Role removed");
      void qc.invalidateQueries({ queryKey: ["admin_people"] });
    }
  };

  if (!isAdmin) {
    return (
      <SectionCard title="Admin console" description="Restricted area">
        <p className="text-sm text-muted-foreground">You need the OSP Platform Admin role to view this page.</p>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Deals across all users" value={String((deals.data ?? []).length)} icon={ShieldCheck} />
        <KpiCard label="Registered users" value={String((people.data?.profiles ?? []).length)} icon={Users2} />
        <KpiCard label="Shared invitations" value={String((people.data?.members ?? []).length)} />
      </div>

      <SectionCard
        title="All deals"
        description="Every deal and simulation in the platform, with its owner and collaborators"
        actions={
          <Input
            className="h-9 w-56"
            placeholder="Search deals, customers, owners"
            value={search}
            maxLength={120}
            onChange={(e) => setSearch(e.target.value)}
          />
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Deal</TableHead>
              <TableHead className="w-48">Customer</TableHead>
              <TableHead className="w-56">Owner</TableHead>
              <TableHead className="w-28">Type</TableHead>
              <TableHead className="w-28">Shared with</TableHead>
              <TableHead className="w-28 text-right">Access</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell>{d.customer_name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{d.owner_name ?? (d.owner_id ? d.owner_id : "Unowned (shared sandbox)")}</TableCell>
                <TableCell>
                  <Badge variant={d.is_simulation ? "outline" : "secondary"} className="text-[10px] font-normal">
                    {d.is_simulation ? "Simulation" : "Live deal"}
                  </Badge>
                </TableCell>
                <TableCell className="num text-sm">{memberCount.get(d.id) ?? 0}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => setShareDeal(d)}>
                    Manage
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!filtered.length && (
              <TableRow>
                <TableCell colSpan={6} className="text-sm text-muted-foreground">
                  No deals match that search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard title="Users and roles" description="Grant platform admin rights or reviewer roles">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead className="w-72 text-right">Grant role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(people.data?.profiles ?? []).map((p) => {
              const userRoles = (people.data?.roles ?? []).filter((r) => r.user_id === p.id);
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <p className="font-medium">{p.display_name ?? p.email}</p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {userRoles.length ? (
                        userRoles.map((r) => (
                          <Badge key={r.role} variant="secondary" className="cursor-pointer text-[10px] font-normal" onClick={() => void revokeRole(p.id, r.role)}>
                            {DEAL_ROLES.find((d) => d.key === r.role)?.label ?? r.role} ×
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className="text-[10px] font-normal">No roles</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Select value={newRole[p.id] ?? ""} onValueChange={(v) => setNewRole((prev) => ({ ...prev, [p.id]: v }))}>
                        <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Select role" /></SelectTrigger>
                        <SelectContent>
                          {DEAL_ROLES.map((r) => (
                            <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" disabled={!newRole[p.id]} onClick={() => void grantRole(p.id, newRole[p.id])}>
                        Grant
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </SectionCard>

      <ShareDealDialog
        dealId={shareDeal?.id ?? null}
        dealName={shareDeal?.name}
        open={!!shareDeal}
        onOpenChange={(v) => !v && setShareDeal(null)}
        canManage
      />
    </div>
  );
}
