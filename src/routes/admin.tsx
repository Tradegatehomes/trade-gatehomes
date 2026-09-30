import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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

  return (
    <Shell>
      <Tabs defaultValue="overview">
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-2 shadow-sm">
          <TabsTrigger value="overview" className="rounded-xl">Overview</TabsTrigger>
          <TabsTrigger value="bookings" className="rounded-xl">Bookings</TabsTrigger>
          <TabsTrigger value="properties" className="rounded-xl">Properties</TabsTrigger>
          <TabsTrigger value="pricing" className="rounded-xl">Pricing</TabsTrigger>
          <TabsTrigger value="amenities" className="rounded-xl">Amenities</TabsTrigger>
          <TabsTrigger value="calendar" className="rounded-xl">Blocked dates</TabsTrigger>
          <TabsTrigger value="payments" className="rounded-xl">Payments</TabsTrigger>
          <TabsTrigger value="reviews" className="rounded-xl">Reviews</TabsTrigger>
          <TabsTrigger value="discounts" className="rounded-xl">Discounts</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><Overview /></TabsContent>
        <TabsContent value="bookings"><Bookings /></TabsContent>
        <TabsContent value="properties"><Properties /></TabsContent>
        <TabsContent value="pricing"><PricingRules /></TabsContent>
        <TabsContent value="amenities"><PropertyAmenities /></TabsContent>
        <TabsContent value="calendar"><Blocked /></TabsContent>
        <TabsContent value="payments"><Payments /></TabsContent>
        <TabsContent value="reviews"><Reviews /></TabsContent>
        <TabsContent value="discounts"><Discounts /></TabsContent>
      </Tabs>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-cream/40">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">TradeGate operations</p>
            <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">Admin dashboard</h1>
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

function useProps() {
  return useQuery({
    queryKey: ["admin-properties"],
    queryFn: async () => {
      const { data, error } = await supabase.from("properties").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

function Overview() {
  const q = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bookings").select("status,total_amount,check_in");
      if (error) throw error;
      return data;
    },
  });
  const rows = q.data ?? [];
  const live = rows.filter((b) => !["cancelled", "refunded"].includes(b.status));
  const today = new Date().toISOString().slice(0, 10);
  const stats = [
    { label: "Total bookings", value: String(rows.length) },
    { label: "Pending", value: String(rows.filter((b) => b.status === "pending").length) },
    { label: "Upcoming check-ins", value: String(live.filter((b) => b.check_in >= today).length) },
    { label: "Booked value", value: formatNaira(live.reduce((s, b) => s + Number(b.total_amount), 0)) },
  ];
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className={card}>
          <p className="text-sm text-muted-foreground">{s.label}</p>
          <p className="mt-2 font-display text-3xl font-bold text-ink">{q.isLoading ? "…" : s.value}</p>
        </div>
      ))}
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
    <div className="mt-6 space-y-3">
      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {BOOKING_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}
        </SelectContent>
      </Select>
      {q.isLoading && <p className="text-muted-foreground">Loading…</p>}
      {!q.isLoading && rows.length === 0 && <p className="text-muted-foreground">No bookings.</p>}
      {rows.map((b) => (
        <div key={b.id} className={`${card} flex flex-wrap items-center justify-between gap-3`}>
          <div>
            <p className="font-semibold text-ink">{b.guest_name} · {b.properties?.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatDate(b.check_in)} → {formatDate(b.check_out)} · {b.guests} guests · {formatNaira(Number(b.total_amount))}
            </p>
            <p className="text-xs text-muted-foreground">{b.reference} · {b.guest_email}{b.guest_phone ? ` · ${b.guest_phone}` : ""}</p>
          </div>
          <Select value={b.status} onValueChange={(v) => update.mutate({ id: b.id, status: v as BookingStatus })}>
            <SelectTrigger className="w-44 capitalize"><SelectValue /></SelectTrigger>
            <SelectContent>
              {BOOKING_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}

function Properties() {
  const qc = useQueryClient();
  const q = useProps();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const save = useMutation({
    mutationFn: async ({ id, values }: { id: string | null; values: PropertyFormValues }) => {
      const { name, slug, city, state, address, property_type, description, bedrooms, bathrooms, max_guests, base_price, cleaning_fee, min_nights, house_rules, cancellation_policy } = values;
      const fields = {
        name: name.trim(), slug: slug.trim(), city: city.trim(), state: state.trim() || null,
        address: address.trim() || null, property_type: property_type.trim() || "Apartment",
        description: description.trim() || null, bedrooms: Number(bedrooms), bathrooms: Number(bathrooms),
        max_guests: Number(max_guests), base_price: Number(base_price), cleaning_fee: Number(cleaning_fee),
        min_nights: Number(min_nights), house_rules: house_rules.trim() || null,
        cancellation_policy: cancellation_policy.trim() || null,
      };
      if (id) {
        const { error } = await supabase.from("properties").update(fields).eq("id", id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase.from("properties").insert({ ...fields, status: "draft" }).select("id").single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (id) => {
      toast.success("Property saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-properties"] });
      qc.invalidateQueries({ queryKey: ["properties"] });
      if (id) qc.invalidateQueries({ queryKey: ["admin-property-images", id] });
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
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });
  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{q.data?.length ?? 0} listings</p>
        <Button onClick={() => setEditing(editing === "new" ? null : "new")}>{editing === "new" ? "Close form" : "Add property"}</Button>
      </div>
      {editing === "new" && <PropertyEditor onCancel={() => setEditing(null)} onSave={(values) => save.mutate({ id: null, values })} saving={save.isPending} />}
      {(q.data ?? []).map((p) => (
        <div key={p.id} className="space-y-3">
          <PropertyRow p={p} onSave={(patch) => updateQuick.mutate({ id: p.id, patch })} onEdit={() => setEditing(editing === p.id ? null : p.id)} editing={editing === p.id} />
          {editing === p.id && <PropertyEditor key={p.id} property={p} onCancel={() => setEditing(null)} onSave={(values) => save.mutate({ id: p.id, values })} saving={save.isPending} />}
        </div>
      ))}
      {!q.isLoading && (q.data ?? []).length === 0 && editing !== "new" && <p className="text-muted-foreground">No listings yet.</p>}
    </div>
  );
}

type PropertyFormValues = {
  name: string; slug: string; city: string; state: string; address: string; property_type: string;
  description: string; bedrooms: string; bathrooms: string; max_guests: string; base_price: string;
  cleaning_fee: string; min_nights: string; house_rules: string; cancellation_policy: string;
};

function PropertyEditor({ property, onCancel, onSave, saving }: {
  property?: Database["public"]["Tables"]["properties"]["Row"];
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
  });
  const field = (name: keyof PropertyFormValues, value: string) => setValues((current) => ({ ...current, [name]: value }));
  const slugFromName = (value: string) => field("slug", value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  const photos = usePropertyPhotos(property?.id);
  return (
    <div className={`${card} space-y-5`}>
      <div>
        <h3 className="font-display text-xl font-bold text-ink">{property ? "Edit listing" : "New listing"}</h3>
        <p className="mt-1 text-sm text-muted-foreground">New listings are saved as drafts until you publish them.</p>
      </div>
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
      <FormField label="Description"><Textarea value={values.description} onChange={(e) => field("description", e.target.value)} rows={4} /></FormField>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="House rules"><Textarea value={values.house_rules} onChange={(e) => field("house_rules", e.target.value)} rows={3} /></FormField>
        <FormField label="Cancellation policy"><Textarea value={values.cancellation_policy} onChange={(e) => field("cancellation_policy", e.target.value)} rows={3} /></FormField>
      </div>
      {property && <PropertyPhotos propertyId={property.id} photos={photos.data ?? []} />}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button disabled={saving || !values.name.trim() || !values.slug.trim() || !values.city.trim()} onClick={() => onSave(values)}>{saving ? "Saving…" : "Save listing"}</Button>
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
  async function setPrimary(id: string) {
    const { error: clearError } = await supabase.from("property_images").update({ is_primary: false }).eq("property_id", propertyId);
    if (clearError) { toast.error(clearError.message); return; }
    const { error } = await supabase.from("property_images").update({ is_primary: true }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    await refresh();
  }
  async function removePhoto(id: string) {
    const { error } = await supabase.from("property_images").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    await refresh();
  }
  return (
    <section className="space-y-3 border-t border-border pt-4">
      <h4 className="font-semibold text-ink">Listing photos</h4>
      <div className="flex flex-wrap gap-2"><Input className="min-w-56 flex-1" aria-label="Photo URL" placeholder="Paste a photo URL" value={url} onChange={(e) => setUrl(e.target.value)} /><Button variant="outline" onClick={addPhoto}>Add photo</Button></div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo) => <div key={photo.id} className="flex min-w-0 items-center justify-between gap-2 rounded-md border border-border p-2">
          <div className="min-w-0"><p className="truncate text-xs text-muted-foreground">{photo.url}</p><Badge className="mt-1" variant={photo.is_primary ? "default" : "secondary"}>{photo.is_primary ? "Cover photo" : "Gallery photo"}</Badge></div>
          <div className="flex shrink-0 gap-1">{!photo.is_primary && <Button size="sm" variant="outline" onClick={() => setPrimary(photo.id)}>Make cover</Button>}<Button size="sm" variant="ghost" onClick={() => removePhoto(photo.id)} aria-label="Remove photo">Remove</Button></div>
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
  p: Database["public"]["Tables"]["properties"]["Row"];
  onSave: (patch: { base_price?: number; status?: PropertyStatus; featured?: boolean }) => void;
  onEdit: () => void;
  editing: boolean;
}) {
  const [price, setPrice] = useState(String(p.base_price));
  return (
    <div className={`${card} flex flex-wrap items-center justify-between gap-3`}>
      <div>
        <p className="font-semibold text-ink">{p.name}</p>
        <p className="text-sm text-muted-foreground">{p.city}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={onEdit}>{editing ? "Close editor" : "Edit listing"}</Button>
        <Input className="w-32" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} aria-label="Nightly price" />
        <Button size="sm" variant="outline" onClick={() => onSave({ base_price: Number(price) })}>Save price</Button>
        <Button size="sm" variant={p.featured ? "default" : "outline"} onClick={() => onSave({ featured: !p.featured })}>
          {p.featured ? "Featured" : "Not featured"}
        </Button>
        <Select value={p.status} onValueChange={(v) => onSave({ status: v as PropertyStatus })}>
          <SelectTrigger className="w-36 capitalize"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PROPERTY_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
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
    <div className="mt-6 space-y-4">
      <div className={`${card} flex flex-wrap items-end gap-2`}>
        <Select value={propertyId} onValueChange={setPropertyId}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Property" /></SelectTrigger>
          <SelectContent>{(props.data ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
        </Select>
        <Input type="date" className="w-40" value={start} onChange={(e) => setStart(e.target.value)} aria-label="From" />
        <Input type="date" className="w-40" value={end} onChange={(e) => setEnd(e.target.value)} aria-label="Until" />
        <Input className="w-48" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <Button onClick={add}>Block dates</Button>
      </div>
      {(q.data ?? []).map((b) => (
        <div key={b.id} className={`${card} flex items-center justify-between`}>
          <p className="text-sm"><span className="font-semibold text-ink">{b.properties?.name}</span> · {formatDate(b.start_date)} → {formatDate(b.end_date)}{b.note ? ` · ${b.note}` : ""}</p>
          <Button size="sm" variant="ghost" onClick={() => remove(b.id)}>Remove</Button>
        </div>
      ))}
    </div>
  );
}
