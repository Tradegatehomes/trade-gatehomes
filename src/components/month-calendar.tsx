import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { eachDate, toISODate } from "@/lib/format";

interface MonthCalendarProps {
  blockedDates: { start_date: string; end_date: string }[];
  checkIn: string | null;
  checkOut: string | null;
  onChange: (range: { checkIn: string | null; checkOut: string | null }) => void;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function MonthCalendar({ blockedDates, checkIn, checkOut, onChange }: MonthCalendarProps) {
  const today = toISODate(new Date());
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const blockedSet = useMemo(() => {
    const set = new Set<string>();
    for (const range of blockedDates) {
      // end_date is treated as inclusive for display
      const endExclusive = new Date(range.end_date + "T00:00:00");
      endExclusive.setDate(endExclusive.getDate() + 1);
      for (const d of eachDate(range.start_date, toISODate(endExclusive))) set.add(d);
    }
    return set;
  }, [blockedDates]);

  const firstWeekday = monthCursor.getDay();
  const daysInMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0).getDate();
  const monthLabel = monthCursor.toLocaleDateString("en-NG", { month: "long", year: "numeric" });

  function handleDayClick(date: string) {
    if (date < today || blockedSet.has(date)) return;
    if (!checkIn || (checkIn && checkOut)) {
      onChange({ checkIn: date, checkOut: null });
    } else if (date > checkIn) {
      onChange({ checkIn, checkOut: date });
    } else {
      onChange({ checkIn: date, checkOut: null });
    }
  }

  const inRange = (date: string) =>
    checkIn && checkOut ? date >= checkIn && date <= checkOut : date === checkIn;

  return (
    <div className="rounded-3xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Previous month"
          disabled={monthCursor <= new Date(new Date().getFullYear(), new Date().getMonth(), 1)}
          onClick={() =>
            setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))
          }
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="font-display text-sm font-bold">{monthLabel}</span>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Next month"
          onClick={() =>
            setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))
          }
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-muted-foreground">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="py-1">
            {d}
          </span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: firstWeekday }).map((_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const date = toISODate(
            new Date(monthCursor.getFullYear(), monthCursor.getMonth(), i + 1),
          );
          const isPast = date < today;
          const isBlocked = blockedSet.has(date);
          const disabled = isPast || isBlocked;
          const selected = inRange(date);
          const isEdge = date === checkIn || date === checkOut;

          return (
            <button
              key={date}
              type="button"
              disabled={disabled}
              onClick={() => handleDayClick(date)}
              className={[
                "aspect-square rounded-xl text-sm font-semibold transition-colors",
                disabled
                  ? isBlocked
                    ? "cursor-not-allowed text-muted-foreground/40 line-through"
                    : "cursor-not-allowed text-muted-foreground/40"
                  : "hover:bg-secondary",
                selected && !isEdge ? "bg-brand/15 text-ink" : "",
                isEdge ? "bg-brand text-brand-foreground" : "",
                !selected && !disabled ? "text-ink" : "",
              ].join(" ")}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Pick your check-in and check-out dates. Crossed-out days are unavailable.
      </p>
    </div>
  );
}
