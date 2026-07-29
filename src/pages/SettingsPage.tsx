import { useState } from "react";
import { useDeal } from "@/context/DealContext";
import { useScenarios, useTowers, useUpsertRow } from "@/hooks/useDealData";
import { supabase } from "@/integrations/supabase/client";
import SectionCard from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DEAL_ROLES, APPROVAL_STATUSES, CONFIDENCE_LEVELS } from "@/types/deal";
import { toast } from "sonner";

export default function SettingsPage() {
  const { profile, roles, canEdit, refreshProfile } = useDeal();
  const { data: scenarios } = useScenarios();
  const { data: towers } = useTowers();
  const upsertScenario = useUpsertRow("scenarios", [["scenarios"]]);
  const upsertTower = useUpsertRow("towers", [["towers"]]);
  const [name, setName] = useState(profile?.display_name ?? "");
  const [org, setOrg] = useState(profile?.organisation ?? "");
  const [title, setTitle] = useState(profile?.job_title ?? "");

  const saveProfile = async () => {
    if (!profile) return;
    const { error } = await supabase.from("profiles").update({ display_name: name, organisation: org, job_title: title }).eq("id", profile.id);
    if (error) return toast.error(error.message);
    await refreshProfile();
    toast.success("Profile updated");
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Your profile" description="Shown alongside decisions and approvals" actions={<Button size="sm" onClick={saveProfile}>Save profile</Button>}>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5"><Label>Display name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Organisation</Label><Input value={org} onChange={(e) => setOrg(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Job title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Assigned roles:</span>
          {roles.length ? roles.map((r) => <Badge key={r}>{DEAL_ROLES.find((d) => d.key === r)?.label ?? r}</Badge>) : <Badge variant="outline">Read only</Badge>}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Roles are granted by a deal architect and control who can edit pricing, models and order forms.</p>
      </SectionCard>

      <SectionCard title="Scenarios" description="Lock scenarios once they are approved to prevent further edits">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Scenario</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead className="w-32">Currency</TableHead>
              <TableHead className="w-28 text-center">Recommended</TableHead>
              <TableHead className="w-24 text-center">Locked</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(scenarios ?? []).map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>
                  <Input className="h-8" disabled={!canEdit} defaultValue={s.owner_name ?? ""} onBlur={(e) => upsertScenario.mutate({ ...s, owner_name: e.target.value })} />
                </TableCell>
                <TableCell>
                  <Input className="h-8" disabled={!canEdit} defaultValue={s.currency} onBlur={(e) => upsertScenario.mutate({ ...s, currency: e.target.value.toUpperCase() })} />
                </TableCell>
                <TableCell className="text-center">
                  <Switch checked={s.is_recommended} disabled={!canEdit} onCheckedChange={(v) => upsertScenario.mutate({ ...s, is_recommended: v })} />
                </TableCell>
                <TableCell className="text-center">
                  <Switch checked={s.is_locked} disabled={!canEdit} onCheckedChange={(v) => upsertScenario.mutate({ ...s, is_locked: v })} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard title="Commercial towers" description="Decision status and confidence used across the dashboard">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tower</TableHead>
              <TableHead className="w-64">Decision status</TableHead>
              <TableHead className="w-40">Confidence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(towers ?? []).map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.description ?? ""}</p>
                </TableCell>
                <TableCell>
                  <Select value={t.decision_status} disabled={!canEdit} onValueChange={(v) => upsertTower.mutate({ ...t, decision_status: v })}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>{APPROVAL_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select value={t.confidence} disabled={!canEdit} onValueChange={(v) => upsertTower.mutate({ ...t, confidence: v })}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>{CONFIDENCE_LEVELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
