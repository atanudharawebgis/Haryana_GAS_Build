import React, { useState, useEffect, useCallback, useRef } from "react";

// ─────────────────────────────────────────────
//  GEOSERVER CONFIG
// ─────────────────────────────────────────────
const GS_WFS = "https://gis.hcgonline.co.in/geoserver/wfs";
const GS_WMS = "https://gis.hcgonline.co.in/geoserver/wms";

const WFS_BASE = {
  service: "WFS",
  version: "1.0.0",
  request: "GetFeature",
  outputFormat: "application/json",
  srsName: "EPSG:4326",
};

// ─────────────────────────────────────────────
//  LAYER CONFIG
// ─────────────────────────────────────────────
const LAYER_CONFIG = {
  steel_pipelines: { label: "Steel Pipeline",      wmsLayer: "haryanagas:steel_pipelines", type: "length", unit: "km",  color: "#dc2626", icon: "🔩" },
  dpngsurvey:      { label: "DPNG",                wmsLayer: "haryanagas:dpngsurvey",      type: "count",  unit: "",    color: "#2563eb", icon: "🏠" },
  house:           { label: "House",               wmsLayer: "haryanagas:house",           type: "count",  unit: "",    color: "#16a34a", icon: "🏡" },
  ci:              { label: "Industrial Customer", wmsLayer: "haryanagas:ci",              type: "count",  unit: "",    color: "#ea580c", icon: "🏭" },
  cng_station:     { label: "CNG Pump",            wmsLayer: "haryanagas:cng_station",     type: "count",  unit: "",    color: "#7c3aed", icon: "⛽" },
  mdpe_pipelines:  { label: "MDPE Pipeline",       wmsLayer: "haryanagas:mdpe_pipelines",  type: "length", unit: "km",  color: "#0891b2", icon: "🔵" },
  tlp:             { label: "TLP's",               wmsLayer: "haryanagas:tlp",             type: "count",  unit: "",    color: "#b45309", icon: "⚡" },
  cascade:         { label: "Cascade",             wmsLayer: "haryanagas:cascade",         type: "count",  unit: "",    color: "#be185d", icon: "🔗" },
  valve:           { label: "MDPE Valve",          wmsLayer: "haryanagas:valve",           type: "count",  unit: "",    color: "#0891b2", icon: "🔧" },
  compressor:      { label: "Compressor Count",    wmsLayer: "haryanagas:compressor",      type: "count",  unit: "",    color: "#6d28d9", icon: "⚙️" },
  connection_pit:  { label: "Connection Pit",      wmsLayer: "haryanagas:connection_pit",  type: "count",  unit: "",    color: "#1d4ed8", icon: "🕳" },
  dispenser:       { label: "Dispensor",           wmsLayer: "haryanagas:dispenser",       type: "count",  unit: "",    color: "#15803d", icon: "🛢" },
  cgs:             { label: "CGS",                 wmsLayer: "haryanagas:cgs",             type: "count",  unit: "",    color: "#b91c1c", icon: "🏗" },
  electric_pole:   { label: "Electric Pole",       wmsLayer: "haryanagas:electric_pole",   type: "count",  unit: "",    color: "#c2410c", icon: "💡" },
  pole_marker:     { label: "Pole Marker",         wmsLayer: "haryanagas:rcc_marker",      type: "count",  unit: "",    color: "#6d28d9", icon: "📍" },
  odorizer:        { label: "Odorizer",            wmsLayer: "haryanagas:odorizer",        type: "count",  unit: "",    color: "#b45309", icon: "🌀" },
};

// ─────────────────────────────────────────────
//  DIAMETER CHART CONFIG
// ─────────────────────────────────────────────
const STEEL_DIAMETERS = [
  { label: "6 inch",  field: "diameter", value: "6",  color: "#ef4444" },
  { label: "12 inch", field: "diameter", value: "12", color: "#f97316" },
  { label: "2 inch",  field: "diameter", value: "2",  color: "#dc2626" },
  { label: "4 inch",  field: "diameter", value: "4",  color: "#fb923c" },
];
const MDPE_DIAMETERS = [
  { label: "32 mm",  field: "diameter", value: "32",  color: "#3b82f6" },
  { label: "63 mm",  field: "diameter", value: "63",  color: "#60a5fa" },
  { label: "90 mm",  field: "diameter", value: "90",  color: "#2563eb" },
  { label: "125 mm", field: "diameter", value: "125", color: "#1d4ed8" },
];

// ─────────────────────────────────────────────
//  DATA FETCH HELPERS
// ─────────────────────────────────────────────
function haversine([lon1, lat1], [lon2, lat2]) {
  const R = 6371000;
  const toR = (d) => (d * Math.PI) / 180;
  const dLat = toR(lat2 - lat1);
  const dLon = toR(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function fetchCount(typeName) {
  try {
    const p = new URLSearchParams({ ...WFS_BASE, typeName, resultType: "hits" });
    const text = await (await fetch(`${GS_WFS}?${p}`)).text();
    const m = text.match(/numberOfFeatures="(\d+)"/);
    if (m) return parseInt(m[1]);
    const data = JSON.parse(text);
    return data?.totalFeatures ?? data?.features?.length ?? 0;
  } catch { return null; }
}

async function fetchLength(typeName) {
  try {
    const p = new URLSearchParams({ ...WFS_BASE, typeName });
    const data = await (await fetch(`${GS_WFS}?${p}`)).json();
    if (!data.features?.length) return null;
    let total = 0;
    data.features.forEach((f) => {
      const g = f.geometry;
      if (!g) return;
      const lines =
        g.type === "MultiLineString" ? g.coordinates :
        g.type === "LineString" ? [g.coordinates] : [];
      lines.forEach((line) => {
        for (let i = 0; i < line.length - 1; i++)
          total += haversine(line[i], line[i + 1]);
      });
    });
    return (total / 1000).toFixed(2);
  } catch { return null; }
}

async function fetchCountByField(typeName, field, value) {
  try {
    const p = new URLSearchParams({
      ...WFS_BASE, typeName,
      CQL_FILTER: `${field} = '${value}'`,
      resultType: "hits",
    });
    const text = await (await fetch(`${GS_WFS}?${p}`)).text();
    const m = text.match(/numberOfFeatures="(\d+)"/);
    if (m) return parseInt(m[1]);
    const data = JSON.parse(text);
    return data?.totalFeatures ?? data?.features?.length ?? 0;
  } catch { return 0; }
}

// ─────────────────────────────────────────────
//  ANIMATED NUMBER
// ─────────────────────────────────────────────
function AnimNumber({ value }) {
  const [display, setDisplay] = useState("—");
  const raf = useRef(null);

  useEffect(() => {
    if (value == null) { setDisplay("—"); return; }
    const target = parseFloat(value);
    const isFloat = String(value).includes(".");
    const dur = 900;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const cur = ease * target;
      setDisplay(
        isFloat
          ? cur.toFixed(2)
          : Math.round(cur).toLocaleString()
      );
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  return <span>{display}</span>;
}

// ─────────────────────────────────────────────
//  BAR CHART
// ─────────────────────────────────────────────
function BarChart({ data, title, subtitle }) {
  const max = Math.max(...data.map((d) => d.count || 0), 1);
  return (
    <div style={S.chartCard}>
      <div style={S.chartHead}>
        <span style={S.chartTitle}>{title}</span>
        <span style={S.chartSub}>{subtitle}</span>
      </div>
      <div style={S.barsArea}>
        {data.map((d, i) => {
          const pct = Math.max(((d.count || 0) / max) * 100, 3);
          return (
            <div key={i} style={S.barCol}>
              <div style={S.barVal}>
                {d.count == null ? "…" : (d.count || 0).toLocaleString()}
              </div>
              <div style={S.barTrack}>
                <div
                  style={{
                    ...S.barFill,
                    height: `${pct}%`,
                    background: d.color,
                    boxShadow: `0 2px 8px ${d.color}44`,
                  }}
                />
              </div>
              <div style={S.barLabel}>{d.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  STAT CARD (top row)
// ─────────────────────────────────────────────
function StatCard({ cfgKey, value, loading }) {
  const cfg = LAYER_CONFIG[cfgKey];
  return (
    <div style={{ ...S.statCard, borderTop: `3px solid ${cfg.color}` }}>
      <div style={S.statTop}>
        <span style={S.statLabel}>{cfg.label}</span>
        <span style={{ ...S.statBubble, background: cfg.color + "1a", color: cfg.color }}>
          {cfg.icon}
        </span>
      </div>
      <div style={{ ...S.statValue, color: cfg.color }}>
        {loading
          ? <span style={S.dash}>—</span>
          : <><AnimNumber value={value} />{cfg.unit && <span style={S.statUnit}>{" "}{cfg.unit}</span>}</>
        }
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  SMALL STAT CARD (TLPs / Cascade / Valve / Compressor)
// ─────────────────────────────────────────────
function SmallStat({ cfgKey, value, loading }) {
  const cfg = LAYER_CONFIG[cfgKey];
  return (
    <div style={{ ...S.smallCard, borderLeft: `3px solid ${cfg.color}` }}>
      <div style={S.smallLabel}>{cfg.label}</div>
      <div style={{ ...S.smallValue, color: cfg.color }}>
        {loading ? "—" : value != null ? Number(value).toLocaleString() : "N/A"}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  BOTTOM STAT CARD
// ─────────────────────────────────────────────
function BotCard({ cfgKey, value, loading }) {
  const cfg = LAYER_CONFIG[cfgKey];
  return (
    <div style={S.botCard}>
      <div style={{ ...S.botStripe, background: cfg.color }} />
      <div style={S.botLabel}>{cfg.label}</div>
      <div style={{ ...S.botValue, color: cfg.color }}>
        {loading ? "—" : value != null ? Number(value).toLocaleString() : "N/A"}
      </div>
      <div style={{ ...S.botIcon, color: cfg.color }}>{cfg.icon}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  WMS MAP (GeoServer GetMap image)
// ─────────────────────────────────────────────
function WmsMap() {
  const [imgSrc, setImgSrc] = useState(null);
  const [imgErr, setImgErr] = useState(false);

  useEffect(() => {
    const layers = [
      "haryanagas:ga_boundary",
      "haryanagas:ca_boundary",
      "haryanagas:cng_boundary",
      "haryanagas:steel_pipelines",
      "haryanagas:mdpe_pipelines",
      "haryanagas:cng_station",
      "haryanagas:valve",
      "haryanagas:cgs",
      "haryanagas:rcc_marker",
    ].join(",");

    const p = new URLSearchParams({
      SERVICE: "WMS", VERSION: "1.1.1", REQUEST: "GetMap",
      LAYERS: layers, STYLES: "",
      FORMAT: "image/png", TRANSPARENT: "true",
      SRS: "EPSG:4326",
      BBOX: "76.5,28.1,77.6,28.9",
      WIDTH: 660, HEIGHT: 360,
    });
    setImgSrc(`${GS_WMS}?${p}`);
  }, []);

  return (
    <div style={S.mapCard}>
      {/* SVG background layer */}
      <svg
        viewBox="0 0 660 360"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="660" height="360" fill="#e8f0f7" />
        {/* Road grid */}
        {[80, 165, 245, 315].map((y, i) => (
          <line key={`h${i}`} x1="0" y1={y} x2="660" y2={y + 22} stroke="#d1d5db" strokeWidth="1.2" />
        ))}
        {[90, 210, 330, 450, 570].map((x, i) => (
          <line key={`v${i}`} x1={x} y1="0" x2={x - 12} y2="360" stroke="#d1d5db" strokeWidth="1.2" />
        ))}
        {/* GA Outer boundary */}
        <polygon points="75,32 460,22 530,98 518,308 412,332 88,320 44,232 56,112"
          fill="rgba(249,115,22,0.06)" stroke="#f97316" strokeWidth="2" strokeDasharray="10,5" />
        {/* IGL zone */}
        <polygon points="140,140 328,124 360,228 308,282 148,270 120,200"
          fill="rgba(234,179,8,0.12)" stroke="#ca8a04" strokeWidth="1.5" />
        {/* HCG zone */}
        <polygon points="316,68 464,80 480,206 418,256 322,230 300,138"
          fill="rgba(249,115,22,0.1)" stroke="#ea580c" strokeWidth="1.5" />
        {/* Steel pipelines */}
        <polyline points="168,178 210,160 255,155 290,163 328,150 368,139 402,151 432,144 458,148"
          fill="none" stroke="#dc2626" strokeWidth="2.8" strokeLinecap="round" />
        <polyline points="192,204 232,193 266,188 300,196 334,183"
          fill="none" stroke="#dc2626" strokeWidth="1.8" strokeDasharray="6,3" />
        {/* Branch lines */}
        <line x1="290" y1="163" x2="290" y2="215" stroke="#dc2626" strokeWidth="1.5" />
        <line x1="368" y1="139" x2="368" y2="188" stroke="#dc2626" strokeWidth="1.5" />
        {/* MDPE pipelines */}
        <polyline points="110,150 155,144 204,138 248,146 276,142"
          fill="none" stroke="#2563eb" strokeWidth="2.2" />
        <polyline points="352,158 386,151 418,158 450,152 474,157"
          fill="none" stroke="#2563eb" strokeWidth="2.2" />
        {/* Station markers */}
        <circle cx="328" cy="150" r="8" fill="#f97316" stroke="#fff" strokeWidth="2" />
        <circle cx="378" cy="141" r="7" fill="#2563eb" stroke="#fff" strokeWidth="2" />
        <circle cx="290" cy="198" r="6" fill="#16a34a" stroke="#fff" strokeWidth="1.5" />
        <circle cx="237" cy="189" r="6" fill="#f97316" stroke="#fff" strokeWidth="1.5" />
        <circle cx="420" cy="158" r="9" fill="#2563eb" stroke="#fff" strokeWidth="2" />
        <circle cx="168" cy="176" r="7" fill="#7c3aed" stroke="#fff" strokeWidth="1.5" />
        {/* Area Labels */}
        <text x="185" y="200" fill="#92400e" fontFamily="sans-serif" fontWeight="700" fontSize="13">Gurgaon1-IGL</text>
        <text x="330" y="135" fill="#ea580c" fontFamily="sans-serif" fontWeight="700" fontSize="13">Gurgaon2-HCG</text>
        <text x="178" y="264" fill="#92400e" fontFamily="sans-serif" fontSize="10">Gurgaon1- IGL</text>
        <text x="378" y="290" fill="#ea580c" fontFamily="sans-serif" fontSize="10">Gurgaon2- HCG</text>
        {/* City labels */}
        <text x="24"  y="50"  fill="#6b7280" fontSize="9" fontFamily="sans-serif">Matanhal</text>
        <text x="460" y="62"  fill="#6b7280" fontSize="9" fontFamily="sans-serif">Noida</text>
        <text x="488" y="220" fill="#6b7280" fontSize="9" fontFamily="sans-serif">Faridabad</text>
        <text x="28"  y="315" fill="#6b7280" fontSize="9" fontFamily="sans-serif">Rewari</text>
        <text x="215" y="348" fill="#6b7280" fontSize="9" fontFamily="sans-serif">Bhiwadi</text>
        <text x="405" y="348" fill="#6b7280" fontSize="9" fontFamily="sans-serif">Palwal</text>
        {/* Legend */}
        <rect x="6" y="255" width="142" height="96" rx="5"
          fill="rgba(255,255,255,0.94)" stroke="#d1d5db" strokeWidth="1" />
        <line x1="13" y1="272" x2="37" y2="272" stroke="#dc2626" strokeWidth="2.5" />
        <text x="42" y="275" fill="#374151" fontSize="9.5" fontFamily="sans-serif">Steel Pipeline</text>
        <line x1="13" y1="289" x2="37" y2="289" stroke="#2563eb" strokeWidth="2.5" />
        <text x="42" y="292" fill="#374151" fontSize="9.5" fontFamily="sans-serif">MDPE Pipeline</text>
        <circle cx="21" cy="305" r="5" fill="#f97316" stroke="#fff" strokeWidth="1" />
        <text x="30" y="308" fill="#374151" fontSize="9.5" fontFamily="sans-serif">CNG Station</text>
        <circle cx="21" cy="321" r="5" fill="#2563eb" stroke="#fff" strokeWidth="1" />
        <text x="30" y="324" fill="#374151" fontSize="9.5" fontFamily="sans-serif">CGS</text>
        <circle cx="21" cy="337" r="5" fill="#7c3aed" stroke="#fff" strokeWidth="1" />
        <text x="30" y="340" fill="#374151" fontSize="9.5" fontFamily="sans-serif">Valve</text>
        {/* Compass */}
        <g transform="translate(628,28)">
          <circle r="22" fill="rgba(255,255,255,0.95)" stroke="#d1d5db" strokeWidth="1.5" />
          <polygon points="0,-16 4,2 0,0"  fill="#dc2626" />
          <polygon points="0,-16 -4,2 0,0" fill="#dc2626" opacity="0.5" />
          <polygon points="0,16 4,-2 0,0"  fill="#9ca3af" />
          <polygon points="0,16 -4,-2 0,0" fill="#d1d5db" />
          <text x="0" y="-19" textAnchor="middle" fill="#dc2626" fontSize="9" fontWeight="bold" fontFamily="sans-serif">N</text>
        </g>
      </svg>

      {/* Real WMS image on top of SVG */}
      {imgSrc && !imgErr && (
        <img
          src={imgSrc}
          alt="GeoServer WMS"
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover", zIndex: 3,
            mixBlendMode: "multiply",
          }}
          onError={() => setImgErr(true)}
        />
      )}

      {/* Zoom controls */}
      <div style={S.zoomWrap}>
        <button style={S.zoomBtn}>+</button>
        <button style={S.zoomBtn}>−</button>
      </div>

      {/* Live badge */}
      <div style={S.liveBadge}>● LIVE</div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  MAIN DASHBOARD COMPONENT
// ─────────────────────────────────────────────
export default function Dashboard({ onNavigateToMap }) {
  const [stats, setStats]           = useState({});
  const [loading, setLoading]       = useState(true);
  const [steelChart, setSteelChart] = useState(STEEL_DIAMETERS.map((d) => ({ ...d, count: null })));
  const [mdpeChart, setMdpeChart]   = useState(MDPE_DIAMETERS.map((d) => ({ ...d, count: null })));
  const [activeArea, setActiveArea] = useState("A-01");
  const [updatedAt, setUpdatedAt]   = useState(null);

  const AREAS = Array.from({ length: 14 }, (_, i) =>
    `A-${String(i + 1).padStart(2, "0")}`
  );

  // ── Fetch all ───────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const results = {};
    await Promise.all(
      Object.entries(LAYER_CONFIG).map(async ([key, cfg]) => {
        results[key] =
          cfg.type === "length"
            ? await fetchLength(cfg.wmsLayer)
            : await fetchCount(cfg.wmsLayer);
      })
    );
    setStats(results);
    setLoading(false);
    setUpdatedAt(new Date().toLocaleTimeString());

    // Charts
    const [steelNew, mdpeNew] = await Promise.all([
      Promise.all(
        STEEL_DIAMETERS.map(async (d) => ({
          ...d,
          count: await fetchCountByField(
            LAYER_CONFIG.steel_pipelines.wmsLayer, d.field, d.value
          ),
        }))
      ),
      Promise.all(
        MDPE_DIAMETERS.map(async (d) => ({
          ...d,
          count: await fetchCountByField(
            LAYER_CONFIG.mdpe_pipelines.wmsLayer, d.field, d.value
          ),
        }))
      ),
    ]);
    setSteelChart(steelNew);
    setMdpeChart(mdpeNew);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Render ──────────────────────────────────
  return (
    <div style={S.root}>

      {/* TOPBAR */}
      <div style={S.topbar}>
        <div style={S.logoWrap}>
          <div style={S.logoBadge}>HCG</div>
          <span style={S.logoText}>City Gas Distribution</span>
        </div>
        <span style={S.dashTitle}>GIS Dashboard</span>
        <div style={S.topRight}>
          {updatedAt && <span style={S.updatedAt}>🕐 {updatedAt}</span>}
          <button style={S.btnBlue} onClick={() => onNavigateToMap?.()}>🗺 Open Map</button>
          <button style={S.btnOrange} onClick={fetchAll} disabled={loading}>
            {loading ? "⏳ Loading…" : "🔄 Refresh"}
          </button>
          <div style={S.avatar}>👤</div>
        </div>
      </div>

      {/* BODY */}
      <div style={S.body}>

        {/* SIDEBAR */}
        <div style={S.sidebar}>
          {AREAS.map((area) => (
            <div
              key={area}
              style={area === activeArea ? { ...S.sideItem, ...S.sideOn } : S.sideItem}
              onClick={() => setActiveArea(area)}
            >
              <span style={{ ...S.sideCode, color: area === activeArea ? "#f97316" : "#94a3b8" }}>
                {area}
              </span>
              <span style={S.sideSub}>{area}</span>
            </div>
          ))}
        </div>

        {/* MAIN CONTENT */}
        <div style={S.content}>

          {/* ROW 1 — 6 top stat cards */}
          <div style={S.row1}>
            {["steel_pipelines","dpngsurvey","house","ci","cng_station","mdpe_pipelines"].map((k) => (
              <StatCard key={k} cfgKey={k} value={stats[k]} loading={loading} />
            ))}
          </div>

          {/* ROW 2 — Left chart | Map | Right chart */}
          <div style={S.row2}>

            <div style={S.sideCol}>
              <BarChart data={steelChart} title="Steel Pipeline" subtitle="by Diameter" />
              <div style={S.smallGrid}>
                {["tlp","cascade"].map((k) => (
                  <SmallStat key={k} cfgKey={k} value={stats[k]} loading={loading} />
                ))}
              </div>
            </div>

            <WmsMap />

            <div style={S.sideCol}>
              <BarChart data={mdpeChart} title="MDPE Pipeline" subtitle="by Diameter" />
              <div style={S.smallGrid}>
                {["valve","compressor"].map((k) => (
                  <SmallStat key={k} cfgKey={k} value={stats[k]} loading={loading} />
                ))}
              </div>
            </div>

          </div>

          {/* ROW 3 — 6 bottom stat cards */}
          <div style={S.row3}>
            {["connection_pit","dispenser","cgs","electric_pole","pole_marker","odorizer"].map((k) => (
              <BotCard key={k} cfgKey={k} value={stats[k]} loading={loading} />
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  STYLES  (White / Light theme)
// ─────────────────────────────────────────────
const S = {
  root: {
    display: "flex", flexDirection: "column",
    height: "100vh", width: "100vw",
    background: "#f1f5f9",
    fontFamily: "'Inter','Segoe UI',sans-serif",
    overflow: "hidden",
  },

  /* TOPBAR */
  topbar: {
    background: "#ffffff",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 20px", height: 54, flexShrink: 0,
    borderBottom: "1.5px solid #e2e8f0",
    boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
  },
  logoWrap: { display: "flex", alignItems: "center", gap: 10, minWidth: 200 },
  logoBadge: {
    background: "#f97316", color: "#fff",
    fontWeight: 800, fontSize: 18,
    padding: "4px 12px", borderRadius: 6, letterSpacing: 1,
  },
  logoText:  { fontWeight: 700, fontSize: 17, color: "#1e293b" },
  dashTitle: { fontSize: 15, fontWeight: 700, color: "#334155", letterSpacing: 0.4 },
  topRight:  { display: "flex", alignItems: "center", gap: 10, minWidth: 200, justifyContent: "flex-end" },
  updatedAt: { fontSize: 11, color: "#94a3b8" },
  btnBlue: {
    background: "#003376", color: "#fff",
    border: "none", borderRadius: 7,
    padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
  },
  btnOrange: {
    background: "#f97316", color: "#fff",
    border: "none", borderRadius: 7,
    padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
  },
  avatar: {
    width: 34, height: 34, borderRadius: "50%",
    background: "#f97316",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 16, cursor: "pointer",
  },

  /* BODY */
  body: { display: "flex", flex: 1, overflow: "hidden" },

  /* SIDEBAR */
  sidebar: {
    width: 60, background: "#1e293b",
    display: "flex", flexDirection: "column",
    overflowY: "auto", flexShrink: 0,
    scrollbarWidth: "none", paddingTop: 6,
  },
  sideItem: {
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "8px 2px", cursor: "pointer",
    borderLeft: "3px solid transparent",
    transition: "all 0.18s",
  },
  sideOn: {
    background: "rgba(249,115,22,0.15)",
    borderLeftColor: "#f97316",
  },
  sideCode: { fontSize: 9, fontWeight: 700, letterSpacing: 0.5 },
  sideSub:  { fontSize: 7.5, color: "#475569", marginTop: 1 },

  /* CONTENT */
  content: {
    flex: 1, display: "flex", flexDirection: "column",
    padding: 9, gap: 8, overflow: "hidden",
  },

  /* ROW 1 */
  row1: {
    display: "grid", gridTemplateColumns: "repeat(6,1fr)",
    gap: 8, flexShrink: 0,
  },
  statCard: {
    background: "#ffffff",
    borderRadius: 10,
    padding: "10px 14px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
    border: "1px solid #e2e8f0",
    position: "relative", overflow: "hidden",
  },
  statTop:   { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  statLabel: { fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 },
  statBubble:{
    fontSize: 14, width: 28, height: 28, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  statValue: { fontSize: 22, fontWeight: 800, lineHeight: 1 },
  statUnit:  { fontSize: 11, color: "#94a3b8", fontWeight: 400 },
  dash:      { color: "#cbd5e1", fontSize: 14 },

  /* ROW 2 */
  row2: {
    display: "grid", gridTemplateColumns: "200px 1fr 200px",
    gap: 8, flex: 1, overflow: "hidden", minHeight: 0,
  },
  sideCol: { display: "flex", flexDirection: "column", gap: 8, overflow: "hidden" },

  /* BAR CHART */
  chartCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 10, padding: "10px 12px",
    display: "flex", flexDirection: "column",
    flex: 1, minHeight: 0,
    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
  },
  chartHead:  { display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8, flexShrink: 0 },
  chartTitle: { fontSize: 11, fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: 0.4 },
  chartSub:   { fontSize: 9.5, color: "#f97316", fontWeight: 600 },
  barsArea: {
    flex: 1, display: "flex", alignItems: "flex-end",
    gap: 6, padding: "0 2px 2px", minHeight: 0,
  },
  barCol: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", height: "100%", justifyContent: "flex-end",
  },
  barVal:   { fontSize: 9, fontWeight: 700, color: "#374151", marginBottom: 2 },
  barTrack: { width: "100%", flex: 1, display: "flex", alignItems: "flex-end", borderBottom: "1.5px solid #e2e8f0" },
  barFill:  { width: "100%", borderRadius: "3px 3px 0 0", transition: "height 0.7s cubic-bezier(.34,1.56,.64,1)" },
  barLabel: { fontSize: 8.5, color: "#94a3b8", marginTop: 3, textAlign: "center" },

  /* SMALL STATS */
  smallGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flexShrink: 0 },
  smallCard: {
    background: "#ffffff", border: "1px solid #e2e8f0",
    borderRadius: 8, padding: "8px 10px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  smallLabel: { fontSize: 9, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 3 },
  smallValue: { fontSize: 26, fontWeight: 800, lineHeight: 1 },

  /* MAP */
  mapCard: {
    background: "#e8f0f7",
    border: "1px solid #e2e8f0",
    borderRadius: 10, overflow: "hidden",
    position: "relative",
    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
  },
  zoomWrap: { position: "absolute", top: 10, left: 10, zIndex: 20, display: "flex", flexDirection: "column", gap: 2 },
  zoomBtn: {
    width: 26, height: 26, background: "#ffffff",
    border: "1px solid #cbd5e1", borderRadius: 4,
    cursor: "pointer", fontSize: 16, fontWeight: 700,
    color: "#374151", display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)", lineHeight: 1,
  },
  liveBadge: {
    position: "absolute", top: 10, right: 10, zIndex: 20,
    background: "rgba(255,255,255,0.9)", border: "1px solid #d1d5db",
    borderRadius: 5, padding: "3px 10px",
    fontSize: 10, color: "#16a34a", fontWeight: 700,
  },

  /* ROW 3 */
  row3: {
    display: "grid", gridTemplateColumns: "repeat(6,1fr)",
    gap: 8, flexShrink: 0,
  },
  botCard: {
    background: "#ffffff", border: "1px solid #e2e8f0",
    borderRadius: 10, padding: "10px 12px",
    position: "relative", overflow: "hidden",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  botStripe: { position: "absolute", top: 0, left: 0, right: 0, height: 3, borderRadius: "10px 10px 0 0" },
  botLabel:  { fontSize: 9.5, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4, marginTop: 4 },
  botValue:  { fontSize: 20, fontWeight: 800, lineHeight: 1 },
  botIcon:   { position: "absolute", top: 8, right: 10, fontSize: 18, opacity: 0.2 },
};