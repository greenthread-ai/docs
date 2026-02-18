import { useEffect, useRef, useState } from "react";

function getThemeVariables(dark: boolean) {
  if (dark) {
    return {
      // Core
      primaryColor: "#1a3a24",
      primaryTextColor: "#e5e5e5",
      primaryBorderColor: "#3cd363",
      secondaryColor: "#1e293b",
      secondaryTextColor: "#cbd5e1",
      secondaryBorderColor: "#334155",
      tertiaryColor: "#1e1b2e",
      tertiaryTextColor: "#c4b5fd",
      tertiaryBorderColor: "#4c3d8f",
      lineColor: "#64748b",
      textColor: "#e5e5e5",
      mainBkg: "#1a3a24",
      nodeBorder: "#3cd363",
      clusterBkg: "#1e293b",
      titleColor: "#e5e5e5",
      edgeLabelBackground: "#1e1e22",
      nodeTextColor: "#e5e5e5",
      // Sequence diagrams
      actorBkg: "#1a3a24",
      actorBorder: "#3cd363",
      actorTextColor: "#e5e5e5",
      actorLineColor: "#64748b",
      signalColor: "#e5e5e5",
      signalTextColor: "#e5e5e5",
      labelBoxBkgColor: "#1e1e22",
      labelBoxBorderColor: "#334155",
      labelTextColor: "#e5e5e5",
      loopTextColor: "#e5e5e5",
      noteBkgColor: "#1e293b",
      noteBorderColor: "#334155",
      noteTextColor: "#cbd5e1",
      activationBkgColor: "#1a3a24",
      activationBorderColor: "#3cd363",
      sequenceNumberColor: "#1a1a1a",
      // State diagrams
      labelColor: "#e5e5e5",
      altBackground: "#1e293b",
    };
  }
  return {
    // Core
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
    // Sequence diagrams
    actorBkg: "#dcfce7",
    actorBorder: "#22c55e",
    actorTextColor: "#1a1a1a",
    actorLineColor: "#94a3b8",
    signalColor: "#1a1a1a",
    signalTextColor: "#1a1a1a",
    labelBoxBkgColor: "#ffffff",
    labelBoxBorderColor: "#cbd5e1",
    labelTextColor: "#1a1a1a",
    loopTextColor: "#1a1a1a",
    noteBkgColor: "#f1f5f9",
    noteBorderColor: "#cbd5e1",
    noteTextColor: "#334155",
    activationBkgColor: "#dcfce7",
    activationBorderColor: "#22c55e",
    sequenceNumberColor: "#ffffff",
    // State diagrams
    labelColor: "#1a1a1a",
    altBackground: "#f8fafc",
  };
}

export function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [dark, setDark] = useState(false);

  // Watch for dark mode changes
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));

    const observer = new MutationObserver(() => {
      setDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // Render chart when chart or theme changes
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const mermaid = (await import("mermaid")).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        themeVariables: getThemeVariables(dark),
        fontFamily: "Geist, system-ui, sans-serif",
        securityLevel: "loose",
      });
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
  }, [chart, dark]);

  return (
    <div
      ref={ref}
      className="not-prose my-6 flex justify-center overflow-x-auto rounded-lg border border-border-default bg-bg-card p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
