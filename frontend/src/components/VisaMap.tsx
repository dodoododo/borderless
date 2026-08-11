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
  visarequired: { dark: "#27272a", light: "#9ea6b0", label: "Visa Required" }, // Đổi thành xám đậm hơn chút để dễ nhìn
  restricted: { dark: "#f43f5e", light: "#e03d61", label: "Restricted" },
  default: { dark: "#18181b", light: "#f1f5f9", label: "No Info" }, // Đổi nền default nhạt bớt
};
const normalizeKey = (str: string | undefined): string => {
  if (!str) return "default";
  return str.toLowerCase().replace(/[\s-_]/g, "");
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
            "Somaliland": "so", // Somaliland thường xét chung visa với Somalia (SO)
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
        backgroundColor: isDark ? "#18181b" : "#ffffff",
        borderColor: isDark ? "#b7b7c4" : "#707070",
        textStyle: {
          color: isDark ? "#fafafa" : "#0f172a",
          fontSize: 12,
        },
        formatter: (params: any) => {
          const countryName = params.name || "Unknown";
          const rawStatus = params.data?.statusText || "No Info";
          
          let displayStatus = rawStatus;
          let dotColor = "#cbd5e1"; // Màu mặc định (Xám nhạt)

          const normKey = rawStatus.toLowerCase().replace(/[\s-_]/g, "");
          const isNumber = !isNaN(Number(normKey)) && normKey.trim() !== "";

          // 🚀 THÊM LOGIC HOME COUNTRY Ở NGAY ĐÂY
          if (rawStatus == 1) {
            displayStatus = "Home Country";
            dotColor = "#c6d400"; // Màu tím (hoặc màu nào bác thích để làm nổi bật quê hương)
          } 
          // Các logic còn lại giữ nguyên
          else if (isNumber) {
            displayStatus = `Visa Free (${rawStatus} days stay)`;
            dotColor = "#10b981"; // Xanh lá
          } else if (normKey.includes("free")) {
            dotColor = "#10b981"; 
          } else if (normKey.includes("arrival")) {
            dotColor = "#f59e0b"; 
          } else if (normKey.includes("evisa") || normKey.includes("eta") || normKey.includes("esta") || normKey.includes("electronic")) {
            dotColor = "#0ea5e9"; 
          } else if (normKey.includes("required")) {
            dotColor = "#71717a"; 
          } else if (normKey.includes("restricted") || normKey.includes("prohibited") || normKey.includes("noadmission") || normKey.includes("refused")) {
            dotColor = "#f43f5e"; 
          }

          return `
            <div style="display: flex; flex-direction: column; gap: 4px; padding: 2px 4px;">
              <div style="font-weight: 700; font-size: 13px; letter-spacing: -0.2px;">
                ${countryName}
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="display: block; width: 8px; height: 8px; border-radius: 50%; background-color: ${dotColor};"></span>
                <span style="font-size: 12px; font-weight: 500; opacity: 0.9;">
                  ${displayStatus}
                </span>
              </div>
            </div>
          `;
        },
      },
      series: [
        {
          type: "map",
          map: "world",
          roam: true,
          scaleLimit: { min: 1, max: 8 },
          // Fallback fill for any region that somehow has no data entry
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
            
            // Lấy mã ISO từ file (nếu có)
            let rawIso = (prop["ISO3166-1-Alpha-2"] || prop.iso_a2 || prop.id || "").toLowerCase();
            
            // 🚀 BÍ QUYẾT FIX LỖI Ở ĐÂY: Nếu gặp mã lỗi -99 hoặc rỗng, tự động map theo tên
            if (rawIso === "-99" || rawIso === "") {
              rawIso = FALLBACK_ISO[countryName] || rawIso;
            }

            const isoCode = rawIso;
            const rawStatus = destinationMap[isoCode];
            const normKey = normalizeKey(rawStatus);

            // Xử lý logic màu sắc
            const isNumber = !isNaN(Number(normKey)) && normKey.trim() !== "";
            let key: keyof typeof COLOR_MAPPING = "default";
            
            if (normKey.includes("free") || isNumber) key = "visafree";
            else if (normKey.includes("arrival")) key = "visaonarrival";
            else if (normKey.includes("evisa")) key = "evisa";
            else if (normKey.includes("eta") || normKey.includes("esta") || normKey.includes("electronic")) key = "eta";
            else if (normKey.includes("required")) key = "visarequired";
            else if (normKey.includes("restricted") || normKey.includes("prohibited") || normKey.includes("noadmission") || normKey.includes("refused")) key = "restricted";

            const baseColor = isDark ? COLOR_MAPPING[key].dark : COLOR_MAPPING[key].light;

            return {
              name: countryName,
              statusText: rawStatus || "No Data",
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
    <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
      <ReactECharts
        option={option}
        style={{ width: "100%", height: "100%" }}
        opts={{ renderer: "canvas" }}
      />
    </div>
  );
};

export const VisaMap = memo(VisaMapComponent);