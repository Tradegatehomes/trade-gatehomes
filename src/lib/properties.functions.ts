import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  pub,
  num,
  propertyBySlug,
  buildQuote,
  quoteSchema,
  bookingSchema,
} from "./booking-quote.server";

export interface PropertyCardDto {
  id: string;
  slug: string;
  name: string;
  property_type: string;
  city: string;
  state: string | null;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  base_price: number;
  featured: boolean;
  image: string | null;
  images: string[];
}

export interface PropertyDetailDto extends PropertyCardDto {
  description: string | null;
  address: string | null;
  country: string;
  min_nights: number;
  included_guests: number;
  extra_guest_fee: number;
  security_deposit: number;
  deposit_required: boolean;
  deposit_percent: number;
  check_in_time: string;
  check_out_time: string;
  house_rules: string | null;
  cancellation_policy: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  images: { url: string; alt_text: string | null }[];
  amenities: { name: string; icon: string | null }[];
  reviews: { guest_name: string; rating: number; comment: string | null; created_at: string }[];
  blocked_dates: { start_date: string; end_date: string }[];
  average_rating: number | null;
}

export const listProperties = createServerFn({ method: "GET" })
  .inputValidator(
    z
      .object({
        city: z.string().optional(),
        guests: z.number().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        propertyType: z.string().optional(),
        sort: z.enum(["featured", "price_asc", "price_desc"]).optional(),
        limit: z.number().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }): Promise<PropertyCardDto[]> => {
    const db = pub();
    let query = db
      .from("properties")
      .select(
        `id,slug,name,property_type,city,state,bedrooms,bathrooms,max_guests,base_price,featured,
         property_images(url,alt_text,sort_order,is_primary)`,
      )
      .eq("status", "active");

    if (data?.city) query = query.ilike("city", `%${data.city}%`);
    if (data?.guests) query = query.gte("max_guests", data.guests);
    if (data?.minPrice != null) query = query.gte("base_price", data.minPrice);
    if (data?.maxPrice != null) query = query.lte("base_price", data.maxPrice);
    if (data?.propertyType) query = query.eq("property_type", data.propertyType);

    const sort = data?.sort ?? "featured";
    if (sort === "price_asc") query = query.order("base_price", { ascending: true });
    else if (sort === "price_desc") query = query.order("base_price", { ascending: false });
    else query = query.order("featured", { ascending: false }).order("base_price", { ascending: true });

    const { data: rows, error } = await query.limit(data?.limit ?? 24);
    if (error) throw new Error("Could not load properties. Please try again.");

    return (rows ?? []).map((r) => {
      const images = ((r as any).property_images ?? []) as {
        url: string;
        sort_order: number;
        is_primary: boolean;
      }[];
      const sorted = [...images].sort(
        (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
      );
      return {
        id: r.id,
        slug: r.slug,
        name: r.name,
        property_type: r.property_type,
        city: r.city,
        state: r.state,
        bedrooms: r.bedrooms,
        bathrooms: r.bathrooms,
        max_guests: r.max_guests,
        base_price: num(r.base_price),
        featured: r.featured,
        image: sorted[0]?.url ?? null,
        images: sorted.map((img) => img.url),
      };
    });
  });

export const getProperty = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }): Promise<PropertyDetailDto | null> => {
    const row = await propertyBySlug(data.slug);
    if (!row) return null;
    const r = row as any;

    const images = [...(r.property_images ?? [])].sort(
      (a: any, b: any) =>
        Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
    );
    const reviews = (r.reviews ?? []).sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    const ratings = reviews.map((x: any) => Number(x.rating));
    const today = new Date().toISOString().slice(0, 10);

    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      property_type: r.property_type,
      city: r.city,
      state: r.state,
      description: r.description,
      address: r.address,
      country: r.country,
      bedrooms: r.bedrooms,
      bathrooms: r.bathrooms,
      max_guests: r.max_guests,
      base_price: num(r.base_price),
      featured: r.featured,
      min_nights: r.min_nights,
      included_guests: r.included_guests ?? 2,
      extra_guest_fee: num(r.extra_guest_fee),
      security_deposit: num(r.security_deposit),
      deposit_required: r.deposit_required,
      deposit_percent: num(r.deposit_percent),
      check_in_time: r.check_in_time,
      check_out_time: r.check_out_time,
      house_rules: r.house_rules,
      cancellation_policy: r.cancellation_policy,
      phone: r.phone,
      whatsapp: r.whatsapp,
      email: r.email,
      image: images[0]?.url ?? null,
      images: images.map((i: any) => ({ url: i.url, alt_text: i.alt_text })),
      amenities: (r.property_amenities ?? []).map((pa: any) => pa.amenities).filter(Boolean),
      reviews,
      blocked_dates: (r.blocked_dates ?? [])
        .filter((b: any) => b.end_date >= today)
        .map((b: any) => ({ start_date: b.start_date, end_date: b.end_date })),
      average_rating: ratings.length
        ? Math.round((ratings.reduce((s: number, v: number) => s + v, 0) / ratings.length) * 10) / 10
        : null,
    };
  });

export const quoteBooking = createServerFn({ method: "POST" })
  .inputValidator(quoteSchema.parse)
  .handler(async ({ data }) => {
    // Expected guest-facing problems (taken dates, bad code, min nights) are returned, not thrown.
    try {
      const { quote } = await buildQuote(data);
      return { ok: true as const, quote, error: null };
    } catch (err) {
      return {
        ok: false as const,
        quote: null,
        error: err instanceof Error ? err.message : "Could not price those dates.",
      };
    }
  });

export const createBooking = createServerFn({ method: "POST" })
  .inputValidator(bookingSchema.parse)
  .handler(async ({ data }) => {
    // Server-side re-pricing + availability check; browser prices are never trusted.
    let built: Awaited<ReturnType<typeof buildQuote>>;
    try {
      built = await buildQuote(data);
    } catch (err) {
      return { ok: false as const, reference: null, error: err instanceof Error ? err.message : "Those dates are not available." };
    }
    const { quote, propertyId } = built;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Link to the signed-in guest when a valid session token accompanies the request.
    let userId: string | null = null;
    try {
      const { getRequestHeader } = await import("@tanstack/react-start/server");
      const auth = getRequestHeader("authorization");
      const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
      if (token) {
        const { data: u } = await supabaseAdmin.auth.getUser(token);
        userId = u.user?.id ?? null;
      }
    } catch {
      userId = null;
    }
    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .insert({
        reference: "", // filled by the bookings_set_reference trigger
        property_id: propertyId,
        user_id: userId,
        guest_name: data.guestName,
        guest_email: data.guestEmail,
        guest_phone: data.guestPhone,
        check_in: data.checkIn,
        check_out: data.checkOut,
        guests: data.guests,
        nights: quote.nights,
        nightly_subtotal: quote.nightly_subtotal,
        cleaning_fee: quote.cleaning_fee,
        service_fee: quote.service_fee,
        extra_guest_fee: quote.extra_guest_fee,
        discount_amount: quote.discount_amount,
        discount_code: quote.discount_code,
        security_deposit: quote.security_deposit,
        total_amount: quote.total_amount,
        amount_due_now: quote.amount_due_now,
        balance_amount: quote.balance_amount,
        balance_due_date: quote.balance_due_date,
        pay_deposit: quote.pay_deposit_available && (data.payDeposit ?? false),
        status: "pending",
        notes: data.notes ?? null,
      })
      .select("reference")
      .single();

    if (error) {
      if (error.code === "23P01") {
        return { ok: false as const, reference: null, error: "Those dates were just booked. Please choose different dates." };
      }
      return { ok: false as const, reference: null, error: "Could not complete the booking. Please try again." };
    }

    // Count discount code usage so usage limits stay accurate.
    if (quote.discount_code) {
      await supabaseAdmin.rpc("increment_discount_usage", { code: quote.discount_code });
    }

    return { ok: true as const, reference: booking.reference, error: null };
  });

export const getBookingByReference = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ reference: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .select(
        `reference,status,guest_name,guest_email,check_in,check_out,guests,nights,
         total_amount,amount_due_now,balance_amount,balance_due_date,pay_deposit,
         discount_code,security_deposit,created_at,
         properties(name,city,state,check_in_time,check_out_time,phone,whatsapp,property_images(url,alt_text,is_primary,sort_order))`,
      )
      .eq("reference", data.reference)
      .maybeSingle();
    if (error || !booking) return null;
    const b = booking as any;
    const images = [...(b.properties?.property_images ?? [])].sort(
      (x: any, y: any) => Number(y.is_primary) - Number(x.is_primary) || x.sort_order - y.sort_order,
    );
    return {
      reference: b.reference,
      status: b.status,
      guestName: b.guest_name,
      guestEmail: b.guest_email,
      checkIn: b.check_in,
      checkOut: b.check_out,
      guests: b.guests,
      nights: b.nights,
      totalAmount: num(b.total_amount),
      amountDueNow: num(b.amount_due_now),
      balanceAmount: num(b.balance_amount),
      balanceDueDate: b.balance_due_date,
      payDeposit: b.pay_deposit,
      discountCode: b.discount_code,
      securityDeposit: num(b.security_deposit),
      createdAt: b.created_at,
      property: {
        name: b.properties?.name,
        city: b.properties?.city,
        state: b.properties?.state,
        checkInTime: b.properties?.check_in_time,
        checkOutTime: b.properties?.check_out_time,
        phone: b.properties?.phone,
        whatsapp: b.properties?.whatsapp,
        image: images[0]?.url ?? null,
      },
    };
  });
