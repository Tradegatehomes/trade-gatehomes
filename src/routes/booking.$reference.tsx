import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { getBookingByReference } from "@/lib/properties.functions";
import { formatNaira, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

const bookingQuery = (reference: string) =>
  queryOptions({
    queryKey: ["booking", reference],
    queryFn: () => getBookingByReference({ data: { reference } }),
  });

export const Route = createFileRoute("/booking/$reference")({
  head: ({ loaderData }) => {
    const b = loaderData as Awaited<ReturnType<typeof getBookingByReference>> | undefined;
    if (!b) {
      return { meta: [{ title: "Booking not found — KeyNest" }, { name: "robots", content: "noindex" }] };
    }
    return {
      meta: [
        { title: `Booking ${b.reference} — KeyNest` },
        { name: "robots", content: "noindex" },
        { property: "og:title", content: `Booking ${b.reference} — KeyNest` },
        {
          property: "og:description",
          content: `Your stay at ${b.property.name}: ${formatDate(b.checkIn)} to ${formatDate(b.checkOut)}.`,
        },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(bookingQuery(params.reference)),
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="font-display text-2xl font-bold text-ink">Booking not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Check the reference in your confirmation email, or contact support.
      </p>
      <Link to="/properties" className="mt-6 inline-block rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground">
        Browse stays
      </Link>
    </div>
  ),
  component: BookingConfirmationPage,
});

function BookingConfirmationPage() {
  const { data: booking } = useSuspenseQuery(bookingQuery(Route.useParams().reference));
  if (!booking) throw notFound();
  const b = booking;
  const waNumber = b.property.whatsapp?.replace("+", "");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-[2.5rem] bg-cream p-8 text-center shadow-card sm:p-10">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-teal/15">
          <CheckCircle2 className="size-8 text-teal" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-ink">
          Your stay is booked!
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Save this reference — you'll use it for check-in and any changes.
        </p>
        <p className="mt-4 inline-block rounded-2xl bg-card px-6 py-3 font-display text-2xl font-bold tracking-wider text-ink shadow-card">
          {b.reference}
        </p>
      </div>

      <div className="mt-8 rounded-3xl bg-card p-6 shadow-card sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">{b.property.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {b.property.city}
              {b.property.state ? `, ${b.property.state}` : ""}
            </p>
          </div>
          <Badge variant="secondary" className="rounded-full capitalize">{b.status.replace(/_/g, " ")}</Badge>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            { icon: CalendarDays, label: "Check-in", value: `${formatDate(b.checkIn)} · from ${b.property.checkInTime}` },
            { icon: Clock, label: "Check-out", value: `${formatDate(b.checkOut)} · by ${b.property.checkOutTime}` },
            { icon: null, label: "Guests", value: `${b.guests} guest${b.guests === 1 ? "" : "s"} · ${b.nights} night${b.nights === 1 ? "" : "s"}` },
            { icon: Mail, label: "Booked for", value: b.guestEmail },
          ].map((row) => (
            <div key={row.label} className="flex items-start gap-3 rounded-2xl bg-background p-4">
              {row.icon && <row.icon className="mt-0.5 size-4 shrink-0 text-brand" />}
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{row.label}</p>
                <p className="mt-0.5 text-sm font-semibold text-ink">{row.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-cream p-5">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total for the stay</span>
              <span className="font-semibold text-ink">{formatNaira(b.totalAmount)}</span>
            </div>
            {b.payDeposit ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due now (deposit)</span>
                  <span className="font-bold text-teal">{formatNaira(b.amountDueNow)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Balance due by {formatDate(b.balanceDueDate)}</span>
                  <span className="font-semibold text-ink">{formatNaira(b.balanceAmount)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due now</span>
                <span className="font-bold text-teal">{formatNaira(b.amountDueNow)}</span>
              </div>
            )}
            {b.securityDeposit > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  Refundable security deposit (held, not spent)
                </span>
                <span className="text-muted-foreground">{formatNaira(b.securityDeposit)}</span>
              </div>
            )}
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-card p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-teal" />
            Payment links are sent after confirmation — you won't be charged on this page. This app
            is a demo; no real payments are processed yet.
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-card p-6 shadow-card">
          <h3 className="font-display text-lg font-bold text-ink">Next steps</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Watch your email for the payment link for {formatNaira(b.amountDueNow)}.</li>
            <li>Once paid, your host confirms your booking.</li>
            <li>
              {b.payDeposit
                ? `Pay the remaining ${formatNaira(b.balanceAmount)} by ${formatDate(b.balanceDueDate)}.`
                : "Nothing else to pay before arrival."}
            </li>
            <li>Show your reference {b.reference} at check-in.</li>
          </ol>
        </div>
        <div className="rounded-3xl bg-card p-6 shadow-card">
          <h3 className="font-display text-lg font-bold text-ink">Need to talk to someone?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Reference {b.reference} quoted, always.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {waNumber && (
              <a
                href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi! About my booking ${b.reference}...`)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal/90"
              >
                <MessageCircle className="size-4" /> WhatsApp
              </a>
            )}
            {b.property.phone && (
              <a
                href={`tel:${b.property.phone}`}
                className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-accent"
              >
                <Phone className="size-4" /> Call
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link to="/properties" className="text-sm font-semibold text-brand hover:underline">
          Browse more stays →
        </Link>
      </div>
    </div>
  );
}
