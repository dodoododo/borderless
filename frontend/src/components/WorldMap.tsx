import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import maplibregl from 'maplibre-gl';
import type { Map as MLMap, GeoJSONSource, MapLayerMouseEvent } from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ArcLayer } from '@deck.gl/layers';
import type { FeatureCollection } from 'geojson';
import type { MapMode, WorldMapProps } from '../types/types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Map, 
  Route, 
  Sun, 
  Mountain, 
  Satellite, 
  TreePine,
  Globe,
  Compass
} from 'lucide-react';
import { TERRITORY_MAPPING } from '../constants/territoryMapping'; 

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY as string; // put in backend/.env.local 
const COUNTRIES_GEOJSON_URL = '/data/countries.geojson';

const COUNTRIES_SOURCE_ID = 'countries';
const COUNTRIES_FILL_LAYER_ID = 'countries-fill';
const COUNTRIES_LINE_LAYER_ID = 'countries-line';

interface ExtendedWorldMapProps extends WorldMapProps {
  theme?: 'light' | 'dark';
  destinationMap?: Record<string, any>;
  homeCountryName?: string;
}


// =====================================================================
// 🚀 BẢNG MÀU CHUẨN (Đồng bộ với PassportExplorer)
// =====================================================================
const COLOR_MAPPING: Record<string, { dark: string; light: string }> = {
  "visa-free": { dark: "#10b981", light: "#059669" },      // Xanh lá
  "visa-on-arrival": { dark: "#f59e0b", light: "#d97706" },// Cam
  "e-visa": { dark: "#3b82f6", light: "#0284c7" },         // Xanh dương
  "eta": { dark: "#8b5cf6", light: "#7c3aed" },            // Tím
  "visa-required": { dark: "#475569", light: "#64748b" },  // Xám Slate
  "restricted": { dark: "#e11d48", light: "#be123c" },     // Đỏ
  "home": { dark: "#eab308", light: "#ca8a04" },           // Vàng (Quê hương)
  "unknown": { dark: "rgba(40,40,40,0.16)", light: "rgba(200,200,200,0.24)" },
  "default": { dark: "rgba(40,40,40,0.16)", light: "rgba(200,200,200,0.24)" },
};

type StatusCategory = "restricted" | "visa-free" | "eta" | "visa-on-arrival" | "e-visa" | "visa-required" | "home" | "unknown";

interface ParsedVisaStatus {
  category: StatusCategory;
  text: string;
  note: string;
  days: number | null;
}

// =====================================================================
// 🚀 1. HÀM GỌT CHUỖI VÀ LỌC LOGIC SIÊU SẠCH
// =====================================================================
export const parseVisaData = (status: unknown): ParsedVisaStatus => {
  if (status === null || status === undefined) return { category: 'unknown', text: 'Unknown', note: '', days: null };
  
  const raw = String(status).trim();
  let baseStatus = raw;
  let noteContent = "";

  // Regex cắt mọi Note phía sau dấu gạch ngang hoặc ngoặc kép
  const match = raw.match(/(\s+-\s+|\s+(?=["']))/);
  if (match && match.index !== undefined) {
    baseStatus = raw.substring(0, match.index).trim();
    noteContent = raw.substring(match.index + match[0].length).trim();
    noteContent = noteContent.replace(/^["']+|["']+$/g, "").trim();
  }

  const s = baseStatus.toLowerCase();
  let category: StatusCategory = 'unknown';
  let days: number | null = null;

  // Xét các trường hợp đặc biệt (số nguyên)
  if (/^-?\d+$/.test(baseStatus)) {
    const num = parseInt(baseStatus, 10);
    if (num === -1 || num === 1) return { category: 'home', text: 'Home Country', note: noteContent, days: null };
    if (num < 0) return { category: 'unknown', text: 'Unknown', note: noteContent, days: null };
    return { category: 'visa-free', text: `Visa Free (${num} days)`, note: noteContent, days: num };
  }

  // Quét từ khóa
  const isNumMatch = baseStatus.match(/^(\d+)/);
  if (isNumMatch) {
    category = 'visa-free';
    days = parseInt(isNumMatch[1], 10);
  } else if (
    s.includes('restricted') || s.includes('prohibited') || s.includes('no admission') || 
    s.includes('noadmission') || s.includes('refused') || s.includes('suspended') || 
    s.includes('banned') || /\bban\b/.test(s) || s.includes('covid')
  ) {
    category = 'restricted';
  } else if (s.includes('required') || s.includes('tourist card')) {
    category = 'visa-required';
  } else if (s.includes('arrival') || s === 'voa' || s.includes('e-voa')) {
    category = 'visa-on-arrival';
  } else if (s.includes('eta') || s.includes('electronic travel') || s.includes('electronic border')) {
    category = 'eta';
  } else if (
    s.includes('e-visa') || s.includes('evisa') || s.includes('e visa') || 
    s.includes('electronic') || s.includes('online') || s.includes('smart service')
  ) {
    category = 'e-visa';
  } else if (s.includes('free') || s.includes('not required') || s.includes('freedom')) {
    category = 'visa-free';
  } else {
    category = 'visa-required';
  }

  // Chuẩn hóa văn bản hiển thị
  let text = baseStatus.charAt(0).toUpperCase() + baseStatus.slice(1);
  if (category === 'visa-free' && days) text = `Visa Free (${days} days)`;
  else if (category === 'visa-free') text = 'Visa Free';

  return { category, text, note: noteContent, days };
};

// =====================================================================
// 🚀 2. HÀM TẠO CÂU VĂN GIẢI THÍCH CHO TOOLTIP
// =====================================================================
function generateVisaSentence(home: string, dest: string, category: string, days: number | null) {
  const homeName = home || "your home country";
  const destName = dest || "this country";
  
  switch(category) {
      case "home": return `This is the passport's issuing country.`;
      case "visa-free": return `Citizens of ${homeName} can travel to ${destName} without a visa${days ? ` for up to ${days} days` : ''}.`;
      case "visa-on-arrival": return `Citizens of ${homeName} can easily obtain a visa upon arrival at border checkpoints in ${destName}.`;
      case "eta": return `Citizens of ${homeName} are required to obtain an Electronic Travel Authorization (ETA) before flying to ${destName}.`;
      case "e-visa": return `Citizens of ${homeName} must apply for an electronic visa (e-Visa) online prior to arriving in ${destName}.`;
      case "restricted": return `Travel to ${destName} is highly restricted, prohibited, or currently suspended for citizens of ${homeName}.`;
      case "visa-required":
      default: return `Citizens of ${homeName} must apply for a traditional visa at an embassy or consulate before traveling to ${destName}.`;
  }
}

const getStyleUrl = (mode: string, theme: 'light' | 'dark') => {
  switch (mode) {
    case 'satellite': return `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`;
    case 'topo': return `https://api.maptiler.com/maps/topo-v2/style.json?key=${MAPTILER_KEY}`;
    case 'outdoor': return `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${MAPTILER_KEY}`;
    case 'bright': return `https://api.maptiler.com/maps/bright-v2/style.json?key=${MAPTILER_KEY}`;
    case 'streets': return `https://api.maptiler.com/maps/streets-v2${theme === 'dark' ? '-dark' : ''}/style.json?key=${MAPTILER_KEY}`;
    case 'voyager': 
    default:
      return `https://api.maptiler.com/maps/basic-v2${theme === 'dark' ? '-dark' : ''}/style.json?key=${MAPTILER_KEY}`;
  }
};

function rgbaToCss(rgba: number[] | undefined, fallback: string): string {
  if (!rgba) return fallback;
  const [r, g, b, a = 255] = rgba;
  return `rgba(${r},${g},${b},${(a / 255).toFixed(3)})`;
}

// Giữ nguyên logic tô màu cũ của anh
function buildFillColorExpression(countryColors: Record<string, number[]>, theme: 'light' | 'dark') {
  const defaultColor = theme === 'dark' ? 'rgba(40,40,40,0.16)' : 'rgba(200,200,200,0.24)';
  const entries = Object.entries(countryColors);
  if (entries.length === 0) return defaultColor;

  const expr: any[] = ['match', ['get', 'iso_a2']];
  
  for (const [iso, rgba] of entries) {
    expr.push(iso.toUpperCase(), rgbaToCss(rgba, defaultColor));
  }
  expr.push(defaultColor); 
  return expr;
}

function normalizeCountryIds(fc: FeatureCollection): FeatureCollection {
  return {
    ...fc,
    features: fc.features.map((f) => {
      const props: any = f.properties ?? {};
      const name = props.name || props.NAME || "Unknown";
      let iso3 = props['ISO3166-1-Alpha-3'] ?? props.ADM0_A3 ?? null;
      let iso2 = props['ISO3166-1-Alpha-2'] ?? props.iso_a2 ?? null;

      const overrides: Record<string, string> = {
        'France': 'FR', 'Kosovo': 'XK', 'Norway': 'NO', 
        'Western Sahara': 'MA', 'Greenland': 'DK', 'Barbados': 'BB', 'Northern Cyprus': 'CY',
        'Puerto Rico': 'US', 'New Caledonia': 'FR', 'Faroe Islands': 'DK',
        'United Arab Emirates': 'AE', 'Somaliland': 'SO', 'Baykonur Cosmodrome': 'KZ'
      };

      if (overrides[name]) iso2 = overrides[name];
      else if (iso2 === '-99' || !iso2) iso2 = "UNKNOWN";

      return { ...f, properties: { ...props, name, iso_a3: iso3, iso_a2: iso2.toUpperCase() } };
    }),
  };
}

export function WorldMap({
  countryColors = {},
  destinationMap = {},     
  homeCountryName = "",    
  flights = [],
  initialCenter = [105.8, 21.0],
  initialZoom = 2.5,
  initialMode = 'globe',
  theme = 'dark',
  onCountryClick,
  height = '600px',
}: ExtendedWorldMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const countriesGeoJsonRef = useRef<FeatureCollection | null>(null);
  const hoveredIdRef = useRef<string | number | null>(null);

  const onCountryClickRef = useRef(onCountryClick);
  const countryColorsRef = useRef(countryColors);
  const themeRef = useRef(theme);
  const destMapRef = useRef(destinationMap);
  const homeRef = useRef(homeCountryName);

  useEffect(() => {
    onCountryClickRef.current = onCountryClick;
    countryColorsRef.current = countryColors;
    themeRef.current = theme;
    destMapRef.current = destinationMap;
    homeRef.current = homeCountryName;
  }, [onCountryClick, countryColors, theme, destinationMap, homeCountryName]);

  const [mapProjection, setMapProjection] = useState<'globe' | 'flat'>(initialMode === 'flat' ? 'flat' : 'globe');
  const [mapStyle, setMapStyle] = useState<string>('bright'); 
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState(initialZoom);

  // 🚀 TOOLTIP STATES
  const currentMousePos = useRef({ x: 0, y: 0 });
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);
  const lastHoverIso = useRef<string | null>(null);
  
  const [tooltipInfo, setTooltipInfo] = useState<{
    visible: boolean; x: number; y: number; countryName: string; iso: string; parsed: ParsedVisaStatus; rawStatus: string;
  } | null>(null);

  const syncCountriesLayer = useCallback((map: MLMap) => {
    const geojson = countriesGeoJsonRef.current;
    if (!geojson) return;

    const fillColor = buildFillColorExpression(countryColorsRef.current, themeRef.current);

    const existingSource = map.getSource(COUNTRIES_SOURCE_ID) as GeoJSONSource | undefined;
    if (existingSource) {
      existingSource.setData(geojson);
    } else {
      map.addSource(COUNTRIES_SOURCE_ID, {
        type: 'geojson',
        data: geojson,
        promoteId: 'name',
      });
    }

    const layers = map.getStyle().layers;
    let firstSymbolId: string | undefined = undefined;
    if (layers) {
      for (const layer of layers) {
        if (layer.type === 'symbol') {
          firstSymbolId = layer.id;
          break;
        }
      }
    }

    if (map.getLayer(COUNTRIES_FILL_LAYER_ID)) {
      map.setPaintProperty(COUNTRIES_FILL_LAYER_ID, 'fill-color', fillColor);
    } else {
      map.addLayer({
        id: COUNTRIES_FILL_LAYER_ID,
        type: 'fill',
        source: COUNTRIES_SOURCE_ID,
        paint: {
          'fill-color': fillColor as any,
          'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.85, 1],
        },
      }, firstSymbolId); 
    }

    if (!map.getLayer(COUNTRIES_LINE_LAYER_ID)) {
      map.addLayer({
        id: COUNTRIES_LINE_LAYER_ID,
        type: 'line',
        source: COUNTRIES_SOURCE_ID,
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#facc15',
            themeRef.current === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
          ],
          'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 2.5, 0.6],
        },
      }, firstSymbolId);
    }
  }, []);

  const buildFlightLayers = useCallback(() => {
    if (flights.length === 0) return [];
    return [
      new ArcLayer({
        id: 'flight-arcs',
        data: flights,
        getSourcePosition: (d) => d.from,
        getTargetPosition: (d) => d.to,
        getSourceColor: (d: any) => [...(d.color ?? [59, 130, 246]), 220] as any,
        getTargetColor: (d: any) => [...(d.color ?? [239, 68, 68]), 220] as any,
        getWidth: 2.5,
        getHeight: 0.5,
        greatCircle: true,
      }),
    ];
  }, [flights]);

  // Khởi tạo bản đồ
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (!MAPTILER_KEY) {
      setLoadError('Thiếu VITE_MAPTILER_KEY trong file .env');
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: getStyleUrl(mapStyle, theme),
      center: initialCenter,
      zoom: initialZoom,
      pitch: 0,
      maxPitch: 60,
      minZoom: 1,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

    map.on('style.load', () => {
      map.setProjection({ type: mapProjection === 'flat' ? 'mercator' : 'globe' });
      syncCountriesLayer(map);
    });

    // Lắng nghe sự kiện zoom và cập nhật state (Đã fix sai số nhảy số trên Globe 3D)
    map.on('zoom', () => {
      const currentRawZoom = map.getZoom();
      
      // Lấy chế độ projection hiện tại của MapLibre (nếu có)
      const currentProj = map.getProjection ? map.getProjection().type : 'mercator';

      if (currentProj === 'globe') {
        // Ở chế độ quả cầu, MapLibre bù trừ zoom theo vĩ độ. Ta dùng hàm Cosin để khử sai số này.
        const lat = map.getCenter().lat;
        // Giới hạn vĩ độ ở 89.9 để tránh hàm Cosin bằng 0 (gây lỗi NaN)
        const safeLat = Math.max(-89.9, Math.min(89.9, lat));
        
        // Công thức tính độ bù trừ
        const zoomAdjustment = Math.log2(Math.cos((safeLat * Math.PI) / 180));
        
        setCurrentZoom(currentRawZoom - zoomAdjustment);
      } else {
        // Ở chế độ 2D Phẳng (Mercator), zoom không bị thay đổi khi kéo chuột
        setCurrentZoom(currentRawZoom);
      }
    });
    map.on('error', (e) => setLoadError(e.error?.message ?? 'Lỗi tải bản đồ.'));

    map.on('mousemove', COUNTRIES_FILL_LAYER_ID, (e: MapLayerMouseEvent) => {
      currentMousePos.current = { x: e.originalEvent.clientX, y: e.originalEvent.clientY };
      
      const feature = e.features?.[0];
      if (!feature) return;

      const id = feature.id; 
      const iso2 = feature.properties?.iso_a2?.toLowerCase();
      const countryName = feature.properties?.name;

      if (hoveredIdRef.current !== null && hoveredIdRef.current !== id) {
        map.setFeatureState({ source: COUNTRIES_SOURCE_ID, id: hoveredIdRef.current }, { hover: false });
      }
      if (id !== undefined) {
        map.setFeatureState({ source: COUNTRIES_SOURCE_ID, id }, { hover: true });
        hoveredIdRef.current = id;
      }
      map.getCanvas().style.cursor = 'pointer';

      // 🚀 LOGIC HẸN GIỜ BẬT TOOLTIP
      if (iso2 !== lastHoverIso.current) {
        lastHoverIso.current = iso2;
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        setTooltipInfo(null);

        if (iso2 && destMapRef.current) {
          // 🚀 FIX LỖI: Tìm data bất chấp chữ IN HOA hay in thường
          let rawStatus = destMapRef.current[iso2] || destMapRef.current[iso2.toUpperCase()];
          
          // Cứu cánh cuối cùng: quét qua toàn bộ object để kiếm key match
          if (!rawStatus) {
            const foundKey = Object.keys(destMapRef.current).find(k => k.toLowerCase() === iso2);
            if (foundKey) rawStatus = destMapRef.current[foundKey];
          }

          if (rawStatus) {
            hoverTimer.current = setTimeout(() => {
              const parsed = parseVisaData(rawStatus); 
              setTooltipInfo({
                visible: true, 
                x: currentMousePos.current.x, 
                y: currentMousePos.current.y,
                countryName: countryName, 
                iso: iso2, 
                parsed,
                rawStatus,
              });
            }, 1000); // Trễ 1 giây
          }
        }
      }
    });

    map.on('mouseleave', COUNTRIES_FILL_LAYER_ID, () => {
      if (hoveredIdRef.current !== null) {
        map.setFeatureState({ source: COUNTRIES_SOURCE_ID, id: hoveredIdRef.current }, { hover: false });
        hoveredIdRef.current = null;
      }
      map.getCanvas().style.cursor = '';
      
      // Xóa bộ đếm và tắt tooltip
      lastHoverIso.current = null;
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      setTooltipInfo(null);
    });

    map.on('click', COUNTRIES_FILL_LAYER_ID, (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      let iso2 = feature?.properties?.iso_a2; 
      if (TERRITORY_MAPPING[iso2.toUpperCase()]) {
        iso2 = TERRITORY_MAPPING[iso2.toUpperCase()];
      }
      if (iso2 && onCountryClickRef.current) {
        onCountryClickRef.current(iso2);
      }
    });

    map.on('load', async () => {
      try {
        const res = await fetch(COUNTRIES_GEOJSON_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rawGeoJson = (await res.json()) as FeatureCollection;

        countriesGeoJsonRef.current = normalizeCountryIds(rawGeoJson);

        syncCountriesLayer(map);

        const overlay = new MapboxOverlay({ layers: buildFlightLayers() });
        map.addControl(overlay as any);
        overlayRef.current = overlay;

        setReady(true);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Lỗi tải ranh giới quốc gia');
      }
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ready && overlayRef.current) {
      overlayRef.current.setProps({ layers: buildFlightLayers() });
    }
  }, [ready, buildFlightLayers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (map.getLayer(COUNTRIES_FILL_LAYER_ID)) {
      syncCountriesLayer(map);
    }
  }, [countryColors, theme, ready, syncCountriesLayer]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setStyle(getStyleUrl(mapStyle, theme));
    map.once('style.load', () => {
      map.setProjection({ type: mapProjection === 'flat' ? 'mercator' : 'globe' });
      syncCountriesLayer(map);
    });
  }, [theme, mapStyle, mapProjection, ready, syncCountriesLayer]);

  const handleProjectionChange = useCallback((newProj: 'globe' | 'flat') => {
    const map = mapRef.current;
    if (!map || newProj === mapProjection) return;

    setMapProjection(newProj);
    map.setProjection({ type: newProj === 'flat' ? 'mercator' : 'globe' });
    
    if (newProj === 'globe') {
      map.easeTo({ center: map.getCenter(), pitch: 10, duration: 1000 });
    } else {
      map.easeTo({ pitch: 0, duration: 1000 });
    }
  }, [mapProjection]);

  const handleStyleChange = useCallback((newStyle: string) => {
    const map = mapRef.current;
    if (!map || newStyle === mapStyle) return;

    setMapStyle(newStyle);
    map.setStyle(getStyleUrl(newStyle, theme));

    map.once('style.load', () => {
      map.setProjection({ type: mapProjection === 'flat' ? 'mercator' : 'globe' });
    });
  }, [mapStyle, mapProjection, theme]);

  const borderClass = theme === 'dark' ? 'border-white/60' : 'border-gray-300';

  return (
    <div
      className={`absolute ${borderClass} inset-0 z-[-1] transition-opacity duration-1000`}
      style={{ position: 'relative', width: '100%', height, zIndex: 0 ,
        backgroundImage: theme === 'dark' 
        ? `url("https://www.transparenttextures.com/patterns/stardust.png"), radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 80%), radial-gradient(circle at 15% 25%, rgba(30, 58, 138, 0.4) 0%, transparent 70%), radial-gradient(circle at 85% 75%, rgba(49, 46, 129, 0.3) 0%, transparent 70%)`
        : `url("https://www.transparenttextures.com/patterns/stardust.png"), radial-gradient(circle at 50% 50%, #ffffff 0%, #dcf4ff 40%, #7dd3fc 100%), radial-gradient(at 0% 0%, rgba(255, 255, 255, 0.8) 0%, transparent 60%), radial-gradient(at 100% 100%, rgba(186, 230, 253, 0.5) 0%, transparent 60%)`,
        backgroundBlendMode: theme === 'dark' ? 'color-dodge' : 'color-dodge',
      }}
    > 
      <div className="relative w-full h-full flex items-center justify-center">
        <div ref={containerRef} className={`transition-all duration-1000 overflow-hidden`}
          style={{ width: '100%', height: '100%', border: mapProjection === 'globe' ? '2px solid rgba(0, 0, 0, 0.8)' : 'none', boxShadow: theme === 'dark' ? 'inset 0 0 100px rgba(0,0,0,0.8)' : 'inset 0 0 100px rgba(255,255,255,0.6)' }}
        />
        {mapProjection === 'globe' && (
          <div className="absolute -bottom-10 w-[80%] h-12 rounded-[100%] transition-opacity duration-1000"
            style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, transparent 70%)', filter: 'blur(20px)', zIndex: -1 }}
          />
        )}
      </div>

      {/* ===================================================================== */}
      {/* 🚀 TOOLTIP CHÍNH THỨC (PORTAL ĐÃ FIX XUNG ĐỘT ANIMATION) */}
      {/* ===================================================================== */}
      {/* ===================================================================== */}
      {/* 🚀 TOOLTIP NGHỆ THUẬT (ORGANIC, EDITORIAL & PERSONAL STYLE) */}
      {/* ===================================================================== */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {tooltipInfo && tooltipInfo.visible && (
            <div
              className="fixed z-[99999] pointer-events-none"
              style={{
                left: tooltipInfo.x + 15,
                top: tooltipInfo.y + 15,
                maxWidth: 'calc(100vw - 30px)',
              }}
            >
              <motion.div
                // Hiệu ứng "đặt giấy": Rơi nhẹ xuống và hơi nghiêng 1 độ
                initial={{ opacity: 0, y: 6, rotate: -1 }} 
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.1 } }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className={`relative p-0 w-max max-w-[500px] border-[1.5px] overflow-hidden ${
                  theme === 'dark' 
                    ? 'bg-[#1c1b19] border-stone-600 text-stone-200 shadow-[2px_2px_0px_#44403c]' 
                    : 'bg-[#FCFCFB] border-stone-900 text-stone-900 '
                }`}
                style={{ borderRadius: '2px' }}
              >
                {(() => {
                  const rawStatus = tooltipInfo.rawStatus;
                  // Lấy màu Status
                  const sColor = rawStatus === '1' || rawStatus === '-1' 
                    ? COLOR_MAPPING.home[theme] 
                    : (COLOR_MAPPING[tooltipInfo.parsed.category]?.[theme] || COLOR_MAPPING.default[theme]);

                  return (
                    <>
                      {/* Dải màu Đánh dấu dọc mép trái (như File Folder Tab) */}
                      <div className="absolute top-0 left-0 bottom-0 w-1.5" style={{ backgroundColor: sColor }} />
                      
                      <div className="pl-5 pr-4 py-4">
                        {/* 1. Header: Cờ & Tên Quốc gia */}
                        <div className="flex items-start gap-3 mb-3">
                          <span 
                            className={`fi fi-${tooltipInfo.iso} text-3xl shrink-0 !bg-cover !bg-center overflow-hidden border border-black/20 shadow-sm`} 
                            style={{ borderRadius: '1px' }} 
                          />
                          <div className="flex flex-col pt-0.5">
                            <h4 className="font-semibold text-[18px] leading-none font-display tracking-tight">
                              {tooltipInfo.countryName}
                            </h4>
                          </div>
                        </div>

                        {/* 2. Visa Status Badge (Kiểu in tem mực) */}
                        <div className="mb-3">
                          <span 
                            className="inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest border"
                            style={{ 
                              color: sColor, 
                              borderColor: sColor, 
                              backgroundColor: theme === 'dark' ? `${sColor}15` : `${sColor}10` 
                            }}
                          >
                            {tooltipInfo.parsed.text}
                          </span>
                        </div>

                        {/* 3. Câu diễn giải (Serif font mộc mạc) */}
                        <p className={`text-[14px] leading-relaxed font-serif ${theme === 'dark' ? 'text-stone-300' : 'text-stone-700'}`}>
                          {generateVisaSentence(homeRef.current, tooltipInfo.countryName, tooltipInfo.parsed.category, tooltipInfo.parsed.days)}
                        </p>

                        {/* 4. Note / Phụ chú (Giao diện đánh máy) */}
                        {tooltipInfo.parsed.note && (
                          <div className={`mt-3.5 pt-2.5 border-t border-dashed ${theme === 'dark' ? 'border-stone-700 text-stone-400' : 'border-stone-300 text-stone-600'}`}>
                            <span className="block text-[9px] font-bold uppercase tracking-[0.2em] mb-1.5 opacity-60">
                              Remarks / Notes
                            </span>
                            <div className=" text-[14px] leading-[1.6]">
                              {tooltipInfo.parsed.note}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* BẢNG CHÚ THÍCH MÀU SẮC */}
      {Object.keys(countryColors).length > 0 && (
        <div className={`absolute bottom-18 left-4 z-10 p-4 rounded-sm backdrop-blur-md border shadow-lg transition-colors ${
          theme === 'dark' ? 'bg-[#020617]/70 border-white/10 text-white' : 'bg-white/80 border-gray-200 text-gray-800'
        }`}>
          <h4 className="text-xs font-bold uppercase tracking-widest mb-3">Visa Status</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {[
              { label: 'Visa-free', color: '#10b981' },
              { label: 'Visa on arrival', color: '#f59e0b' },
              { label: 'e-Visa', color: '#3b82f6' },
              { label: 'ETA', color: '#7c3aed' },
              { label: 'Visa required', color: '#64748b' },
              { label: 'No admission', color: '#f43f5e' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-[11px] font-medium">
                <span className="w-3 h-3 shadow-[0_0_8px_rgba(0,0,0,0.2)]" style={{ backgroundColor: item.color }} />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`absolute bottom-4 left-4 z-10 px-3 py-1.5 rounded-sm text-base font-mono font-bold backdrop-blur-md shadow-sm border transition-colors ${
        theme === 'dark' ? 'bg-black/50 border-white/10 text-white/80' : 'bg-white/70 border-gray-200 text-gray-900'
      }`}>
        Zoom: x{currentZoom.toFixed(2)}
      </div>

      {/* BẢNG ĐIỀU KHIỂN */}
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-4 items-start">
        <div className={`group gap-2 flex p-1.5 rounded-sm backdrop-blur-2xl shadow-lg border transition-all duration-500 w-fit ${
          theme === 'dark' ? 'bg-[#020617]/40 border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.5)]' : 'bg-white/70 border-white/50 shadow-[0_12px_40px_rgba(0,0,0,0.08)]'
        }`}>
          {(['globe', 'flat'] as const).map((proj) => {
            const isActive = mapProjection === proj;
            return (
              <button
                key={proj}
                onClick={() => handleProjectionChange(proj)}
                className={`flex items-center justify-start rounded-sm p-2.5 text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                  isActive ? (theme === 'dark' ? 'bg-white text-black shadow-sm' : 'bg-gray-900 text-white shadow-md')
                           : `hover:bg-gray-500/10 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`
                }`}
              >
                {proj === 'globe' ? <Globe className="w-4 h-4 shrink-0" /> : <Map className="w-4 h-4 shrink-0" />}
                <span className="overflow-hidden whitespace-nowrap max-w-0 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:max-w-[120px] group-hover:opacity-100 group-hover:pl-2.5">
                  {proj === 'globe' ? '3D Globe' : '2D Map'}
                </span>
              </button>
            );
          })}
        </div>

        <div className={`group grid grid-cols-3 gap-1.5 p-1.5 rounded-sm backdrop-blur-2xl shadow-lg border transition-all duration-500 w-fit ${
          theme === 'dark' ? 'bg-[#020617]/40 border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.5)]' : 'bg-white/70 border-white/50 shadow-[0_12px_40px_rgba(0,0,0,0.08)]'
        }`}>
          {[
            { id: 'voyager', icon: <Compass className="w-4 h-4 shrink-0" />, label: 'Standard' },
            { id: 'streets', icon: <Route className="w-4 h-4 shrink-0" />, label: 'Streets' },
            { id: 'bright', icon: <Sun className="w-4 h-4 shrink-0" />, label: 'Light' },
            { id: 'topo', icon: <Mountain className="w-4 h-4 shrink-0" />, label: 'Terrain' },
            { id: 'satellite', icon: <Satellite className="w-4 h-4 shrink-0" />, label: 'Satellite' },
            { id: 'outdoor', icon: <TreePine className="w-4 h-4 shrink-0" />, label: 'Outdoors' }
          ].map((style) => {
            const isActive = mapStyle === style.id;
            return (
              <button
                key={style.id}
                onClick={() => handleStyleChange(style.id)}
                className={`flex items-center justify-start rounded-sm p-2.5 text-xs font-bold tracking-wide transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                  isActive ? (theme === 'dark' ? 'bg-white text-black shadow-sm' : 'bg-gray-900 text-white shadow-md')
                           : `hover:bg-gray-500/10 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`
                }`}
              >
                {style.icon}
                <span className="overflow-hidden whitespace-nowrap max-w-0 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:max-w-[100px] group-hover:opacity-100 group-hover:pl-2">
                  {style.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {!ready && !loadError && (
        <div className={`absolute inset-0 flex items-center justify-center backdrop-blur-sm z-20 font-medium transition-colors ${
          theme === 'dark' ? 'bg-black/50 text-white' : 'bg-white/50 text-gray-800'
        }`}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="animate-pulse">Đang tải dữ liệu bản đồ...</span>
          </div>
        </div>
      )}
    </div>
  );
}