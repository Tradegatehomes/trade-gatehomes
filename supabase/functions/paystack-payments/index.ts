import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function secretKey() {
  const modern = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (modern) {
    const keys = JSON.parse(modern);
    if (keys.default) return keys.default as string;
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
}

async function hmacSha512Hex(secret: string, value: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY");
  if (!paystackSecret) return json({ error: "Paystack test key has not been configured yet." }, 503);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const adminKey = secretKey();
  if (!supabaseUrl || !adminKey) return json({ error: "Server configuration is incomplete." }, 500);

  const supabase = createClient(supabaseUrl, adminKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const rawBody = await req.text();
  let body: any;
  try {
    body = JSON.parse(rawBody || "{}");
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  async function settlePayment(reference: string, paystackData: any) {
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("id,booking_id,reference,amount,currency,is_deposit,status")
      .eq("reference", reference)
      .maybeSingle();
    if (paymentError || !payment) throw new Error("Payment record not found.");

    if (payment.status === "success") return { alreadyProcessed: true, payment };

    const expectedAmount = Math.round(Number(payment.amount) * 100);
    const receivedAmount = Number(paystackData.amount);
    const receivedCurrency = String(paystackData.currency ?? "").toUpperCase();

    if (
      String(paystackData.status) !== "success" ||
      receivedAmount !== expectedAmount ||
      receivedCurrency !== String(payment.currency).toUpperCase()
    ) {
      await supabase
        .from("payments")
        .update({ status: "failed", raw_response: paystackData })
        .eq("id", payment.id);
      throw new Error("Payment verification failed.");
    }

    const paidAt = paystackData.paid_at || paystackData.paidAt || new Date().toISOString();
    const { error: updatePaymentError } = await supabase
      .from("payments")
      .update({ status: "success", paid_at: paidAt, raw_response: paystackData })
      .eq("id", payment.id);
    if (updatePaymentError) throw updatePaymentError;

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id,total_amount")
      .eq("id", payment.booking_id)
      .single();
    if (bookingError || !booking) throw new Error("Booking not found.");

    const { data: successfulPayments, error: totalsError } = await supabase
      .from("payments")
      .select("amount")
      .eq("booking_id", payment.booking_id)
      .eq("status", "success");
    if (totalsError) throw totalsError;

    const totalPaid = (successfulPayments ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
    const fullyPaid = totalPaid + 0.005 >= Number(booking.total_amount);
    const { error: updateBookingError } = await supabase
      .from("bookings")
      .update({ status: fullyPaid ? "fully_paid" : "partially_paid" })
      .eq("id", booking.id);
    if (updateBookingError) throw updateBookingError;

    // Best-effort email notification for both guest and bookings inbox.
    try {
      const publishableKeys = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
      const publishableKey = publishableKeys
        ? JSON.parse(publishableKeys).default
        : Deno.env.get("SUPABASE_ANON_KEY");
      if (publishableKey) {
        await fetch(`${supabaseUrl}/functions/v1/booking-emails`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: publishableKey },
          body: JSON.stringify({
            event: "payment_confirmed",
            bookingReference: booking.reference,
            paymentReference: reference,
          }),
        });
      }
    } catch (error) {
      console.error("Payment email notification failed", error);
    }

    return { alreadyProcessed: false, payment, totalPaid, fullyPaid };
  }

  const signature = req.headers.get("x-paystack-signature");
  if (signature) {
    const expected = await hmacSha512Hex(paystackSecret, rawBody);
    if (expected !== signature) return json({ error: "Invalid webhook signature." }, 401);

    if (body?.event === "charge.success" && body?.data?.reference) {
      try {
        await settlePayment(String(body.data.reference), body.data);
      } catch (error) {
        console.error("Paystack webhook processing failed", error);
        return json({ error: "Webhook processing failed." }, 500);
      }
    }
    return json({ received: true });
  }

  if (body?.action === "initialize") {
    const bookingReference = String(body.bookingReference ?? "").trim();
    if (!bookingReference) return json({ error: "Booking reference is required." }, 400);

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id,reference,guest_email,total_amount,amount_due_now,balance_amount,pay_deposit,status")
      .eq("reference", bookingReference)
      .maybeSingle();
    if (bookingError || !booking) return json({ error: "Booking not found." }, 404);
    if (["cancelled", "refunded", "completed"].includes(String(booking.status))) {
      return json({ error: "This booking cannot accept a payment." }, 400);
    }

    const { data: successfulPayments, error: paymentsError } = await supabase
      .from("payments")
      .select("amount,is_deposit")
      .eq("booking_id", booking.id)
      .eq("status", "success");
    if (paymentsError) throw paymentsError;

    const totalPaid = (successfulPayments ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
    const totalAmount = Number(booking.total_amount);
    const remaining = Math.max(0, Math.round((totalAmount - totalPaid) * 100) / 100);
    if (remaining <= 0) return json({ paid: true, message: "This booking is already fully paid." });

    const hasSuccessfulPayment = (successfulPayments ?? []).length > 0;
    const firstDeposit = Boolean(booking.pay_deposit) && !hasSuccessfulPayment;
    const amount = firstDeposit ? Math.min(Number(booking.amount_due_now), remaining) : remaining;
    if (!(amount > 0)) return json({ error: "No payment amount is due." }, 400);

    const paymentReference = `TG-${booking.reference}-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
    const callbackBase = Deno.env.get("PAYSTACK_CALLBACK_BASE_URL") || "https://www.tradegatehomes.com";
    const callbackUrl = `${callbackBase}/booking/${encodeURIComponent(booking.reference)}`;

    const initResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: booking.guest_email,
        amount: String(Math.round(amount * 100)),
        currency: "NGN",
        reference: paymentReference,
        callback_url: callbackUrl,
        metadata: JSON.stringify({
          booking_reference: booking.reference,
          booking_id: booking.id,
          payment_type: firstDeposit ? "deposit" : hasSuccessfulPayment ? "balance" : "full",
        }),
      }),
    });
    const initJson = await initResponse.json();
    if (!initResponse.ok || !initJson?.status || !initJson?.data?.authorization_url) {
      console.error("Paystack initialize failed", initJson);
      return json({ error: initJson?.message || "Could not initialize payment." }, 502);
    }

    const { error: insertError } = await supabase.from("payments").insert({
      booking_id: booking.id,
      reference: paymentReference,
      provider: "paystack",
      amount,
      currency: "NGN",
      is_deposit: firstDeposit,
      status: "pending",
      raw_response: initJson,
    });
    if (insertError) {
      console.error("Payment record insert failed", insertError);
      return json({ error: "Could not create payment record." }, 500);
    }

    return json({
      authorizationUrl: initJson.data.authorization_url,
      reference: paymentReference,
      amount,
      isDeposit: firstDeposit,
    });
  }

  if (body?.action === "verify") {
    const reference = String(body.reference ?? "").trim();
    if (!reference) return json({ error: "Payment reference is required." }, 400);

    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${paystackSecret}` } },
    );
    const verifyJson = await verifyResponse.json();
    if (!verifyResponse.ok || !verifyJson?.status || !verifyJson?.data) {
      return json({ error: verifyJson?.message || "Could not verify payment." }, 502);
    }

    try {
      const settled = await settlePayment(reference, verifyJson.data);
      return json({
        success: true,
        status: verifyJson.data.status,
        fullyPaid: Boolean(settled.fullyPaid),
        alreadyProcessed: Boolean(settled.alreadyProcessed),
      });
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Payment verification failed." }, 400);
    }
  }

  return json({ error: "Unsupported action." }, 400);
});
