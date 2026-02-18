import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

const styles = {
  info: {
    border: "border-blue-200 dark:border-blue-500/20",
    bg: "bg-blue-50 dark:bg-blue-500/5",
    icon: "text-blue-600 dark:text-blue-400",
    title: "text-blue-900 dark:text-blue-300",
  },
  warning: {
    border: "border-amber-200 dark:border-amber-500/20",
    bg: "bg-amber-50 dark:bg-amber-500/5",
    icon: "text-amber-600 dark:text-amber-400",
    title: "text-amber-900 dark:text-amber-300",
  },
  tip: {
    border: "border-emerald-200 dark:border-emerald-500/20",
    bg: "bg-emerald-50 dark:bg-emerald-500/5",
    icon: "text-emerald-600 dark:text-emerald-400",
    title: "text-emerald-900 dark:text-emerald-300",
  },
};

const icons = {
  info: (
    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  tip: (
    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
};

const titles = { info: "Info", warning: "Warning", tip: "Tip" };

export function Callout({
  type = "info",
  title,
  children,
}: {
  type?: "info" | "warning" | "tip";
  title?: string;
  children: ReactNode;
}) {
  const s = styles[type];

  return (
    <div className={cn("my-6 rounded-lg border p-4 not-prose", s.border, s.bg)}>
      <div className={cn("flex items-center gap-2 text-sm font-semibold", s.title)}>
        <span className={s.icon}>{icons[type]}</span>
        {title || titles[type]}
      </div>
      <div className="mt-2 text-sm leading-relaxed text-text-secondary [&>p]:mt-0">
        {children}
      </div>
    </div>
  );
}
