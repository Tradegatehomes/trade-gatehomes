import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatNaira } from "@/lib/format";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My trips — KeyNest" },
      { name: "description", content: "View your upcoming and past KeyNest bookings." },
      { property: "og:title", content: "My trips — KeyNest" },
      { property: "og:description", content: "View your upcoming and past KeyNest bookings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/account" } });
  }, [loading, user, navigate]);

  const trips = useQuery({
    queryKey: ["my-trips", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("reference,check_in,check_out,guests,total_amount,status,properties(name,city,slug)")
        .order("check_in", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (loading || !user) return <div className="mx-auto max-w-4xl px-4 py-16 text-muted-foreground">Loading…</div>;

  const today = new Date().toISOString().slice(0, 10);
  const list = trips.data ?? [];
  const upcoming = list.filter((b) => b.check_out >= today);
  const past = list.filter((b) => b.check_out < today);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-ink">My trips</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        </div>
        <Button variant="outline" className="rounded-full" onClick={() => supabase.auth.signOut()}>
          Sign out
        </Button>
      </div>

      {trips.isLoading ? (
        <p className="mt-10 text-muted-foreground">Loading your trips…</p>
      ) : list.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-border p-10 text-center">
          <p className="font-display text-xl font-bold text-ink">No trips yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Bookings you make while signed in show up here.</p>
          <Button asChild className="mt-5 rounded-full">
            <Link to="/properties">Find a stay</Link>
          </Button>
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
