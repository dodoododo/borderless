import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import type { Map as MLMap, GeoJSONSource, MapLayerMouseEvent } from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ArcLayer } from '@deck.gl/layers';
import type { FeatureCollection } from 'geojson';
import type { MapMode, WorldMapProps } from '../types/types';
import { CountryModal } from './CountryModal';
import { 
  Map, 
  Route, 
  Sun, 
  Mountain, 
  Satellite, 
  Tent ,
  TreePine,
  Globe,
  Layers, 
  Compass
} from 'lucide-react';
import { TERRITORY_MAPPING } from '../constants/territoryMapping'; 

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY as string;

// Path to the pre-fixed Natural Earth countries file, served as a static
// asset from /public. It MUST be antimeridian-corrected before it lands
// here — see the note below.
const COUNTRIES_GEOJSON_URL = '/data/countries.geojson';

interface ExtendedWorldMapProps extends WorldMapProps {
  theme?: 'light' | 'dark';
}

// ─────────────────────────────────────────────────────────────
// WHY THIS FILE CHANGED (updated)
//
// Bug #1 (fixed previously): deck.gl layers added via MapboxOverlay are
// matched to MapLibre's camera but rendered on a flat plane, not warped
// onto the sphere, unless you use deck.gl's experimental _GlobeView. Fix
// was to move the country choropleth to a native MapLibre `fill` layer,
// which curves correctly because MapLibre's globe projection lives in its
// own renderer. deck.gl (MapboxOverlay) is now only used for the ArcLayer
// flight arcs, which don't exhibit this bug the way large polygons do.
//
// Bug #2 (this fix): the "Russia stretches across the globe" artifact is a
// SEPARATE, unrelated problem — antimeridian (180°/-180°) crossing. Russia's
// coastline near the Bering Strait crosses the date line; the raw topojson
// conversion left those ring coordinates jumping straight from ~+179.9° to
// ~-179.9° with no split. MapLibre's GeoJSON `fill` layer does not auto-split
// antimeridian-crossing polygons (unlike d3.geoPath, which clips this during
// projection — that's why plain d3/Observable globe demos using the same
// world-atlas data don't show the bug). The unsplit ring gets rendered as a
// straight line connecting +180° to -180° in planar lon/lat space instead of
// a short hop across the date line, producing the horizontal band.
//
// Fix: source country geometry from a LOCAL, pre-corrected GeoJSON file
// (Natural Earth 110m admin-0 countries, antimeridian-split via mapshaper
// or the `antimeridian` Python package as a one-time build step — see repo
// README) instead of fetching+converting topojson at runtime. This also
// drops the topojson-client dependency and the external CDN fetch.
// ─────────────────────────────────────────────────────────────

const COUNTRIES_SOURCE_ID = 'countries';
const COUNTRIES_FILL_LAYER_ID = 'countries-fill';
const COUNTRIES_LINE_LAYER_ID = 'countries-line';

const getStyleUrl = (mode: MapMode, theme: 'light' | 'dark') => {
  if (mode === 'satellite') return `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`;
  if (theme === 'light') {
    return mode === 'globe' || mode === 'flat'
      ? `https://api.maptiler.com/maps/basic-v2/style.json?key=${MAPTILER_KEY}`
      : `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;
  } else {
    return mode === 'globe' || mode === 'flat'
      ? `https://api.maptiler.com/maps/darkmatter/style.json?key=${MAPTILER_KEY}`
      : `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${MAPTILER_KEY}`;
  }
};


// Converts a deck.gl-style [r,g,b,a(0-255)] array into a CSS rgba() string
// for use in MapLibre paint expressions.
function rgbaToCss(rgba: number[] | undefined, fallback: string): string {
  if (!rgba) return fallback;
  const [r, g, b, a = 255] = rgba;
  return `rgba(${r},${g},${b},${(a / 255).toFixed(3)})`;
}

// 2. Cập nhật buildFillColorExpression để nó dùng 'iso_a2' đem so sánh
function buildFillColorExpression(countryColors: Record<string, number[]>, theme: 'light' | 'dark') {
  const defaultColor = theme === 'dark' ? 'rgba(40,40,40,0.16)' : 'rgba(200,200,200,0.24)';
  const entries = Object.entries(countryColors);
  if (entries.length === 0) return defaultColor;

  // SỬA TỪ 'iso_a3' THÀNH 'iso_a2' Ở DÒNG NÀY:
  const expr: any[] = ['match', ['get', 'iso_a2']];
  
  for (const [iso, rgba] of entries) {
    // Mapbox phân biệt chữ hoa/chữ thường, nên chắc chắn iso phải là In Hoa
    expr.push(iso.toUpperCase(), rgbaToCss(rgba, defaultColor));
  }
  expr.push(defaultColor); 
  return expr;
}

// Normalizes iso_a3 casing across different GeoJSON providers, and covers
// Natural Earth's well-known "-99" sentinel for countries with ambiguous
// ISO codes (France, Norway, Kosovo, Somaliland, N. Cyprus...) by falling
// back to ADM0_A3, which Natural Earth always fills in.
// 1. Tạo một bảng "danh sách đen" các nước bị lỗi mã trong Natural Earth 
// và ép nó về đúng mã ISO-2
const FIX_NATURAL_EARTH_ISO2: Record<string, string> = {
  // Các vùng bác bị thiếu:
  'GRL': 'GL', // Greenland
  'SAH': 'EH', // Tây Sahara
  'TWN': 'TW', // Đài Loan
  'NCL': 'NC', // New Caledonia
  'FRO': 'FO', // Faroe Islands
  'PRI': 'PR', // Puerto Rico
  
  // Các nước cũ
  'NOR': 'NO', 'FRA': 'FR', 'ARE': 'AE', 'GBR': 'GB', 'ZAF': 'ZA',
  'NLD': 'NL', 'KOS': 'XK', 'PSE': 'PS', 'PSX': 'PS', 'CYN': 'CY',
  'SOL': 'SO', 'ATA': 'AQ', 'SMR': 'SM',
};

function normalizeCountryIds(fc: FeatureCollection): FeatureCollection {
  return {
    ...fc,
    features: fc.features.map((f) => {
      const props: any = f.properties ?? {};
      const name = props.name || props.NAME || "Unknown";
      
      let iso3 = props['ISO3166-1-Alpha-3'] ?? props.ADM0_A3 ?? null;
      let iso2 = props['ISO3166-1-Alpha-2'] ?? props.iso_a2 ?? null;

      // Ép mã cho các vùng bị lỗi hoặc là lãnh thổ phụ thuộc
      const overrides: Record<string, string> = {
        'France': 'FR', 'Kosovo': 'XK', 'Norway': 'NO', 
        'Western Sahara': 'MA', // EH -> MA (Morocco)
        'Greenland': 'DK', 'Barbados': 'BB', 'Northern Cyprus': 'CY',
        'Puerto Rico': 'US', 'New Caledonia': 'FR', 'Faroe Islands': 'DK',
        'United Arab Emirates': 'AE', // Thêm UAE vào đây cho chắc chắn
        'Somaliland': 'SO', // Gộp Somaliland dùng chung data của Somalia
        'Baykonur Cosmodrome': 'KZ'
      };

      if (overrides[name]) {
        iso2 = overrides[name];
      } else if (iso2 === '-99' || !iso2) {
        iso2 = "UNKNOWN";
      }

      return { 
        ...f, 
        properties: { ...props, name, iso_a3: iso3, iso_a2: iso2.toUpperCase() } 
      };
    }),
  };
}

export function WorldMap({
  countryColors = {},
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

  // Keep latest callback/data in refs so the map event listeners (bound once)
  // never go stale without needing to be re-bound on every render.
  const onCountryClickRef = useRef(onCountryClick);
  const countryColorsRef = useRef(countryColors);
  const themeRef = useRef(theme);
  onCountryClickRef.current = onCountryClick;
  countryColorsRef.current = countryColors;
  themeRef.current = theme;

  const [mode, setMode] = useState<MapMode>(initialMode);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [currentZoom, setCurrentZoom] = useState(initialZoom);

  const [selectedIso, setSelectedIso] = useState<string | null>(null);

  // (Re)adds the countries source + fill layer. Safe to call repeatedly —
  // MapLibre wipes runtime-added sources/layers on every setStyle(), so this
  // runs again on every style.load (mode/theme change), and also whenever
  // countryColors changes to update the paint expression in place.
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

    // =========================================================
    // 1. TÌM LỚP CHỮ (LABELS) ĐỂ CHÈN MÀU XUỐNG DƯỚI
    // =========================================================
    const layers = map.getStyle().layers;
    let firstSymbolId: string | undefined = undefined;
    if (layers) {
      for (const layer of layers) {
        // 'symbol' là type dành cho các layer chứa text tên nước, thành phố...
        if (layer.type === 'symbol') {
          firstSymbolId = layer.id;
          break;
        }
      }
    }
    // =========================================================

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
      }, firstSymbolId); // <--- 2. TRUYỀN ID VÀO ĐÂY ĐỂ ĐẨY LAYER XUỐNG DƯỚI CHỮ
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
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            2.5,
            0.6,
          ],
        },
      }, firstSymbolId); // <--- TRUYỀN VÀO ĐÂY CHO CẢ ĐƯỜNG VIỀN NỮA
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
        getSourceColor: (d: any): [number, number, number, number] =>
          [...(d.color ?? [59, 130, 246]), 220] as [number, number, number, number],
        getTargetColor: (d: any): [number, number, number, number] =>
          [...(d.color ?? [239, 68, 68]), 220] as [number, number, number, number],
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
      style: getStyleUrl(initialMode, theme),
      center: initialCenter,
      zoom: initialZoom,
      pitch: 0,
      maxPitch: 60,
      minZoom: 1,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

    map.on('style.load', () => {
      map.setProjection({ type: initialMode === 'flat' ? 'mercator' : 'globe' });
      syncCountriesLayer(map); // no-op until data has been fetched once
    });

    // Lắng nghe sự kiện zoom và cập nhật state
    map.on('zoom', () => {
      setCurrentZoom(map.getZoom());
    });

    map.on('error', (e) => setLoadError(e.error?.message ?? 'Lỗi tải bản đồ.'));

    // Hover / click on countries — bound once. These are layer-id-scoped, so
    // they keep working correctly even though the layer gets removed and
    // re-added on every style change.
    map.on('mousemove', COUNTRIES_FILL_LAYER_ID, (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      if (!feature) return;
      // Lúc này id chính là tên nước (do promoteId: 'name')
      const id = feature.id; 

      if (hoveredIdRef.current !== null && hoveredIdRef.current !== id) {
        map.setFeatureState({ source: COUNTRIES_SOURCE_ID, id: hoveredIdRef.current }, { hover: false });
      }
      if (id !== undefined) {
        map.setFeatureState({ source: COUNTRIES_SOURCE_ID, id }, { hover: true });
        hoveredIdRef.current = id;
      }
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', COUNTRIES_FILL_LAYER_ID, () => {
      if (hoveredIdRef.current !== null) {
        map.setFeatureState({ source: COUNTRIES_SOURCE_ID, id: hoveredIdRef.current }, { hover: false });
        hoveredIdRef.current = null;
      }
      map.getCanvas().style.cursor = '';
    });

    // Trong WorldMap.tsx
    map.on('click', COUNTRIES_FILL_LAYER_ID, (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      let iso2 = feature?.properties?.iso_a2; 

      // Gộp vào nước cha trước khi cập nhật state
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update flight arcs khi dữ liệu đổi
  useEffect(() => {
    if (ready && overlayRef.current) {
      overlayRef.current.setProps({ layers: buildFlightLayers() });
    }
  }, [ready, buildFlightLayers]);

  // Update country fill colors khi countryColors hoặc theme đổi (không cần reload style)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (map.getLayer(COUNTRIES_FILL_LAYER_ID)) {
      syncCountriesLayer(map);
    }
  }, [countryColors, theme, ready, syncCountriesLayer]);

  // Theo dõi sự thay đổi của Theme để đổi style bản đồ live
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setStyle(getStyleUrl(mode, theme));

    map.once('style.load', () => {
      map.setProjection({ type: mode === 'flat' ? 'mercator' : 'globe' });
      syncCountriesLayer(map);
    });
  }, [theme, mode, ready, syncCountriesLayer]);

  // Cập nhật Mode (Quả cầu / Phẳng)
  const handleModeChange = useCallback((newMode: MapMode) => {
    const map = mapRef.current;
    if (!map || newMode === mode) return;

    setMode(newMode);
    map.setStyle(getStyleUrl(newMode, theme));

    map.once('style.load', () => {
      map.setProjection({ type: newMode === 'flat' ? 'mercator' : 'globe' });
      map.setPitch(0);
      syncCountriesLayer(map);
    });
  }, [mode, theme, syncCountriesLayer]);


  // 1. Khai báo 2 state mới thay cho `mode` cũ
  const [mapProjection, setMapProjection] = useState<'globe' | 'flat'>('globe');
  const [mapStyle, setMapStyle] = useState<string>('bright'); // Mặc định là voyager

  // 2. Hàm getStyleUrl được cập nhật để load đúng các variant mới
  const getStyleUrl = useCallback((styleId: string, currentTheme: 'light' | 'dark') => {
    switch (styleId) {
      case 'satellite': return `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`;
      case 'topo': return `https://api.maptiler.com/maps/topo-v2/style.json?key=${MAPTILER_KEY}`;
      case 'outdoor': return `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${MAPTILER_KEY}`;
      case 'bright': return `https://api.maptiler.com/maps/bright-v2/style.json?key=${MAPTILER_KEY}`;
      case 'streets': return `https://api.maptiler.com/maps/streets-v2${currentTheme === 'dark' ? '-dark' : ''}/style.json?key=${MAPTILER_KEY}`;
      case 'voyager': 
      default:
        // Dùng basic/dataviz cho voyager mode để nhìn data đẹp nhất
        return `https://api.maptiler.com/maps/basic-v2${currentTheme === 'dark' ? '-dark' : ''}/style.json?key=${MAPTILER_KEY}`;
    }
  }, []);

  // 3. Hàm xử lý khi người dùng đổi loại bản đồ (Style)
  const handleStyleChange = useCallback((newStyle: string) => {
    const map = mapRef.current;
    if (!map || newStyle === mapStyle) return;

    setMapStyle(newStyle);
    map.setStyle(getStyleUrl(newStyle, theme));

    // Phải set lại projection mỗi khi đổi style vì Maplibre sẽ reset nó
    map.once('style.load', () => {
      map.setProjection({ type: mapProjection === 'flat' ? 'mercator' : 'globe' });
      // Bác có thể gọi lại hàm vẽ viền/tô màu native ở đây (như đã hướng dẫn ở các bước trước)
    });
  }, [mapStyle, mapProjection, theme, getStyleUrl]);

  // 4. Hàm xử lý khi người dùng đổi 3D/2D (Projection)
  const handleProjectionChange = useCallback((newProj: 'globe' | 'flat') => {
    const map = mapRef.current;
    if (!map || newProj === mapProjection) return;

    setMapProjection(newProj);
    map.setProjection({ type: newProj === 'flat' ? 'mercator' : 'globe' });
    
    if (newProj === 'globe') {
      // Chuyển sang 3D: Giữ nguyên tọa độ đang xem, zoom ra một chút để thấy độ cong, và nghiêng 25 độ
      map.easeTo({
        center: map.getCenter(), // Lấy tọa độ hiện tại làm tâm
        pitch: 10,               // Độ nghiêng nghệ thuật
        duration: 1000
      });
    } else {
      // Chuyển sang 2D: Đưa góc nghiêng về 0 để bản đồ phẳng không bị méo
      map.easeTo({
        pitch: 0,
        duration: 1000
      });
    }
  }, [mapProjection]);


  // 5. Tính năng tự động căn giữa khi zoom ra xa ở chế độ 3D
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Cancels out globe's automatic zoom-vs-latitude compensation so we're
    // comparing an "equator-equivalent" zoom, not the raw compensated value —
    // otherwise just panning toward the poles can trip this threshold.
    const getEquatorEquivalentZoom = (currentZoom: number, lat: number) => {
      const zoomAdjustment = Math.log2(Math.cos((lat * Math.PI) / 180));
      return currentZoom - zoomAdjustment;
    };

    const handleZoomEnd = () => {
      if (mapProjection !== 'globe') return;
      const effectiveZoom = getEquatorEquivalentZoom(map.getZoom(), map.getCenter().lat);
      if (effectiveZoom < 1.4) {
        map.easeTo({
          zoom: 2,
          pitch: 0,
          bearing: 0,
          duration: 800,
        });
      }
    };

    map.on('zoom', () => {
      setCurrentZoom(getEquatorEquivalentZoom(map.getZoom(), map.getCenter().lat));
    });
    return () => { map.off('zoomend', handleZoomEnd); };
  }, [mapProjection]);

  // 5. Cập nhật useEffect theo dõi Theme
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setStyle(getStyleUrl(mapStyle, theme));
    
    map.once('style.load', () => {
      map.setProjection({ type: mapProjection === 'flat' ? 'mercator' : 'globe' });
    });
  }, [theme, mapStyle, mapProjection, ready, getStyleUrl]);

  // ... (các code logic phía trên)

  const borderClass = theme === 'dark' ? 'border-white/60' : 'border-gray-300';

  return (
    <div
      className={`absolute ${borderClass} inset-0 z-[-1] transition-opacity duration-1000`}
      style={{ position: 'relative', width: '100%', height, zIndex: 0 ,
        backgroundImage: theme === 'dark' 
        ? `
          url("https://www.transparenttextures.com/patterns/stardust.png"),
          radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 80%), 
          radial-gradient(circle at 15% 25%, rgba(30, 58, 138, 0.4) 0%, transparent 70%),
          radial-gradient(circle at 85% 75%, rgba(49, 46, 129, 0.3) 0%, transparent 70%)
        `
        : `
          url("https://www.transparenttextures.com/patterns/stardust.png"),
          radial-gradient(circle at 50% 50%, #ffffff 0%, #dcf4ff 40%, #7dd3fc 100%),
          radial-gradient(at 0% 0%, rgba(255, 255, 255, 0.8) 0%, transparent 60%),
          radial-gradient(at 100% 100%, rgba(186, 230, 253, 0.5) 0%, transparent 60%)
        `,
        // Dùng blend mode để trộn cái ảnh hạt bụi sao (stardust) chìm vào màu gradient
        backgroundBlendMode: theme === 'dark' ? 'color-dodge' : 'color-dodge',
        // backgroundBlendMode: '', // Trộn lớp hạt vào nền
      }}
    > 
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Lớp chứa bản đồ + Ánh sáng mặt cầu */}
        <div 
          ref={containerRef}
          className={`
            transition-all duration-1000 overflow-hidden
          `}
          style={{ 
            width: '100%', height: '100%',
            // Bóng đổ nội tại (tạo khối 3D),
            // 👉 THÊM VIỀN ĐEN Ở ĐÂY:
            border: mapProjection === 'globe' 
              ? '2px solid rgba(0, 0, 0, 0.8)' // Viền đen hơi trong suốt một chút cho "nghệ"
              : 'none', // Chế độ 2D thì tắt viền đi
            boxShadow: theme === 'dark'
              ? 'inset 0 0 100px rgba(0,0,0,0.8)'
              : 'inset 0 0 100px rgba(255,255,255,0.6)'
          }}
        />

        {/* Lớp bóng đổ (Cái bóng nằm dưới quả cầu) */}
        {mapProjection === 'globe' && (
          <div 
            className="absolute -bottom-10 w-[80%] h-12 rounded-[100%] transition-opacity duration-1000"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, transparent 70%)',
              filter: 'blur(20px)',
              zIndex: -1
            }}
          />
        )}
      </div>

      {/* BẢNG CHÚ THÍCH MÀU SẮC */}
      {/* BẢNG CHÚ THÍCH MÀU SẮC — chỉ hiện khi đã có dữ liệu tô màu quốc gia */}
      {Object.keys(countryColors).length > 0 && (
        <div className={`absolute bottom-18 left-4 z-10 p-4 rounded-sm backdrop-blur-md border shadow-lg transition-colors ${
          theme === 'dark' 
            ? 'bg-[#020617]/70 border-white/10 text-white' 
            : 'bg-white/80 border-gray-200 text-gray-800'
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
                <span 
                  className="w-3 h-3 shadow-[0_0_8px_rgba(0,0,0,0.2)]" 
                  style={{ backgroundColor: item.color }} 
                />
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

      {/* KHU VỰC BẢNG ĐIỀU KHIỂN */}
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-4 items-start">
        
        {/* 1. Thanh chọn Chế độ hiển thị (3D/2D) */}
        {/* Thêm class 'group' vào container chung */}
        <div className={`group gap-2 flex p-1.5 rounded-sm backdrop-blur-2xl shadow-lg border transition-all duration-500 w-fit ${
          theme === 'dark' 
            ? 'bg-[#020617]/40 border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.5)]' 
            : 'bg-white/70 border-white/50 shadow-[0_12px_40px_rgba(0,0,0,0.08)]'
        }`}>
          {(['globe', 'flat'] as const).map((proj) => {
            const isActive = mapProjection === proj;
            return (
              <button
                key={proj}
                onClick={() => handleProjectionChange(proj)}
                // Đổi thành justify-start để khi mở rộng icon không bị chạy qua chạy lại
                className={`flex items-center justify-start rounded-sm p-2.5 text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                  isActive
                    ? (theme === 'dark' ? 'bg-white text-black shadow-sm' : 'bg-gray-900 text-white shadow-md')
                    : `hover:bg-gray-500/10 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`
                }`}
              >
                {proj === 'globe' ? <Globe className="w-4 h-4 shrink-0" /> : <Map className="w-4 h-4 shrink-0" />}
                
                {/* Mặc định tàng hình (max-w-0), chỉ mở rộng chữ khi rê chuột vào KHUNG CHUNG (group-hover) */}
                <span className="overflow-hidden whitespace-nowrap max-w-0 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:max-w-[120px] group-hover:opacity-100 group-hover:pl-2.5">
                  {proj === 'globe' ? '3D Globe' : '2D Map'}
                </span>
              </button>
            );
          })}
        </div>

        {/* 2. Thanh chọn Loại bản đồ (Styles) - GRID 3x2 */}
        {/* Đổi từ 'flex flex-wrap' sang 'grid grid-cols-3' để tạo lưới 3x2 */}
        <div className={`group grid grid-cols-3 gap-1.5 p-1.5 rounded-sm backdrop-blur-2xl shadow-lg border transition-all duration-500 w-fit ${
          theme === 'dark' 
            ? 'bg-[#020617]/40 border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.5)]' 
            : 'bg-white/70 border-white/50 shadow-[0_12px_40px_rgba(0,0,0,0.08)]'
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
                  isActive
                    ? (theme === 'dark' ? 'bg-white text-black shadow-sm' : 'bg-gray-900 text-white shadow-md')
                    : `hover:bg-gray-500/10 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`
                }`}
              >
                {style.icon}

                {/* Tương tự, chỉ hiện chữ khi hover vào bảng lưới */}
                <span className="overflow-hidden whitespace-nowrap max-w-0 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:max-w-[100px] group-hover:opacity-100 group-hover:pl-2">
                  {style.label}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Loading Overlay */}
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

      {/* Error Overlay */}
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-red-400 text-sm z-20 p-6 text-center font-bold backdrop-blur-md">
          <div className="max-w-md p-4 rounded-xl border border-red-500/30 bg-red-500/10">
            <p className="text-xl mb-2">⚠️</p>
            <p>{loadError}</p>
          </div>
        </div>
      )}
    </div>
  );
}