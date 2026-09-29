// Server-only pricing engine. Never trust browser-submitted prices.
import { eachDate } from "./format";

export interface PricingRuleRow {
  rule_type: "weekend" | "seasonal" | "date_specific" | "promotional";
  start_date: string | null;
  end_date: string | null;
  nightly_price: string | number | null;
  price_modifier_percent: string | number | null;
  min_nights: number | null;
}

export interface DiscountRow {
  code: string;
  percent_off: string | number | null;
  amount_off: string | number | null;
  start_date: string | null;
  end_date: string | null;
  usage_limit: number | null;
  times_used: number;
  min_amount: string | number | null;
  min_nights: number | null;
  property_id: string | null;
  active: boolean;
}

export interface QuoteInput {
  base_price: number;
  cleaning_fee: number;
  service_fee_percent: number;
  security_deposit: number;
  extra_guest_fee: number;
  included_guests: number;
  min_nights: number;
  deposit_required: boolean;
  deposit_percent: number;
  deposit_fixed: string | number | null;
  balance_due_days: number;
}

export interface Quote {
  nights: number;
  nightly: { date: string; price: number }[];
  nightly_subtotal: number;
  nightly_average: number;
  cleaning_fee: number;
  service_fee: number;
  extra_guests: number;
  extra_guest_fee: number;
  discount_amount: number;
  discount_code: string | null;
  security_deposit: number;
  total_amount: number;
  pay_deposit_available: boolean;
  amount_due_now: number;
  balance_amount: number;
  balance_due_date: string | null;
  deposit_amount_now: number;
  deposit_balance_amount: number;
  deposit_balance_due_date: string | null;
  currency: "NGN";
}

const inRange = (date: string, start: string | null, end: string | null) => {
  if (!start || !end) return false;
  return date >= start && date <= end;
};

export function computeQuote(
  property: QuoteInput,
  rules: PricingRuleRow[],
  discount: DiscountRow | null,
  checkIn: string,
  checkOut: string,
  guests: number,
  payDeposit: boolean,
): Quote {
  const dates = eachDate(checkIn, checkOut);
  const nights = dates.length;

  const nightly: { date: string; price: number }[] = [];
  for (const date of dates) {
    let price = Number(property.base_price);
    const dow = new Date(date + "T00:00:00").getDay();
    let seasonal: number | null = null;
    let dateSpecific: number | null = null;

    for (const rule of rules) {
      if (!inRange(date, rule.start_date, rule.end_date)) continue;
      const pct = Number(rule.price_modifier_percent ?? 0);
      switch (rule.rule_type) {
        case "weekend":
          if ((dow === 5 || dow === 6) && pct !== 0) price = price * (1 + pct / 100);
          break;
        case "seasonal":
          seasonal = rule.nightly_price != null ? Number(rule.nightly_price) : price * (1 + pct / 100);
          break;
        case "date_specific":
          dateSpecific = rule.nightly_price != null ? Number(rule.nightly_price) : price * (1 + pct / 100);
          break;
        case "promotional":
          price = price * (1 - pct / 100);
          break;
      }
    }
    if (seasonal != null) price = seasonal;
    if (dateSpecific != null) price = dateSpecific;

    nightly.push({ date, price: Math.round(price) });
  }

  const nightlySubtotal = nightly.reduce((sum, n) => sum + n.price, 0);
  const extraGuests = Math.max(0, guests - property.included_guests);
  const extraGuestFee = extraGuests * Number(property.extra_guest_fee) * nights;
  const cleaningFee = Number(property.cleaning_fee);
  const serviceFee = Math.round((nightlySubtotal * Number(property.service_fee_percent)) / 100);

  let discountAmount = 0;
  let discountCode: string | null = null;
  if (discount) {
    const base = nightlySubtotal + extraGuestFee;
    discountAmount = discount.percent_off != null
      ? Math.round((base * Number(discount.percent_off)) / 100)
      : Math.min(Number(discount.amount_off ?? 0), base);
    discountCode = discount.code;
  }

  const total = nightlySubtotal + cleaningFee + serviceFee + extraGuestFee - discountAmount;

  // Deposit breakdown is computed whenever the property offers a deposit,
  // so the UI can label both payment options correctly.
  let amountDueNow = total;
  let balanceAmount = 0;
  let balanceDueDate: string | null = null;
  let depositAmountNow = 0;
  let depositBalanceAmount = 0;
  let depositBalanceDueDate: string | null = null;
  if (property.deposit_required) {
    depositAmountNow = property.deposit_fixed != null
      ? Math.round(Number(property.deposit_fixed))
      : Math.round((total * Number(property.deposit_percent)) / 100);
    depositBalanceAmount = total - depositAmountNow;
    const due = new Date(checkIn + "T00:00:00");
    due.setDate(due.getDate() - property.balance_due_days);
    depositBalanceDueDate = due.toISOString().slice(0, 10);
    if (payDeposit) {
      amountDueNow = depositAmountNow;
      balanceAmount = depositBalanceAmount;
      balanceDueDate = depositBalanceDueDate;
    }
  }

  return {
    nights,
    nightly,
    nightly_subtotal: nightlySubtotal,
    nightly_average: nights ? Math.round(nightlySubtotal / nights) : 0,
    cleaning_fee: cleaningFee,
    service_fee: serviceFee,
    extra_guests: extraGuests,
    extra_guest_fee: extraGuestFee,
    discount_amount: discountAmount,
    discount_code: discountCode,
    security_deposit: Number(property.security_deposit),
    total_amount: total,
    pay_deposit_available: property.deposit_required,
    amount_due_now: amountDueNow,
    balance_amount: balanceAmount,
    balance_due_date: balanceDueDate,
    deposit_amount_now: depositAmountNow,
    deposit_balance_amount: depositBalanceAmount,
    deposit_balance_due_date: depositBalanceDueDate,
    currency: "NGN",
  };
}

// Overlap = existing.check_in < new checkOut AND existing.check_out > new checkIn.
export async function assertBookable(
  client: { from: (t: string) => any },
  propertyId: string,
  checkIn: string,
  checkOut: string,
): Promise<void> {
  const activeStatuses = ["pending", "confirmed", "partially_paid", "fully_paid", "completed"];

  const { data: bookings } = await client
    .from("bookings")
    .select("id")
    .eq("property_id", propertyId)
    .in("status", activeStatuses)
    .lt("check_in", checkOut)
    .gt("check_out", checkIn)
    .limit(1);
  if (bookings && bookings.length > 0) {
    throw new Error("Those dates are already booked. Please choose different dates.");
  }

  const { data: blocked } = await client
    .from("blocked_dates")
    .select("id")
    .eq("property_id", propertyId)
    .lt("start_date", checkOut)
    .gt("end_date", checkIn)
    .limit(1);
  if (blocked && blocked.length > 0) {
    throw new Error("Those dates are not available. Please choose different dates.");
  }
}
