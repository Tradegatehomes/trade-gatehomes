import { Link } from "@tanstack/react-router";
import { KeyRound, Mail, Phone } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/70 bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-2xl bg-brand text-brand-foreground">
              <KeyRound className="size-5" />
            </span>
            <span className="font-display text-xl font-bold text-ink">KeyNest</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            [BRAND TAGLINE] Book verified shortlet apartments across Nigeria with clear pricing and
            real availability. Replace this placeholder text.
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
            <li>[Support hours placeholder]</li>
            <li>[Support email placeholder]</li>
            <li>[Support phone placeholder]</li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-ink/70">Contact</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Phone className="size-4" /> [Phone number]
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4" /> [Email address]
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/70 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} KeyNest — placeholder name. All listings are demo data until
        you add your own.
      </div>
    </footer>
  );
}
