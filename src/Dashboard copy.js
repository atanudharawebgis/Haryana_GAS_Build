import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// OpenLayers imports — same as your App.jsx
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import TileWMS from "ol/source/TileWMS";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj";
import "ol/ol.css";
import hcgLogo from "./assets/HCG-logo-1.png";

// ============================================================
// GEOSERVER CONFIG  (same as App.jsx)
// ============================================================
const GS_WFS = "https://gis.hcgonline.co.in/geoserver/wfs";
const GS_WMS = "https://gis.hcgonline.co.in/geoserver/wms";

const WFS_BASE = {
  service: "WFS",
  version: "1.0.0",
  request: "GetFeature",
  outputFormat: "application/json",
  srsName: "EPSG:4326",
};

// ── All WMS layers (same as App.jsx layerGroups) ──────────
const WMS_LAYERS = [
  { key: "ga_boundary", wms: "haryanagas:ga_boundary" },
  { key: "ca_boundary", wms: "haryanagas:ca_boundary" },
  { key: "cng_boundary", wms: "haryanagas:cng_boundary" },
  { key: "cng_station", wms: "haryanagas:cng_station" },
  { key: "compressor", wms: "haryanagas:compressor" },
  // { key: "cgs", wms: "haryanagas:cgs" },
  { key: "dispenser", wms: "haryanagas:dispenser" },
  { key: "odorizer", wms: "haryanagas:odorizer" },
  { key: "cascade", wms: "haryanagas:cascade" },
  { key: "ci", wms: "haryanagas:ci" },
  { key: "dpngsurvey", wms: "haryanagas:dpngsurvey" },
  { key: "pole_marker", wms: "haryanagas:pole_marker" },
  { key: "rcc_marker", wms: "haryanagas:rcc_marker" },
  { key: "road", wms: "haryanagas:road" },
  { key: "house", wms: "haryanagas:house" },
  { key: "connection_pit", wms: "haryanagas:connection_pit" },
  { key: "electric_pole", wms: "haryanagas:electric_pole" },
  { key: "steel_pipelines", wms: "haryanagas:steel_pipelines" },
  { key: "tlp", wms: "haryanagas:tlp" },
  { key: "mdpe_pipelines", wms: "haryanagas:mdpe_pipelines" },
  { key: "valve", wms: "haryanagas:valve" },
];

// ── Stat layer definitions ────────────────────────────────
const LAYERS = {
  steel_pipelines: {
    label: "Steel Pipeline",
    wms: "haryanagas:steel_pipelines",
    type: "length",
    unit: "km",
    icon: "🔩",
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca",
  },
  dpngsurvey: {
    label: "CNG Station",
    wms: "haryanagas:cng_station",
    type: "count",
    unit: "",
    icon: "📋",
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
  },
  house: {
    label: "Domestic Customer",
    wms: "haryanagas:house",
    type: "count",
    unit: "",
    icon: "🏡",
    color: "#16a34a",
    bg: "#f0fdf4",
    border: "#bbf7d0",
  },
  ci: {
    label: "Industrial & Commercial Customer",
    wms: "haryanagas:ci",
    type: "count",
    unit: "",
    icon: "🏭",
    color: "#9333ea",
    bg: "#faf5ff",
    border: "#e9d5ff",
  },
  cng_station: {
    label: "Gas Valve",
    wms: "haryanagas:cng_station",
    type: "count",
    unit: "",
    icon: "⛽",
    color: "#ea580c",
    bg: "#fff7ed",
    border: "#fed7aa",
  },
  mdpe_pipelines: {
    label: "MDPE Pipeline",
    wms: "haryanagas:mdpe_pipelines",
    type: "length",
    unit: "km",
    icon: "🔵",
    color: "#0891b2",
    bg: "#ecfeff",
    border: "#a5f3fc",
  },
  tlp: {
    label: "TLP",
    wms: "haryanagas:tlp",
    type: "count",
    unit: "",
    icon: "⚡",
    color: "#ca8a04",
    bg: "#fefce8",
    border: "#fef08a",
  },
  cascade: {
    label: "Cascade",
    wms: "haryanagas:cascade",
    type: "count",
    unit: "",
    icon: "🔗",
    color: "#db2777",
    bg: "#fdf2f8",
    border: "#fbcfe8",
  },
  valve: {
    label: "Valve",
    wms: "haryanagas:valve",
    type: "count",
    unit: "",
    icon: "🔧",
    color: "#0891b2",
    bg: "#ecfeff",
    border: "#a5f3fc",
  },
  compressor: {
    label: "Compressor",
    wms: "haryanagas:compressor",
    type: "count",
    unit: "",
    icon: "⚙️",
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#ddd6fe",
  },
  connection_pit: {
    label: "TLP",
    wms: "haryanagas:connection_pit",
    type: "count",
    unit: "",
    icon: "🕳️",
    color: "#0369a1",
    bg: "#f0f9ff",
    border: "#bae6fd",
  },
  dispenser: {
    label: "TF",
    wms: "haryanagas:dispenser",
    type: "count",
    unit: "",
    icon: "🚿",
    color: "#059669",
    bg: "#ecfdf5",
    border: "#a7f3d0",
  },
  cgs: {
    label: "CGS",
    wms: "haryanagas:cgs",
    type: "count",
    unit: "",
    icon: "🏗️",
    color: "#b91c1c",
    bg: "#fef2f2",
    border: "#fecaca",
  },
  electric_pole: {
    label: "Compressor",
    wms: "haryanagas:electric_pole",
    type: "count",
    unit: "",
    icon: "🔌",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
  },
  pole_marker: {
    label: "Dispensor",
    wms: "haryanagas:rcc_marker",
    type: "count",
    unit: "",
    icon: "📌",
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#ddd6fe",
  },
  odorizer: {
    label: "DRS",
    wms: "haryanagas:odorizer",
    type: "count",
    unit: "",
    icon: "💨",
    color: "#0f766e",
    bg: "#f0fdfa",
    border: "#99f6e4",
  },
};

// ============================================================
// HELPERS
// ============================================================
function haversine([lon1, lat1], [lon2, lat2]) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function fetchCount(typeName) {
  try {
    const p = new URLSearchParams({
      service: "WFS",
      version: "1.0.0",
      request: "GetFeature",
      typeName,
      resultType: "hits",
    });
    const txt = await (await fetch(`${GS_WFS}?${p}`)).text();
    const m =
      txt.match(/numberOfFeatures="(\d+)"/i) ||
      txt.match(/numberMatched="(\d+)"/i);
    if (m) return parseInt(m[1]);
    const d = JSON.parse(txt);
    return d?.totalFeatures ?? d?.features?.length ?? 0;
  } catch {
    try {
      const p2 = new URLSearchParams({ ...WFS_BASE, typeName });
      const d2 = await (await fetch(`${GS_WFS}?${p2}`)).json();
      return d2?.features?.length ?? 0;
    } catch {
      return null;
    }
  }
}

async function fetchLength(typeName) {
  try {
    const p = new URLSearchParams({ ...WFS_BASE, typeName });
    const data = await (await fetch(`${GS_WFS}?${p}`)).json();
    if (!data.features?.length) return null;
    let km = 0;
    data.features.forEach((f) => {
      const g = f.geometry;
      if (!g) return;
      const segs =
        g.type === "MultiLineString"
          ? g.coordinates
          : g.type === "LineString"
            ? [g.coordinates]
            : [];
      segs.forEach((seg) => {
        for (let i = 0; i < seg.length - 1; i++)
          km += haversine(seg[i], seg[i + 1]);
      });
    });
    return parseFloat(km.toFixed(2));
  } catch {
    return null;
  }
}

async function fetchCountFiltered(typeName, cql) {
  try {
    const p = new URLSearchParams({
      ...WFS_BASE,
      typeName,
      CQL_FILTER: cql,
      resultType: "hits",
    });
    const txt = await (await fetch(`${GS_WFS}?${p}`)).text();
    const m =
      txt.match(/numberOfFeatures="(\d+)"/i) ||
      txt.match(/numberMatched="(\d+)"/i);
    if (m) return parseInt(m[1]);
    const d = JSON.parse(txt);
    return d?.totalFeatures ?? d?.features?.length ?? 0;
  } catch {
    return 0;
  }
}

// ============================================================
// MINI OPENLAYERS MAP — same layers as App.jsx
// ============================================================
function MiniOLMap() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Base layer
    const baseLayer = new TileLayer({
      source: new OSM({ crossOrigin: "anonymous" }),
    });

    // All WMS layers (same as App.jsx)
    const wmsLayers = WMS_LAYERS.map(
      ({ wms }) =>
        new TileLayer({
          source: new TileWMS({
            url: GS_WMS,
            params: {
              LAYERS: wms,
              FORMAT: "image/png8",
              TRANSPARENT: true,
              TILED: true,
            },
            serverType: "geoserver",
            crossOrigin: "anonymous",
            transition: 0,
          }),
          preload: 2,
        }),
    );

    const map = new Map({
      target: mapRef.current,
      layers: [baseLayer, ...wmsLayers],
      controls: [], // no default controls — clean look
      view: new View({
        center: fromLonLat([76.993869, 28.448841]),
        zoom: 10,
        maxZoom: 20,
        minZoom: 2,
        constrainResolution: true,
      }),
    });

    mapInstance.current = map;

    // resize when parent changes
    const ro = new ResizeObserver(() => map.updateSize());
    ro.observe(mapRef.current);

    return () => {
      ro.disconnect();
      map.setTarget(null);
      mapInstance.current = null;
    };
  }, []);

  // zoom helpers
  const zoomIn = () => {
    const v = mapInstance.current?.getView();
    v && v.animate({ zoom: v.getZoom() + 1, duration: 250 });
  };
  const zoomOut = () => {
    const v = mapInstance.current?.getView();
    v && v.animate({ zoom: v.getZoom() - 1, duration: 250 });
  };
  const home = () => {
    const v = mapInstance.current?.getView();
    v &&
      v.animate({
        center: fromLonLat([76.993869, 28.448841]),
        zoom: 10,
        duration: 500,
      });
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "#f8fafc",
        borderRadius: "0 0 12px 12px",
        overflow: "hidden",
      }}
    >
      {/* OL map canvas */}
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

      {/* Map controls overlay */}
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          zIndex: 10,
        }}
      >
        {[
          { label: "⌂", title: "Home", onClick: home },
          { label: "+", title: "Zoom In", onClick: zoomIn },
          { label: "−", title: "Zoom Out", onClick: zoomOut },
        ].map((btn) => (
          <button
            key={btn.label}
            title={btn.title}
            onClick={btn.onClick}
            style={{
              width: 28,
              height: 28,
              background: "#fff",
              border: "1px solid #cbd5e1",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
              color: "#374151",
              lineHeight: 1,
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Live badge */}
      <div
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          background: "rgba(15,23,42,0.85)",
          border: "1px solid #334155",
          borderRadius: 6,
          padding: "3px 10px",
          fontSize: 10,
          fontWeight: 600,
          color: "#4ade80",
          display: "flex",
          alignItems: "center",
          gap: 5,
          zIndex: 10,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#16a34a",
            animation: "livepulse 2s infinite",
          }}
        />
        Live GIS
      </div>
    </div>
  );
}

// ============================================================
// ANIMATED COUNT-UP
// ============================================================
function CountUp({ target, isFloat }) {
  if (target == null) return <span style={{ color: "#9ca3af" }}>—</span>;
  return (
    <span>
      {isFloat
        ? parseFloat(target).toFixed(2)
        : Math.round(target).toLocaleString("en-IN")}
    </span>
  );
}

// Legend image from WMS GetLegendGraphic
function LegendImg({ wmsLayer, label }) {
  const [err, setErr] = useState(false);
  if (err) return null;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        marginBottom: 6,
        paddingBottom: 6,
        borderBottom: "1px solid #f1f5f9",
      }}
    >
      <span
        style={{
          fontSize: 10,
          color: "#2d5282",
          fontWeight: 600,
          marginBottom: 3,
        }}
      >
        {label}
      </span>
      <img
        src={`${GS_WMS}?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&LAYER=${wmsLayer}`}
        alt={label}
        onError={() => setErr(true)}
      />
    </div>
  );
}

const ALL_LEGEND_LAYERS = [
  { wms: "haryanagas:ga_boundary", label: "GA Boundary" },
  { wms: "haryanagas:ca_boundary", label: "CA Boundary" },
  { wms: "haryanagas:cng_boundary", label: "CNG Boundary" },
  { wms: "haryanagas:steel_pipelines", label: "Steel Pipeline" },
  { wms: "haryanagas:mdpe_pipelines", label: "MDPE Pipeline" },
  { wms: "haryanagas:tlp", label: "TLP" },
  { wms: "haryanagas:valve", label: "Valve" },
  { wms: "haryanagas:cng_station", label: "CNG Station" },
  { wms: "haryanagas:compressor", label: "Compressor" },
  { wms: "haryanagas:cgs", label: "CGS" },
  { wms: "haryanagas:dispenser", label: "Dispenser" },
  { wms: "haryanagas:odorizer", label: "Odorizer" },
  { wms: "haryanagas:cascade", label: "Cascade" },
  { wms: "haryanagas:ci", label: "Industrial Customer" },
  { wms: "haryanagas:dpngsurvey", label: "DPNG Survey" },
  { wms: "haryanagas:pole_marker", label: "Pole Marker" },
  { wms: "haryanagas:rcc_marker", label: "Stone Marker" },
  { wms: "haryanagas:road", label: "Road" },
  { wms: "haryanagas:house", label: "House" },
  { wms: "haryanagas:connection_pit", label: "Connection Pit" },
  { wms: "haryanagas:electric_pole", label: "Electric Pole" },
];

function SideItem({ label, active, isParent, isChild, expanded, onClick }) {
  return (
    <div
      onClick={onClick}
      title={label}
      style={{
        padding: isChild ? "5px 4px 5px 10px" : "7px 4px",
        fontSize: isChild ? 9 : 10,
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        borderRadius: 6,
        margin: "1px 4px",
        background: active ? (isChild ? "#1d4ed8" : "#003376") : "transparent",
        color: active ? "#fff" : isChild ? "#94a3b8" : "#64748b",
        transition: "all 0.15s",
        textAlign: "center",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        borderLeft: isChild ? "2px solid #cbd5e1" : "none",
      }}
    >
      {isParent ? (expanded ? "▾ " : "▸ ") : ""}
      {label}
    </div>
  );
}
// ============================================================
// MAIN DASHBOARD COMPONENT
// ============================================================
export default function Dashboard({ onNavigateToMap, onBackToHome }) {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [steelChart, setSteelChart] = useState([]);
  const [mdpeChart, setMdpeChart] = useState([]);
  const [chartLoad, setChartLoad] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [gaList, setGaList] = useState([]);
  const [caList, setCaList] = useState([]);
  const [selectedGA, setSelectedGA] = useState("ALL");
  const [selectedCA, setSelectedCA] = useState("ALL");

  // GA list fetch
 useEffect(() => {
    setGaList(["Gurugram", "Faridabad", "Panipat"]);
  }, []);

  // CA list fetch jab GA change ho
  useEffect(() => {
    if (selectedGA === "ALL") {
      setCaList([]);
      setSelectedCA("ALL");
      return;
    }
    setCaList(["Zone A", "Zone B", "Zone C"]);
    setSelectedCA("ALL");
  }, [selectedGA]);

  // ── fetch main stats ──────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setLoading(true);
    // const result = {
    //   steel_pipelines: 142.5,
    //   dpngsurvey: 12480,
    //   house: 8920,
    //   ci: 340,
    //   cng_station: 18,
    //   mdpe_pipelines: 98.3,
    //   tlp: 56,
    //   cascade: 24,
    //   valve: 210,
    //   compressor: 12,
    //   connection_pit: 1840,
    //   dispenser: 95,
    //   cgs: 7,
    //   electric_pole: 430,
    //   pole_marker: 620,
    //   odorizer: 15,
    // };
    // setStats(result);
    setLoading(false);
    setLastUpdated(new Date().toLocaleTimeString("en-IN"));
  }, [selectedGA, selectedCA]);

  // ── fetch chart data ──────────────────────────────────────
  const fetchCharts = useCallback(async () => {
    setChartLoad(true);
    setSteelChart([
      { label: '2"',  color: "#fca5a5", value: 320 },
      { label: '4"',  color: "#f87171", value: 180 },
      { label: '6"',  color: "#ef4444", value: 95  },
      { label: '12"', color: "#b91c1c", value: 40  },
    ]);
    setMdpeChart([
      { label: "32",  color: "#bfdbfe", value: 410 },
      { label: "63",  color: "#60a5fa", value: 280 },
      { label: "90",  color: "#3b82f6", value: 150 },
      { label: "125", color: "#1d4ed8", value: 60  },
    ]);
    setChartLoad(false);
  }, []);

  useEffect(() => {
    fetchStats();
    fetchCharts();
  }, [fetchStats, fetchCharts]);

  const doRefresh = () => {
    fetchStats();
    fetchCharts();
  };

  // ── shared tooltip style ──────────────────────────────────
  const tooltipStyle = {
    contentStyle: {
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      fontSize: 12,
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    },
    formatter: (v) => [v.toLocaleString("en-IN"), "Count"],
    cursor: { fill: "rgba(0,0,0,0.04)" },
  };

  // ── RENDER ────────────────────────────────────────────────
  return (
    <div style={ROOT}>
      <style>{`
        @keyframes livepulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
      `}</style>

      {/* ── TOP BAR ── */}
      <div style={TOPBAR}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src={hcgLogo}
            alt="HCG"
            style={{
              height: 20,
              width: "auto",
              objectFit: "contain",
              padding: "2px",
            }}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#e2e8f0" }}>
              BlueView | Haryana City Gas Distribution
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {lastUpdated && (
            <span style={{ fontSize: 11, color: "#e2e5eb" }}>
              🕐 {lastUpdated}
            </span>
          )}
          {onNavigateToMap && (
            <button onClick={onNavigateToMap} style={BTN_BLUE}>
              🗺 Open Full Map
            </button>
          )}
          <button
            onClick={doRefresh}
            disabled={loading}
            style={{ ...BTN_ORANGE, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "⏳ Loading…" : "Refresh"}
          </button>
          {onBackToHome && (
            <button onClick={onBackToHome} style={BTN_GRAY}>
              Home
            </button>
          )}
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* MAIN CONTENT */}
        <div style={CONTENT}>
          {/* ROW 1 — 6 top stat cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6,1fr)",
              gap: 8,
              flexShrink: 0,
            }}
          >
            {[
              "steel_pipelines",
              "dpngsurvey",
              "house",
              "ci",
              "cng_station",
              "mdpe_pipelines",
            ].map((k) => {
              const cfg = LAYERS[k];
              const val = stats[k] ?? null;
              return (
                <div
                  key={k}
                  style={{
                    background: "#fff",
                    border: "1px solid #dbeafe",
                    borderTop: `2px solid ${cfg.color}`,
                    borderRadius: 8,
                    padding: "10px 14px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#2d5282",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: 6,
                        }}
                      >
                        {cfg.label}
                      </div>
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: 800,
                          color: cfg.color,
                          lineHeight: 1,
                        }}
                      >
                        {loading ? (
                          <span style={{ fontSize: 14, color: "#9ca3af" }}>
                            Loading…
                          </span>
                        ) : (
                          <>
                            <CountUp
                              target={val}
                              isFloat={cfg.type === "length"}
                            />
                            {cfg.unit && (
                              <span
                                style={{
                                  fontSize: 12,
                                  color: "#9ca3af",
                                  marginLeft: 4,
                                  fontWeight: 500,
                                }}
                              >
                                {cfg.unit}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    {/* <span style={{ fontSize: 26, opacity: 0.55 }}>
                      {cfg.icon}
                    </span> */}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ROW 2 — Left panel + Map + Right panel */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "300px 1fr 220px 300px",
              gap: 8,
              flex: 1,
              overflow: "hidden",
              minHeight: 0,
            }}
          >
            {/* LEFT PANEL */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                overflow: "hidden",
              }}
            >
              {/* Steel bar chart */}
              <div style={CHART_CARD}>
                <div style={CHART_TITLE}>
                  Steel Pipeline Bargraph
                  <br />
                  <span
                    style={{
                      color: "#9ca3af",
                      textTransform: "none",
                      letterSpacing: 0,
                      fontWeight: 400,
                    }}
                  >
                    by Diameter
                  </span>
                </div>
                {chartLoad ? (
                  <div style={LOADING_TEXT}>Fetching…</div>
                ) : (
                  <div style={{ flex: 1, minHeight: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={steelChart}
                        margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
                      >
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 10, fill: "#475569" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 9, fill: "#475569" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip {...tooltipStyle} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {steelChart.map((d, i) => (
                            <Cell key={i} fill={d.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              {/* TLP + Cascade */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                {["tlp", "cascade"].map((k) => {
                  const cfg = LAYERS[k];
                  return (
                    <div
                      key={k}
                      style={{
                        background: "#fff",
                        border: "1px solid #dbeafe",
                        borderLeft: `2px solid ${cfg.color}`,
                        borderRadius: 0,
                        padding: "10px 12px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: "#2d5282",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.4px",
                        }}
                      >
                        {cfg.label}
                      </div>
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: 800,
                          color: cfg.color,
                          marginTop: 3,
                        }}
                      >
                        {loading ? (
                          "…"
                        ) : (
                          <CountUp target={stats[k] ?? null} isFloat={false} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CENTER — Real OL Map + WMS Legend */}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                overflow: "hidden",
                minHeight: 0,
              }}
            >
              {/* Filter bar — GREEN BOX — map ke upar alag */}
              <div
                style={{
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: 8,
                  padding: "6px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{ fontWeight: 700, fontSize: 12, color: "#1e3a5f" }}
                >
                  Haryana Gas Network
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <select
                    value={selectedGA}
                    onChange={(e) => {
                      setSelectedGA(e.target.value);
                      setSelectedCA("ALL");
                    }}
                    style={{
                      fontSize: 11,
                      padding: "4px 8px",
                      borderRadius: 6,
                      border: "1px solid #bfdbfe",
                      color: "#1e3a5f",
                      background: "#fff",
                      cursor: "pointer",
                      minWidth: 120,
                    }}
                  >
                    <option value="ALL">All GA</option>
                    {gaList.map((ga) => (
                      <option key={ga} value={ga}>
                        {ga}
                      </option>
                    ))}
                  </select>

                  {selectedGA !== "ALL" && (
                    <select
                      value={selectedCA}
                      onChange={(e) => setSelectedCA(e.target.value)}
                      style={{
                        fontSize: 11,
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "1px solid #bfdbfe",
                        color: "#1e3a5f",
                        background: "#fff",
                        cursor: "pointer",
                        minWidth: 120,
                      }}
                    >
                      <option value="ALL">All CA</option>
                      {caList.map((ca) => (
                        <option key={ca} value={ca}>
                          {ca}
                        </option>
                      ))}
                    </select>
                  )}

                  {(selectedGA !== "ALL" || selectedCA !== "ALL") && (
                    <button
                      onClick={() => {
                        setSelectedGA("ALL");
                        setSelectedCA("ALL");
                      }}
                      style={{
                        fontSize: 10,
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "1px solid #fca5a5",
                        background: "#fef2f2",
                        color: "#dc2626",
                        cursor: "pointer",
                      }}
                    >
                      ✕ Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Map — RED BOX — full remaining height */}
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #dbeafe",
                  borderTop: "2px solid #1e3a5f",
                  borderRadius: 8,
                  overflow: "hidden",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                }}
              >
                <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
                  <MiniOLMap />
                </div>
              </div>
            </div>

            {/* LEGEND COLUMN — scrollable */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                minHeight: 0,
              }}
            >
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #dbeafe",
                  borderTop: "2px solid #1e3a5f",
                  borderRadius: 8,
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  minHeight: 0,
                  overflow: "hidden",
                }}
              >
                {/* Fixed header */}
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#1e3a5f",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    padding: "10px 12px 6px 12px",
                    borderBottom: "1px solid #dbeafe",
                    flexShrink: 0, // ← header fix rahega
                    background: "#fff",
                  }}
                >
                  Map Legend
                </div>

                {/* Scrollable items only */}
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto", // ← sirf items scroll honge
                    padding: "8px 12px",
                  }}
                >
                  {ALL_LEGEND_LAYERS.map((item) => (
                    <LegendImg
                      key={item.wms}
                      wmsLayer={item.wms}
                      label={item.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT PANEL */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                overflow: "hidden",
              }}
            >
              {/* MDPE bar chart */}
              <div style={CHART_CARD}>
                <div style={CHART_TITLE}>
                  MDPE Pipeline Bargraph
                  <br />
                  <span
                    style={{
                      color: "#9ca3af",
                      textTransform: "none",
                      letterSpacing: 0,
                      fontWeight: 400,
                    }}
                  >
                    by Diameter (mm)
                  </span>
                </div>
                {chartLoad ? (
                  <div style={LOADING_TEXT}>Fetching…</div>
                ) : (
                  <div style={{ flex: 1, minHeight: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={mdpeChart}
                        margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
                      >
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 10, fill: "#6b7280" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 9, fill: "#9ca3af" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip {...tooltipStyle} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {mdpeChart.map((d, i) => (
                            <Cell key={i} fill={d.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              {/* Valve + Compressor */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                {["valve", "compressor"].map((k) => {
                  const cfg = LAYERS[k];
                  return (
                    <div
                      key={k}
                      style={{
                        background: "#fff",
                        border: "1px solid #dbeafe",
                        borderLeft: `2px solid ${cfg.color}`,
                        borderRadius: 0,
                        padding: "10px 12px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: "#2d5282",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.4px",
                        }}
                      >
                        {cfg.label}
                      </div>
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: 800,
                          color: cfg.color,
                          marginTop: 3,
                        }}
                      >
                        {loading ? (
                          "…"
                        ) : (
                          <CountUp target={stats[k] ?? null} isFloat={false} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ROW 3 — Bottom 6 cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6,1fr)",
              gap: 8,
              flexShrink: 0,
            }}
          >
            {[
              "connection_pit",
              "dispenser",
              // "cgs",
              "electric_pole",
              "pole_marker",
              "odorizer",
            ].map((k) => {
              const cfg = LAYERS[k];
              return (
                <div
                  key={k}
                  style={{
                    background: "#fff",
                    border: "1px solid #dbeafe",
                    borderBottom: `2px solid ${cfg.color}`,
                    borderRadius: 8,
                    padding: "10px 14px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: "#2d5282",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: 4,
                    }}
                  >
                    {cfg.label}
                  </div>
                  <div
                    style={{ fontSize: 22, fontWeight: 800, color: cfg.color }}
                  >
                    {loading ? (
                      "…"
                    ) : (
                      <CountUp target={stats[k] ?? null} isFloat={false} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SHARED STYLE TOKENS
// ============================================================
const ROOT = {
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  width: "100vw",
  background: "#a8b5c4",
  fontFamily: "'Inter',system-ui,sans-serif",
  overflow: "hidden",
};
const TOPBAR = {
  background: "#003376",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px 20px",
  flexShrink: 0,
  borderBottom: "2px solid #2d5282",
};
const LOGO_BOX = {
  background: "#f97316",
  color: "#fff",
  fontWeight: 900,
  fontSize: 16,
  padding: "4px 11px",
  borderRadius: 6,
  letterSpacing: 1,
};
const SIDEBAR = {
  width: 64,
  background: "#1e3a5f",
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
  flexShrink: 0,
  borderRight: "1px solid #2d5282",
  scrollbarWidth: "none",
  paddingTop: 4,
};
const CONTENT = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  padding: 8,
  gap: 8,
};
const CHART_CARD = {
  background: "#fff",
  border: "1px solid #dbeafe",
  borderTop: "2px solid #1e3a5f",
  borderRadius: 8,
  padding: "12px",
  flex: 1,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  minHeight: 0,
};
const CHART_TITLE = {
  fontSize: 10,
  fontWeight: 700,
  color: "#2d5282",
  marginBottom: 8,
  textTransform: "uppercase",
  letterSpacing: "0.6px",
  flexShrink: 0,
};
const LOADING_TEXT = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#93c5fd",
  fontSize: 12,
};
const BTN_BLUE = {
  background: "#2d5282",
  color: "#bfdbfe",
  border: "none",
  borderRadius: 6,
  padding: "6px 14px",
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
};
const BTN_ORANGE = {
  background: "#ea580c",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "6px 14px",
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
};
const BTN_GRAY = {
  background: "#3b5998",
  color: "#bfdbfe",
  border: "none",
  borderRadius: 6,
  padding: "6px 14px",
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
};
