import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — TradeGate Continental Homes" },
      { name: "description", content: "How TradeGate Continental Homes collects and uses guest information." },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="This policy explains the personal information we collect when you use our website, make a booking or contact TradeGate Continental Homes."
    >
      <LegalSection title="1. Information we collect">
        <p>We may collect information you provide directly, including your name, email address, phone number, booking dates, number of guests, booking preferences and messages or notes related to your stay.</p>
        <p>When you make a payment, we store booking and payment references, payment status, amount paid and related transaction information. We do not need to store your full payment-card details.</p>
      </LegalSection>

      <LegalSection title="2. How we use your information">
        <p>We use guest information to create and manage bookings, verify payments, send booking confirmations and receipts, provide customer support, communicate about outstanding balances and operate our properties.</p>
        <p>We may also use operational data to improve our booking process, prevent misuse and maintain the security of our website and services.</p>
      </LegalSection>

      <LegalSection title="3. Service providers">
        <p>We may share information with service providers that help us operate the booking experience, such as payment processors, email-delivery providers, hosting providers and database infrastructure providers.</p>
        <p>These providers receive only the information needed to perform their role.</p>
      </LegalSection>

      <LegalSection title="4. Data retention">
        <p>We retain booking and transaction records for as long as reasonably necessary for customer service, operational, accounting, fraud-prevention and legal purposes.</p>
      </LegalSection>

      <LegalSection title="5. Your choices">
        <p>You may contact us to ask about personal information associated with your booking or to request a correction where information is inaccurate.</p>
      </LegalSection>

      <LegalSection title="6. Security">
        <p>We use reasonable technical and organisational measures to protect information held through our website and connected services. No online system can be guaranteed to be completely secure.</p>
      </LegalSection>

      <LegalSection title="7. Updates to this policy">
        <p>We may update this Privacy Policy when our services, systems or operating requirements change. The latest version will always be published on this page.</p>
      </LegalSection>

      <LegalSection title="8. Contact">
        <p>For privacy questions, contact <a className="font-semibold text-ink hover:underline" href="mailto:bookings@tradegatehomes.com">bookings@tradegatehomes.com</a>.</p>
      </LegalSection>
    </LegalPage>
  );
}
