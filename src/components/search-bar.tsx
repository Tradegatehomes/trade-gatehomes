import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
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

  const mobileField =
    "w-full rounded-lg border border-input bg-background px-3 pb-2 pt-5 text-sm focus:outline-none focus:ring-1 focus:ring-brand/50";
  const mobileLabel =
    "pointer-events-none absolute left-3 top-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground";

  const mobileForm = (
    <form onSubmit={submit} className="grid grid-cols-2 gap-2 md:hidden">
      <div className="relative col-span-2">
        <span className={mobileLabel}>Where</span>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City, area or state"
          className={mobileField}
        />
      </div>
      <div className="relative">
        <span className={mobileLabel}>Check-in</span>
        <input
          type="date"
          min={today}
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className={`${mobileField} text-xs`}
        />
      </div>
      <div className="relative">
        <span className={mobileLabel}>Check-out</span>
        <input
          type="date"
          min={checkIn || today}
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className={`${mobileField} text-xs`}
        />
      </div>
      <div className="relative">
        <span className={mobileLabel}>Guests</span>
        <select
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className={`${mobileField} appearance-none`}
        >
          {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "guest" : "guests"}
            </option>
          ))}
        </select>
      </div>
      <Button
        type="submit"
        className="h-auto self-stretch rounded-lg text-sm font-semibold shadow-md active:scale-95"
      >
        <Search className="size-4" /> Search
      </Button>
      {error ? (
        <p className="col-span-2 px-1 text-xs font-semibold text-destructive">{error}</p>
      ) : null}
    </form>
  );

  return (
    <>
      {mobileForm}
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
  );
}
