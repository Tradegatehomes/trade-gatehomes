import { Link } from "@tanstack/react-router";
import { Mail, MessageCircle, Phone } from "lucide-react";

const WHATSAPP = "+2347058860184";
const EMAIL = "tradegateconcept@gmail.com";
const whatsappLink = `https://wa.me/${WHATSAPP.replace(/\D/g, "")}`;

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/70 bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <img src="/tradegate-icon.svg" alt="" aria-hidden="true" className="h-20 w-28 shrink-0 object-contain object-left mix-blend-multiply" />
            <div className="leading-tight">
              <p className="font-display text-xl font-bold tracking-wide text-ink">TRADEGATE</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">Continental Homes</p>
            </div>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Comfort • Class • Convenience — book verified shortlet apartments across Nigeria with
            clear pricing and real availability.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-ink/70">Explore</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/properties" className="text-muted-foreground hover:text-ink">
                Browse homes
              </Link>
            </li>
            <li>
              <Link to="/properties" search={{ sort: "price_asc" }} className="text-muted-foreground hover:text-ink">
                Best value stays
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-ink/70">Support</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>We usually respond within a few minutes — reach out any time.</li>
            <li>
              <a
                href={`mailto:${EMAIL}`}
                className="hover:text-ink"
              >
                Email support
              </a>
            </li>
            <li>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="hover:text-ink"
              >
                Chat with us on WhatsApp
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-ink/70">Contact</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Phone className="size-4" />
              <a href={`tel:${WHATSAPP}`} className="hover:text-ink">
                +234 705 886 0184
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MessageCircle className="size-4" />
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="hover:text-ink"
              >
                WhatsApp us
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4" />
              <a href={`mailto:${EMAIL}`} className="hover:text-ink">
                tradegateconcept@gmail.com
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/70 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} TradeGate Continental Homes. All rights reserved.
      </div>
    </footer>
  );
}
