import { useState, useMemo, useRef, useEffect } from "react";

/* ── Types ── */
interface Model {
  id: string;
  name: string;
  params: string;
  bedrockIn: number;
  bedrockOut: number;
  recVram: number;
  tp: Record<string, number | null>;
}

interface GPU {
  vram: number;
  label: string;
  hourly: number;
  spot: number;
  reserved: number;
}

/* ── Data ── */
const MODELS: Model[] = [
  { id: "llama8b", name: "Llama 3.1 8B", params: "8B", bedrockIn: 0.22, bedrockOut: 0.22, recVram: 16, tp: { H100: 16200, A100: 5800, L4: 2200 } },
  { id: "ministral8b", name: "Ministral 8B", params: "8B", bedrockIn: 0.15, bedrockOut: 0.15, recVram: 16, tp: { H100: 16000, A100: 5700, L4: 2100 } },
  { id: "gemma27b", name: "Gemma 3 27B", params: "27B", bedrockIn: 0.23, bedrockOut: 0.38, recVram: 36, tp: { H100: 7500, A100: 2800, L4: null } },
  { id: "qwen32b", name: "Qwen3 32B", params: "32B", bedrockIn: 0.15, bedrockOut: 0.60, recVram: 40, tp: { H100: 6500, A100: 2400, L4: null } },
  { id: "llama70b", name: "Llama 3.1 70B", params: "70B", bedrockIn: 0.72, bedrockOut: 0.72, recVram: 80, tp: { H100: 3300, A100: 1150, L4: null } },
  { id: "mistral123b", name: "Mistral Large 3", params: "675B MoE", bedrockIn: 0.50, bedrockOut: 1.50, recVram: 750, tp: { H100: 1800, A100: null, L4: null } },
  { id: "deepseek", name: "DeepSeek v3.2", params: "671B MoE", bedrockIn: 0.62, bedrockOut: 1.85, recVram: 750, tp: { H100: 900, A100: null, L4: null } },
];
const GPUS: Record<string, GPU> = {
  H100: { vram: 80, label: "H100 80GB", hourly: 3.93, spot: 2.50, reserved: 1.95 },
  A100: { vram: 80, label: "A100 80GB", hourly: 2.745, spot: 0.77, reserved: 1.74 },
  L4:   { vram: 24, label: "L4 24GB",   hourly: 0.8048, spot: 0.3006, reserved: 0.5239 },
};
const GT_AUD = 17, AUD_USD = 0.71, GT_USD = GT_AUD * AUD_USD, HRS = 730;

/* ── Formatters ── */
const f$ = (n: number | null | undefined) => { if (n == null || isNaN(n)) return "\u2014"; if (Math.abs(n) >= 1e6) return `$${(n/1e6).toFixed(1)}M`; if (Math.abs(n) >= 1e3) return `$${(n/1e3).toFixed(1)}K`; return `$${n.toFixed(0)}`; };
const f$x = (n: number | null | undefined) => (n == null || isNaN(n)) ? "\u2014" : `$${n.toFixed(2)}`;
const fT = (n: number | null | undefined) => { if (n == null) return "\u2014"; if (n >= 1e12) return `${(n/1e12).toFixed(1)}T`; if (n >= 1e9) return `${(n/1e9).toFixed(1)}B`; if (n >= 1e6) return `${(n/1e6).toFixed(0)}M`; return n >= 1e3 ? `${(n/1e3).toFixed(0)}K` : n.toFixed(0); };

const BAR_COLORS = ["#d95534", "#e88c3a", "#43aa8b", "#577590", "#9b5de5", "#f15bb5", "#00bbf9"];

/* ── Dark mode hook ── */
function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return dark;
}

/* ── Width hook ── */
function useWidth(ref: React.RefObject<HTMLElement | null>) {
  const [w, setW] = useState(800);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setW(e.contentRect.width);
    });
    ro.observe(ref.current);
    setW(ref.current.offsetWidth);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

/* ── Bar chart ── */
interface ChartItem { label: string; cost: number; color: string; }

function BillChart({ items, gtTotal, gtLabel, compact, dark }: {
  items: ChartItem[]; gtTotal: number; gtLabel: string; compact: boolean; dark: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cRef = useRef<HTMLDivElement>(null);
  const total = items.reduce((s, i) => s + i.cost, 0);
  const max = Math.max(total, gtTotal) * 1.15;

  useEffect(() => {
    const c = ref.current, ct = cRef.current;
    if (!c || !ct) return;
    const W = ct.offsetWidth;
    const H = compact ? 150 : 190;
    c.width = W * 2; c.height = H * 2;
    c.style.width = W + "px"; c.style.height = H + "px";
    const x = c.getContext("2d");
    if (!x) return;
    x.scale(2, 2);
    x.clearRect(0, 0, W, H);

    const textColor = dark ? "#e5e5e5" : "#333";
    const mutedColor = dark ? "#888" : "#999";

    const pl = compact ? 14 : Math.min(100, W * 0.12);
    const pr = compact ? 14 : Math.min(100, W * 0.12);
    const pt = compact ? 30 : 28;
    const bH = compact ? 40 : 50;
    const gap = compact ? 20 : 28;
    const sc = (v: number) => (v / max) * (W - pl - pr);
    const labelFont = compact ? "500 9px" : "500 11px";
    const totalFont = compact ? "700 12px" : "700 14px";
    const segFont = compact ? "600 8px" : "600 9px";
    const segValFont = compact ? "700 9px" : "700 11px";
    const ff = "'DM Sans', system-ui, sans-serif";

    if (compact) {
      x.fillStyle = mutedColor; x.font = `${labelFont} ${ff}`; x.textAlign = "left";
      x.fillText("Bedrock", pl, pt - 8);
      x.fillStyle = mutedColor;
      x.fillText("GreenThread", pl, pt + bH + gap - 8);
    }

    // Bedrock bar
    const y1 = pt;
    let bx = pl;
    items.forEach((it, i) => {
      const w = sc(it.cost);
      if (w > 0) {
        x.fillStyle = it.color || BAR_COLORS[i % BAR_COLORS.length];
        const r = 5;
        x.beginPath();
        if (items.length === 1) x.roundRect(bx, y1, w, bH, [r, r, r, r]);
        else if (i === 0) x.roundRect(bx, y1, w, bH, [r, 0, 0, r]);
        else if (i === items.length - 1) x.roundRect(bx, y1, w, bH, [0, r, r, 0]);
        else x.rect(bx, y1, w, bH);
        x.fill();
        if (w > (compact ? 40 : 55)) {
          x.fillStyle = "#fff"; x.font = `${segFont} ${ff}`; x.textAlign = "center";
          x.fillText(it.label, bx + w/2, y1 + bH/2 - (compact ? 3 : 5));
          x.font = `${segValFont} ${ff}`;
          x.fillText(f$(it.cost), bx + w/2, y1 + bH/2 + (compact ? 8 : 10));
        }
        bx += w;
      }
    });
    x.fillStyle = textColor; x.font = `${totalFont} ${ff}`; x.textAlign = "left";
    x.fillText(f$(total), bx + 8, y1 + bH/2 + 5);
    if (!compact) {
      x.fillStyle = mutedColor; x.font = `${labelFont} ${ff}`; x.textAlign = "right";
      x.fillText("Bedrock", pl - 12, y1 + bH/2 + 4);
    }

    // GT bar
    const y2 = y1 + bH + gap;
    const gw = sc(gtTotal);
    x.fillStyle = "#1a9654";
    x.beginPath(); x.roundRect(pl, y2, gw, bH, [5, 5, 5, 5]); x.fill();
    if (gw > (compact ? 50 : 80)) {
      x.fillStyle = "#fff"; x.font = `${segFont} ${ff}`; x.textAlign = "center";
      x.fillText(gtLabel, pl + gw/2, y2 + bH/2 - (compact ? 3 : 5));
      x.font = `${segValFont} ${ff}`;
      x.fillText(f$(gtTotal), pl + gw/2, y2 + bH/2 + (compact ? 8 : 10));
    }
    x.fillStyle = textColor; x.font = `${totalFont} ${ff}`; x.textAlign = "left";
    x.fillText(f$(gtTotal), pl + gw + 8, y2 + bH/2 + 5);
    if (!compact) {
      x.fillStyle = mutedColor; x.font = `${labelFont} ${ff}`; x.textAlign = "right";
      x.fillText("GreenThread", pl - 12, y2 + bH/2 + 4);
    }

    // Savings bracket
    if (total > gtTotal && W > 400) {
      const sav = total - gtTotal, pct = ((sav / total) * 100).toFixed(0);
      const bkx = pl + sc(total) + 6;
      if (bkx + 80 < W) {
        x.strokeStyle = "rgba(26,150,84,0.35)"; x.lineWidth = 1.5;
        x.beginPath(); x.moveTo(bkx, y1 + 8); x.lineTo(bkx + 10, y1 + 8);
        x.lineTo(bkx + 10, y2 + bH - 8); x.lineTo(bkx, y2 + bH - 8); x.stroke();
        x.fillStyle = "#1a9654"; x.font = `700 ${compact ? 11 : 12}px ${ff}`; x.textAlign = "left";
        const sy = (y1 + y2 + bH) / 2;
        x.fillText(`Save ${f$(sav)}/mo`, bkx + 16, sy - 2);
        x.fillStyle = "rgba(26,150,84,0.6)"; x.font = `500 10px ${ff}`;
        x.fillText(`${pct}% less`, bkx + 16, sy + 13);
      }
    }
  }, [items, gtTotal, gtLabel, max, total, compact, dark]);

  return <div ref={cRef} style={{ width: "100%" }}><canvas ref={ref} /></div>;
}

/* ── Main Calculator ── */
export function TokenCrossoverCalculator() {
  const dark = useDarkMode();
  const rootRef = useRef<HTMLDivElement>(null);
  const W = useWidth(rootRef);
  const sm = W < 560;
  const md = W < 780;

  const init: Record<string, number> = {}; MODELS.forEach(m => { init[m.id] = m.id === "llama70b" ? 1 : 0; });
  const [mc, setMc] = useState(init);
  const [gpuId, setGpu] = useState("H100");
  const [pr, setPr] = useState("ondemand");
  const [ioR, setIo] = useState(60);
  const [tok, setTok] = useState(5e9);
  const [otherOn, setOtherOn] = useState(false);
  const [otherPct, setOtherPct] = useState(30);
  const [otherRate, setOtherRate] = useState(3.00);
  const [tab, setTab] = useState("bill");

  const presets = [
    { l: "1B", v: 1e9 }, { l: "2.5B", v: 2.5e9 }, { l: "5B", v: 5e9 },
    { l: "10B", v: 10e9 }, { l: "25B", v: 25e9 }, { l: "50B", v: 50e9 }, { l: "100B", v: 100e9 },
  ];
  const adj = (id: string, d: number) => setMc(p => ({ ...p, [id]: Math.max(0, Math.min(8, (p[id] || 0) + d)) }));

  const active = MODELS.filter(m => mc[m.id] > 0);
  const total = active.reduce((s, m) => s + mc[m.id], 0);
  const largest = active.length > 0 ? active.reduce((a, b) => b.recVram > a.recVram ? b : a) : null;
  const gpu = GPUS[gpuId];
  const ok = largest && largest.tp[gpuId] != null;

  const calc = useMemo(() => {
    if (!largest || !ok || total === 0) return null;
    const gN = Math.ceil(largest.recVram / gpu.vram), vram = gN * gpu.vram;
    const gtM = GT_USD * vram;
    const hr = pr === "reserved" ? gpu.reserved : pr === "spot" ? gpu.spot : gpu.hourly;
    const ec2 = hr * HRS * gN, self = ec2 + gtM;
    const iF = ioR / 100;
    const bd = active.map((m, i) => {
      const r = m.bedrockIn * iF + m.bedrockOut * (1 - iF);
      const c = mc[m.id], pi = tok * (r / 1e6);
      return { ...m, count: c, rate: r, perInst: pi, sub: pi * c, color: BAR_COLORS[i % BAR_COLORS.length] };
    });
    const totBR = bd.reduce((s, m) => s + m.sub, 0);
    const oHrs = otherOn ? HRS * (otherPct / 100) * gN : 0;
    const oVal = oHrs * otherRate;
    const effBR = totBR + oVal;
    const sav = effBR - self, pct = effBR > 0 ? (sav / effBR) * 100 : 0;
    const items = bd.map(m => ({ label: `${m.name} \u00D7${m.count}`, cost: m.sub, color: m.color }));
    const avgR = bd.reduce((s, m) => s + m.rate * m.count, 0) / total;
    const fpm = self / total;
    const cross = fpm / (avgR / 1e6);
    const miles = [1e9, 2.5e9, 5e9, 10e9, 25e9, 50e9, 100e9].map(t => {
      const b = t * (avgR / 1e6); return { t, b, g: fpm, d: b - fpm, l: fT(t) };
    });
    return { gN, vram, gtM, ec2, self, hr, bd, totBR, oHrs, oVal, effBR, sav, pct, ann: sav * 12, items, avgR, fpm, cross, miles };
  }, [largest, gpu, gpuId, pr, ioR, mc, tok, active, total, ok, otherOn, otherPct, otherRate]);

  /* ── Dark mode color palette ── */
  const colors = dark ? {
    bg: "transparent",
    text: "#e5e5e5",
    textMuted: "#aaa",
    textFaint: "#777",
    cardBg: "#1e2a22",
    cardBgAlt: "#1a1f2a",
    controlBg: "#1a1f1e",
    controlBorder: "#2a3a2e",
    inputBg: "#1a1f1e",
    inputBorder: "#2a3a2e",
    inputText: "#e5e5e5",
    modelActive: "#1a3a24",
    modelActiveBorder: "#1a9654",
    modelInactive: "#1a1f1e",
    borderLight: "#2a3a2e",
    borderMed: "#334433",
    tabBg: "#1a1f1e",
    tabBorder: "#2a3a2e",
    tableBg: "#1a2420",
    tableRowBorder: "#1e2e24",
    tableHeaderBorder: "#2a4a30",
    red: "#d95534",
    redBg: "#2a1a18",
    redBorder: "#3a2420",
    green: "#1a9654",
    greenBg: "#1a2a20",
    greenBorder: "#1a3a24",
    greenMuted: "#5a9a6a",
    redMuted: "#c07a5a",
    savingsCardBg: "#1a2a20",
    bedrockCardBg: "#2a1a18",
    summaryBg: "#1a2a20",
  } : {
    bg: "transparent",
    text: "#222",
    textMuted: "#999",
    textFaint: "#bbb",
    cardBg: "#f8faf8",
    cardBgAlt: "#f5f6f5",
    controlBg: "#f5f6f5",
    controlBorder: "none",
    inputBg: "#fff",
    inputBorder: "#d4dcd5",
    inputText: "#222",
    modelActive: "#edf8f0",
    modelActiveBorder: "#1a9654",
    modelInactive: "#f5f6f5",
    borderLight: "#f4f5f4",
    borderMed: "#e8ece8",
    tabBg: "#fff",
    tabBorder: "#e8ece8",
    tableBg: "#f8faf8",
    tableRowBorder: "#f4f5f4",
    tableHeaderBorder: "#eef0ee",
    red: "#d95534",
    redBg: "#fef8f4",
    redBorder: "#fde8e0",
    green: "#1a9654",
    greenBg: "#f0faf3",
    greenBorder: "#d0ecd8",
    greenMuted: "#5a9a6a",
    redMuted: "#c07a5a",
    savingsCardBg: "#f0faf3",
    bedrockCardBg: "#fef8f4",
    summaryBg: "#f0faf3",
  };

  /* ── Responsive helpers ── */
  const pad = sm ? "16px 14px" : md ? "20px 20px" : "28px 32px";
  const gap = sm ? 8 : 12;
  const cardS = (bg?: string): React.CSSProperties => ({
    background: bg || colors.cardBg,
    border: "none",
    borderRadius: sm ? 8 : 10,
    padding: sm ? "12px 14px" : "16px 18px",
    boxShadow: dark ? "0 1px 3px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.03)" : "0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)",
  });
  const btnS = (isActive: boolean): React.CSSProperties => ({
    all: "unset", cursor: "pointer", padding: sm ? "5px 10px" : "6px 14px",
    borderRadius: 6, background: isActive ? "#1a9654" : dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.7)",
    border: `1.5px solid ${isActive ? "#1a9654" : colors.inputBorder}`,
    fontSize: sm ? 10 : 11, fontWeight: isActive ? 600 : 400,
    color: isActive ? "#fff" : dark ? "#ccc" : "#555", fontFamily: "inherit", transition: "all 0.15s",
    whiteSpace: "nowrap",
  });
  const inputS: React.CSSProperties = {
    padding: sm ? "6px 8px" : "7px 12px", background: colors.inputBg,
    border: `1.5px solid ${colors.inputBorder}`, borderRadius: 6, color: colors.inputText,
    fontSize: 12, fontFamily: "inherit", fontWeight: 600, outline: "none",
    maxWidth: "100%", boxSizing: "border-box",
  };
  const labelS: React.CSSProperties = { fontSize: 10, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 4, fontWeight: 600 };
  const tblS: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: sm ? 11 : 12 };
  const thS: React.CSSProperties = { textAlign: "left", padding: sm ? "8px 8px" : "10px 12px", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.5px", color: colors.textMuted, borderBottom: `2px solid ${colors.tableHeaderBorder}`, fontWeight: 600, whiteSpace: "nowrap" };
  const tdS: React.CSSProperties = { padding: sm ? "8px 8px" : "10px 12px", borderBottom: `1px solid ${colors.tableRowBorder}`, whiteSpace: "nowrap" };

  return (
    <div ref={rootRef} style={{
      fontFamily: "'DM Sans', system-ui, sans-serif", background: colors.bg,
      color: colors.text, padding: pad, maxWidth: 1080, margin: "0 auto",
      boxSizing: "border-box", width: "100%",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* ── Model Roster ── */}
      <div style={{ marginBottom: sm ? 16 : 22 }}>
        <div style={labelS}>Your models</div>
        <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 10 }}>
          GreenThread runs all on the same GPUs (sized to the largest). {"<"}5ms hot-swap.
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: sm ? "1fr" : md ? "repeat(auto-fill, minmax(200px, 1fr))" : "repeat(auto-fill, minmax(215px, 1fr))",
          gap: 8,
        }}>
          {MODELS.map(m => {
            const c = mc[m.id] || 0, a = c > 0, can = m.tp[gpuId] != null;
            return (
              <div key={m.id} style={{
                display: "flex", alignItems: "center", gap: 8, padding: sm ? "8px 10px" : "9px 12px",
                borderRadius: 8, background: a ? colors.modelActive : colors.modelInactive,
                border: a ? `1.5px solid ${colors.modelActiveBorder}` : "1.5px solid transparent",
                opacity: can ? 1 : 0.35, transition: "all 0.15s",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: a ? 600 : 400, color: a ? colors.text : colors.textMuted }}>{m.name}</div>
                  <div style={{ fontSize: 10, color: colors.textFaint }}>
                    {m.params} · {m.recVram}GB · {f$x(m.bedrockIn * (ioR / 100) + m.bedrockOut * (1 - ioR / 100))}/1M
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                  <button onClick={() => adj(m.id, -1)} style={{
                    all: "unset", cursor: c > 0 ? "pointer" : "default",
                    width: 28, height: 28, borderRadius: 6, background: dark ? "#2a3a2e" : "#f0f2f0",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, fontWeight: 700, color: c > 0 ? (dark ? "#ccc" : "#555") : (dark ? "#555" : "#ccc"),
                  }}>{"\u2212"}</button>
                  <span style={{ minWidth: 24, textAlign: "center", fontSize: 17, fontWeight: 700, color: a ? "#1a9654" : (dark ? "#444" : "#ddd") }}>{c}</span>
                  <button onClick={() => can && adj(m.id, 1)} style={{
                    all: "unset", cursor: can ? "pointer" : "not-allowed",
                    width: 28, height: 28, borderRadius: 6, background: can ? (dark ? "#1a3a24" : "#edf7f0") : (dark ? "#2a3a2e" : "#f0f2f0"),
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, fontWeight: 700, color: can ? "#1a9654" : (dark ? "#555" : "#ccc"),
                  }}>+</button>
                </div>
              </div>
            );
          })}
        </div>
        {total > 0 && (
          <div style={{ marginTop: 8, fontSize: 11, color: "#1a9654", fontWeight: 500 }}>
            {total} model{total > 1 ? "s" : ""} on {gpuId}
            {largest && <span style={{ color: colors.textFaint }}> · sized to {largest.name} ({largest.recVram}GB)</span>}
          </div>
        )}
      </div>

      {/* ── Controls ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: sm ? "1fr" : "repeat(auto-fit, minmax(170px, 1fr))",
        gap: sm ? 12 : 14, marginBottom: sm ? 16 : 22,
        padding: sm ? "12px 14px" : "16px",
        background: colors.controlBg, borderRadius: sm ? 8 : 10, border: "none",
      }}>
        <div>
          <div style={labelS}>GPU</div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {Object.entries(GPUS).map(([id, g]) => {
              const can = !largest || largest.tp[id] != null;
              return <button key={id} onClick={() => can && setGpu(id)}
                style={{ ...btnS(id === gpuId), opacity: can ? 1 : 0.35, cursor: can ? "pointer" : "not-allowed" }}>{g.label}</button>;
            })}
          </div>
        </div>
        <div>
          <div style={labelS}>EC2 pricing tier</div>
          <select value={pr} onChange={e => setPr(e.target.value)} style={{ ...inputS, width: "100%" }}>
            <option value="ondemand">On-Demand ({f$x(gpu.hourly)}/hr)</option>
            <option value="reserved">Reserved 1yr ({f$x(gpu.reserved)}/hr)</option>
            <option value="spot">Spot (~{f$x(gpu.spot)}/hr)</option>
          </select>
        </div>
        <div>
          <div style={labelS}>Input / Output: {ioR}% / {100 - ioR}%</div>
          <input type="range" min={10} max={90} value={ioR} onChange={e => setIo(+e.target.value)}
            style={{ width: "100%", accentColor: "#1a9654" }} />
        </div>
      </div>

      {total === 0 && (
        <div style={{ ...cardS(), textAlign: "center", padding: sm ? 32 : 48, marginBottom: 24 }}>
          <div style={{ fontSize: 14, color: colors.textFaint }}>Add models above to see the comparison</div>
        </div>
      )}

      {ok && calc && (<>
        {/* ── Token Volume ── */}
        <div style={{ marginBottom: sm ? 16 : 22, padding: sm ? "14px" : "18px", ...cardS(dark ? "#1a2a20" : "#f0f7f1") }}>
          <div style={labelS}>Token volume per model, per month</div>
          <div style={{ display: "flex", gap: sm ? 4 : 6, marginBottom: 12, marginTop: 8, flexWrap: "wrap" }}>
            {presets.map(p => <button key={p.l} onClick={() => setTok(p.v)} style={btnS(tok === p.v)}>{p.l}</button>)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: colors.textMuted }}>Custom:</span>
            <input type="number" value={tok}
              onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0) setTok(v); }}
              style={{ ...inputS, width: sm ? 120 : 155 }} />
            <span style={{ fontSize: 11, color: "#1a9654", fontWeight: 500 }}>
              {fT(tok)}/mo each{total > 1 && ` · ${fT(tok * total)} total`}
            </span>
          </div>
        </div>

        {/* ── Other Workloads ── */}
        <div style={{ marginBottom: sm ? 16 : 22, padding: sm ? "14px" : "18px", ...cardS(otherOn ? (dark ? "#1a2a20" : "#edf8f0") : colors.cardBgAlt) }}>
          <div style={{ display: "flex", alignItems: "center", gap: sm ? 10 : 12 }}>
            <button onClick={() => setOtherOn(!otherOn)} style={{
              all: "unset", cursor: "pointer", flexShrink: 0,
              width: 44, height: 26, borderRadius: 13,
              background: otherOn ? "#1a9654" : (dark ? "#555" : "#ccc"),
              position: "relative", transition: "background 0.2s",
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 11, background: "#fff",
                position: "absolute", top: 2, left: otherOn ? 20 : 2,
                transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
              }} />
            </button>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: sm ? 12 : 13, fontWeight: 500, color: colors.text }}>
                I also run training, fine-tuning, or batch workloads
              </div>
              <div style={{ fontSize: sm ? 10 : 11, color: colors.textMuted }}>
                Bedrock users need separate EC2 {"\u2014"} GreenThread runs it free on the same hardware
              </div>
            </div>
          </div>
          {otherOn && (
            <div style={{
              marginTop: 16, paddingTop: 16, borderTop: `1px solid ${dark ? "#2a3a2e" : "#e0e8e0"}`,
              display: "grid", gridTemplateColumns: sm ? "1fr" : "1fr 1fr", gap: sm ? 12 : 18,
            }}>
              <div>
                <div style={labelS}>GPU time needed for training: {otherPct}%</div>
                <input type="range" min={5} max={60} value={otherPct} onChange={e => setOtherPct(+e.target.value)}
                  style={{ width: "100%", accentColor: "#1a9654" }} />
              </div>
              <div>
                <div style={labelS}>EC2 cost for that compute</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: dark ? "#aaa" : "#666" }}>$</span>
                  <input type="number" step="0.50" min="0" max="20" value={otherRate}
                    onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0) setOtherRate(v); }}
                    style={{ ...inputS, width: 75 }} />
                  <span style={{ fontSize: 10, color: colors.textMuted }}>/hr/GPU</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Hero Summary Cards ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: sm ? "1fr" : md ? "1fr 1fr" : "1fr 1fr 1fr",
          gap, marginBottom: sm ? 16 : 22,
        }}>
          <div style={{ ...cardS(colors.bedrockCardBg) }}>
            <div style={labelS}>Bedrock total cost</div>
            <div style={{ fontSize: sm ? 22 : 26, fontWeight: 700, color: colors.red }}>
              {f$(calc.effBR)}<span style={{ fontSize: 12, fontWeight: 400 }}>/mo</span>
            </div>
            <div style={{ fontSize: 10, color: colors.redMuted, marginTop: 3 }}>
              {total} model{total > 1 ? "s" : ""} {"\u00D7"} {fT(tok)}/mo
              {otherOn && calc.oVal > 0 && <span> + {f$(calc.oVal)} training</span>}
            </div>
          </div>
          <div style={{ ...cardS(colors.greenBg) }}>
            <div style={labelS}>GreenThread + EC2</div>
            <div style={{ fontSize: sm ? 22 : 26, fontWeight: 700, color: colors.green }}>
              {f$(calc.self)}<span style={{ fontSize: 12, fontWeight: 400 }}>/mo</span>
            </div>
            <div style={{ fontSize: 10, color: colors.greenMuted, marginTop: 3 }}>
              {calc.gN}{"\u00D7"} {gpuId} · 1 cluster
              {otherOn && calc.oVal > 0 && <span> · training included</span>}
            </div>
          </div>
          <div style={{
            ...cardS(calc.sav > 0 ? colors.greenBg : colors.bedrockCardBg),
            ...(md && !sm ? { gridColumn: "1 / -1" } : {}),
          }}>
            <div style={labelS}>{calc.sav > 0 ? "GreenThread saves you" : "Bedrock is cheaper by"}</div>
            <div style={{ fontSize: sm ? 22 : 26, fontWeight: 700, color: calc.sav > 0 ? colors.green : colors.red }}>
              {f$(Math.abs(calc.sav))}<span style={{ fontSize: 12, fontWeight: 400 }}>/mo</span>
            </div>
            <div style={{ fontSize: 10, color: calc.sav > 0 ? colors.greenMuted : colors.redMuted, marginTop: 3 }}>
              {calc.sav > 0
                ? `${calc.pct.toFixed(0)}% less · ${f$(calc.ann)}/year`
                : `Crossover at ${fT(calc.cross)}/mo per model`}
            </div>
          </div>
        </div>

        {/* ── Bar Chart ── */}
        <div style={{ ...cardS(), padding: sm ? "12px 10px 8px" : "18px 16px 12px", marginBottom: sm ? 20 : 28 }}>
          <BillChart
            items={otherOn && calc.oVal > 0
              ? [...calc.items, { label: "Training", cost: calc.oVal, color: "#888" }]
              : calc.items}
            gtTotal={calc.self}
            gtLabel={`${calc.gN}\u00D7${gpuId} + GT`}
            compact={sm}
            dark={dark} />
        </div>

        {/* ── Tabbed Tables ── */}
        <div style={{ marginBottom: sm ? 20 : 28 }}>
          <div style={{ display: "flex", gap: 0 }}>
            {[{ id: "bill", l: "Bill breakdown" }, { id: "cross", l: "Crossover milestones" }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                all: "unset", cursor: "pointer", padding: sm ? "9px 14px" : "11px 22px",
                background: tab === t.id ? colors.tabBg : "transparent",
                borderRadius: "8px 8px 0 0",
                border: tab === t.id ? `1px solid ${colors.tabBorder}` : "1px solid transparent",
                borderBottom: tab === t.id ? `1px solid ${colors.tableBg}` : `1px solid ${colors.tabBorder}`,
                fontSize: sm ? 11 : 12, fontWeight: tab === t.id ? 600 : 400,
                color: tab === t.id ? colors.text : colors.textFaint, fontFamily: "inherit",
              }}>{t.l}</button>
            ))}
            <div style={{ flex: 1, borderBottom: `1px solid ${colors.tabBorder}` }} />
          </div>

          {tab === "bill" && (
            <div style={{
              background: colors.tableBg, border: `1px solid ${colors.tabBorder}`, borderTop: "none",
              borderRadius: "0 0 10px 10px", padding: sm ? "12px 0" : "22px",
              overflowX: "auto", WebkitOverflowScrolling: "touch",
            }}>
              <div style={{ minWidth: sm ? 520 : "auto", padding: sm ? "0 12px" : 0 }}>
                <table style={tblS}>
                  <thead>
                    <tr>
                      <th style={thS}>Model</th>
                      <th style={{ ...thS, textAlign: "center" }}>Count</th>
                      <th style={{ ...thS, textAlign: "right" }}>Rate/1M</th>
                      <th style={{ ...thS, textAlign: "right" }}>Per instance</th>
                      <th style={{ ...thS, textAlign: "right", color: colors.red }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calc.bd.map(m => (
                      <tr key={m.id}>
                        <td style={tdS}>
                          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: m.color, marginRight: 8, verticalAlign: "middle" }} />
                          {m.name}
                        </td>
                        <td style={{ ...tdS, textAlign: "center", color: "#1a9654", fontWeight: 600 }}>{"\u00D7"}{m.count}</td>
                        <td style={{ ...tdS, textAlign: "right", color: colors.textMuted }}>{f$x(m.rate)}</td>
                        <td style={{ ...tdS, textAlign: "right", color: colors.textMuted }}>{f$(m.perInst)}</td>
                        <td style={{ ...tdS, textAlign: "right", color: colors.red, fontWeight: 600 }}>{f$(m.sub)}</td>
                      </tr>
                    ))}
                    {otherOn && calc.oVal > 0 && (
                      <tr>
                        <td style={tdS}>
                          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#888", marginRight: 8, verticalAlign: "middle" }} />
                          Training / batch compute
                        </td>
                        <td colSpan={3} style={{ ...tdS, textAlign: "right", color: colors.textFaint }}>
                          {Math.round(calc.oHrs)} GPU-hrs {"\u00D7"} {f$x(otherRate)}/hr
                        </td>
                        <td style={{ ...tdS, textAlign: "right", color: colors.red, fontWeight: 600 }}>{f$(calc.oVal)}</td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={4} style={{ padding: "14px 12px", fontWeight: 700, color: colors.red, borderTop: `2px solid ${colors.redBorder}` }}>
                        Total Bedrock{otherOn && calc.oVal > 0 ? " + training" : ""}
                      </td>
                      <td style={{ padding: "14px 12px", textAlign: "right", fontWeight: 700, color: colors.red, fontSize: 16, borderTop: `2px solid ${colors.redBorder}` }}>
                        {f$(calc.effBR)}<span style={{ fontSize: 10, fontWeight: 400 }}>/mo</span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ ...tdS, color: dark ? "#ccc" : "#555" }}>
                        <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#1a9654", marginRight: 8, verticalAlign: "middle" }} />
                        EC2 ({calc.gN}{"\u00D7"} {gpuId})
                      </td>
                      <td colSpan={3} style={{ ...tdS, textAlign: "right", color: colors.textFaint }}>
                        {f$x(calc.hr)}/hr {"\u00D7"} {calc.gN} {"\u00D7"} {HRS}hrs
                      </td>
                      <td style={{ ...tdS, textAlign: "right", color: "#1a9654" }}>{f$(calc.ec2)}</td>
                    </tr>
                    <tr>
                      <td style={{ ...tdS, color: dark ? "#ccc" : "#555" }}>
                        <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#1a9654", marginRight: 8, verticalAlign: "middle" }} />
                        GreenThread license
                      </td>
                      <td colSpan={3} style={{ ...tdS, textAlign: "right", color: colors.textFaint }}>
                        ${GT_AUD} AUD {"\u00D7"} {calc.vram}GB VRAM
                      </td>
                      <td style={{ ...tdS, textAlign: "right", color: "#1a9654" }}>{f$(calc.gtM)}</td>
                    </tr>
                    {otherOn && calc.oVal > 0 && (
                      <tr>
                        <td colSpan={5} style={{ ...tdS, color: colors.greenMuted, fontSize: 11, fontStyle: "italic" }}>
                          Training / batch workloads run on the same hardware at no extra cost
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={4} style={{ padding: "14px 12px", fontWeight: 700, color: "#1a9654", borderTop: `2px solid ${colors.greenBorder}` }}>
                        Total GreenThread + EC2
                      </td>
                      <td style={{ padding: "14px 12px", textAlign: "right", fontWeight: 700, color: "#1a9654", fontSize: 16, borderTop: `2px solid ${colors.greenBorder}` }}>
                        {f$(calc.self)}<span style={{ fontSize: 10, fontWeight: 400 }}>/mo</span>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={4} style={{ padding: "16px 12px", fontWeight: 700, fontSize: 14, color: calc.sav > 0 ? "#1a9654" : colors.red, borderTop: `2px solid ${dark ? "#3a3a2a" : "#e8e2cc"}` }}>
                        {calc.sav > 0 ? "GreenThread saves you" : "Bedrock is cheaper by"}
                      </td>
                      <td style={{ padding: "16px 12px", textAlign: "right", fontWeight: 700, fontSize: 18, color: calc.sav > 0 ? "#1a9654" : colors.red, borderTop: `2px solid ${dark ? "#3a3a2a" : "#e8e2cc"}` }}>
                        {f$(Math.abs(calc.sav))}<span style={{ fontSize: 10, fontWeight: 400 }}>/mo</span>
                      </td>
                    </tr>
                    {calc.sav > 0 && (
                      <tr>
                        <td colSpan={4} style={{ padding: "4px 12px", color: "#1a965488", fontSize: 11 }}>Annual savings</td>
                        <td style={{ padding: "4px 12px", textAlign: "right", color: "#1a965488", fontWeight: 600, fontSize: 13 }}>
                          {f$(calc.ann)}<span style={{ fontSize: 10 }}>/yr</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "cross" && (
            <div style={{
              background: colors.tableBg, border: `1px solid ${colors.tabBorder}`, borderTop: "none",
              borderRadius: "0 0 10px 10px", padding: sm ? "12px 0" : "22px",
              overflowX: "auto", WebkitOverflowScrolling: "touch",
            }}>
              <div style={{ minWidth: sm ? 480 : "auto", padding: sm ? "0 12px" : 0 }}>
                <div style={{ fontSize: 12, color: dark ? "#aaa" : "#666", marginBottom: 16, padding: sm ? "0 0 0 0" : 0 }}>
                  Per-model average crossover:{" "}
                  <strong style={{ color: "#1a9654" }}>{fT(calc.cross)}/mo</strong>
                  <span style={{ color: colors.textFaint }}> · avg rate {f$x(calc.avgR)}/1M · GT/model {f$(calc.fpm)}/mo</span>
                </div>
                <table style={tblS}>
                  <thead>
                    <tr>
                      {["Tokens/mo", "Bedrock", "GT", "Diff", ""].map((h, i) => (
                        <th key={i} style={{
                          ...thS, textAlign: i === 0 ? "left" : i === 4 ? "center" : "right",
                          color: i === 1 ? colors.red : i === 2 ? "#1a9654" : colors.textMuted,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {calc.miles.map((ms, i) => {
                      const w = ms.d > 0 ? "GT" : "Bedrock";
                      return (
                        <tr key={i}>
                          <td style={{ ...tdS, fontWeight: 500 }}>{ms.l}</td>
                          <td style={{ ...tdS, textAlign: "right", color: colors.red }}>{f$(ms.b)}</td>
                          <td style={{ ...tdS, textAlign: "right", color: "#1a9654" }}>{f$(ms.g)}</td>
                          <td style={{ ...tdS, textAlign: "right", fontWeight: 600, color: ms.d > 0 ? "#1a9654" : colors.red }}>
                            {ms.d > 0 ? "+" : ""}{f$(ms.d)}
                          </td>
                          <td style={{ ...tdS, textAlign: "center" }}>
                            <span style={{
                              padding: "3px 12px", borderRadius: 4, fontSize: 10, fontWeight: 600,
                              background: w === "GT" ? (dark ? "#1a3a24" : "#edf7f0") : (dark ? "#3a1a18" : "#fef4f4"),
                              color: w === "GT" ? "#1a9654" : colors.red,
                            }}>{w}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ── Summary ── */}
        <div style={{ ...cardS(colors.summaryBg), marginBottom: sm ? 20 : 28 }}>
          <div style={{ fontSize: sm ? 12 : 13, color: dark ? "#ccc" : "#444", lineHeight: 1.7 }}>
            <strong style={{ color: "#1a9654" }}>Summary:</strong>{" "}
            {total} model{total > 1 ? "s" : ""} at {fT(tok)}/mo each.{" "}
            Bedrock: <strong style={{ color: colors.red }}>{f$(calc.effBR)}/mo</strong>.{" "}
            GreenThread: <strong style={{ color: "#1a9654" }}>{f$(calc.self)}/mo</strong>.{" "}
            {calc.sav > 0
              ? <span>GreenThread saves <strong style={{ color: "#1a9654" }}>{f$(calc.sav)}/mo</strong> ({calc.pct.toFixed(0)}%) {"\u2014"} <strong>{f$(calc.ann)}/year</strong>.</span>
              : <span>Bedrock is cheaper by {f$(Math.abs(calc.sav))}/mo. Crossover at <strong style={{ color: "#1a9654" }}>{fT(calc.cross)}/mo</strong> per model.</span>}
            {otherOn && calc.oVal > 0 && <span> Bedrock total includes {f$(calc.oVal)}/mo for separate training compute that GreenThread provides free.</span>}
          </div>
        </div>
      </>)}

      {!ok && largest && (
        <div style={{ ...cardS(colors.bedrockCardBg), textAlign: "center", padding: sm ? 24 : 36, marginBottom: 24 }}>
          <div style={{ color: colors.red, fontSize: 14 }}>
            {largest.name} ({largest.recVram}GB) can't run on {gpu.label}.
          </div>
          <div style={{ color: colors.redMuted, fontSize: 12, marginTop: 6 }}>
            Try: {Object.entries(GPUS).filter(([id]) => largest.tp[id] != null).map(([, g]) => g.label).join(", ")}
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{ padding: "14px 0", fontSize: 9, color: dark ? "#666" : "#ccc", lineHeight: 1.7, borderTop: `1px solid ${dark ? "#2a3a2e" : "#eee"}` }}>
        AUD/USD {AUD_USD}. GT: ${GT_AUD} AUD/GB VRAM/mo.
        Hardware sized to largest model (FP8 weights + KV cache). All models share via {"<"}5ms hot-swap.
        EC2: H100 ~$3.93/hr, A100 ~$2.75/hr, L4 ~$0.80/hr (post-Jun'25 OD).
        Excludes networking, storage, ops, Bedrock batch/caching discounts.
      </div>
    </div>
  );
}
