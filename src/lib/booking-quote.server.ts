// Server-only booking quote pipeline shared by quote and create flows.
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  computeQuote,
  assertBookable,
  type PricingRuleRow,
  type DiscountRow,
  type Quote,
} from "./pricing.server";

export const quoteSchema = z.object({
  slug: z.string(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().int().min(1).max(20),
  discountCode: z.string().optional(),
  payDeposit: z.boolean().optional(),
});

export const bookingSchema = quoteSchema.extend({
  guestName: z.string().min(2),
  guestEmail: z.string().email(),
  guestPhone: z.string().min(7),
  notes: z.string().optional(),
});

export const num = (v: unknown) => Number(v ?? 0);

export function pub() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] || import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  const url = process.env["SUPABASE_URL"] || import.meta.env["VITE_SUPABASE_URL"];
  if (!url || !key) throw new Error("Missing Supabase environment variables.");
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Opaque sb_ keys are not JWTs; send apikey, not a Bearer header.
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
  return client;
}

export async function propertyBySlug(slug: string) {
  const { data, error } = await pub()
    .from("properties")
    .select(
      `*, property_images(url,alt_text,sort_order,is_primary),
       property_amenities(amenities(name,icon)),
       reviews(guest_name,rating,comment,created_at),
       blocked_dates(start_date,end_date)`,
    )
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new Error("Could not load this property. Please try again.");
  return data;
}

export async function buildQuote(
  input: z.infer<typeof quoteSchema>,
): Promise<{ quote: Quote; propertyId: string }> {
  const row = await propertyBySlug(input.slug);
  if (!row) throw new Error("Property not found.");
  const p = row as any;

  const nights = Math.round(
    (new Date(input.checkOut).getTime() - new Date(input.checkIn).getTime()) / 86400000,
  );
  if (nights < 1) throw new Error("Check-out must be after check-in.");
  if (nights < p.min_nights) throw new Error(`This stay has a ${p.min_nights}-night minimum.`);
  if (input.guests > p.max_guests)
    throw new Error(`This place sleeps up to ${p.max_guests} guests.`);

  await assertBookable(pub(), p.id, input.checkIn, input.checkOut);

  const { data: rules } = await pub()
    .from("pricing_rules")
    .select("rule_type,start_date,end_date,nightly_price,price_modifier_percent,min_nights")
    .eq("property_id", p.id);

  let discount: DiscountRow | null = null;
  const code = input.discountCode?.trim().toUpperCase();
  if (code) {
    const { data: dc } = await pub()
      .from("discount_codes")
      .select("*")
      .eq("code", code)
      .eq("active", true)
      .maybeSingle();
    const d = dc as DiscountRow | null;
    const today = new Date().toISOString().slice(0, 10);
    if (!d) throw new Error(`Code ${code} was not found.`);
    const withinDates =
      (!d.start_date || d.start_date <= today) && (!d.end_date || d.end_date >= today);
    const propertyMatch = !d.property_id || d.property_id === p.id;
    const withinLimit = d.usage_limit == null || d.times_used < d.usage_limit;
    const meetsNights = d.min_nights == null || nights >= d.min_nights;
    if (!withinDates || !propertyMatch || !withinLimit || !meetsNights) {
      throw new Error(`Code ${code} is not valid for this stay.`);
    }
    discount = d;
  }

  const quote = computeQuote(
    {
      base_price: num(p.base_price),
      cleaning_fee: num(p.cleaning_fee),
      service_fee_percent: num(p.service_fee_percent),
      security_deposit: num(p.security_deposit),
      extra_guest_fee: num(p.extra_guest_fee),
      included_guests: p.included_guests ?? 2,
      min_nights: p.min_nights,
      deposit_required: p.deposit_required,
      deposit_percent: num(p.deposit_percent),
      deposit_fixed: p.deposit_fixed,
      balance_due_days: p.balance_due_days ?? 7,
    },
    (rules ?? []) as unknown as PricingRuleRow[],
    discount,
    input.checkIn,
    input.checkOut,
    input.guests,
    input.payDeposit ?? false,
  );

  if (discount && discount.min_amount != null && quote.total_amount < Number(discount.min_amount)) {
    throw new Error("Your booking total is below this discount code's minimum.");
  }
  return { quote, propertyId: p.id };
}
