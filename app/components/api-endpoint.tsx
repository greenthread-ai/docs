import { cn } from "~/lib/utils";

const methodColors: Record<string, { bg: string; text: string }> = {
  GET: { bg: "bg-emerald-100 dark:bg-emerald-500/15", text: "text-emerald-700 dark:text-emerald-400" },
  POST: { bg: "bg-blue-100 dark:bg-blue-500/15", text: "text-blue-700 dark:text-blue-400" },
  PUT: { bg: "bg-amber-100 dark:bg-amber-500/15", text: "text-amber-700 dark:text-amber-400" },
  DELETE: { bg: "bg-red-100 dark:bg-red-500/15", text: "text-red-700 dark:text-red-400" },
  PATCH: { bg: "bg-purple-100 dark:bg-purple-500/15", text: "text-purple-700 dark:text-purple-400" },
};

export function ApiEndpoint({
  method,
  path,
}: {
  method: string;
  path: string;
}) {
  const colors = methodColors[method] || methodColors.GET;

  return (
    <div className="not-prose my-4 flex items-center gap-3 rounded-lg border border-border-default bg-bg-card px-4 py-3">
      <span
        className={cn(
          "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider",
          colors.bg,
          colors.text
        )}
      >
        {method}
      </span>
      <code className="text-sm font-medium" style={{ fontFamily: "Geist Mono, monospace" }}>
        {path}
      </code>
    </div>
  );
}
