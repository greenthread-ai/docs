import { NavLink } from "react-router";
import { sections } from "~/lib/docs-meta";
import { cn } from "~/lib/utils";

export function Sidebar({ className }: { className?: string }) {
  return (
    <nav className={cn("space-y-6", className)}>
      {sections.map((section) => (
        <div key={section.title}>
          <h4 className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            {section.title}
          </h4>
          <ul className="space-y-0.5">
            {section.pages.map((page) => (
              <li key={page.slug}>
                <NavLink
                  to={`/${page.slug}`}
                  className={({ isActive }) =>
                    cn(
                      "block rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                      isActive
                        ? "bg-brand-bg text-brand"
                        : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                    )
                  }
                >
                  {page.title}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
