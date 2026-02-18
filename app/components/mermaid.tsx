import { useEffect, useRef, useState } from "react";

async function initMermaid(dark: boolean) {
  const mermaid = (await import("mermaid")).default;
  mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    themeVariables: dark
      ? {
          primaryColor: "#1a3a24",
          primaryTextColor: "#e5e5e5",
          primaryBorderColor: "#3cd363",
          secondaryColor: "#1e293b",
          secondaryTextColor: "#cbd5e1",
          secondaryBorderColor: "#334155",
          tertiaryColor: "#1e1b2e",
          tertiaryTextColor: "#c4b5fd",
          tertiaryBorderColor: "#4c3d8f",
          lineColor: "#555",
          textColor: "#e5e5e5",
          mainBkg: "#1a3a24",
          nodeBorder: "#3cd363",
          clusterBkg: "#1e293b",
          titleColor: "#e5e5e5",
          edgeLabelBackground: "#16161a",
          nodeTextColor: "#e5e5e5",
        }
      : {
          primaryColor: "#dcfce7",
          primaryTextColor: "#1a1a1a",
          primaryBorderColor: "#22c55e",
          secondaryColor: "#f1f5f9",
          secondaryTextColor: "#334155",
          secondaryBorderColor: "#cbd5e1",
          tertiaryColor: "#ede9fe",
          tertiaryTextColor: "#5b21b6",
          tertiaryBorderColor: "#c4b5fd",
          lineColor: "#94a3b8",
          textColor: "#1a1a1a",
          mainBkg: "#dcfce7",
          nodeBorder: "#22c55e",
          clusterBkg: "#f8fafc",
          titleColor: "#1a1a1a",
          edgeLabelBackground: "#ffffff",
          nodeTextColor: "#1a1a1a",
        },
    fontFamily: "Geist, system-ui, sans-serif",
    securityLevel: "loose",
  });
  return mermaid;
}

export function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    const dark = document.documentElement.classList.contains("dark");

    (async () => {
      const mermaid = await initMermaid(dark);
      const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
      try {
        const { svg: rendered } = await mermaid.render(id, chart.trim());
        if (!cancelled) setSvg(rendered);
      } catch {
        if (!cancelled) setSvg(`<pre style="color:red">Mermaid render error</pre>`);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chart]);

  return (
    <div
      ref={ref}
      className="not-prose my-6 flex justify-center overflow-x-auto rounded-lg border border-border-default bg-bg-card p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
