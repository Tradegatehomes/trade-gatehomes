import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { CalendarCheck, MapPin, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { SearchBar } from "@/components/search-bar";
import { PropertyCard } from "@/components/property-card";
import { Button } from "@/components/ui/button";
import { listProperties } from "@/lib/properties.functions";
import heroImg from "@/assets/hero-living-room.jpg";

const featuredQuery = queryOptions({
  queryKey: ["properties", "home"],
  queryFn: () => listProperties({ data: { limit: 6 } }),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TradeGate Continental Homes — Shortlet apartments in Nigeria" },
      {
        name: "description",
        content:
          "Verified shortlet apartments in Lagos, Abuja and Port Harcourt. Live availability calendars, clear Naira pricing, and quick reservation requests.",
      },
      { property: "og:title", content: "TradeGate Continental Homes — Shortlet apartments in Nigeria" },
      {
        property: "og:description",
        content:
          "Verified shortlet apartments in Lagos, Abuja and Port Harcourt. Live availability calendars, clear Naira pricing, and quick reservation requests.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(featuredQuery),
  component: HomePage,
});

function HomePage() {
  const { data: properties } = useSuspenseQuery(featuredQuery);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-cream">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-ink/70 shadow-card">
              <Sparkles className="size-3.5 text-brand" /> Verified shortlets across Nigeria
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Your home away from home, booked in minutes.
            </h1>
            <p className="mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
              Real availability calendars, transparent Naira pricing, and a straightforward reservation process —
              no endless back-and-forth with hosts.
            </p>
            <div className="mt-8">
              <SearchBar variant="hero" />
            </div>
          </div>
          <div className="relative hidden lg:block">
            <img
              src={heroImg}
              alt="Warm, sunlit living room in a serviced apartment"
              className="aspect-[4/3] w-full rounded-[2.5rem] object-cover shadow-float"
            />
          </div>
        </div>
      </section>

      {/* Featured stays */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Featured stays
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Hand-picked apartments our guests keep coming back to.
            </p>
          </div>
          <Button asChild variant="ghost" className="hidden rounded-full text-brand sm:inline-flex">
            <Link to="/properties">View all →</Link>
          </Button>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
        <div className="mt-8 text-center sm:hidden">
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/properties">View all stays</Link>
          </Button>
        </div>
      </section>

      {/* Popular locations */}
      <section className="bg-cream py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Popular locations
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Start your search in the cities guests love most.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { city: "Lagos", blurb: "Lagoon views, nightlife and business hubs" },
              { city: "Abuja", blurb: "Quiet, secure stays in the capital" },
              { city: "Port Harcourt", blurb: "Family-sized apartments in GRA" },
            ].map((c) => (
              <Link
                key={c.city}
                to="/properties"
                search={{ city: c.city }}
                className="group rounded-3xl bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-float"
              >
                <span className="flex size-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                  <MapPin className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-ink">{c.city}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.blurb}</p>
                <span className="mt-3 inline-block text-sm font-semibold text-brand group-hover:underline">
                  Browse {c.city} stays →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why book with us */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Why book with us
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: CalendarCheck,
              title: "Live availability",
              body: "Every calendar shows real blocked dates, so what you see is what you can book.",
            },
            {
              icon: Wallet,
              title: "Clear pricing",
              body: "See the nightly rate, fees and stay total before you send your reservation request.",
            },
            {
              icon: ShieldCheck,
              title: "Verified listings",
              body: "Each apartment is inspected before it goes live, with clear house rules and policies.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-3xl bg-card p-6 shadow-card">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-teal/10 text-teal">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-bold text-ink">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-[2.5rem] bg-ink px-6 py-12 text-center text-white sm:px-12">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Ready when you are.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-white/70">
            Pick your dates, review the total, and send your reservation request in a few simple steps.
          </p>
          <Button asChild size="lg" className="mt-6 rounded-full bg-brand text-brand-foreground hover:bg-brand/90">
            <Link to="/properties">Find your stay</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
