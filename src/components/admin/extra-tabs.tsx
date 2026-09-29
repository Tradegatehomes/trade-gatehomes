import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, formatNaira } from "@/lib/format";
import type { Database } from "@/integrations/supabase/types";

type RuleType = Database["public"]["Enums"]["pricing_rule_type"];
const RULE_TYPES: RuleType[] = ["weekend", "seasonal", "date_specific", "promotional"];
const card = "rounded-2xl border border-border bg-card p-5";

function usePropertyList() {
  return useQuery({
    queryKey: ["admin-properties-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("properties").select("id,name").order("name");
      if (error) throw error;
      return data;
    },
  });
}

function PropertyPicker({ value, onChange, allowAll }: { value: string; onChange: (v: string) => void; allowAll?: boolean }) {
  const props = usePropertyList();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-56"><SelectValue placeholder="Property" /></SelectTrigger>
      <SelectContent>
        {allowAll && <SelectItem value="all">All properties</SelectItem>}
        {(props.data ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export function PricingRules() {
  const qc = useQueryClient();
  const [propertyId, setPropertyId] = useState("");
  const [type, setType] = useState<RuleType>("seasonal");
  const [label, setLabel] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [price, setPrice] = useState("");
  const [modifier, setModifier] = useState("");
  const [minNights, setMinNights] = useState("");
  const q = useQuery({
    queryKey: ["admin-pricing", propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("pricing_rules").select("*").eq("property_id", propertyId).order("created_at");
      if (error) throw error;
      return data;
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-pricing", propertyId] });
  const needsDates = type !== "weekend";
  async function add() {
    if (!propertyId) return toast.error("Pick a property first.");
    if (needsDates && (!start || !end || end < start)) return toast.error("Enter a valid date range.");
    if (!price && !modifier) return toast.error("Set a nightly price or a % change.");
    const { error } = await supabase.from("pricing_rules").insert({
      property_id: propertyId, rule_type: type, label: label.trim() || null,
      start_date: needsDates ? start : null, end_date: needsDates ? end : null,
      nightly_price: price ? Number(price) : null,
      price_modifier_percent: modifier ? Number(modifier) : null,
      min_nights: minNights ? Number(minNights) : null,
    });
    if (error) return toast.error(error.message);
    toast.success("Pricing rule added");
    setLabel(""); setPrice(""); setModifier(""); setMinNights("");
    refresh();
  }
  async function remove(id: string) {
    const { error } = await supabase.from("pricing_rules").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }
  return (
    <div className="mt-6 space-y-4">
      <PropertyPicker value={propertyId} onChange={setPropertyId} />
      {propertyId && (
        <>
          <div className={`${card} flex flex-wrap items-end gap-2`}>
            <Select value={type} onValueChange={(v) => setType(v as RuleType)}>
              <SelectTrigger className="w-40 capitalize"><SelectValue /></SelectTrigger>
              <SelectContent>{RULE_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>)}</SelectContent>
            </Select>
            <Input className="w-40" placeholder="Label (e.g. Detty December)" value={label} onChange={(e) => setLabel(e.target.value)} />
            {needsDates && (
              <>
                <Input type="date" className="w-40" value={start} onChange={(e) => setStart(e.target.value)} aria-label="From" />
                <Input type="date" className="w-40" value={end} onChange={(e) => setEnd(e.target.value)} aria-label="Until" />
              </>
            )}
            <Input type="number" className="w-36" placeholder="Nightly price ₦" value={price} onChange={(e) => setPrice(e.target.value)} />
            <Input type="number" className="w-28" placeholder="or % +/-" value={modifier} onChange={(e) => setModifier(e.target.value)} />
            <Input type="number" className="w-28" placeholder="Min nights" value={minNights} onChange={(e) => setMinNights(e.target.value)} />
            <Button onClick={add}>Add rule</Button>
          </div>
          {q.data?.length === 0 && <p className="text-muted-foreground">No pricing rules — the base price applies.</p>}
          {(q.data ?? []).map((r) => (
            <div key={r.id} className={`${card} flex items-center justify-between`}>
              <p className="text-sm">
                <Badge variant="secondary" className="mr-2 capitalize">{r.rule_type.replace("_", " ")}</Badge>
                <span className="font-semibold text-ink">{r.label ?? "Untitled"}</span>
                {r.start_date ? ` · ${formatDate(r.start_date)} → ${formatDate(r.end_date!)}` : ""}
                {r.nightly_price != null ? ` · ${formatNaira(Number(r.nightly_price))}/night` : ""}
                {r.price_modifier_percent != null ? ` · ${Number(r.price_modifier_percent) > 0 ? "+" : ""}${r.price_modifier_percent}%` : ""}
                {r.min_nights ? ` · min ${r.min_nights} nights` : ""}
              </p>
              <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>Remove</Button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export function PropertyAmenities() {
  const qc = useQueryClient();
  const [propertyId, setPropertyId] = useState("");
  const [newName, setNewName] = useState("");
  const all = useQuery({
    queryKey: ["admin-amenities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("amenities").select("id,name").order("name");
      if (error) throw error;
      return data;
    },
  });
  const linked = useQuery({
    queryKey: ["admin-property-amenities", propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("property_amenities").select("amenity_id").eq("property_id", propertyId);
      if (error) throw error;
      return new Set(data.map((d) => d.amenity_id));
    },
  });
  async function toggle(amenityId: string, on: boolean) {
    const { error } = on
      ? await supabase.from("property_amenities").insert({ property_id: propertyId, amenity_id: amenityId })
      : await supabase.from("property_amenities").delete().eq("property_id", propertyId).eq("amenity_id", amenityId);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-property-amenities", propertyId] });
  }
  async function addAmenity() {
    if (!newName.trim()) return;
    const { error } = await supabase.from("amenities").insert({ name: newName.trim() });
    if (error) return toast.error(error.message);
    setNewName("");
    qc.invalidateQueries({ queryKey: ["admin-amenities"] });
  }
  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap gap-2">
        <PropertyPicker value={propertyId} onChange={setPropertyId} />
        <Input className="w-48" placeholder="New amenity name" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <Button variant="outline" onClick={addAmenity}>Add amenity</Button>
      </div>
      {propertyId ? (
        <div className={`${card} flex flex-wrap gap-2`}>
          {(all.data ?? []).map((a) => {
            const on = linked.data?.has(a.id) ?? false;
            return (
              <Button key={a.id} size="sm" variant={on ? "default" : "outline"} className="rounded-full" onClick={() => toggle(a.id, !on)}>
                {a.name}
              </Button>
            );
          })}
          {all.data?.length === 0 && <p className="text-muted-foreground">No amenities yet — add one above.</p>}
        </div>
      ) : (
        <p className="text-muted-foreground">Pick a property to choose its amenities.</p>
      )}
    </div>
  );
}

export function Payments() {
  const q = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id,reference,amount,status,provider,is_deposit,paid_at,created_at,bookings(reference,guest_name)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });
  const rows = q.data ?? [];
  const received = rows.filter((p) => p.status === "success").reduce((s, p) => s + Number(p.amount), 0);
  return (
    <div className="mt-6 space-y-3">
      <div className={card}>
        <p className="text-sm text-muted-foreground">Payments received</p>
        <p className="mt-1 font-display text-3xl font-bold text-ink">{formatNaira(received)}</p>
      </div>
      {q.isLoading && <p className="text-muted-foreground">Loading…</p>}
      {!q.isLoading && rows.length === 0 && <p className="text-muted-foreground">No payments yet.</p>}
      {rows.map((p) => (
        <div key={p.id} className={`${card} flex flex-wrap items-center justify-between gap-3`}>
          <div>
            <p className="font-semibold text-ink">{formatNaira(Number(p.amount))} · {p.bookings?.guest_name}</p>
            <p className="text-xs text-muted-foreground">
              {p.bookings?.reference} · {p.reference} · {p.provider}{p.is_deposit ? " · deposit" : ""} · {formatDate((p.paid_at ?? p.created_at).slice(0, 10))}
            </p>
          </div>
          <Badge variant={p.status === "success" ? "default" : "secondary"} className="capitalize">{p.status}</Badge>
        </div>
      ))}
    </div>
  );
}

export function Discounts() {
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<"percent" | "amount">("percent");
  const [value, setValue] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [limit, setLimit] = useState("");
  const [minNights, setMinNights] = useState("");
  const [propertyId, setPropertyId] = useState("all");
  const q = useQuery({
    queryKey: ["admin-discounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discount_codes")
        .select("id,code,percent_off,amount_off,times_used,usage_limit,active,start_date,end_date,min_nights,properties(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-discounts"] });
  async function add() {
    const v = Number(value);
    if (!code.trim() || !(v > 0) || (kind === "percent" && v > 100)) return toast.error("Enter a code and a valid discount.");
    if (start && end && end < start) return toast.error("End date must be after start date.");
    const { error } = await supabase.from("discount_codes").insert({
      code: code.trim().toUpperCase(),
      percent_off: kind === "percent" ? v : null,
      amount_off: kind === "amount" ? v : null,
      start_date: start || null, end_date: end || null,
      usage_limit: limit ? Number(limit) : null,
      min_nights: minNights ? Number(minNights) : null,
      property_id: propertyId === "all" ? null : propertyId,
    });
    if (error) return toast.error(error.message);
    toast.success("Discount code added");
    setCode(""); setValue(""); setLimit(""); setMinNights("");
    refresh();
  }
  async function toggle(id: string, active: boolean) {
    const { error } = await supabase.from("discount_codes").update({ active }).eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }
  async function remove(id: string) {
    const { error } = await supabase.from("discount_codes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }
  return (
    <div className="mt-6 space-y-3">
      <div className={`${card} flex flex-wrap items-end gap-2`}>
        <Input className="w-36" placeholder="CODE" value={code} onChange={(e) => setCode(e.target.value)} />
        <Select value={kind} onValueChange={(v) => setKind(v as "percent" | "amount")}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="percent">% off</SelectItem>
            <SelectItem value="amount">₦ off</SelectItem>
          </SelectContent>
        </Select>
        <Input className="w-28" type="number" placeholder="Value" value={value} onChange={(e) => setValue(e.target.value)} />
        <Input type="date" className="w-40" value={start} onChange={(e) => setStart(e.target.value)} aria-label="Valid from" />
        <Input type="date" className="w-40" value={end} onChange={(e) => setEnd(e.target.value)} aria-label="Valid until" />
        <Input className="w-28" type="number" placeholder="Max uses" value={limit} onChange={(e) => setLimit(e.target.value)} />
        <Input className="w-28" type="number" placeholder="Min nights" value={minNights} onChange={(e) => setMinNights(e.target.value)} />
        <PropertyPicker value={propertyId} onChange={setPropertyId} allowAll />
        <Button onClick={add}>Add code</Button>
      </div>
      {(q.data ?? []).map((d) => (
        <div key={d.id} className={`${card} flex flex-wrap items-center justify-between gap-3`}>
          <p className="text-sm">
            <span className="font-display font-bold text-ink">{d.code}</span> ·{" "}
            {d.percent_off ? `${d.percent_off}% off` : d.amount_off ? `${formatNaira(Number(d.amount_off))} off` : ""} · used {d.times_used}
            {d.usage_limit ? `/${d.usage_limit}` : ""}
            {d.start_date || d.end_date ? ` · ${d.start_date ? formatDate(d.start_date) : "now"} → ${d.end_date ? formatDate(d.end_date) : "no end"}` : ""}
            {d.min_nights ? ` · min ${d.min_nights} nights` : ""}
            {` · ${d.properties?.name ?? "all properties"}`}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant={d.active ? "default" : "outline"} onClick={() => toggle(d.id, !d.active)}>{d.active ? "Active" : "Inactive"}</Button>
            <Button size="sm" variant="ghost" onClick={() => remove(d.id)}>Delete</Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Reviews() {
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const q = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id,guest_name,rating,comment,approved,admin_response,created_at,properties(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-reviews"] });
  async function patch(id: string, values: { approved?: boolean; admin_response?: string | null }) {
    const { error } = await supabase.from("reviews").update(values).eq("id", id);
    if (error) return toast.error(error.message);
    if (values.admin_response !== undefined) toast.success("Reply saved");
    refresh();
  }
  const rows = q.data ?? [];
  return (
    <div className="mt-6 space-y-3">
      {!q.isLoading && rows.length === 0 && <p className="text-muted-foreground">No reviews yet.</p>}
      {rows.map((r) => (
        <div key={r.id} className={`${card} space-y-3`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-2xl">
              <p className="font-semibold text-ink">{r.guest_name} · {r.rating}/5 · {r.properties?.name}</p>
              <p className="text-sm text-muted-foreground">{r.comment}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={r.approved ? "default" : "secondary"}>{r.approved ? "Published" : "Hidden"}</Badge>
              <Button size="sm" variant="outline" onClick={() => patch(r.id, { approved: !r.approved })}>{r.approved ? "Hide" : "Publish"}</Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Reply as host (shown under the review)"
              value={drafts[r.id] ?? r.admin_response ?? ""}
              onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
            />
            <Button size="sm" variant="outline" onClick={() => patch(r.id, { admin_response: (drafts[r.id] ?? r.admin_response ?? "").trim() || null })}>
              Save reply
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
