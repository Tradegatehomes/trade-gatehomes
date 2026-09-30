import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BarChart3, BedDouble, CalendarDays, CreditCard, Home, ListChecks, Percent, Settings2, Star, Tags } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStaff } from "@/hooks/use-staff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, formatNaira } from "@/lib/format";
import { Discounts, Payments, PricingRules, PropertyAmenities, Reviews } from "@/components/admin/extra-tabs";
import type { Database } from "@/integrations/supabase/types";

type BookingStatus = Database["public"]["Enums"]["booking_status"];
type PropertyStatus = Database["public"]["Enums"]["property_status"];
const BOOKING_STATUSES: BookingStatus[] = ["pending", "confirmed", "partially_paid", "fully_paid", "completed", "cancelled", "refunded"];
const PROPERTY_STATUSES: PropertyStatus[] = ["active", "inactive", "draft", "maintenance"];
const DEFAULT_PROPERTY_CONTACT = {
  phone: "+2347058860184",
  whatsapp: "+2347058860184",
  email: "tradegateconcept@gmail.com",
};

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — TradeGate Continental Homes" },
      { name: "description", content: "Manage properties, bookings, availability, reviews and discount codes." },
      { property: "og:title", content: "Admin dashboard — TradeGate Continental Homes" },
      { property: "og:description", content: "Manage properties, bookings, availability, reviews and discount codes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isStaff, loading } = useStaff();
  if (loading) return <Shell><p className="text-muted-foreground">Loading…</p></Shell>;
  if (!user)
    return (
      <Shell>
        <p className="text-muted-foreground">Please sign in with a staff account.</p>
        <Button asChild className="mt-4 rounded-full"><Link to="/auth" search={{ redirect: "/admin" }}>Sign in</Link></Button>
      </Shell>
    );
  if (!isStaff) return <Shell><p className="text-muted-foreground">Your account doesn't have staff access.</p></Shell>;

  const navItems = [
    { value: "overview", label: "Overview", icon: BarChart3, group: "Workspace" },
    { value: "bookings", label: "Bookings", icon: ListChecks, group: "Operations" },
    { value: "properties", label: "Properties", icon: Home, group: "Operations" },
    { value: "calendar", label: "Availability", icon: CalendarDays, group: "Operations" },
    { value: "pricing", label: "Pricing", icon: Percent, group: "Revenue" },
    { value: "payments", label: "Payments", icon: CreditCard, group: "Revenue" },
    { value: "discounts", label: "Discounts", icon: Tags, group: "Revenue" },
    { value: "amenities", label: "Amenities", icon: Settings2, group: "Content" },
    { value: "reviews", label: "Reviews", icon: Star, group: "Content" },
  ] as const;

  return (
    <Shell>
      <Tabs defaultValue="overview" className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
        <aside className="lg:sticky lg:top-24">
          <TabsList className="flex h-auto w-full gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-2 shadow-sm lg:flex-col lg:items-stretch lg:overflow-visible lg:rounded-3xl lg:p-3">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const previous = navItems[index - 1];
              const showGroup = index === 0 || previous.group !== item.group;
              return (
                <div key={item.value} className="contents lg:block">
                  {showGroup && (
                    <p className="hidden px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground first:pt-1 lg:block">
                      {item.group}
                    </p>
                  )}
                  <TabsTrigger
                    value={item.value}
                    className="shrink-0 justify-start gap-2 rounded-xl px-3 py-2.5 data-[state=active]:bg-ink data-[state=active]:text-white lg:w-full"
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </TabsTrigger>
                </div>
              );
            })}
          </TabsList>
        </aside>

        <div className="min-w-0">
          <TabsContent value="overview" className="mt-0"><Overview /></TabsContent>
          <TabsContent value="bookings" className="mt-0"><Bookings /></TabsContent>
          <TabsContent value="properties" className="mt-0"><Properties /></TabsContent>
          <TabsContent value="pricing" className="mt-0"><PricingRules /></TabsContent>
          <TabsContent value="amenities" className="mt-0"><PropertyAmenities /></TabsContent>
          <TabsContent value="calendar" className="mt-0"><Blocked /></TabsContent>
          <TabsContent value="payments" className="mt-0"><Payments /></TabsContent>
          <TabsContent value="reviews" className="mt-0"><Reviews /></TabsContent>
          <TabsContent value="discounts" className="mt-0"><Discounts /></TabsContent>
        </div>
      </Tabs>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-cream/40">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 lg:px-6">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">TradeGate operations</p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">Admin dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">Manage listings, bookings, pricing, reviews and availability from one place.</p>
          </div>
          <Button asChild variant="outline" className="rounded-full bg-card">
            <Link to="/">View public site</Link>
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

const card = "rounded-3xl border border-border/80 bg-card p-5 shadow-sm";

type AdminProperty = Database["public"]["Tables"]["properties"]["Row"] & {
  property_images?: { url: string; is_primary: boolean; sort_order: number }[];
  property_amenities?: { amenity_id: string }[];
};

function propertyReadiness(p: AdminProperty) {
  const checks = [
    { label: "Basic information", complete: Boolean(p.name && p.slug && p.city && p.address) },
    { label: "Description", complete: Boolean(p.description && p.description.trim().length >= 40) },
    { label: "Pricing", complete: Number(p.base_price) > 0 },
    { label: "Gallery photos", complete: (p.property_images?.length ?? 0) >= 4 },
    { label: "Amenities", complete: (p.property_amenities?.length ?? 0) >= 3 },
    { label: "House rules", complete: Boolean(p.house_rules) },
    { label: "Cancellation policy", complete: Boolean(p.cancellation_policy) },
    { label: "Guest enquiries", complete: Boolean(p.whatsapp || p.phone || p.email) },
  ];
  const completed = checks.filter((check) => check.complete).length;
  return {
    checks,
    completed,
    total: checks.length,
    percent: Math.round((completed / checks.length) * 100),
    missing: checks.filter((check) => !check.complete).map((check) => check.label),
  };
}

function useProps() {
  return useQuery({
    queryKey: ["admin-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*,property_images(url,is_primary,sort_order),property_amenities(amenity_id)")
        .order("name");
      if (error) throw error;
      return data as AdminProperty[];
    },
  });
}

function SectionIntro({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">{eyebrow}</p>}
        <h2 className="mt-1 font-display text-2xl font-bold text-ink">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

function Overview() {
  const q = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bookings").select("reference,guest_name,status,total_amount,check_in,created_at,properties(name)").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });
  const props = useProps();
  const rows = q.data ?? [];
  const live = rows.filter((b) => !["cancelled", "refunded"].includes(b.status));
  const today = new Date().toISOString().slice(0, 10);
  const stats = [
    { label: "Live properties", value: String((props.data ?? []).filter((p) => p.status === "active").length) },
    { label: "Pending bookings", value: String(rows.filter((b) => b.status === "pending").length) },
    { label: "Upcoming check-ins", value: String(live.filter((b) => b.check_in >= today).length) },
    { label: "Booked value", value: formatNaira(live.reduce((s, b) => s + Number(b.total_amount), 0)) },
  ];
  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={card}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className="mt-3 font-display text-3xl font-bold text-ink">{q.isLoading || props.isLoading ? "…" : s.value}</p>
          </div>
        ))}
      </div>
      {(rows.length > 0) && (
        <div className={card}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-xl font-bold text-ink">Recent bookings</h3>
              <p className="mt-1 text-sm text-muted-foreground">The latest reservation activity across your properties.</p>
            </div>
          </div>
          <div className="mt-4 divide-y divide-border">
            {rows.slice(0, 5).map((b) => (
              <div key={b.reference} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{b.guest_name} · {b.properties?.name ?? "Property"}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{b.reference} · check-in {formatDate(b.check_in)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">{b.status.replace("_", " ")}</Badge>
                  <span className="text-sm font-semibold text-ink">{formatNaira(Number(b.total_amount))}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className={card}>
          <h3 className="font-display text-xl font-bold text-ink">Operations snapshot</h3>
          <p className="mt-1 text-sm text-muted-foreground">Monitor your live listings and guest activity, then use the tabs above to manage each area.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-secondary/70 p-4"><p className="text-xs text-muted-foreground">All bookings</p><p className="mt-1 text-2xl font-bold text-ink">{rows.length}</p></div>
            <div className="rounded-2xl bg-secondary/70 p-4"><p className="text-xs text-muted-foreground">Active listings</p><p className="mt-1 text-2xl font-bold text-ink">{(props.data ?? []).filter((p) => p.status === "active").length}</p></div>
            <div className="rounded-2xl bg-secondary/70 p-4"><p className="text-xs text-muted-foreground">Featured listings</p><p className="mt-1 text-2xl font-bold text-ink">{(props.data ?? []).filter((p) => p.featured).length}</p></div>
          </div>
        </div>
        <div className="rounded-3xl bg-ink p-6 text-white shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">Needs attention</p>
          <h3 className="mt-2 font-display text-xl font-bold">Listing readiness</h3>
          <div className="mt-4 space-y-3">
            {(props.data ?? [])
              .map((p) => ({ p, readiness: propertyReadiness(p) }))
              .filter(({ readiness }) => readiness.percent < 100)
              .sort((a, b) => a.readiness.percent - b.readiness.percent)
              .slice(0, 3)
              .map(({ p, readiness }) => (
                <div key={p.id}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-semibold">{p.name}</span>
                    <span className="text-white/70">{readiness.percent}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/15">
                    <div className="h-full rounded-full bg-white" style={{ width: `${readiness.percent}%` }} />
                  </div>
                </div>
              ))}
            {!props.isLoading && (props.data ?? []).every((p) => propertyReadiness(p).percent === 100) && (
              <p className="text-sm text-white/70">All listings have the essentials in place.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Bookings() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const q = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id,reference,guest_name,guest_email,guest_phone,check_in,check_out,guests,total_amount,status,properties(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) => {
      const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Booking updated");
      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });
  const rows = (q.data ?? []).filter((b) => filter === "all" || b.status === filter);
  return (
    <div className="mt-6">
      <SectionIntro eyebrow="Guest operations" title="Bookings" description="Review upcoming stays, guest details and booking status changes." />
      <div className={card + " mb-4 flex flex-wrap items-center justify-between gap-3"}>
        <div><p className="text-sm font-semibold text-ink">Booking queue</p><p className="text-xs text-muted-foreground">{rows.length} matching bookings</p></div>
        <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {BOOKING_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}
        </SelectContent>
        </Select>
      </div>
      <div className="space-y-3">
      {q.isLoading && <p className="text-muted-foreground">Loading…</p>}
      {!q.isLoading && rows.length === 0 && <p className="text-muted-foreground">No bookings.</p>}
      {rows.map((b) => (
        <div key={b.id} className={`${card} flex flex-wrap items-center justify-between gap-4`}>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-ink">{b.guest_name}</p><Badge variant="secondary" className="capitalize">{b.status.replace("_", " ")}</Badge></div>
            <p className="mt-1 text-sm font-medium text-ink/80">{b.properties?.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{formatDate(b.check_in)} → {formatDate(b.check_out)} · {b.guests} guests · {formatNaira(Number(b.total_amount))}</p>
            <p className="text-xs text-muted-foreground">{b.reference} · {b.guest_email}{b.guest_phone ? ` · ${b.guest_phone}` : ""}</p>
          </div>
          <Select value={b.status} onValueChange={(v) => update.mutate({ id: b.id, status: v as BookingStatus })}>
            <SelectTrigger className="w-full capitalize sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {BOOKING_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      ))}
      </div>
    </div>
  );
}

function Properties() {
  const qc = useQueryClient();
  const q = useProps();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const save = useMutation({
    mutationFn: async ({ id, values }: { id: string | null; values: PropertyFormValues }) => {
      const { name, slug, city, state, address, property_type, description, bedrooms, bathrooms, max_guests, base_price, cleaning_fee, min_nights, house_rules, cancellation_policy, phone, whatsapp, email, amenity_ids } = values;
      const fields = {
        name: name.trim(), slug: slug.trim(), city: city.trim(), state: state.trim() || null,
        address: address.trim() || null, property_type: property_type.trim() || "Apartment",
        description: description.trim() || null, bedrooms: Number(bedrooms), bathrooms: Number(bathrooms),
        max_guests: Number(max_guests), base_price: Number(base_price), cleaning_fee: Number(cleaning_fee),
        min_nights: Number(min_nights), house_rules: house_rules.trim() || null,
        cancellation_policy: cancellation_policy.trim() || null,
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        email: email.trim().toLowerCase() || null,
      };
      let propertyId = id;
      if (id) {
        const { error } = await supabase.from("properties").update(fields).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("properties").insert({ ...fields, status: "draft" }).select("id").single();
        if (error) throw error;
        propertyId = data.id;
      }

      if (!propertyId) throw new Error("Property could not be saved.");
      const { error: clearAmenitiesError } = await supabase.from("property_amenities").delete().eq("property_id", propertyId);
      if (clearAmenitiesError) throw clearAmenitiesError;
      if (amenity_ids.length > 0) {
        const { error: amenityError } = await supabase.from("property_amenities").insert(
          amenity_ids.map((amenity_id) => ({ property_id: propertyId!, amenity_id })),
        );
        if (amenityError) throw amenityError;
      }
      return propertyId;
    },
    onSuccess: async (id, variables) => {
      toast.success(variables.id ? "Property updated" : "Draft saved — you can add photos now");
      await qc.invalidateQueries({ queryKey: ["admin-properties"] });
      await qc.invalidateQueries({ queryKey: ["properties"] });
      if (id) await qc.invalidateQueries({ queryKey: ["admin-property-images", id] });
      await qc.invalidateQueries({ queryKey: ["admin-property-amenities"] });
      setEditing(variables.id ? null : id);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });
  const updateQuick = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Database["public"]["Tables"]["properties"]["Update"] }) => {
      const { error } = await supabase.from("properties").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Property updated");
      qc.invalidateQueries({ queryKey: ["admin-properties"] });
      qc.invalidateQueries({ queryKey: ["properties"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });
  const rows = (q.data ?? []).filter((p) => {
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [p.name, p.city, p.state ?? "", p.property_type].some((v) => v.toLowerCase().includes(term));
    return matchesStatus && matchesSearch;
  });
  return (
    <div className="mt-6">
      <SectionIntro
        eyebrow="Inventory"
        title="Properties"
        description="Manage listing content, publishing status, pricing and gallery images."
        action={<Button onClick={() => setEditing(editing === "new" ? null : "new")}>{editing === "new" ? "Close form" : "Add property"}</Button>}
      />
      <div className={card + " mb-4 grid gap-3 md:grid-cols-[1fr_180px_auto]"}>
        <Input placeholder="Search by property, city or type" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {PROPERTY_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center justify-end text-sm text-muted-foreground">{rows.length} of {q.data?.length ?? 0} listings</div>
      </div>
      <div className="space-y-4">
        {editing === "new" && <PropertyEditor onCancel={() => setEditing(null)} onSave={(values) => save.mutate({ id: null, values })} saving={save.isPending} />}
        {rows.map((p) => (
          <div key={p.id} className="space-y-3">
            <PropertyRow p={p} onSave={(patch) => updateQuick.mutate({ id: p.id, patch })} onEdit={() => setEditing(editing === p.id ? null : p.id)} editing={editing === p.id} />
            {editing === p.id && <PropertyEditor key={p.id} property={p} onCancel={() => setEditing(null)} onSave={(values) => save.mutate({ id: p.id, values })} saving={save.isPending} />}
          </div>
        ))}
        {!q.isLoading && rows.length === 0 && editing !== "new" && (
          <div className={card + " py-12 text-center"}>
            <p className="font-semibold text-ink">No matching properties</p>
            <p className="mt-1 text-sm text-muted-foreground">Adjust your search or status filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}

type PropertyFormValues = {
  name: string; slug: string; city: string; state: string; address: string; property_type: string;
  description: string; bedrooms: string; bathrooms: string; max_guests: string; base_price: string;
  cleaning_fee: string; min_nights: string; house_rules: string; cancellation_policy: string;
  phone: string; whatsapp: string; email: string; amenity_ids: string[];
};

function PropertyEditor({ property, onCancel, onSave, saving }: {
  property?: AdminProperty;
  onCancel: () => void;
  onSave: (values: PropertyFormValues) => void;
  saving: boolean;
}) {
  const [values, setValues] = useState<PropertyFormValues>({
    name: property?.name ?? "", slug: property?.slug ?? "", city: property?.city ?? "", state: property?.state ?? "",
    address: property?.address ?? "", property_type: property?.property_type ?? "Apartment", description: property?.description ?? "",
    bedrooms: String(property?.bedrooms ?? 1), bathrooms: String(property?.bathrooms ?? 1), max_guests: String(property?.max_guests ?? 2),
    base_price: String(property?.base_price ?? 0), cleaning_fee: String(property?.cleaning_fee ?? 0), min_nights: String(property?.min_nights ?? 1),
    house_rules: property?.house_rules ?? "", cancellation_policy: property?.cancellation_policy ?? "",
    phone: property?.phone ?? DEFAULT_PROPERTY_CONTACT.phone,
    whatsapp: property?.whatsapp ?? DEFAULT_PROPERTY_CONTACT.whatsapp,
    email: property?.email ?? DEFAULT_PROPERTY_CONTACT.email,
    amenity_ids: property?.property_amenities?.map((item) => item.amenity_id) ?? [],
  });
  const field = (name: Exclude<keyof PropertyFormValues, "amenity_ids">, value: string) => setValues((current) => ({ ...current, [name]: value }));
  const slugFromName = (value: string) => field("slug", value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  const photos = usePropertyPhotos(property?.id);
  const amenities = useQuery({
    queryKey: ["admin-amenities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("amenities").select("id,name").order("name");
      if (error) throw error;
      return data;
    },
  });
  const toggleAmenity = (amenityId: string) =>
    setValues((current) => ({
      ...current,
      amenity_ids: current.amenity_ids.includes(amenityId)
        ? current.amenity_ids.filter((id) => id !== amenityId)
        : [...current.amenity_ids, amenityId],
    }));
  return (
    <div className={`${card} space-y-6 border-brand/20`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">{property ? "Listing workspace" : "Create inventory"}</p>
          <h3 className="mt-1 font-display text-2xl font-bold text-ink">{property ? "Edit listing" : "New listing"}</h3>
          <p className="mt-1 text-sm text-muted-foreground">Complete the essentials first, then add photos and publish when the listing is ready.</p>
        </div>
        {property && <Badge variant={property.status === "active" ? "default" : "secondary"} className="capitalize">{property.status}</Badge>}
      </div>
      <div className="rounded-2xl bg-secondary/40 p-4">
        <p className="mb-4 text-sm font-semibold text-ink">Listing basics</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FormField label="Property name"><Input value={values.name} onChange={(e) => { field("name", e.target.value); if (!property) slugFromName(e.target.value); }} /></FormField>
        <FormField label="Listing address"><Input value={values.address} onChange={(e) => field("address", e.target.value)} /></FormField>
        <FormField label="URL name"><Input value={values.slug} onChange={(e) => field("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} /></FormField>
        <FormField label="City"><Input value={values.city} onChange={(e) => field("city", e.target.value)} /></FormField>
        <FormField label="State / region"><Input value={values.state} onChange={(e) => field("state", e.target.value)} /></FormField>
        <FormField label="Property type"><Input value={values.property_type} onChange={(e) => field("property_type", e.target.value)} /></FormField>
        <FormField label="Bedrooms"><Input type="number" min="0" value={values.bedrooms} onChange={(e) => field("bedrooms", e.target.value)} /></FormField>
        <FormField label="Bathrooms"><Input type="number" min="0" value={values.bathrooms} onChange={(e) => field("bathrooms", e.target.value)} /></FormField>
        <FormField label="Maximum guests"><Input type="number" min="1" value={values.max_guests} onChange={(e) => field("max_guests", e.target.value)} /></FormField>
        <FormField label="Nightly price (₦)"><Input type="number" min="0" value={values.base_price} onChange={(e) => field("base_price", e.target.value)} /></FormField>
        <FormField label="Cleaning fee (₦)"><Input type="number" min="0" value={values.cleaning_fee} onChange={(e) => field("cleaning_fee", e.target.value)} /></FormField>
        <FormField label="Minimum nights"><Input type="number" min="1" value={values.min_nights} onChange={(e) => field("min_nights", e.target.value)} /></FormField>
        </div>
      </div>
      <div>
        <p className="mb-3 text-sm font-semibold text-ink">Guest-facing content</p>
        <FormField label="Description"><Textarea value={values.description} onChange={(e) => field("description", e.target.value)} rows={4} /></FormField>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="House rules"><Textarea value={values.house_rules} onChange={(e) => field("house_rules", e.target.value)} rows={3} /></FormField>
        <FormField label="Cancellation policy"><Textarea value={values.cancellation_policy} onChange={(e) => field("cancellation_policy", e.target.value)} rows={3} /></FormField>
      </div>
      <div className="rounded-2xl border border-border bg-background p-4 sm:p-5">
        <div className="mb-4">
          <p className="text-sm font-semibold text-ink">Amenities</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Select everything included with this property. Choose at least three for a complete listing.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(amenities.data ?? []).map((amenity) => {
            const selected = values.amenity_ids.includes(amenity.id);
            return (
              <Button
                key={amenity.id}
                type="button"
                size="sm"
                variant={selected ? "default" : "outline"}
                className="rounded-full"
                onClick={() => toggleAmenity(amenity.id)}
              >
                {selected ? "✓ " : ""}{amenity.name}
              </Button>
            );
          })}
          {!amenities.isLoading && (amenities.data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No amenities have been created yet.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background p-4 sm:p-5">
        <div className="mb-4">
          <p className="text-sm font-semibold text-ink">Guest enquiries</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            These details power the WhatsApp, Call and Email actions shown on the public property page.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField label="WhatsApp number">
            <Input inputMode="tel" placeholder="+234…" value={values.whatsapp} onChange={(e) => field("whatsapp", e.target.value)} />
          </FormField>
          <FormField label="Phone number">
            <Input inputMode="tel" placeholder="+234…" value={values.phone} onChange={(e) => field("phone", e.target.value)} />
          </FormField>
          <FormField label="Enquiries email">
            <Input type="email" placeholder="hello@example.com" value={values.email} onChange={(e) => field("email", e.target.value)} />
          </FormField>
        </div>
      </div>

      {property ? (
        <PropertyPhotos propertyId={property.id} photos={photos.data ?? []} />
      ) : (
        <section className="rounded-2xl border border-dashed border-brand/30 bg-brand/5 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">Listing photos</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Save this listing as a draft first. The photo uploader will open here immediately after the draft is created.
              </p>
            </div>
            <div className="inline-flex h-10 items-center justify-center rounded-full border border-input bg-background px-4 text-sm font-medium text-muted-foreground opacity-70">
              Upload photos after saving
            </div>
          </div>
        </section>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button className="w-full sm:w-auto" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          className="w-full sm:w-auto"
          disabled={saving || !values.name.trim() || !values.slug.trim() || !values.city.trim()}
          onClick={() => onSave(values)}
        >
          {saving ? "Saving…" : property ? "Save changes" : "Save draft & add photos"}
        </Button>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-medium text-ink">{label}{children}</label>;
}

function usePropertyPhotos(propertyId?: string) {
  return useQuery({
    queryKey: ["admin-property-images", propertyId],
    enabled: Boolean(propertyId),
    queryFn: async () => {
      if (!propertyId) return [];
      const { data, error } = await supabase.from("property_images").select("id,url,alt_text,is_primary,sort_order").eq("property_id", propertyId).order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

function PropertyPhotos({ propertyId, photos }: { propertyId: string; photos: { id: string; url: string; alt_text: string | null; is_primary: boolean; sort_order: number }[] }) {
  const qc = useQueryClient();
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["admin-property-images", propertyId] });
    await qc.invalidateQueries({ queryKey: ["properties"] });
    await qc.invalidateQueries({ queryKey: ["property"] });
  }
  async function addPhoto() {
    const cleanUrl = url.trim();
    if (!cleanUrl) return;
    const { error } = await supabase.from("property_images").insert({ property_id: propertyId, url: cleanUrl, is_primary: photos.length === 0, sort_order: photos.length });
    if (error) { toast.error(error.message); return; }
    setUrl("");
    toast.success("Photo added");
    await refresh();
  }
  async function uploadPhoto(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setUploading(true);
    try {
      const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
      const path = `${propertyId}/${Date.now()}-${safe}`;
      const { error: uploadError } = await supabase.storage.from("property-images").upload(path, file, { upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("property-images").getPublicUrl(path);
      const { error } = await supabase.from("property_images").insert({
        property_id: propertyId,
        url: data.publicUrl,
        alt_text: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
        is_primary: photos.length === 0,
        sort_order: photos.length,
      });
      if (error) throw error;
      toast.success("Photo uploaded");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Photo upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function setPrimary(id: string) {
    const { error: clearError } = await supabase.from("property_images").update({ is_primary: false }).eq("property_id", propertyId);
    if (clearError) { toast.error(clearError.message); return; }
    const { error } = await supabase.from("property_images").update({ is_primary: true }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    await refresh();
  }
  async function removePhoto(id: string) {
    const photo = photos.find((item) => item.id === id);
    const { error } = await supabase.from("property_images").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }

    if (photo?.url.includes("/storage/v1/object/public/property-images/")) {
      const path = photo.url.split("/storage/v1/object/public/property-images/")[1]?.split("?")[0];
      if (path) await supabase.storage.from("property-images").remove([decodeURIComponent(path)]);
    }
    toast.success("Photo removed");
    await refresh();
  }
  return (
    <section className="space-y-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-semibold text-ink">Listing photos</h4>
          <p className="text-xs text-muted-foreground">Upload directly from your device or paste an existing image URL.</p>
        </div>
        <label className="inline-flex cursor-pointer items-center rounded-full border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
          {uploading ? "Uploading…" : "Upload photo"}
          <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => uploadPhoto(e.target.files?.[0])} />
        </label>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]"><Input className="w-full" aria-label="Photo URL" placeholder="Or paste a photo URL" value={url} onChange={(e) => setUrl(e.target.value)} /><Button className="w-full sm:w-auto" variant="outline" onClick={addPhoto}>Add URL</Button></div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo) => <div key={photo.id} className="overflow-hidden rounded-2xl border border-border bg-background">
          <img src={photo.url} alt={photo.alt_text ?? "Property photo"} className="aspect-[4/3] w-full object-cover" />
          <div className="grid gap-2 p-3 sm:flex sm:items-center sm:justify-between">
            <Badge variant={photo.is_primary ? "default" : "secondary"}>{photo.is_primary ? "Cover photo" : "Gallery photo"}</Badge>
            <div className="grid grid-cols-2 gap-1 sm:flex sm:shrink-0">{!photo.is_primary && <Button size="sm" variant="outline" onClick={() => setPrimary(photo.id)}>Make cover</Button>}<Button size="sm" variant="ghost" onClick={() => removePhoto(photo.id)} aria-label="Remove photo">Remove</Button></div>
          </div>
        </div>)}
      </div>
    </section>
  );
}

function PropertyRow({
  p,
  onSave,
  onEdit,
  editing,
}: {
  p: AdminProperty;
  onSave: (patch: { base_price?: number; status?: PropertyStatus; featured?: boolean }) => void;
  onEdit: () => void;
  editing: boolean;
}) {
  const [price, setPrice] = useState(String(p.base_price));
  const photos = [...(p.property_images ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order);
  const cover = photos[0]?.url;
  return (
    <div className={card + " overflow-hidden p-0"}>
      <div className="grid md:grid-cols-[220px_1fr]">
        <div className="min-h-44 bg-secondary">
          {cover ? <img src={cover} alt={p.name} className="h-full min-h-44 w-full object-cover" /> : <div className="flex h-full min-h-44 items-center justify-center px-6 text-center text-sm text-muted-foreground">No cover photo yet</div>}
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-xl font-bold text-ink">{p.name}</p>
                <Badge variant={p.status === "active" ? "default" : "secondary"} className="capitalize">{p.status}</Badge>
                {p.featured && <Badge variant="outline">Featured</Badge>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{p.city}{p.state ? `, ${p.state}` : ""} · {p.property_type}</p>
              <p className="mt-2 text-sm text-muted-foreground">{p.bedrooms} bed · {p.bathrooms} bath · up to {p.max_guests} guests · {photos.length} photos</p>
              {(() => {
                const readiness = propertyReadiness(p);
                return (
                  <div className="mt-3 max-w-sm">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink">Listing completeness</span>
                      <span className="text-muted-foreground">{readiness.percent}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${readiness.percent}%` }} />
                    </div>
                    {readiness.missing.length > 0 && (
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        Missing: {readiness.missing.join(" · ")}
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="text-left md:text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Nightly rate</p>
              <p className="mt-1 font-display text-xl font-bold text-ink">{formatNaira(Number(p.base_price))}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-2 border-t border-border pt-4 sm:flex sm:flex-wrap sm:items-center">
            <Button size="sm" className="w-full sm:w-auto" onClick={onEdit}>{editing ? "Close editor" : "Manage listing"}</Button>
            <div className="grid grid-cols-[1fr_auto] gap-2 sm:flex sm:items-center">
              <Input className="w-full sm:w-32" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} aria-label={`Nightly price for ${p.name}`} />
              <Button size="sm" variant="outline" onClick={() => onSave({ base_price: Number(price) })}>Update rate</Button>
            </div>
            <Button size="sm" className="w-full sm:w-auto" variant={p.featured ? "default" : "outline"} onClick={() => onSave({ featured: !p.featured })}>
              {p.featured ? "Featured" : "Feature listing"}
            </Button>
            <Select value={p.status} onValueChange={(v) => onSave({ status: v as PropertyStatus })}>
              <SelectTrigger className="w-full capitalize sm:w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROPERTY_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}

function Blocked() {
  const qc = useQueryClient();
  const props = useProps();
  const [propertyId, setPropertyId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [note, setNote] = useState("");
  const q = useQuery({
    queryKey: ["admin-blocked"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blocked_dates").select("id,start_date,end_date,note,properties(name)").order("start_date");
      if (error) throw error;
      return data;
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-blocked"] });
  async function add() {
    if (!propertyId || !start || !end || end <= start) { toast.error("Pick a property and a valid date range."); return; }
    const { error } = await supabase.from("blocked_dates").insert({ property_id: propertyId, start_date: start, end_date: end, note: note || null });
    if (error) { toast.error(error.message); return; }
    toast.success("Dates blocked");
    setNote("");
    refresh();
  }
  async function remove(id: string) {
    const { error } = await supabase.from("blocked_dates").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    refresh();
  }
  return (
    <div className="mt-6">
      <SectionIntro eyebrow="Availability" title="Blocked dates" description="Keep unavailable dates out of the booking flow for maintenance, owner use or manual holds." />
      <div className={`${card} mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5`}>
        <Select value={propertyId} onValueChange={setPropertyId}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Property" /></SelectTrigger>
          <SelectContent>{(props.data ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
        </Select>
        <Input type="date" className="w-full" value={start} onChange={(e) => setStart(e.target.value)} aria-label="From" />
        <Input type="date" className="w-full" value={end} onChange={(e) => setEnd(e.target.value)} aria-label="Until" />
        <Input className="w-full" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <Button className="w-full sm:w-auto" onClick={add}>Block dates</Button>
      </div>
      <div className="space-y-3">{(q.data ?? []).map((b) => (
        <div key={b.id} className={`${card} flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center`}>
          <p className="text-sm"><span className="font-semibold text-ink">{b.properties?.name}</span> · {formatDate(b.start_date)} → {formatDate(b.end_date)}{b.note ? ` · ${b.note}` : ""}</p>
          <Button size="sm" variant="ghost" onClick={() => remove(b.id)}>Remove</Button>
        </div>
      ))}</div>
    </div>
  );
}
