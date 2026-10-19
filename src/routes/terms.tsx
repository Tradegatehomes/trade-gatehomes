import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — TradeGate Continental Homes" },
      { name: "description", content: "Terms and conditions for using TradeGate Continental Homes and making reservations." },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms & Conditions"
      intro="These terms explain the rules that apply when you browse, reserve or pay for a stay through TradeGate Continental Homes."
    >
      <LegalSection title="1. Using our website">
        <p>By using this website or submitting a booking, you agree to these Terms & Conditions and to any property-specific rules shown before or after booking.</p>
        <p>You must provide accurate guest, contact and payment information. You are responsible for reviewing your booking details before completing payment.</p>
      </LegalSection>

      <LegalSection title="2. Reservations">
        <p>A reservation is tied to the selected property, dates, number of guests and booking reference. Availability is subject to confirmation at the time of booking.</p>
        <p>A booking becomes confirmed once the required payment has been successfully verified and the booking status has been updated accordingly.</p>
      </LegalSection>

      <LegalSection title="3. Payments">
        <p>Payments may be made in full or, where offered, as a 50% part payment followed by the remaining balance.</p>
        <p>Where a part-payment option is selected, the outstanding balance must be paid on or before the check-in date. Payment links provided by email or on the booking page may be used to complete the balance.</p>
        <p>Payment processing is handled by our payment provider. A payment is treated as successful only after verification.</p>
      </LegalSection>

      <LegalSection title="4. Guest responsibilities">
        <p>Guests must follow the house rules, occupancy limits, check-in/check-out instructions and any property-specific restrictions supplied for the booked stay.</p>
        <p>The person making the reservation is responsible for the conduct of all guests included in the booking.</p>
      </LegalSection>

      <LegalSection title="5. Pricing">
        <p>Prices may include nightly charges and applicable fees such as cleaning, service, extra-guest or security-related charges. The booking summary shown before payment is the applicable price for that reservation.</p>
      </LegalSection>

      <LegalSection title="6. Cancellations and refunds">
        <p>Cancellations and refunds are governed by our Cancellation/Refund Policy and any property-specific cancellation terms shown for the reservation.</p>
      </LegalSection>

      <LegalSection title="7. Website availability">
        <p>We aim to keep property information, availability and pricing accurate, but temporary technical issues may occur. We may correct obvious errors or contact you where a booking requires clarification.</p>
      </LegalSection>

      <LegalSection title="8. Contact">
        <p>For booking or policy questions, contact us at <a className="font-semibold text-ink hover:underline" href="mailto:bookings@tradegatehomes.com">bookings@tradegatehomes.com</a> or call <a className="font-semibold text-ink hover:underline" href="tel:08069534435">0806 953 4435</a>.</p>
      </LegalSection>
    </LegalPage>
  );
}
