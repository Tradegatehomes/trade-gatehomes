import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bath, BedDouble, MapPin, Star, Users } from "lucide-react";
import { formatNaira } from "@/lib/format";
import type { PropertyCardDto } from "@/lib/properties.functions";
import { Badge } from "@/components/ui/badge";


function PropertyCardGallery({ property }: { property: PropertyCardDto }) {
  const [active, setActive] = useState(0);
  const images = property.gallery?.length ? property.gallery : property.image ? [property.image] : [];
  return (
    <div className="relative aspect-[4/3] overflow-hidden">
      {images.length ? (
        <>
          <div
            className="flex h-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:hidden"
            onScroll={(e) => {
              const el = e.currentTarget;
              setActive(Math.max(0, Math.min(images.length - 1, Math.round(el.scrollLeft / el.clientWidth))));
            }}
            aria-label={`${property.name} photos`}
          >
            {images.map((src, index) => (
              <img
                key={src}
                src={src}
                alt={`${property.name} photo ${index + 1}`}
                className="h-full w-full shrink-0 snap-center object-cover"
                loading={index === 0 ? "eager" : "lazy"}
              />
            ))}
          </div>
          <img
            src={images[0]}
            alt={property.name}
            className="hidden size-full object-cover transition-transform duration-500 group-hover:scale-105 sm:block"
          />
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1 sm:hidden" aria-hidden="true">
              {images.slice(0, 5).map((_, index) => (
                <span key={index} className={`h-1.5 rounded-full bg-white shadow transition-all ${index === active ? "w-4" : "w-1.5 opacity-70"}`} />
              ))}
            </div>
          )}
        </>
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
  );
}

export function PropertyCard({ property }: { property: PropertyCardDto }) {
  return (
    <Link
      to="/properties/$slug"
      params={{ slug: property.slug }}
      preload="intent"
      className="group block overflow-hidden rounded-3xl bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-float"
    >
      <PropertyCardGallery property={property} />
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
