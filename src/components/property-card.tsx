import { Link } from "@tanstack/react-router";
import { Bath, BedDouble, MapPin, Star, Users } from "lucide-react";
import { formatNaira } from "@/lib/format";
import type { PropertyCardDto } from "@/lib/properties.functions";
import { Badge } from "@/components/ui/badge";

export function PropertyCard({ property }: { property: PropertyCardDto }) {
  return (
    <Link
      to="/properties/$slug"
      params={{ slug: property.slug }}
      preload="intent"
      className="group block overflow-hidden rounded-3xl bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-float"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {property.image ? (
          <img
            src={property.image}
            alt={property.name}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="size-full bg-secondary" />
        )}
        {property.featured ? (
          <Badge className="absolute left-3 top-3 rounded-full bg-sun text-ink hover:bg-sun">
            Featured
          </Badge>
        ) : null}
        <span className="absolute bottom-3 right-3 rounded-full bg-ink/85 px-3 py-1 text-sm font-bold text-white">
          {formatNaira(property.base_price)}
          <span className="text-xs font-medium text-white/80"> /night</span>
        </span>
      </div>
      <div className="grid gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-bold leading-tight text-ink">{property.name}</h3>
          {property.state ? (
            <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-4" /> {property.city}
            </span>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {property.property_type} · {property.city}
          {property.state ? `, ${property.state}` : ""}
        </p>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <BedDouble className="size-4" /> {property.bedrooms} bed
          </span>
          <span className="flex items-center gap-1">
            <Bath className="size-4" /> {property.bathrooms} bath
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-4" /> {property.max_guests} guests
          </span>
        </div>
      </div>
    </Link>
  );
}
