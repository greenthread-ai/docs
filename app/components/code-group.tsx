import { useState, type ReactNode, Children } from "react";
import { cn } from "~/lib/utils";

export function CodeGroup({
  labels,
  children,
}: {
  labels: string[];
  children: ReactNode;
}) {
  const [active, setActive] = useState(0);
  const items = Children.toArray(children);

  return (
    <div className="not-prose my-6 overflow-hidden rounded-lg border border-border-default">
      <div className="flex border-b border-border-subtle bg-bg-muted">
        {labels.map((label, i) => (
          <button
            key={label}
            onClick={() => setActive(i)}
            className={cn(
              "px-4 py-2 text-xs font-medium transition-colors",
              i === active
                ? "border-b-2 border-brand bg-bg-card text-text-primary"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="[&>pre]:my-0 [&>pre]:rounded-none [&>pre]:border-0">
        {items[active]}
      </div>
    </div>
  );
}
