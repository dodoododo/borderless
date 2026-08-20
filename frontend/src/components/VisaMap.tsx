import { memo, useMemo, useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";

interface VisaMapProps {
  destinationMap: Record<string, string>; // e.g. { vn: "Visa Free", us: "Visa Required" }
  theme: "dark" | "light";
}

const COLOR_MAPPING: Record<string, { dark: string; light: string; label: string }> = {
  visafree: { dark: "#10b981", light: "#059669", label: "Visa Free" },
  visaonarrival: { dark: "#f59e0b", light: "#d97706", label: "Visa on Arrival" },
  evisa: { dark: "#0ea5e9", light: "#0284c7", label: "eVisa" },
  eta: { dark: "#8b5cf6", light: "#7c3aed", label: "ETA" },
  visarequired: { dark: "#27272a", light: "#9ea6b0", label: "Visa Required" },
  restricted: { dark: "#f43f5e", light: "#e03d61", label: "Restricted" },
  default: { dark: "#18181b", light: "#f1f5f9", label: "No Info" },
};

// Darken a hex color by a factor (0-1, lower = darker) for hover state
const darken = (hex: string, factor: number = 0.82): string => {
  const h = hex.replace("#", "");
  const r = Math.round(parseInt(h.substring(0, 2), 16) * factor);
  const g = Math.round(parseInt(h.substring(2, 4), 16) * factor);
  const b = Math.round(parseInt(h.substring(4, 6), 16) * factor);
  return `rgb(${r}, ${g}, ${b})`;
};

const FALLBACK_ISO: Record<string, string> = {
  "France": "fr",
  "Norway": "no",
  "Somaliland": "so", 
  "Kosovo": "xk",
  "Northern Cyprus": "cy",
  "Western Sahara": "ma"
};

const VisaMapComponent = ({ destinationMap, theme }: VisaMapProps) => {
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/data/countries.geojson")
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load geojson: ${res.status}`);
        return res.json();
      })
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
    const isDark = theme === "dark";
    const borderHighlight = isDark ? "#fafafa" : "#0f172a";

    return {
      backgroundColor: isDark ? "#404f73" : "#bed8e8",
      tooltip: {
        trigger: "item",
        appendToBody: true,
        backgroundColor: isDark ? "rgba(24, 24, 27, 0.95)" : "rgba(255, 255, 255, 0.95)",
        borderColor: isDark ? "#b7b7c4" : "#707070",
        borderWidth: 1,
        padding: 5,
        textStyle: {
          color: isDark ? "#fafafa" : "#0f172a",
          fontSize: 12,
        },
        formatter: (params: any) => {
          const countryName = params.name || "Unknown";
          const data = params.data?.customData;

          if (!data) return countryName; 

          const { displayText, note, dotColor } = data;

          let tooltipHtml = `
            <div style="display: flex; flex-direction: column; gap: 3px; max-width: 400px; white-space: normal; word-wrap: break-word;">
              <div style="font-weight: 500; font-size: 14px; letter-spacing: -0.2px;">
                ${countryName}
              </div>
              <div style="display: flex; align-items: center; gap: 2px;">
                <span style="display: block; width: 8px; height: 8px; border-radius: 50%; background-color: ${dotColor};"></span>
                <span style="font-size: 13px; font-weight: 400;">
                  ${displayText}
                </span>
              </div>
          `;

          if (note) {
            tooltipHtml += `
              <div style="margin-top: 1px; font-size: 11px; line-height: 1.4; border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}; padding-top: 3px;">
                ${note}
              </div>
            `;
          }

          tooltipHtml += `</div>`;
          return tooltipHtml;
        },
      },
      series: [
        {
          type: "map",
          map: "world",
          roam: true,
          scaleLimit: { min: 1, max: 8 },
          top: "5%",
          bottom: "0%",
          left: "1%",
          right: "1%",
          itemStyle: {
            areaColor: isDark ? COLOR_MAPPING.default.dark : COLOR_MAPPING.default.light,
            borderColor: isDark ? "#e6e6e6" : "#2b2828",
            borderWidth: 0.5,
          },
          emphasis: {
            label: { show: false },
          },
          
          data: geoData.features.map((feature: any) => {
            const prop = feature.properties || {};
            const countryName = prop.name || "";
            
            let rawIso = (prop["ISO3166-1-Alpha-2"] || prop.iso_a2 || prop.id || "").toLowerCase();
            if (rawIso === "-99" || rawIso === "") {
              rawIso = FALLBACK_ISO[countryName] || rawIso;
            }

            const isoCode = rawIso;
            const rawStatus = destinationMap[isoCode] || "";

            // =====================================================================
            // 🚀 BƯỚC 1: TÁCH BẠCH CHUỖI VÀ NOTE SIÊU CHUẨN Y HỆT BÊN NGOÀI
            // =====================================================================
            let baseStatus = rawStatus.trim();
            let noteContent = "";

            const match = rawStatus.match(/(\s+-\s+|\s+(?=["']))/);
            if (match && match.index !== undefined) {
              baseStatus = rawStatus.substring(0, match.index).trim();
              noteContent = rawStatus.substring(match.index + match[0].length).trim();
              noteContent = noteContent.replace(/^["']+|["']+$/g, "").trim();
            }

            const s = baseStatus.toLowerCase();

            // =====================================================================
            // 🚀 BƯỚC 2: LỌC MÀU (THỨ TỰ ƯU TIÊN TUYỆT ĐỐI)
            // =====================================================================
            let key: keyof typeof COLOR_MAPPING = "default";
            
            if (s) {
              if (/^\d+/.test(s)) {
                key = "visafree";
              } 
              else if (
                s.includes('restricted') || s.includes('prohibited') || 
                s.includes('no admission') || s.includes('noadmission') || 
                s.includes('refused') || s.includes('suspended') || 
                s.includes('banned') || /\bban\b/.test(s) || s.includes('covid')
              ) {
                key = "restricted";
              } 
              else if (s.includes('required') || s.includes('tourist card')) {
                key = "visarequired";
              } 
              else if (s.includes('arrival') || s === 'voa' || s.includes('e-voa')) {
                key = "visaonarrival";
              } 
              else if (s.includes('eta') || s.includes('electronic travel') || s.includes('electronic border')) {
                key = "eta";
              } 
              else if (
                s.includes('e-visa') || s.includes('evisa') || s.includes('e visa') || 
                s.includes('electronic') || s.includes('online') || s.includes('smart service')
              ) {
                key = "evisa";
              } 
              else if (s.includes('free') || s.includes('not required') || s.includes('freedom')) {
                key = "visafree";
              } 
              else {
                key = "visarequired"; // Mặc định an toàn
              }
            }

            // =====================================================================
            // 🚀 BƯỚC 3: FORMAT TEXT HIỂN THỊ LÊN TOOLTIP SẠCH BÓNG
            // =====================================================================
            const isNumeric = /^\d+$/.test(baseStatus);
            let displayText = baseStatus;

            if (isNumeric && (baseStatus === '1' || baseStatus === '-1')) {
              displayText = "Home Country";
            } else if (isNumeric) {
              displayText = `Visa Free (${baseStatus} days)`;
            } else if (key === "visafree") {
              displayText = "Visa Free";
            } else if (baseStatus) {
              displayText = baseStatus.charAt(0).toUpperCase() + baseStatus.slice(1);
            } else {
              displayText = "No Data";
            }

            // =====================================================================
            // 🚀 LẤY MÀU VÀ GÁN DỮ LIỆU ĐỂ RENDER
            // =====================================================================
            let baseColor = isDark ? COLOR_MAPPING[key].dark : COLOR_MAPPING[key].light;
            if (baseStatus === "1" || baseStatus === "-1") {
               baseColor = "#c6d400"; // Màu đặc biệt cho Home Country
            }

            return {
              name: countryName,
              customData: {
                displayText,
                note: noteContent,
                dotColor: baseColor,
                rawStatus
              },
              itemStyle: {
                areaColor: baseColor,
              },
              emphasis: {
                itemStyle: {
                  areaColor: darken(baseColor),
                  borderColor: borderHighlight,
                  borderWidth: 1.2,
                },
              },
            };
          }),
        },
      ],
    };
  }, [geoData, destinationMap, theme]);

  if (!option) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-sm opacity-60">Loading map…</span>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] sm:h-full relative flex items-center justify-center overflow-hidden">
      <ReactECharts
        option={option}
        style={{ width: "100%", height: "100%" }}
        opts={{ renderer: "canvas" }}
        notMerge={true}     
        lazyUpdate={true}
      />
    </div>
  );
};

export const VisaMap = memo(VisaMapComponent);