# Shortlet booking platform — roadmap

## Phase 1 — core platform (in progress)
- [x] Database schema (properties, units, images, amenities, pricing rules, blocked dates, bookings, payments, refunds, reviews, discounts, airbnb calendars, notifications, roles)
- [x] Design system (playful flat marketplace)
- [x] Public homepage with search
- [x] Property search + filters
- [x] Property detail page (gallery, amenities, availability, booking widget)
- [x] Server-side pricing engine + availability engine
- [x] Booking engine + confirmation page
- [x] Auth (email/password + Google) and guest dashboard
- [x] Admin dashboard: overview, properties, bookings, pricing rules, amenities, blocked dates, payments, reviews (with host replies), discounts

## Phase 2 — payments
- [ ] Paystack integration (modular provider layer)
- [x] Server-side payment verification + webhook
- [ ] Receipts, refunds, deposit balances
- Blocked: needs Paystack secret key from the client

## Phase 3 — communications
- [ ] Transactional email templates (Resend)
- [ ] WhatsApp click-to-chat (done inline) + Business API automation
- [ ] Airbnb iCal sync per property
- Blocked: needs provider credentials and real Airbnb calendar URLs

## Phase 4 — growth
- [ ] GA4 analytics events
- [ ] Sitemap + structured data
- [ ] Advanced reporting, performance and security review
