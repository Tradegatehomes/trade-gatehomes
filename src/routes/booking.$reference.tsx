import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  CreditCard,
  Loader2,
} from "lucide-react";
import { getBookingByReference } from "@/lib/properties.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { formatNaira, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

const bookingQuery = (reference: string) =>
  queryOptions({
    queryKey: ["booking", reference],
    queryFn: () => getBookingByReference({ data: { reference } }),
  });

export const Route = createFileRoute("/booking/$reference")({
  validateSearch: (search: Record<string, unknown>) => ({
    reference: typeof search.reference === "string" ? search.reference : undefined,
  }),
  head: ({ loaderData }) => {
    const b = loaderData as Awaited<ReturnType<typeof getBookingByReference>> | undefined;
    if (!b) {
      return { meta: [{ title: "Booking not found — TradeGate Continental Homes" }, { name: "robots", content: "noindex" }] };
    }
    return {
      meta: [
        { title: `Booking ${b.reference} — TradeGate Continental Homes` },
        { name: "robots", content: "noindex" },
        { property: "og:title", content: `Booking ${b.reference} — TradeGate Continental Homes` },
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
  const params = Route.useParams();
  const search = Route.useSearch();
  const queryClient = useQueryClient();
  const { data: booking } = useSuspenseQuery(bookingQuery(params.reference));
  const [paying, setPaying] = useState(false);
  const [verifying, setVerifying] = useState(Boolean(search.reference));

  useEffect(() => {
    if (!search.reference) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("paystack-payments", {
          body: { action: "verify", reference: search.reference },
        });
        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || "Payment verification failed.");
        if (!cancelled) {
          toast.success(data.fullyPaid ? "Payment confirmed. Your booking is fully paid." : "Payment confirmed.");
          await queryClient.invalidateQueries({ queryKey: ["booking", params.reference] });
          window.history.replaceState({}, "", `/booking/${encodeURIComponent(params.reference)}`);
        }
      } catch (error) {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Could not verify payment.");
      } finally {
        if (!cancelled) setVerifying(false);
      }
    })();
    return () => { cancelled = true; };
  }, [search.reference, params.reference, queryClient]);

  async function payNow() {
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke("paystack-payments", {
        body: { action: "initialize", bookingReference: params.reference },
      });
      if (error) throw error;
      if (data?.paid) {
        toast.success(data.message || "This booking is already fully paid.");
        await queryClient.invalidateQueries({ queryKey: ["booking", params.reference] });
        return;
      }
      if (!data?.authorizationUrl) throw new Error(data?.error || "Could not start payment.");
      window.location.assign(data.authorizationUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start payment.");
    } finally {
      setPaying(false);
    }
  }
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
          Reservation received
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Save this reference. We’ll use it to confirm the stay, payment details and any changes.
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
          <div className="mt-4 grid gap-3">
            {["fully_paid", "completed"].includes(b.status) ? (
              <div className="flex items-start gap-2 rounded-xl bg-card p-3 text-xs text-muted-foreground">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-teal" />
                Payment received. No payment is currently due for this booking.
              </div>
            ) : (
              <>
                <Button
                  size="lg"
                  className="w-full rounded-2xl"
                  onClick={payNow}
                  disabled={paying || verifying}
                >
                  {paying || verifying ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
                  {verifying ? "Verifying payment…" : paying ? "Opening secure checkout…" : b.status === "partially_paid" ? `Pay balance · ${formatNaira(b.balanceAmount)}` : `Pay securely · ${formatNaira(b.amountDueNow)}`}
                </Button>
                <div className="flex items-start gap-2 rounded-xl bg-card p-3 text-xs text-muted-foreground">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-teal" />
                  Secure checkout is powered by Paystack. The amount is verified on our server before the booking status changes.
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-card p-6 shadow-card">
          <h3 className="font-display text-lg font-bold text-ink">Next steps</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Use the secure payment button above to pay {b.status === "partially_paid" ? "the remaining balance" : formatNaira(b.amountDueNow)}.</li>
            <li>Successful payments are verified automatically and reflected on your booking.</li>
            <li>
              {b.payDeposit
                ? `Pay the remaining ${formatNaira(b.balanceAmount)} by ${formatDate(b.balanceDueDate)}.`
                : "Your booking will show as fully paid once the payment is verified."}
            </li>
            <li>Show your reference {b.reference} at check-in.</li>
          </ol>
        </div>
        <div className="rounded-3xl bg-card p-6 shadow-card">
          <h3 className="font-display text-lg font-bold text-ink">Need to talk to someone?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Quote reference {b.reference} when contacting support.
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
