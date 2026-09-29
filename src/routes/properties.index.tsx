import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { Search } from "lucide-react";
import { useState } from "react";
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
      { title: "Browse shortlet apartments — KeyNest" },
      {
        name: "description",
        content:
          "Browse verified shortlet apartments across Nigeria. Filter by city, guests, dates and price, and see live availability.",
      },
      { property: "og:title", content: "Browse shortlet apartments — KeyNest" },
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
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        Browse stays
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {properties.length} {properties.length === 1 ? "home" : "homes"} available
        {search.city ? ` in ${search.city}` : " across Nigeria"}.
      </p>

      <div className="mt-6 rounded-3xl bg-card p-4 shadow-card">
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
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min ₦"
            className="w-28"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <span className="text-sm text-muted-foreground">–</span>
          <Input
            type="number"
            placeholder="Max ₦"
            className="w-28"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
          <Button variant="outline" className="rounded-full" onClick={applyPrice}>
            <Search className="mr-1 size-4" /> Apply
          </Button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm font-medium text-ink/70">Sort</span>
          <Select
            value={search.sort ?? "featured"}
            onValueChange={(v) => setSearch({ sort: v === "featured" ? undefined : v })}
          >
            <SelectTrigger className="w-44 rounded-full">
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
