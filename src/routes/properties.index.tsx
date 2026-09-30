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
        className={`${filtersOpen ? "block" : "hidden"} mt-4 rounded-2xl bg-card p-3 shadow-card sm:mt-6 sm:block sm:rounded-3xl sm:p-4`}
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

      {/* Filter row */}
      <div
        className={`${filtersOpen ? "flex" : "hidden"} mt-3 flex-nowrap items-center gap-2 sm:mt-4 sm:flex sm:flex-wrap sm:gap-3`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1 rounded-lg border border-input bg-card px-2 py-1 sm:flex-none sm:gap-2 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0">
          <Input
            type="number"
            placeholder="Min ₦"
            className="h-7 min-w-0 flex-1 border-0 bg-transparent px-1 text-xs shadow-none focus-visible:ring-0 sm:h-10 sm:w-28 sm:flex-none sm:rounded-md sm:border sm:bg-card sm:px-3 sm:text-sm"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <span className="text-xs text-muted-foreground sm:text-sm">–</span>
          <Input
            type="number"
            placeholder="Max ₦"
            className="h-7 min-w-0 flex-1 border-0 bg-transparent px-1 text-xs shadow-none focus-visible:ring-0 sm:h-10 sm:w-28 sm:flex-none sm:rounded-md sm:border sm:bg-card sm:px-3 sm:text-sm"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 shrink-0 rounded-md px-2 text-[11px] font-bold uppercase sm:h-10 sm:rounded-full sm:px-4 sm:text-sm sm:font-normal sm:normal-case"
            onClick={applyPrice}
          >
            <Search className="size-3 sm:mr-1 sm:size-4" />
            <span className="hidden sm:inline">Apply</span>
          </Button>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
          <span className="hidden text-sm font-medium text-ink/70 sm:inline">Sort</span>
          <Select
            value={search.sort ?? "featured"}
            onValueChange={(v) => setSearch({ sort: v === "featured" ? undefined : v })}
          >
            <SelectTrigger className="h-9 w-32 rounded-lg text-xs sm:h-10 sm:w-44 sm:rounded-full sm:text-sm">
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
              className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand transition-colors hover:bg-brand/20"
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
