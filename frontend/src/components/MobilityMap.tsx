import { memo, useMemo, useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import type { RankingData } from "../types/ranking.type";

interface MobilityMapProps {
  rankings: RankingData[];
  theme?: "dark" | "light";
  // MỚI: Thêm prop metric để tái sử dụng map cho nhiều trang
  metric?: "mobility" | "openness"; 
}

const FALLBACK_ISO: Record<string, string> = {
  "France": "fr",
  "Norway": "no",
  "Somaliland": "so",
  "Kosovo": "xk",
  "Northern Cyprus": "cy",
  "Western Sahara": "ma",
};

const MobilityMapComponent = ({ rankings, theme, metric = "mobility" }: MobilityMapProps) => {
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
    const isDark = theme === "dark";
    const isOpenness = metric === "openness";

    // Lấy giá trị lớn nhất tùy theo metric
    const maxScore = rankings.length > 0 
      ? Math.max(...rankings.map(r => isOpenness ? (r.opennessScore || 0) : r.globalScore)) 
      : 200;

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        backgroundColor: isDark ? "rgba(24, 24, 27, 0.9)" : "rgba(255, 255, 255, 0.9)",
        borderColor: isDark ? "#3f3f46" : "#e2e8f0",
        borderWidth: 1,
        textStyle: {
          color: isDark ? "#fafafa" : "#bdc1c9",
          fontSize: 13,
        },
        formatter: (params: any) => {
          const { name, value, data } = params;
          if (!data || value === undefined || isNaN(value)) {
            return `<b>${name || "Unknown"}</b><br/>No data available`;
          }
          
          // Thay đổi text tooltip theo Metric
          const scoreLabel = isOpenness ? "Openness Score:" : "Mobility Score:";
          const rankLabel = isOpenness ? "Openness Rank:" : "Global Rank:";
          const highlightColor = isOpenness ? "#8b5cf6" : "#10b981"; // Tím violet hoặc Xanh ngọc

          return `
            <div style="display:flex; flex-direction:column; gap:4px; padding:2px;">
              <div style="font-weight:700; font-size:14px;">${name}</div>
              <div style="display:flex; justify-content:space-between; gap:12px;">
                <span style="opacity:0.7">${rankLabel}</span>
                <span style="font-weight:bold; color:${highlightColor};">#${data.rank}</span>
              </div>
              <div style="display:flex; justify-content:space-between; gap:12px;">
                <span style="opacity:0.7">${scoreLabel}</span>
                <span style="font-weight:bold; color:${highlightColor};">${value}</span>
              </div>
            </div>
          `;
        },
      },
      visualMap: {
        left: "1%",
        bottom: "10%",
        min: 0,
        max: maxScore,
        text: isOpenness ? ["Most Welcoming", "Restrictive"] : ["High Mobility", "Low Mobility"],
        textStyle: { color: isDark ? "#ffffff" : "#02193b", fontSize: 11 },
        calculable: true,
        inRange: {
          // MỚI: Đổi dải màu dựa trên metric
          color: isOpenness
            ? (isDark ? ["#333333", "#3b0764", "#8b5cf6"] : ["#f3e8ff", "#c4b5fd", "#7c3aed"]) // Tím Violet cho Openness
            : (isDark ? ["#000000", "#70c96b"] : ["#e2e8f0", "#94a3b8", "#059669"]) // Xanh Emerald cho Global Power
        },
      },
      series: [
        {
          type: "map",
          map: "world",
          roam: true,
          scaleLimit: { min: 1, max: 8 },
          top: "5%",
          bottom: "1%",
          left: "1%",
          right: "1%",
          itemStyle: {
            borderColor: isDark ? "#000000" : "#ffffff",
            borderWidth: 0.8,
            areaColor: isDark ? "#18181b" : "#f1f5f9",
          },
          emphasis: {
            label: { show: false },
            itemStyle: {
              borderColor: isDark ? "#ffffff" : "#000000",
              borderWidth: 1.5,
              areaColor: isOpenness ? "#a78bfa" : "#3b82f6", // Hover màu sáng tương ứng
            },
          },
          data: geoData.features.map((feature: any) => {
            const prop = feature.properties || {};
            const countryName = prop.name || "";
            let rawIso = (prop["ISO3166-1-Alpha-2"] || prop.iso_a2 || prop.id || "").toLowerCase();
            if (rawIso === "-99" || rawIso === "") {
              rawIso = FALLBACK_ISO[countryName] || rawIso;
            }

            const ranking = rankings.find(r => r.iso.toLowerCase() === rawIso);

            return {
              name: countryName,
              // Gắn đúng Value và Rank theo Metric đang chọn
              value: ranking ? (isOpenness ? ranking.opennessScore : ranking.globalScore) : NaN,
              rank: ranking ? (isOpenness ? (ranking as any).opennessRank : ranking.rank) : "-",
              iso: rawIso,
            };
          }),
        },
      ],
    };
  }, [geoData, rankings, theme, metric]);

  if (!option) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-sm opacity-60 animate-pulse">Loading world map…</span>
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

export const MobilityMap = memo(MobilityMapComponent);