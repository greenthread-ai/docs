import { Link } from "react-router";
import { ThemeToggle } from "./theme-toggle";
import { SearchDialog } from "./search";
import { MobileNav } from "./mobile-nav";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[90rem] items-center gap-4 px-4 lg:px-8">
        <MobileNav />
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <img src="/logo.png" alt="GreenThread" className="h-8" />
        </Link>
        <span className="text-xs font-medium text-text-muted tracking-wide uppercase">
          Docs
        </span>

        <div className="flex-1" />

        <SearchDialog />
        <ThemeToggle />
      </div>
    </header>
  );
}
