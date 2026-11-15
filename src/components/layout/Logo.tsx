import { Link } from "@tanstack/react-router";

export function Logo() {
  return (
    <Link
      to="/"
      className="flex items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Seniors' Wisdom home"
    >
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 18c3-1 5-1 8 1 3-2 5-2 8-1V6c-3-1-5-1-8 1-3-2-5-2-8-1z" />
          <path d="M12 7v12" />
        </svg>
      </span>
      <span className="font-display text-lg font-extrabold tracking-tight">
        Seniors' <span className="text-primary-ink">Wisdom</span>
      </span>
    </Link>
  );
}
