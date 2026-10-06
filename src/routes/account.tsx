import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useStaff } from "@/hooks/use-staff";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDate, formatNaira } from "@/lib/format";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My profile — TradeGate Continental Homes" },
      { name: "description", content: "Manage your TradeGate Continental Homes account." },
      { property: "og:title", content: "My profile — TradeGate Continental Homes" },
      { property: "og:description", content: "Manage your TradeGate Continental Homes account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, loading } = useAuth();
  const { isStaff, loading: staffLoading } = useStaff();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/account" } });
  }, [loading, user, navigate]);

  if (loading || staffLoading || !user) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-muted-foreground">Loading…</div>;
  }

  return isStaff ? <AdminProfile userId={user.id} email={user.email ?? ""} /> : <GuestTrips userId={user.id} email={user.email ?? ""} />;
}

function AdminProfile({ userId, email }: { userId: string; email: string }) {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const profile = useQuery({
    queryKey: ["my-admin-profile", userId],
    queryFn: async () => {
      const [profileResult, roleResult] = await Promise.all([
        supabase.from("profiles").select("full_name,email").eq("id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
      ]);
      if (profileResult.error) throw profileResult.error;
      if (roleResult.error) throw roleResult.error;
      return {
        fullName: profileResult.data?.full_name ?? "",
        email: profileResult.data?.email ?? email,
        role: roleResult.data?.role ?? "staff",
      };
    },
  });

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (currentPassword && currentPassword === newPassword) {
      toast.error("Choose a new password that is different from your current password.");
      return;
    }

    setSaving(true);
    try {
      const payload = currentPassword ? { password: newPassword, currentPassword } : { password: newPassword };
      const { error } = await supabase.auth.updateUser(payload as any);
      if (error) throw error;
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not change password");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  const roleLabel = (profile.data?.role ?? "staff").replace("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Admin account</p>
          <h1 className="mt-1 font-display text-4xl font-bold text-ink">My Profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">View your account details, change your password, or sign out.</p>
        </div>
        <Button variant="outline" className="rounded-full" onClick={signOut}>Sign out</Button>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Profile</p>
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</p>
              <p className="mt-1 font-semibold text-ink">{profile.isLoading ? "Loading…" : profile.data?.fullName || "Not provided"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</p>
              <p className="mt-1 break-all font-semibold text-ink">{profile.data?.email || email}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Role</p>
              <Badge className="mt-2 rounded-full" variant="secondary">{roleLabel}</Badge>
            </div>
          </div>
          <Button asChild variant="outline" className="mt-6 w-full rounded-full">
            <Link to="/admin">Back to admin dashboard</Link>
          </Button>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Security</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-ink">Change password</h2>
          <p className="mt-1 text-sm text-muted-foreground">Update the password for this admin account.</p>

          <form onSubmit={changePassword} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="current-password" className="text-sm font-medium text-ink">Current password</label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Enter current password"
              />
              <p className="text-xs text-muted-foreground">
                If you signed in with an email link and do not have a password yet, leave this blank.
              </p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="new-password" className="text-sm font-medium text-ink">New password</label>
              <Input
                id="new-password"
                type="password"
                minLength={6}
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="At least 6 characters"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="confirm-password" className="text-sm font-medium text-ink">Confirm new password</label>
              <Input
                id="confirm-password"
                type="password"
                minLength={6}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter new password"
              />
            </div>
            <Button type="submit" className="rounded-full" disabled={saving || !newPassword || !confirmPassword}>
              {saving ? "Changing…" : "Change password"}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}

function GuestTrips({ userId, email }: { userId: string; email: string }) {
  const trips = useQuery({
    queryKey: ["my-trips", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("reference,check_in,check_out,guests,total_amount,status,properties(name,city,slug)")
        .order("check_in", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const today = new Date().toISOString().slice(0, 10);
  const list = trips.data ?? [];
  const upcoming = list.filter((b) => b.check_out >= today);
  const past = list.filter((b) => b.check_out < today);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-ink">My trips</h1>
          <p className="mt-1 text-sm text-muted-foreground">{email}</p>
        </div>
        <Button variant="outline" className="rounded-full" onClick={() => supabase.auth.signOut()}>Sign out</Button>
      </div>

      {trips.isLoading ? (
        <p className="mt-10 text-muted-foreground">Loading your trips…</p>
      ) : list.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-border p-10 text-center">
          <p className="font-display text-xl font-bold text-ink">No trips yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Bookings you make while signed in show up here.</p>
          <Button asChild className="mt-5 rounded-full"><Link to="/properties">Find a stay</Link></Button>
        </div>
      ) : (
        <>
          <Section title="Upcoming" items={upcoming} />
          <Section title="Past" items={past} />
        </>
      )}
    </div>
  );
}

type Trip = {
  reference: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_amount: number;
  status: string;
  properties: { name: string; city: string; slug: string } | null;
};

function Section({ title, items }: { title: string; items: Trip[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
      <div className="mt-4 grid gap-3">
        {items.map((b) => (
          <Link
            key={b.reference}
            to="/booking/$reference"
            params={{ reference: b.reference }}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-secondary"
          >
            <div>
              <p className="font-semibold text-ink">{b.properties?.name ?? "Property"}</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(b.check_in)} → {formatDate(b.check_out)} · {b.guests} guest{b.guests > 1 ? "s" : ""}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Ref {b.reference}</p>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="capitalize">{b.status.replace("_", " ")}</Badge>
              <p className="mt-2 font-display font-bold text-ink">{formatNaira(Number(b.total_amount))}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
