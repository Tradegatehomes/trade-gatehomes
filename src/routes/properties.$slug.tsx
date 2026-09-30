import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import {
  Bath,
  BedDouble,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Star,
  Users,
} from "lucide-react";
import { useState } from "react";
import { CalendarCheck } from "lucide-react";
import { BookingWidget } from "@/components/booking-widget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatNaira } from "@/lib/format";
import { getProperty } from "@/lib/properties.functions";

const propertyQuery = (slug: string) =>
  queryOptions({
    queryKey: ["property", slug],
    queryFn: () => getProperty({ data: { slug } }),
  });

export const Route = createFileRoute("/properties/$slug")({
  head: ({ loaderData }) => {
    const loaded = loaderData as Awaited<ReturnType<typeof getProperty>> | undefined;
    const p = loaded ?? null;
    if (!p) {
      return {
        meta: [
          { title: "Listing unavailable — TradeGate Continental Homes" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    return {
      meta: [
        {
          title: `${p.name} — ${p.city} shortlet | TradeGate Continental Homes`,
        },
        {
          name: "description",
          content:
            p.description?.replace("[PROPERTY DESCRIPTION] ", "").slice(0, 155) ??
            `Book ${p.name} in ${p.city}, Nigeria. Live availability and clear Naira pricing.`,
        },
        { property: "og:title", content: `${p.name} — ${p.city} shortlet | TradeGate Continental Homes` },
        {
          property: "og:description",
          content:
            p.description?.replace("[PROPERTY DESCRIPTION] ", "").slice(0, 155) ??
            `Book ${p.name} in ${p.city}, Nigeria. Live availability and clear Naira pricing.`,
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(propertyQuery(params.slug)),
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="font-display text-2xl font-bold text-ink">This listing isn't available</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        It may have been taken down or the link is out of date.
      </p>
      <Link to="/properties" className="mt-6 inline-block rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground">
        Browse other stays
      </Link>
    </div>
  ),
  component: PropertyDetailPage,
});

function PropertyDetailPage() {
  const { data: property } = useSuspenseQuery(propertyQuery(Route.useParams().slug));
  const [bookingOpen, setBookingOpen] = useState(false);
  if (!property) throw notFound();
  const p = property;
  const description = p.description?.replace("[PROPERTY DESCRIPTION] ", "").replace(
    " Replace this placeholder copy with the real listing description.",
    "",
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 lg:pb-8">
      {/* Title block */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary" className="rounded-full">{p.property_type}</Badge>
            {p.average_rating ? (
              <span className="flex items-center gap-1 font-semibold text-ink">
                <Star className="size-4 fill-sun text-sun" /> {p.average_rating}
                <span className="font-normal text-muted-foreground">
                  ({p.reviews.length} review{p.reviews.length === 1 ? "" : "s"})
                </span>
              </span>
            ) : null}
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {p.name}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4" /> {p.city}
            {p.state ? `, ${p.state}` : ""}, Nigeria
          </p>
        </div>
      </div>

      {/* Gallery: swipeable on mobile, editorial grid on larger screens */}
      {p.images.length > 0 && <PropertyGallery images={p.images} name={p.name} />}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_400px]">
        {/* Left: details */}
        <div className="space-y-10">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Users, label: `${p.max_guests} guests` },
              { icon: BedDouble, label: `${p.bedrooms} bedroom${p.bedrooms === 1 ? "" : "s"}` },
              { icon: Bath, label: `${p.bathrooms} bathroom${p.bathrooms === 1 ? "" : "s"}` },
              { icon: Clock, label: `${p.min_nights}-night minimum` },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-card p-4 shadow-card">
                <s.icon className="size-5 text-brand" />
                <p className="mt-2 text-sm font-semibold text-ink">{s.label}</p>
              </div>
            ))}
          </div>

          {description && (
            <section>
              <h2 className="font-display text-xl font-bold text-ink">About this place</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">
                {description}
              </p>
            </section>
          )}

          {p.amenities.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-bold text-ink">What this place offers</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {p.amenities.map((a) => (
                  <div key={a.name} className="flex items-center gap-2 rounded-2xl bg-card px-4 py-3 shadow-card">
                    <CheckCircle2 className="size-4 shrink-0 text-teal" />
                    <span className="text-sm font-medium text-ink">{a.name}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-card p-6 shadow-card">
              <h3 className="font-display text-lg font-bold text-ink">House rules</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {p.house_rules ?? "[House rules placeholder]"}
              </p>
            </div>
            <div className="rounded-3xl bg-card p-6 shadow-card">
              <h3 className="font-display text-lg font-bold text-ink">Check-in & out</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Check-in from {p.check_in_time} · Check-out by {p.check_out_time}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{p.cancellation_policy}</p>
            </div>
          </section>

          {p.reviews.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-bold text-ink">
                Reviews {p.average_rating ? <span className="text-muted-foreground">({p.average_rating} average)</span> : null}
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {p.reviews.map((r) => (
                  <div key={r.guest_name} className="rounded-3xl bg-card p-5 shadow-card">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={
                            i < Math.round(r.rating)
                              ? "size-4 fill-sun text-sun"
                              : "size-4 text-muted-foreground/40"
                          }
                        />
                      ))}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-ink/90">“{r.comment}”</p>
                    <p className="mt-3 text-xs font-semibold text-muted-foreground">{r.guest_name}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-3xl bg-cream p-6">
            <h2 className="font-display text-lg font-bold text-ink">Questions about this stay?</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {p.whatsapp && (
                <a
                  href={`https://wa.me/${p.whatsapp.replace("+", "")}?text=${encodeURIComponent(`Hi! I'm interested in ${p.name}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal/90"
                >
                  <MessageCircle className="size-4" /> WhatsApp
                </a>
              )}
              {p.phone && (
                <a
                  href={`tel:${p.phone}`}
                  className="inline-flex items-center gap-2 rounded-full border border-input bg-card px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-accent"
                >
                  <Phone className="size-4" /> Call
                </a>
              )}
              {p.email && (
                <a
                  href={`mailto:${p.email}`}
                  className="inline-flex items-center gap-2 rounded-full border border-input bg-card px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-accent"
                >
                  <Mail className="size-4" /> Email
                </a>
              )}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              We usually respond within a few minutes — reach out any time.
            </p>
          </section>
        </div>

        {/* Right: booking */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
            <p className="font-display text-2xl font-bold text-ink">
              {formatNaira(p.base_price)}
              <span className="text-sm font-medium text-muted-foreground"> / night</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Tap <strong className="text-ink">Book now</strong> to pick your dates, see the total and confirm your stay.
            </p>
            <Button size="lg" className="mt-4 w-full rounded-full text-base" onClick={() => setBookingOpen(true)}>
              <CalendarCheck className="size-5" /> Book now
            </Button>
            <ContactButtons p={p} />
          </div>
        </div>
      </div>

      {/* Mobile sticky bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        <p className="font-display text-lg font-bold text-ink">
          {formatNaira(p.base_price)}
          <span className="text-xs font-medium text-muted-foreground"> / night</span>
        </p>
        <Button className="rounded-full px-6" onClick={() => setBookingOpen(true)}>
          <CalendarCheck className="size-4" /> Book now
        </Button>
      </div>

      <Sheet open={bookingOpen} onOpenChange={setBookingOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Book {p.name}</SheetTitle>
            <SheetDescription>Choose your dates and guests, then confirm your booking.</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <BookingWidget property={p} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}


function PropertyGallery({ images, name }: { images: { url: string; alt_text: string | null }[]; name: string }) {
  const [active, setActive] = useState(0);
  return (
    <div className="mt-6">
      <div className="relative -mx-4 sm:hidden">
        <div
          className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={(e) => {
            const el = e.currentTarget;
            const itemWidth = el.firstElementChild?.getBoundingClientRect().width ?? el.clientWidth;
            const gap = 8;
            setActive(Math.max(0, Math.min(images.length - 1, Math.round(el.scrollLeft / (itemWidth + gap)))));
          }}
          aria-label="Property photos"
        >
          {images.map((img, index) => (
            <figure key={img.url} className="w-[88vw] shrink-0 snap-center first:snap-start">
              <img
                src={img.url}
                alt={img.alt_text ?? `${name} photo ${index + 1}`}
                className="aspect-[4/3] w-full rounded-[1.75rem] object-cover shadow-card"
                loading={index === 0 ? "eager" : "lazy"}
              />
            </figure>
          ))}
        </div>
        <div className="pointer-events-none absolute bottom-5 right-7 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold text-white">
          {active + 1} / {images.length}
        </div>
        {images.length > 1 && (
          <div className="mt-1 flex justify-center gap-1.5" aria-hidden="true">
            {images.map((_, index) => (
              <span key={index} className={`h-1.5 rounded-full transition-all ${index === active ? "w-5 bg-brand" : "w-1.5 bg-border"}`} />
            ))}
          </div>
        )}
      </div>

      <div className="hidden gap-3 sm:grid sm:grid-cols-4 sm:grid-rows-2">
        {images.slice(0, 1).map((img) => (
          <img
            key={img.url}
            src={img.url}
            alt={img.alt_text ?? name}
            className="aspect-[4/3] w-full rounded-3xl object-cover shadow-card sm:col-span-2 sm:row-span-2"
          />
        ))}
        {images.slice(1, 5).map((img) => (
          <img
            key={img.url}
            src={img.url}
            alt={img.alt_text ?? name}
            className="aspect-[4/3] w-full rounded-3xl object-cover shadow-card"
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
}

function ContactButtons({ p }: { p: { name: string; whatsapp?: string | null; phone?: string | null; email?: string | null } }) {
  if (!p.whatsapp && !p.phone && !p.email) return null;
  return (
    <div className="mt-5 border-t border-border pt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact the host</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {p.whatsapp && (
          <a
            href={`https://wa.me/${p.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi! I'm interested in ${p.name}.`)}`}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center gap-1 rounded-2xl border border-input py-3 text-xs font-semibold text-ink hover:bg-accent"
          >
            <MessageCircle className="size-5 text-brand" /> WhatsApp
          </a>
        )}
        {p.phone && (
          <a href={`tel:${p.phone}`} className="flex flex-col items-center gap-1 rounded-2xl border border-input py-3 text-xs font-semibold text-ink hover:bg-accent">
            <Phone className="size-5 text-brand" /> Call
          </a>
        )}
        {p.email && (
          <a href={`mailto:${p.email}`} className="flex flex-col items-center gap-1 rounded-2xl border border-input py-3 text-xs font-semibold text-ink hover:bg-accent">
            <Mail className="size-5 text-brand" /> Email
          </a>
        )}
      </div>
    </div>
  );
}
