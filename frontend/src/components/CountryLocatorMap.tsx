import { memo, useMemo, useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";

interface CountryLocatorMapProps {
  iso2: string;
  countryName: string;
  accentRaw?: string;
  accentMuted?: string;
  seaColor?: string;
}

// 1. HÀM TRỘN MÀU VỚI MÀU TRẮNG ĐỂ TẠO MÀU SOLID NHẠT HƠN (KHÔNG DÙNG OPACITY)
const tintColorWithWhite = (hexColor: string, tintFactor: number): string => {
  // Chuẩn hóa chuỗi hex
  let hex = hexColor.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  // Nếu mã màu lỗi, trả về màu mặc định
  if (hex.length !== 6) return "#f8fafc"; 

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Pha trộn với màu trắng (255, 255, 255) theo tỷ lệ tintFactor (ví dụ 0.9 là 90% trắng)
  const newR = Math.round(r + (255 - r) * tintFactor);
  const newG = Math.round(g + (255 - g) * tintFactor);
  const newB = Math.round(b + (255 - b) * tintFactor);

  return `rgb(${newR}, ${newG}, ${newB})`; // Trả về RGB đặc 100%, không có kênh Alpha (A)
};

// 2. Hàm helper để tính toán khung giới hạn tọa độ của một quốc gia
const getFeatureBounds = (feature: any) => {
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  
  if (!feature?.geometry?.coordinates) return null;

  const type = feature.geometry.type;
  const coords = feature.geometry.coordinates;

  const updateBounds = (coord: number[]) => {
    const [lng, lat] = coord;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  };

  if (type === 'Polygon') {
    coords.forEach((ring: any[]) => ring.forEach(updateBounds));
  } else if (type === 'MultiPolygon') {
    coords.forEach((poly: any[]) => poly.forEach((ring: any[]) => ring.forEach(updateBounds)));
  } else {
    return null;
  }

  if (minLng !== Infinity) return { minLng, maxLng, minLat, maxLat };
  return null;
};

const CountryLocatorMapComponent = ({ 
  iso2, 
  countryName, 
  accentRaw = "#3b82f6", 
  accentMuted = "#64748b",
  seaColor = "#cae3e8" 
}: CountryLocatorMapProps) => {
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/data/countries.geojson")
      .then((res) => res.json())
      .then((geo) => {
        if (cancelled) return;
        if (!echarts.getMap("world")) {
          echarts.registerMap("world", geo);
        }
        setGeoData(geo);
      })
      .catch((err) => console.error("Error loading world geojson:", err));

    return () => {
      cancelled = true;
    };
  }, []);

  const option = useMemo(() => {
    if (!geoData) return null;

    // --- TẠO MÀU NỀN SOLID NHẠT TỪ MÀU ACCENT ---
    // Pha 90% màu trắng vào màu accentRaw để ra màu "Soft" nhưng ĐẶC 100%
    const solidSoftColor = tintColorWithWhite(accentRaw, 0.95);

    let centerCoord: number[] = [0, 20];
    let zoomLevel = 1.2; 

    const targetFeature = geoData.features.find((feature: any) => {
      const prop = feature.properties || {};
      const rawIso = (prop["ISO3166-1-Alpha-2"] || prop.iso_a2 || prop.id || "").toString().toLowerCase();
      const propName = (prop.name || "").toString().toLowerCase();
      
      return (
        (iso2 && rawIso === iso2.toLowerCase()) || 
        (countryName && propName === countryName.toLowerCase())
      );
    });

    if (targetFeature) {
      const bounds = getFeatureBounds(targetFeature);
      if (bounds) {
        const { minLng, maxLng, minLat, maxLat } = bounds;
        
        const lngSpan = maxLng - minLng;
        const latSpan = maxLat - minLat;
        const cLng = (minLng + maxLng) / 2;
        const cLat = (minLat + maxLat) / 2;

        centerCoord = [cLng, cLat];

        const finalLngSpan = Math.max(lngSpan * 1.5, 10);
        const finalLatSpan = Math.max(latSpan * 1.5, 10);
        
        const zoomX = 360 / finalLngSpan;
        const zoomY = 180 / finalLatSpan;
        
        zoomLevel = Math.min(zoomX, zoomY);
        zoomLevel = Math.max(1.2, Math.min(zoomLevel, 15));
      }
    }

    return {
      backgroundColor: seaColor,
      tooltip: {
        trigger: "item",
        triggerOn: "mousemove",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderColor: accentRaw,
        borderWidth: 1.5,
        padding: [10, 14],
        extraCssText: "box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); border-radius: 8px; backdrop-filter: blur(8px); pointer-events: none;",
        textStyle: {
          color: "#0f172a",
          fontSize: 13,
        },
        formatter: (params: any) => {
          const { name } = params;
          if (!name) return ""; 
          return `
            <div style="display: flex; flex-direction: column; gap: 4px; min-width: 120px;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                <span style="font-weight: 700; font-size: 14px; color: #0f172a; font-family: sans-serif;">${name}</span>
              </div>
            </div>
          `;
        },
      },
      geo: {
        map: "world",
        roam: true, 
        scaleLimit: { min: 1, max: 20 }, 
        center: centerCoord, 
        zoom: zoomLevel, 
        selectedMode: false,
        label: { show: false },
        emphasis: { label: { show: false } },
        
        regions: geoData.features.map((feature: any) => {
          const prop = feature.properties || {};
          const rawIso = (prop["ISO3166-1-Alpha-2"] || prop.iso_a2 || prop.id || "").toLowerCase();
          const isTarget = rawIso === iso2.toLowerCase() || prop.name?.toLowerCase() === countryName.toLowerCase();

          return {
            name: prop.name,
            itemStyle: isTarget ? {
              // Nước ĐƯỢC CHỌN
              areaColor: accentRaw,
              borderColor: accentMuted,
              borderWidth: 1,
              shadowColor: accentRaw,
            } : {
              // CÁC NƯỚC KHÁC: Dùng màu Soft ĐẶC 100% tự pha
              areaColor: solidSoftColor, 
              borderColor: accentMuted, 
              borderWidth: 0.5,
            },
            emphasis: {
              itemStyle: {
                areaColor: isTarget ? accentRaw : accentMuted, 
                borderColor: "#ffffff", 
                borderWidth: 2, 
                shadowBlur: isTarget ? 2 : 6, 
                shadowColor: isTarget ? accentRaw : "rgba(0,0,0,0.25)",
              }
            }
          };
        }),
      },
      series: [
        {
          type: "map",
          geoIndex: 0,
          data: geoData.features.map((feature: any) => ({
            name: feature.properties?.name || "",
          })),
        },
      ],
    };
  }, [geoData, iso2, countryName, accentRaw, accentMuted, seaColor]);

  if (!option) {
    return (
      <div className="w-full h-full flex items-center justify-center min-h-[350px]" style={{ backgroundColor: seaColor }}>
        <span className="text-xs font-mono uppercase tracking-widest text-slate-400 animate-pulse">
          Rendering spatial map...
        </span>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
      <ReactECharts
        option={option}
        style={{ width: "100%", height: "100%", minHeight: "380px" }}
        opts={{ renderer: "canvas" }}
      />
    </div>
  );
};

export const CountryLocatorMap = memo(CountryLocatorMapComponent);