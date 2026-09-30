import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { SearchBar } from "@/components/search-bar";
import { PropertyCard } from "@/components/property-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listProperties } from "@/lib/properties.functions";

const searchSchema = z.object({
  city: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  guests: z.coerce.number().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  propertyType: z.string().optional(),
  sort: z.enum(["featured", "price_asc", "price_desc"]).optional(),
});

export const Route = createFileRoute("/properties/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Browse shortlet apartments — TradeGate Continental Homes" },
      {
        name: "description",
        content:
          "Browse verified shortlet apartments across Nigeria. Filter by city, guests, dates and price, and see live availability.",
      },
      { property: "og:title", content: "Browse shortlet apartments — TradeGate Continental Homes" },
      {
        property: "og:description",
        content:
          "Browse verified shortlet apartments across Nigeria. Filter by city, guests, dates and price, and see live availability.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PropertiesPage,
});

function PropertiesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [minPrice, setMinPrice] = useState(search.minPrice?.toString() ?? "");
  const [maxPrice, setMaxPrice] = useState(search.maxPrice?.toString() ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Collapse the mobile search panel after a search is applied
  useEffect(() => {
    setFiltersOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.city, search.checkIn, search.checkOut, search.guests]);

  const listQuery = queryOptions({
    queryKey: ["properties", "list", search],
    queryFn: () =>
      listProperties({
        data: {
          city: search.city,
          guests: search.guests,
          minPrice: search.minPrice,
          maxPrice: search.maxPrice,
          propertyType: search.propertyType,
          sort: search.sort,
        },
      }),
  });
  const { data: properties } = useSuspenseQuery(listQuery);

  function setSearch(next: Record<string, unknown>) {
    navigate({
      to: "/properties",
      search: { ...search, ...next },
    });
  }

  function applyPrice() {
    setSearch({
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });
  }

  const activeFilters = [
    search.city && { label: "City", value: search.city },
    search.checkIn && search.checkOut && { label: "Dates", value: `${search.checkIn} → ${search.checkOut}` },
    search.guests && { label: "Guests", value: `${search.guests}+` },
    search.minPrice && { label: "Min", value: `₦${search.minPrice.toLocaleString()}` },
    search.maxPrice && { label: "Max", value: `₦${search.maxPrice.toLocaleString()}` },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-4xl">
        Browse stays
      </h1>
      <p className="mt-1 text-sm text-muted-foreground sm:mt-2">
        {properties.length} {properties.length === 1 ? "home" : "homes"} available
        {search.city ? ` in ${search.city}` : " across Nigeria"}.
      </p>

      {/* Mobile: collapsed search pill */}
      <button
        type="button"
        onClick={() => setFiltersOpen((o) => !o)}
        className="mt-4 flex w-full items-center gap-3 rounded-full bg-card px-4 py-3 shadow-card sm:hidden"
        aria-expanded={filtersOpen}
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground">
          <Search className="size-4" />
        </span>
        <span className="min-w-0 flex-1 truncate text-left text-sm font-medium text-ink">
          {search.city || "Search stays"}
          {search.checkIn && search.checkOut
            ? ` · ${search.checkIn} → ${search.checkOut}`
            : ""}
          {search.guests ? ` · ${search.guests} guests` : ""}
        </span>
        <span className="shrink-0 text-xs font-semibold text-brand">
          {filtersOpen ? "Hide" : "Filters"}
        </span>
      </button>

      <div
        className={`${filtersOpen ? "block" : "hidden"} mt-4 w-full max-w-full overflow-hidden sm:mt-6 sm:block`}
      >
        <SearchBar
          initial={{
            ...(search.city ? { city: search.city } : {}),
            ...(search.checkIn ? { checkIn: search.checkIn } : {}),
            ...(search.checkOut ? { checkOut: search.checkOut } : {}),
            ...(search.guests ? { guests: search.guests } : {}),
          }}
        />
      </div>

      {/* Secondary filters */}
      <div
        className={`${filtersOpen ? "block" : "hidden"} mt-3 w-full max-w-full sm:mt-4 sm:block`}
      >
        <div className="w-full max-w-full overflow-hidden rounded-2xl border border-border/80 bg-card p-3 shadow-sm sm:flex sm:flex-wrap sm:items-end sm:gap-3 sm:rounded-3xl sm:p-4">
          <div className="grid min-w-0 gap-3 min-[390px]:grid-cols-2 sm:flex sm:items-end">
            <label className="block min-w-0 sm:w-32">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Min price</span>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="₦0"
                className="h-11 w-full min-w-0 rounded-xl bg-background text-base sm:h-10 sm:rounded-full sm:text-sm"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </label>
            <label className="block min-w-0 sm:w-32">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Max price</span>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="No max"
                className="h-11 w-full min-w-0 rounded-xl bg-background text-base sm:h-10 sm:rounded-full sm:text-sm"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </label>
            <Button
              variant="outline"
              className="h-11 w-full rounded-xl font-semibold min-[390px]:col-span-2 sm:h-10 sm:w-auto sm:rounded-full sm:font-normal"
              onClick={applyPrice}
            >
              <Search className="size-4" />
              Apply price
            </Button>
          </div>

          <div className="mt-3 min-w-0 sm:ml-auto sm:mt-0 sm:w-48">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Sort by</span>
            <Select
              value={search.sort ?? "featured"}
              onValueChange={(v) => setSearch({ sort: v === "featured" ? undefined : v })}
            >
              <SelectTrigger className="h-11 w-full rounded-xl text-base sm:h-10 sm:rounded-full sm:text-sm">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured first</SelectItem>
                <SelectItem value="price_asc">Price: low to high</SelectItem>
                <SelectItem value="price_desc">Price: high to low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {activeFilters.map((f) => (
            <button
              key={f.label}
              onClick={() =>
                setSearch(
                  f.label === "City"
                    ? { city: undefined }
                    : f.label === "Dates"
                      ? { checkIn: undefined, checkOut: undefined }
                      : f.label === "Guests"
                        ? { guests: undefined }
                        : f.label === "Min"
                          ? { minPrice: undefined }
                          : { maxPrice: undefined },
                )
              }
              className="max-w-full break-words rounded-full bg-brand/10 px-3 py-1 text-left text-xs font-semibold text-brand transition-colors hover:bg-brand/20"
            >
              {f.label}: {f.value} ✕
            </button>
          ))}
        </div>
      )}

      {properties.length > 0 ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      ) : (
        <div className="mt-12 rounded-3xl bg-card p-10 text-center shadow-card">
          <h2 className="font-display text-xl font-bold text-ink">No stays match your search</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Try widening your dates, budget or guest count — or clear the filters to see everything.
          </p>
          <Button
            variant="outline"
            className="mt-4 rounded-full"
            onClick={() =>
              navigate({
                to: "/properties",
                search: { sort: search.sort },
              })
            }
          >
            Clear all filters
          </Button>
        </div>
      )}

      <p className="mt-10 text-center text-xs text-muted-foreground">
        Prices shown are per night in Naira. Final totals include cleaning, service and extra-guest
        fees — calculated before you confirm.
      </p>
    </div>
  );
}
