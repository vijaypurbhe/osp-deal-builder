import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type State = "checking" | "ready" | "needs_code";

export const RESET_EMAIL_KEY = "osp.resetEmail";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [state, setState] = useState<State>("checking");
  const [email, setEmail] = useState(() => localStorage.getItem(RESET_EMAIL_KEY) ?? "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Reset password · OSP Deal Builder";
  }, []);

  useEffect(() => {
    let settled = false;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        settled = true;
        setState("ready");
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        settled = true;
        setState("ready");
        return;
      }
      // Give the recovery link exchange a moment, then fall back to code entry.
      setTimeout(() => {
        if (!settled) setState((s) => (s === "checking" ? "needs_code" : s));
      }, 2000);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: otpError } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: "recovery" });
    setBusy(false);
    if (otpError) return setError(otpError.message);
    setState("ready");
  };

  const resend = async () => {
    if (!email) return setError("Enter your work email first.");
    setBusy(true);
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    toast.success("A new reset email is on its way.");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("The two passwords do not match.");
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) return setError(updateError.message);
    localStorage.removeItem(RESET_EMAIL_KEY);
    toast.success("Password updated — you're signed in.");
    navigate("/", { replace: true });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-md bg-primary font-display font-bold text-primary-foreground">OSP</div>
          <CardTitle className="font-display text-xl">
            {state === "needs_code" ? "Confirm your reset code" : "Set a new password"}
          </CardTitle>
          <CardDescription>
            {state === "needs_code"
              ? "Paste the 6-digit code from the reset email, or open the link from the same browser."
              : "Choose a new password for your OSP Deal Builder account."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state === "checking" && <p className="text-center text-sm text-muted-foreground">Checking your reset link…</p>}

          {state === "needs_code" && (
            <form className="space-y-3" onSubmit={verifyCode}>
              <div className="space-y-1.5">
                <Label htmlFor="reset-email">Work email</Label>
                <Input id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reset-code">Reset code</Label>
                <Input id="reset-code" inputMode="numeric" autoComplete="one-time-code" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} required />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy}>Continue</Button>
              <Button type="button" variant="outline" className="w-full" onClick={resend} disabled={busy}>Send me a new reset email</Button>
              <Button asChild variant="ghost" className="w-full">
                <Link to="/login">Back to sign in</Link>
              </Button>
            </form>
          )}

          {state === "ready" && (
            <form className="space-y-3" onSubmit={submit}>
              <div className="space-y-1.5">
                <Label htmlFor="new-password">New password</Label>
                <Input id="new-password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input id="confirm-password" type="password" autoComplete="new-password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy}>Update password</Button>
              <Button asChild variant="ghost" className="w-full">
                <Link to="/login">Back to sign in</Link>
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
