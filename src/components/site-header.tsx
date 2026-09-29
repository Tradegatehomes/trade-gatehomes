import { Link } from "@tanstack/react-router";
import { KeyRound, Menu } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const links = [
    { to: "/properties" as const, label: "Browse homes" },
    user ? { to: "/account" as const, label: "My trips" } : { to: "/auth" as const, label: "Sign in" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-2xl bg-brand text-brand-foreground">
            <KeyRound className="size-5" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-ink">KeyNest</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-full px-4 py-2 text-sm font-semibold text-ink/80 transition-colors hover:bg-secondary hover:text-ink"
              activeProps={{ className: "bg-secondary text-ink" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Button asChild className="rounded-full">
            <Link to="/properties">Find a stay</Link>
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetTitle className="font-display">KeyNest</SheetTitle>
            <nav className="mt-6 flex flex-col gap-1">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2 text-base font-semibold hover:bg-secondary"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
