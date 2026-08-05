import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useDeal } from "@/context/DealContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function Login() {
  const { session, loading } = useDeal();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"auth" | "forgot">("auth");
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    document.title = "Sign in · OSP Deal Builder";
  }, []);

  if (!loading && session) return <Navigate to="/" replace />;

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    navigate("/", { replace: true });
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created. You can sign in now.");
  };

  const sendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    setResetSent(true);
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) return toast.error("Google sign-in failed");
    if (result.redirected) return;
    navigate("/", { replace: true });
  };

  if (mode === "forgot") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-md bg-primary font-display font-bold text-primary-foreground">S+N</div>
            <CardTitle className="font-display text-xl">Reset your password</CardTitle>
            <CardDescription>We'll email you a secure link to set a new password.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {resetSent ? (
              <div className="space-y-3 text-center">
                <p className="text-sm">Check your inbox — if an account exists for <span className="font-medium">{email}</span>, a reset link is on its way. The link expires in 1 hour.</p>
                <Button variant="outline" className="w-full" onClick={() => { setMode("auth"); setResetSent(false); }}>Back to sign in</Button>
              </div>
            ) : (
              <form className="space-y-3" onSubmit={sendReset}>
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email">Work email</Label>
                  <Input id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>Send reset link</Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setMode("auth")}>Back to sign in</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    );
  }


  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-md bg-primary font-display font-bold text-primary-foreground">S+N</div>
          <CardTitle className="font-display text-xl">OSP Deal Builder</CardTitle>
          <CardDescription>Smith+Nephew Salesforce estate — commercial modelling workspace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form className="space-y-3 pt-3" onSubmit={signIn}>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Work email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>Sign in</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form className="space-y-3 pt-3" onSubmit={signUp}>
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email2">Work email</Label>
                  <Input id="email2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password2">Password</Label>
                  <Input id="password2" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>Create account</Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative py-1 text-center text-xs text-muted-foreground">
            <span className="bg-card px-2">or</span>
            <div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-border" />
          </div>
          <Button variant="outline" className="w-full" onClick={google}>Continue with Google</Button>
        </CardContent>
      </Card>
    </main>
  );
}
