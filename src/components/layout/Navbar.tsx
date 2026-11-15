import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { to: "/ask", label: "Ask" },
  { to: "/browse", label: "Browse Tips" },
  { to: "/share", label: "Share a Tip" },
  { to: "/placements", label: "Placements" },
  { to: "/requests", label: "Requests" },
] as const;

const linkClass =
  "rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const activeClass = "bg-primary-soft text-accent-foreground hover:bg-primary-soft";

function signInPlaceholder() {
  toast("Sign in is coming soon", { description: "For now you can browse, ask and share freely." });
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <div className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className={linkClass} activeProps={{ className: activeClass }}>
              {n.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ink" size="sm" className="hidden sm:inline-flex" onClick={signInPlaceholder}>
            Sign in
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-4 flex flex-col gap-1">
                {NAV.map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className={`${linkClass} text-base`}
                    activeProps={{ className: activeClass }}
                  >
                    {n.label}
                  </Link>
                ))}
                <Button variant="ink" className="mt-4" onClick={signInPlaceholder}>
                  Sign in
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
