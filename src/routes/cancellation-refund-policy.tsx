import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const Route = createFileRoute("/cancellation-refund-policy")({
  head: () => ({
    meta: [
      { title: "Cancellation & Refund Policy — TradeGate Continental Homes" },
      { name: "description", content: "Cancellation, refund and payment-balance policy for TradeGate Continental Homes bookings." },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: CancellationRefundPage,
});

function CancellationRefundPage() {
  return (
    <LegalPage
      eyebrow="Booking policy"
      title="Cancellation/Refund Policy"
      intro="This policy explains how cancellation requests, refunds and outstanding balances are handled for TradeGate Continental Homes reservations."
    >
      <LegalSection title="1. Before cancelling">
        <p>Please review the cancellation terms attached to your specific property and booking. Property-specific terms may vary and form part of your reservation conditions.</p>
      </LegalSection>

      <LegalSection title="2. Cancellation requests">
        <p>To request a cancellation, contact our bookings team as early as possible and provide your booking reference, guest name and stay dates.</p>
        <p>A cancellation request is not complete until it has been acknowledged and the booking status has been updated.</p>
      </LegalSection>

      <LegalSection title="3. Refund eligibility">
        <p>Refund eligibility depends on the timing of the cancellation, the property-specific cancellation terms, the reason for cancellation and whether any non-refundable charges have already been incurred.</p>
        <p>Where a refund is approved, the refundable amount will be communicated before processing.</p>
      </LegalSection>

      <LegalSection title="4. Part payments">
        <p>If you selected the 50% part-payment option, the remaining balance is due on or before your check-in date unless otherwise agreed in writing.</p>
        <p>If a booking is cancelled before the remaining balance is paid, any refund of the first payment will still be subject to the applicable cancellation terms.</p>
      </LegalSection>

      <LegalSection title="5. Failed or duplicate payments">
        <p>If you believe you were charged more than once, or a payment appears to have failed while your account was charged, contact us with the booking and payment references so the transaction can be reviewed.</p>
      </LegalSection>

      <LegalSection title="6. Refund processing">
        <p>Approved refunds are returned through the applicable payment channel where possible. Processing time may vary depending on the payment provider and financial institution.</p>
      </LegalSection>

      <LegalSection title="7. Property-initiated cancellations">
        <p>If TradeGate Continental Homes must cancel a confirmed reservation because the booked accommodation cannot be provided, we will contact the guest and work toward an appropriate resolution, which may include an alternative stay or refund where applicable.</p>
      </LegalSection>

      <LegalSection title="8. Contact">
        <p>Send cancellation or refund requests to <a className="font-semibold text-ink hover:underline" href="mailto:bookings@tradegatehomes.com">bookings@tradegatehomes.com</a> or call <a className="font-semibold text-ink hover:underline" href="tel:08069534435">0806 953 4435</a>.</p>
      </LegalSection>
    </LegalPage>
  );
}
