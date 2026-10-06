import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Sign in — TradeGate Continental Homes" },
      { name: "description", content: "Sign in or create a TradeGate Continental Homes account to manage your stays." },
      { property: "og:title", content: "Sign in — TradeGate Continental Homes" },
      { property: "og:description", content: "Sign in or create a TradeGate Continental Homes account to manage your stays." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [magicBusy, setMagicBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const target = redirect && redirect.startsWith("/") ? redirect : "/account";

  useEffect(() => {
    if (user) navigate({ to: target });
  }, [user, target, navigate]);

  async function sendMagicLink() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error("Enter your email address first.");
      return;
    }
    setMagicBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: window.location.origin + "/admin",
        },
      });
      if (error) throw error;
      toast.success("Check your email for a secure sign-in link.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send sign-in link");
    } finally {
      setMagicBusy(false);
    }
  }

  async function sendPasswordReset() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error("Enter your email address first.");
      return;
    }

    setResetBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: window.location.origin + "/reset-password",
      });
      if (error) throw error;
      toast.success("Password reset link sent. Check your email.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send password reset email");
    } finally {
      setResetBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/auth", data: { full_name: name } },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }


  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
        <h1 className="font-display text-3xl font-bold text-ink">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signin" ? "Sign in to see your trips." : "Book faster and keep all your stays in one place."}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="password">Password</Label>
              {mode === "signin" && (
                <button
                  type="button"
                  className="text-xs font-semibold text-brand hover:underline"
                  disabled={resetBusy}
                  onClick={sendPasswordReset}
                >
                  {resetBusy ? "Sending…" : "Forgot password?"}
                </button>
              )}
            </div>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full rounded-full" disabled={busy}>
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
          {mode === "signin" && (
            <>
              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-full"
                disabled={magicBusy || !email.trim()}
                onClick={sendMagicLink}
              >
                {magicBusy ? "Sending…" : "Email me a sign-in link"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Invited admins can use the secure email link without needing a password first.
              </p>
            </>
          )}
        </form>
        <button
          type="button"
          className="mt-5 w-full text-center text-sm font-semibold text-brand hover:underline"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
