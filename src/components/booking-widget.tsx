import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Loader2, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { MonthCalendar } from "@/components/month-calendar";
import { formatNaira, formatDate, toISODate } from "@/lib/format";
import { createBooking, quoteBooking, type PropertyDetailDto } from "@/lib/properties.functions";

export function BookingWidget({ property }: { property: PropertyDetailDto }) {
  const navigate = useNavigate();
  const today = toISODate(new Date());
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [guests, setGuests] = useState(Math.min(property.included_guests, property.max_guests));
  const [discountCode, setDiscountCode] = useState("");
  const [payDeposit, setPayDeposit] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const ready = Boolean(checkIn && checkOut && checkOut > checkIn);

  const quoteQuery = useQuery({
    queryKey: ["quote", property.slug, checkIn, checkOut, guests, discountCode.trim().toUpperCase(), payDeposit],
    queryFn: () =>
      quoteBooking({
        data: {
          slug: property.slug,
          checkIn: checkIn!,
          checkOut: checkOut!,
          guests,
          discountCode: discountCode.trim() ? discountCode.trim().toUpperCase() : undefined,
          payDeposit,
        },
      }),
    enabled: ready,
    retry: false,
    staleTime: 60_000,
  });

  const quote = quoteQuery.data?.quote ?? undefined;
  const quoteError: Error | null = quoteQuery.data?.error
    ? new Error(quoteQuery.data.error)
    : (quoteQuery.error as Error | null);

  useEffect(() => {
    if (checkOut && checkIn && checkOut <= checkIn) setCheckOut(null);
  }, [checkIn, checkOut]);

  async function book() {
    if (!ready || !quote) return;
    setSubmitting(true);
    try {
      const result = await createBooking({
        data: {
          slug: property.slug,
          checkIn: checkIn!,
          checkOut: checkOut!,
          guests,
          discountCode: discountCode.trim() ? discountCode.trim().toUpperCase() : undefined,
          payDeposit,
          guestName,
          guestEmail,
          guestPhone,
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      navigate({ to: "/booking/$reference", params: { reference: result.reference } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not complete the booking.");
    } finally {
      setSubmitting(false);
    }
  }

  const whatsapp = property.whatsapp
    ? `https://wa.me/${property.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
        `Hello, I'd like to ask about ${property.name}.`,
      )}`
    : null;

  return (
    <div className="grid gap-5">
      <MonthCalendar
        blockedDates={property.blocked_dates}
        checkIn={checkIn}
        checkOut={checkOut}
        onChange={(r) => {
          setCheckIn(r.checkIn);
          setCheckOut(r.checkOut);
        }}
      />

      <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-baseline justify-between">
          <p className="font-display text-2xl font-bold text-ink">
            {formatNaira(property.base_price)}
            <span className="text-sm font-medium text-muted-foreground"> / night</span>
          </p>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <CalendarDays className="size-4" /> {property.check_in_time} – {property.check_out_time}
          </span>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Check-in
            </Label>
            <Input
              type="date"
              min={today}
              value={checkIn ?? ""}
              onChange={(e) => setCheckIn(e.target.value || null)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Check-out
            </Label>
            <Input
              type="date"
              min={checkIn ?? today}
              value={checkOut ?? ""}
              onChange={(e) => setCheckOut(e.target.value || null)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Guests (sleeps {property.max_guests})
            </Label>
            <Input
              type="number"
              min={1}
              max={property.max_guests}
              value={guests}
              onChange={(e) => setGuests(Math.max(1, Math.min(property.max_guests, Number(e.target.value))))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Discount code
            </Label>
            <Input
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
              placeholder="e.g. WELCOME10"
            />
          </div>
        </div>

        {ready ? (
          <div className="mt-4">
            {quoteError ? (
              <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
                {quoteError.message}
              </p>
            ) : quoteQuery.isFetching && !quote ? (
              <p className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Calculating your price…
              </p>
            ) : quote ? (
              <div className="grid gap-1.5 text-sm">
                <Row label={`${formatNaira(quote.nightly_average)} × ${quote.nights} ${quote.nights === 1 ? "night" : "nights"}`} value={formatNaira(quote.nightly_subtotal)} />
                {quote.extra_guest_fee > 0 ? (
                  <Row label={`Extra guests (${quote.extra_guests})`} value={formatNaira(quote.extra_guest_fee)} />
                ) : null}
                <Row label="Cleaning fee" value={formatNaira(quote.cleaning_fee)} />
                {quote.service_fee > 0 ? <Row label="Service fee" value={formatNaira(quote.service_fee)} /> : null}
                {quote.discount_amount > 0 ? (
                  <Row label={`Discount ${quote.discount_code ?? ""}`} value={`- ${formatNaira(quote.discount_amount)}`} highlight />
                ) : null}
                <Separator className="my-2" />
                <Row label="Total" value={formatNaira(quote.total_amount)} bold />

                {quote.pay_deposit_available ? (
                  <RadioGroup
                    value={payDeposit ? "deposit" : "full"}
                    onValueChange={(v) => setPayDeposit(v === "deposit")}
                    className="mt-3 grid gap-2 rounded-2xl bg-secondary p-3"
                  >
                    <label className="flex items-center gap-3 text-sm">
                      <RadioGroupItem value="full" id="pay-full" />
                      <span>
                        Pay in full now — <strong>{formatNaira(quote.total_amount)}</strong>
                      </span>
                    </label>
                    <label className="flex items-center gap-3 text-sm">
                      <RadioGroupItem value="deposit" id="pay-deposit" />
                      <span>
                        Pay deposit now — <strong>{formatNaira(quote.deposit_amount_now)}</strong>,
                        balance {formatNaira(quote.deposit_balance_amount)} due{" "}
                        {quote.deposit_balance_due_date
                          ? formatDate(quote.deposit_balance_due_date)
                          : "before check-in"}
                      </span>
                    </label>
                  </RadioGroup>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 rounded-2xl bg-secondary px-4 py-3 text-sm text-muted-foreground">
            Select your dates to see the exact price.
          </p>
        )}

        {ready && quote ? (
          <div className="mt-4 grid gap-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="grid gap-1">
                <Label className="text-xs font-bold text-muted-foreground">Full name</Label>
                <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Ada Obi" />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs font-bold text-muted-foreground">Email</Label>
                <Input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="ada@email.com" />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs font-bold text-muted-foreground">Phone</Label>
                <Input type="tel" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="+234…" />
              </div>
            </div>

            <Button
              size="lg"
              className="h-12 rounded-2xl font-display text-base"
              disabled={submitting || !guestName || !guestEmail || !guestPhone}
              onClick={book}
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {submitting ? "Reserving…" : "Reserve your dates"}
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" /> You won't be charged yet — payment links are sent after confirmation.
            </p>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {whatsapp ? (
            <Button asChild variant="outline" className="rounded-full">
              <a href={whatsapp} target="_blank" rel="noreferrer">
                <MessageCircle className="size-4" /> WhatsApp
              </a>
            </Button>
          ) : null}
          {property.phone ? (
            <Button asChild variant="outline" className="rounded-full">
              <a href={`tel:${property.phone}`}>
                <Phone className="size-4" /> Call
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  highlight,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between ${bold ? "font-display text-base font-bold" : ""}`}>
      <span className={highlight ? "font-semibold text-teal" : "text-muted-foreground"}>{label}</span>
      <span className={highlight ? "font-semibold text-teal" : "font-semibold text-ink"}>{value}</span>
    </div>
  );
}
