import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import ospLogo from "@/assets/osp-logo.png.asset.json";

type State = "checking" | "ready" | "needs_code";

export const RESET_EMAIL_KEY = "osp.resetEmail";

/** Pull a recovery token out of anything the user pastes: a full verify URL,
 *  an app URL with #access_token / ?token_hash / ?code, or a bare token. */
function extractToken(raw: string): { tokenHash?: string; code?: string; accessToken?: string; refreshToken?: string; otp?: string } {
  const value = raw.trim();
  if (!value) return {};
  const readParams = (search: string, hash: string) => {
    const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    const h = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
    const get = (k: string) => q.get(k) ?? h.get(k) ?? undefined;
    return {
      tokenHash: get("token_hash") ?? get("token") ?? undefined,
      code: get("code"),
      accessToken: get("access_token"),
      refreshToken: get("refresh_token"),
    };
  };
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      return readParams(url.search, url.hash);
    } catch {
      /* fall through */
    }
  }
  if (value.includes("=") && (value.includes("&") || value.includes("?") || value.includes("#"))) {
    return readParams(value, "");
  }
  if (/^\d{6,8}$/.test(value)) return { otp: value };
  return { tokenHash: value };
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [state, setState] = useState<State>("checking");
  const [email, setEmail] = useState(() => localStorage.getItem(RESET_EMAIL_KEY) ?? "");
  const [pasted, setPasted] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Reset password · OSP Deal Builder";
  }, []);

  useEffect(() => {
    let cancelled = false;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setState("ready");
    });

    (async () => {
      const { tokenHash, code, accessToken, refreshToken } = extractToken(
        window.location.href,
      );

      // 1. Existing / hash-delivered session
      if (accessToken && refreshToken) {
        const { error: e } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (!cancelled && !e) return setState("ready");
      }
      // 2. PKCE style link
      if (code) {
        const { error: e } = await supabase.auth.exchangeCodeForSession(code);
        if (!cancelled && !e) return setState("ready");
      }
      // 3. token_hash style link
      if (tokenHash) {
        const { error: e } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
        if (!cancelled && !e) return setState("ready");
      }
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) return setState("ready");
      setState((s) => (s === "checking" ? "needs_code" : s));
    })();

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const useLinkOrCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { tokenHash, code, accessToken, refreshToken, otp } = extractToken(pasted);
    setBusy(true);
    try {
      if (accessToken && refreshToken) {
        const { error: err } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (err) throw err;
      } else if (code) {
        const { error: err } = await supabase.auth.exchangeCodeForSession(code);
        if (err) throw err;
      } else if (otp) {
        if (!email) throw new Error("Enter your work email so we can match the code.");
        const { error: err } = await supabase.auth.verifyOtp({ email, token: otp, type: "recovery" });
        if (err) throw err;
      } else if (tokenHash) {
        const { error: err } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
        if (err) throw err;
      } else {
        throw new Error("Paste the full reset link from the email.");
      }
      setState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "That reset link could not be verified.");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!email) return setError("Enter your work email first.");
    setBusy(true);
    localStorage.setItem(RESET_EMAIL_KEY, email);
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
          <img src={ospLogo.url} alt="OSP Deal Workbench by Tech Mahindra" className="mx-auto h-12 w-auto" />
          <CardTitle className="font-display text-xl">
            {state === "needs_code" ? "Confirm your reset link" : "Set a new password"}
          </CardTitle>
          <CardDescription>
            {state === "needs_code"
              ? "Right-click “Reset password” in the email, copy the link address, and paste it below."
              : "Choose a new password for your OSP Deal Builder account."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state === "checking" && <p className="text-center text-sm text-muted-foreground">Checking your reset link…</p>}

          {state === "needs_code" && (
            <form className="space-y-3" onSubmit={useLinkOrCode}>
              <div className="space-y-1.5">
                <Label htmlFor="reset-email">Work email</Label>
                <Input id="reset-email" type="email" value={email} onChange={(ev) => setEmail(ev.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reset-link">Reset link (or code)</Label>
                <Input
                  id="reset-link"
                  placeholder="https://…/auth/v1/verify?token=…&type=recovery"
                  value={pasted}
                  onChange={(ev) => setPasted(ev.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Paste the whole link — we read the recovery token from it, so it doesn't matter where the link tries to send you.
                </p>
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
                <Input id="new-password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(ev) => setPassword(ev.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input id="confirm-password" type="password" autoComplete="new-password" minLength={8} value={confirm} onChange={(ev) => setConfirm(ev.target.value)} required />
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
