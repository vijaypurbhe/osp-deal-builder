import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDealMembers, useInviteMember, useRemoveMember } from "@/hooks/useDealMembers";
import { shareSchema, fieldErrors } from "@/lib/validation";
import { Trash2, UserPlus } from "lucide-react";

interface Props {
  dealId: string | null;
  dealName?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  canManage: boolean;
}

export default function ShareDealDialog({ dealId, dealName, open, onOpenChange, canManage }: Props) {
  const { data: members, isLoading } = useDealMembers(open ? dealId : null);
  const invite = useInviteMember(dealId);
  const remove = useRemoveMember();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("viewer");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const parsed = shareSchema.safeParse({ email, role });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    invite.mutate({ email: parsed.data.email as string, role: parsed.data.role as "viewer" | "editor" }, { onSuccess: () => setEmail("") });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share {dealName ?? "deal"}</DialogTitle>
          <DialogDescription>
            Invited colleagues see only this deal. Editors can change pricing and scenarios; viewers are read-only.
          </DialogDescription>
        </DialogHeader>

        {canManage && (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-[1fr_140px]">
              <div className="space-y-1.5">
                <Label htmlFor="share-email">Work email</Label>
                <Input
                  id="share-email"
                  type="email"
                  placeholder="colleague@company.com"
                  maxLength={255}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Access</Label>
                <Select value={role} onValueChange={(v) => setRole(v as "viewer" | "editor")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            <Button size="sm" onClick={submit} disabled={invite.isPending || !dealId}>
              <UserPlus className="mr-1.5 h-4 w-4" /> Invite
            </Button>
          </div>
        )}

        <div className="space-y-2 border-t pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">People with access</p>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (members ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Only you and platform admins can see this deal.</p>
          ) : (
            <ul className="space-y-1.5">
              {(members ?? []).map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                  <span className="min-w-0 truncate">{m.invited_email}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] font-normal capitalize">{m.role}</Badge>
                    {canManage && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        aria-label={`Remove ${m.invited_email}`}
                        onClick={() => remove.mutate(m.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
