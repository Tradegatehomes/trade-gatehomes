import { useNavigate } from "@tanstack/react-router";
import { CalendarDays, ChevronDown, MapPin, Search, SlidersHorizontal, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toISODate } from "@/lib/format";

interface SearchBarProps {
  initial?: { city?: string; checkIn?: string; checkOut?: string; guests?: number };
  variant?: "hero" | "compact";
}

export function SearchBar({ initial, variant = "compact" }: SearchBarProps) {
  const navigate = useNavigate();
  const today = toISODate(new Date());
  const [city, setCity] = useState(initial?.city ?? "");
  const [checkIn, setCheckIn] = useState(initial?.checkIn ?? "");
  const [checkOut, setCheckOut] = useState(initial?.checkOut ?? "");
  const [guests, setGuests] = useState(initial?.guests ?? 2);
  const [error, setError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (checkIn && checkOut && checkOut <= checkIn) {
      setError("Check-out must be after check-in.");
      return;
    }
    navigate({
      to: "/properties",
      search: {
        city: city || undefined,
        checkIn: checkIn || undefined,
        checkOut: checkOut || undefined,
        guests: guests > 0 ? guests : undefined,
      },
    });
  }

  const fieldClass =
    variant === "hero"
      ? "h-12 rounded-2xl border-input bg-card text-sm"
      : "h-10 rounded-xl border-input bg-card text-sm";

  const mobileInput =
    "h-14 w-full min-w-0 rounded-2xl border border-border bg-card px-4 pt-5 text-sm text-ink shadow-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15";
  const mobileLabel =
    "pointer-events-none absolute left-11 top-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground";

  const mobileFields = (
    <form
      onSubmit={submit}
      className={`w-full max-w-full overflow-hidden rounded-[1.75rem] border border-border/80 bg-card p-3 shadow-card md:hidden ${variant === "hero" ? "space-y-2.5" : "space-y-2"}`}
    >
      <label className="relative block">
        <MapPin className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-brand" />
        <span className={mobileLabel}>Where</span>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City, area or state"
          className={`${mobileInput} pl-11`}
          autoComplete="address-level2"
        />
      </label>

      <div className={variant === "hero" ? "grid gap-2.5" : "grid grid-cols-2 gap-2"}>
        <label className="relative block min-w-0">
          <CalendarDays className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-brand" />
          <span className={mobileLabel}>Check-in</span>
          <input
            type="date"
            min={today}
            value={checkIn}
            onChange={(e) => {
              setCheckIn(e.target.value);
              if (checkOut && e.target.value && checkOut <= e.target.value) setCheckOut("");
            }}
            className={`${mobileInput} pl-11 pr-3 [color-scheme:light]`}
            aria-label="Check-in date"
          />
        </label>

        <label className="relative block min-w-0">
          <CalendarDays className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-brand" />
          <span className={mobileLabel}>Check-out</span>
          <input
            type="date"
            min={checkIn || today}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className={`${mobileInput} pl-11 pr-3 [color-scheme:light]`}
            aria-label="Check-out date"
          />
        </label>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <label className="relative block min-w-0">
          <Users className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-brand" />
          <span className={mobileLabel}>Guests</span>
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className={`${mobileInput} appearance-none pl-11 pr-9`}
            aria-label="Number of guests"
          >
            {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "guest" : "guests"}
              </option>
            ))}
          </select>
        </label>

        <Button
          type="submit"
          className="h-14 rounded-2xl px-5 font-display text-sm font-semibold shadow-sm active:scale-[0.98]"
        >
          <Search className="size-4" />
          <span className="hidden min-[360px]:inline">Search</span>
        </Button>
      </div>

      {error ? (
        <p className="px-2 pt-1 text-xs font-semibold text-destructive" role="alert">{error}</p>
      ) : null}
    </form>
  );

  const mobileSummary = [
    city || "Anywhere",
    checkIn && checkOut ? `${checkIn} → ${checkOut}` : "Any dates",
    `${guests} ${guests === 1 ? "guest" : "guests"}`,
  ].join(" · ");

  return (
    <>
      {variant === "hero" ? (
        <div className="w-full max-w-full md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="flex w-full max-w-full items-center gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3.5 text-left shadow-card"
            aria-expanded={mobileOpen}
            aria-controls="home-mobile-search"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand text-brand-foreground">
              <SlidersHorizontal className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Find a stay
              </span>
              <span className="block truncate text-sm font-semibold text-ink">{mobileSummary}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-brand">
              {mobileOpen ? "Hide" : "Filters"}
              <ChevronDown className={`size-4 transition-transform ${mobileOpen ? "rotate-180" : ""}`} />
            </span>
          </button>
          {mobileOpen ? <div id="home-mobile-search" className="mt-2 w-full max-w-full">{mobileFields}</div> : null}
        </div>
      ) : (
        mobileFields
      )}
      <form
        onSubmit={submit}
        className="hidden gap-3 rounded-3xl bg-card/90 p-4 shadow-float backdrop-blur md:grid md:grid-cols-[1.2fr_1fr_1fr_0.8fr_auto] md:items-center md:rounded-[2rem]"
      >
      <label className="grid gap-1">
        <span className="px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Where
        </span>
        <Input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City, area or state"
          className={fieldClass}
        />
      </label>
      <label className="grid gap-1">
        <span className="px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Check-in
        </span>
        <Input
          type="date"
          min={today}
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className={fieldClass}
        />
      </label>
      <label className="grid gap-1">
        <span className="px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Check-out
        </span>
        <Input
          type="date"
          min={checkIn || today}
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className={fieldClass}
        />
      </label>
      <label className="grid gap-1">
        <span className="px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Guests
        </span>
        <Select
          value={String(guests)}
          onValueChange={(v) => setGuests(Number(v))}
        >
          <SelectTrigger className={fieldClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} {n === 1 ? "guest" : "guests"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <div className="grid gap-2 md:pt-6">
        <Button type="submit" size={variant === "hero" ? "lg" : "default"} className="h-12 rounded-2xl font-display text-base">
          <Search className="size-4" /> Search
        </Button>
        {error ? (
          <p className="px-1 text-xs font-semibold text-destructive">{error}</p>
        ) : null}
      </div>
      </form>
    </>
  );
}
