import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-16 border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>Seniors' Wisdom · Advice from students who've been there.</p>
        <div className="flex flex-wrap gap-4">
          <Link to="/browse" className="hover:text-foreground">Browse</Link>
          <Link to="/share" className="hover:text-foreground">Share a tip</Link>
          <Link to="/requests" className="hover:text-foreground">Unanswered questions</Link>
        </div>
      </div>
    </footer>
  );
}
