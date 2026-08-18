import React from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, MapPin, Globe2, Activity, Loader2, AlertTriangle, Map, Languages, Car, Phone, Clock, Users, Ruler, Landmark, Globe , Plane , ChevronRight, Search, X, Zap, ExternalLink, ShieldCheck, Bold } from "lucide-react";
import {
  AreaChart,         
  Area,
  XAxis,
  YAxis,             
  CartesianGrid,     
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { useCountryProfile } from "../hooks/useCountryProfile.ts";
import { usePassportStatus } from "../hooks/usePassportStatus.ts";
import { resolveStatusLabel } from "../types/visa.type.ts";
import type { RankingData } from "../types/ranking.type"; 
import { VisaMap } from "../components/VisaMap.tsx"
import { parseDestinationStatus, type StatusCategory } from "../utils/visaParser";


// Hàm dịch mã ISO thành tên quốc gia
const getCountryName = (isoCode: string) => {
  try {
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return regionNames.of(isoCode.toUpperCase()) || isoCode;
  } catch {
    return isoCode;
  }
};

// -----------------------------------------------------------------------------
// THEME PROPS
// -----------------------------------------------------------------------------
interface PassportDetailPageProps {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}

const STATUS_COLORS_DARK: Record<string, string> = {
  "Visa Free": "text-[#34d399] bg-[#34d399]/10",
  "eVisa": "text-[#38bdf8] bg-[#38bdf8]/10",
  "ETA": "text-[#c084fc] bg-[#c084fc]/10",
  "Electronic Authorization": "text-[#c084fc] bg-[#c084fc]/10",
  "Visa on Arrival": "text-[#fbbf24] bg-[#fbbf24]/10",
  "Visa Required": "text-[#fb923c] bg-[#fb923c]/10",
  "Restricted": "text-[#f87171] bg-[#f87171]/10",
};

const STATUS_COLORS_LIGHT: Record<string, string> = {
  "Visa Free": "text-[#059669] bg-[#059669]/10",
  "eVisa": "text-[#0284c7] bg-[#0284c7]/10",
  "ETA": "text-[#9333ea] bg-[#9333ea]/10",
  "Electronic Authorization": "text-[#9333ea] bg-[#9333ea]/10",
  "Visa on Arrival": "text-[#d97706] bg-[#d97706]/10",
  "Visa Required": "text-[#ea580c] bg-[#ea580c]/10",
  "Restricted": "text-[#dc2626] bg-[#dc2626]/10",
};

// export type StatusCategory = "restricted" | "free" | "eta" | "arrival" | "evisa" | "required" | "other";

export interface ParsedVisaStatus {
  category: StatusCategory;
  displayText: string;
  note: string;
}

// export function parseDestinationStatus(rawStatus: string): ParsedVisaStatus {
//   const status = (rawStatus || "").trim();

//   // =====================================================================
//   // 1. TÁCH BẠCH CHUỖI VÀ NOTE SIÊU CHUẨN (Cân mọi định dạng)
//   // Bắt các trường hợp: 
//   // - "e-visa - note" (có gạch ngang)
//   // - "90 "note"" (chỉ có khoảng trắng liền trước ngoặc kép)
//   // =====================================================================
//   let baseStatus = status;
//   let noteContent = "";

//   const match = status.match(/(\s+-\s+|\s+(?=["']))/);
//   if (match && match.index !== undefined) {
//     baseStatus = status.substring(0, match.index).trim();
//     noteContent = status.substring(match.index + match[0].length).trim();
//     // Dọn dẹp sạch sẽ ngoặc kép bọc ngoài note
//     noteContent = noteContent.replace(/^["']+|["']+$/g, "").trim();
//   }

//   const s = baseStatus.toLowerCase();

//   // =====================================================================
//   // 2. LỌC CATEGORY (THỨ TỰ ƯU TIÊN TUYỆT ĐỐI)
//   // =====================================================================
//   let category: StatusCategory = "other";
  
//   // 🚀 ƯU TIÊN SỐ 1: Bắt đầu bằng SỐ -> Auto lụm thành Visa Free
//   if (/^\d+/.test(s)) {
//     category = "free";
//   } 
//   // 🚀 Nhóm Cấm / Hạn chế: Dùng \bban\b để KHÔNG bắt nhầm "Taliban", "Albania", "Lebanon"
//   else if (
//     s.includes('restricted') || s.includes('prohibited') || 
//     s.includes('no admission') || s.includes('noadmission') || 
//     s.includes('refused') || s.includes('suspended') || 
//     s.includes('banned') || /\bban\b/.test(s) || s.includes('covid')
//   ) {
//     category = "restricted";
//   } 
//   else if (s.includes('required') || s.includes('tourist card')) {
//     category = "required";
//   } 
//   else if (s.includes('arrival') || s === 'voa' || s.includes('e-voa')) {
//     category = "arrival";
//   } 
//   else if (s.includes('eta') || s.includes('electronic travel') || s.includes('electronic border')) {
//     category = "eta";
//   } 
//   else if (
//     s.includes('e-visa') || s.includes('evisa') || s.includes('e visa') || 
//     s.includes('electronic') || s.includes('online') || s.includes('smart service')
//   ) {
//     category = "evisa";
//   } 
//   else if (s.includes('free') || s.includes('not required') || s.includes('freedom')) {
//     category = "free";
//   } 
//   else {
//     category = "required"; // Mặc định an toàn nhất
//   }

//   // =====================================================================
//   // 3. FORMAT TEXT HIỂN THỊ LÊN UI SẠCH BÓNG
//   // =====================================================================
//   const isNumeric = /^\d+$/.test(baseStatus);
//   let displayText = baseStatus;

//   if (isNumeric && baseStatus === '1') {
//     displayText = "Home Country";
//   } else if (isNumeric) {
//     displayText = `Visa Free (${baseStatus} days)`;
//   } else if (category === "free") {
//     displayText = "Visa Free";
//   } else {
//     // Viết hoa chữ cái đầu cho đẹp (VD: "e-visa" -> "E-visa", "visa required" -> "Visa required")
//     displayText = baseStatus.charAt(0).toUpperCase() + baseStatus.slice(1);
//   }

//   return {
//     category,
//     displayText,
//     note: noteContent
//   };
// }

interface StatusMeta {
  key: StatusCategory;
  label: string;
  dot: string;
  chipBg: string;
  chipText: string;
  chipBorder: string;
}

const STATUS_META: StatusMeta[] = [
  { key: "free", label: "Visa Free", dot: "bg-emerald-400", chipBg: "bg-emerald-400/30", chipText: "text-emerald-500", chipBorder: "border-emerald-400/30" },
  { key: "arrival", label: "On Arrival", dot: "bg-amber-400", chipBg: "bg-amber-400/10", chipText: "text-amber-500", chipBorder: "border-amber-400/30" },
  { key: "eta", label: "ETA", dot: "bg-fuchsia-400", chipBg: "bg-fuchsia-400/10", chipText: "text-fuchsia-500", chipBorder: "border-fuchsia-400/30" },
  { key: "evisa", label: "eVisa", dot: "bg-blue-400", chipBg: "bg-blue-400/10", chipText: "text-blue-500", chipBorder: "border-blue-400/30" },
  { key: "required", label: "Required", dot: "bg-zinc-400", chipBg: "bg-zinc-400/70", chipText: "text-zinc-900", chipBorder: "border-zinc-400/80" },
  { key: "restricted", label: "Restricted", dot: "bg-rose-500", chipBg: "bg-rose-500/10", chipText: "text-rose-500", chipBorder: "border-rose-500/30" },
  { key: "other", label: "Other", dot: "bg-slate-400", chipBg: "bg-slate-400/10", chipText: "text-slate-400", chipBorder: "border-slate-400/30" },
];

const ALL_STATUSES_ON: Record<StatusCategory, boolean> = {
  home: true,
  free: true,
  arrival: true,
  eta: true,
  evisa: true,
  required: true,
  restricted: true,
  other: true,
};

// -----------------------------------------------------------------------------
// HELPER: sinh bảng màu theo theme
// -----------------------------------------------------------------------------
const getPalette = (theme: 'dark' | 'light') => {
  if (theme === 'light') {
    return {
      pageBg: "bg-[#F3F4F6]",        
      text: "text-[#0F172A]",        
      panelBg: "bg-white/80",        
      panelBgSolid: "bg-white",
      panelBorder: "border-[#E2E8F0]",
      hairline: "border-[#0F172A]/10",
      subtleBg: "bg-[#F8FAFC]",      
      subtleBorder: "border-[#E2E8F0]",
      muted: "text-[#64748B]",        
      mutedIcon: "text-[#94A3B8]",
      backBtnBg: "bg-white",
      backBtnBorder: "border-[#E2E8F0]",
      backBtnHoverBorder: "group-hover:border-[#94A3B8]",
      chartGrid: "rgba(15, 23, 42, 0.04)",
      chartTick: "#000000",
      chartCursor: "rgba(15, 23, 42, 0.08)",
      tooltipBg: "bg-[#0F172A]",      
      tooltipBorder: "border-[#0F172A]",
      statusColors: STATUS_COLORS_LIGHT,
      chip: "bg-[#F1F5F9] border-[#E2E8F0] text-[#475569]",
      rowHover: "hover:bg-[#dbdbdb]",
      arrowRing: "border-[#CBD5E1] bg-white text-[#0F172A]",
      mapBg: "bg-white",
      mapInnerBg: "bg-[#F8FAFC]",
      radialFrom: "from-[#0F172A]/[0.06]", 
      headerGradTo: "#0F172A",
    };
  }
  
  return {
    pageBg: "bg-[#050505]",        
    text: "text-[#FAFAFA]",        
    panelBg: "bg-[#121214]/70",    
    panelBgSolid: "bg-[#121214]",
    panelBorder: "border-white/[0.08]", 
    hairline: "border-white/[0.06]",    
    subtleBg: "bg-white/[0.03]",
    subtleBorder: "border-white/[0.05]",
    muted: "text-[#5a5a61]",        
    mutedIcon: "text-[#71717A]",
    backBtnBg: "bg-[#18181B]",
    backBtnBorder: "border-white/10",
    backBtnHoverBorder: "group-hover:border-white/30",
    chartGrid: "rgba(255,255,255,0.03)",
    chartTick: "#71717A",
    chartCursor: "rgba(255,255,255,0.15)",
    tooltipBg: "bg-[#18181B]",      
    tooltipBorder: "border-white/10",
    statusColors: STATUS_COLORS_DARK,
    chip: "bg-white/5 border-white/10 text-[#D4D4D8]", 
    rowHover: "hover:bg-white/[0.04]",
    arrowRing: "border-white/20 bg-white/10 text-white",
    mapBg: "bg-[#0C0C0E]",          
    mapInnerBg: "bg-[#050505]",
    radialFrom: "from-white/10",    
    headerGradTo: "#FAFAFA",
  };
};

// -----------------------------------------------------------------------------
// COMPONENTS PHỤ TRỢ
// -----------------------------------------------------------------------------
const SectionLabel = ({ children, muted }: { children: React.ReactNode; muted: string }) => (
  <h4 className={`text-[10px] font-bold uppercase tracking-[0.2em] ${muted} mb-3`}>
    {children}
  </h4>
);

const DataRow = ({ label, value, isMono = false, palette }: any) => (
  <div className={`flex justify-between items-baseline py-2.5 border-b ${palette.hairline} last:border-0`}>
    <span className={`text-sm ${palette.muted}`}>{label}</span>
    <span className={`text-sm ${palette.text} ${isMono ? "font-mono text-xs" : "font-medium"}`}>
      {value}
    </span>
  </div>
);

// -----------------------------------------------------------------------------
// COMPONENT CHÍNH
// -----------------------------------------------------------------------------
export function PassportDetailPage({ theme, setTheme }: PassportDetailPageProps) {
  const { iso } = useParams<{ iso: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const passportPower = location.state?.passportPower as RankingData | undefined;
  const palette = getPalette(theme);
  
  const [applyTarget, setApplyTarget] = React.useState<any | null>(null);
  const [chartMetric, setChartMetric] = React.useState<'mobility' | 'rank' | 'openness'>('mobility');

  // 🚀 TÍNH TOÁN DỮ LIỆU BIỂU ĐỒ TỪ HISTORY (NO MOCK DATA)
  const chartData = React.useMemo(() => {
    const historyData = (passportPower as any)?.history;

    if (historyData && Array.isArray(historyData) && historyData.length > 0) {
      const sorted = [...historyData].sort((a, b) => a.period.localeCompare(b.period));
      
      return sorted.map(h => ({
        period: h.period,      
        score: h.globalScore,  
        rank: h.rank,          
        opennessScore: h.opennessScore || 0 
      }));
    }

    return []; // Trả về mảng rỗng nếu chưa có dữ liệu lịch sử
  }, [passportPower]);

  // Cấu hình linh hoạt cho Recharts (Sử dụng mảng giá trị chuẩn của Recharts để tránh lỗi TS 2322)
  const chartConfig = React.useMemo(() => {
    switch (chartMetric) {
      case 'rank':
        return { 
          dataKey: 'rank', 
          reversed: true, 
          label: 'Global Rank', 
          domain: [1, 'dataMax + 1'] as [any, any]
        };
      case 'openness':
        return { 
          dataKey: 'opennessScore', 
          reversed: false, 
          label: 'Openness', 
          domain: [0, 'dataMax'] as [any, any] 
        };
      case 'mobility':
      default:
        return { 
          dataKey: 'score', 
          reversed: false, 
          label: 'Mobility Score', 
          domain: [0, 'dataMax + 5'] as [any, any] 
        };
    }
  }, [chartMetric]);

  const startPeriod = chartData.length > 0 ? chartData[0].period : "—";
  const endPeriod = chartData.length > 0 ? chartData[chartData.length - 1].period : "—";

  const rankFromState = (location.state as { rank?: number; score?: number } | null)?.rank;
  const scoreFromState = (location.state as { rank?: number; score?: number } | null)?.score;

  const { data: profile, loading, error } = useCountryProfile(iso ?? null);
  const { data: passportStatus, loading: destinationsLoading, error: destinationsError } = usePassportStatus(iso ?? null);

  const [activeStatuses, setActiveStatuses] = React.useState<Record<StatusCategory, boolean>>(ALL_STATUSES_ON);
  const toggleStatus = (key: StatusCategory) => {
    setActiveStatuses((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = React.useState("");
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 1000);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const col1Ref = React.useRef<HTMLDivElement>(null);
  const [col1Height, setCol1Height] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!col1Ref.current) return;
    const el = col1Ref.current;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCol1Height(entry.contentRect.height);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [profile]);

  const flagIso = (iso || profile?.iso2 || "").toLowerCase();

  // Parse destinations (NO MOCK DATA)
  const destinations = passportStatus?.destinations
    ? Object.entries(passportStatus.destinations).map(([destIso, rawStatus]) => ({
        iso: destIso.toLowerCase(),
        name: getCountryName(destIso),
        status: resolveStatusLabel(rawStatus as string),
        duration: "",
      }))
    : [];

  const filteredDestinations = React.useMemo(
    () => {
      const q = debouncedSearchQuery.trim().toLowerCase();
      return destinations.filter((d) => {
        // Dùng hàm parseDestinationStatus để lấy đúng category
        const category = parseDestinationStatus(d.status).category;
        const statusMatch = activeStatuses[category];
        const searchMatch = q === "" || d.name.toLowerCase().includes(q) || d.iso.toLowerCase().includes(q);
        return statusMatch && searchMatch;
      });
    },
    [destinations, activeStatuses, debouncedSearchQuery]
  );

  const filteredMapData = React.useMemo(() => {
    const data: Record<string, string> = {};
    destinations.forEach((d) => {
      const category = parseDestinationStatus(d.status).category;
      if (activeStatuses[category]) {
        data[d.iso] = d.status;
      }
    });
    return data;
  }, [destinations, activeStatuses]);

  const statusCounts = React.useMemo(() => {
    const counts: Record<StatusCategory, number> = { home: 0, free: 0, arrival: 0, eta: 0, evisa: 0, required: 0, restricted: 0, other: 0 };
    destinations.forEach((d) => {
      const category = parseDestinationStatus(d.status).category;
      counts[category] += 1;
    });
    return counts;
  }, [destinations]);

  const transition = { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };

  if (loading) {
    return (
      <div className={`w-full min-h-screen flex items-center justify-center ${palette.pageBg} ${palette.text}`}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className={`w-6 h-6 animate-spin ${palette.muted}`} />
          <span className={`text-sm ${palette.muted}`}>Loading passport profile…</span>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={`w-full min-h-screen flex items-center justify-center ${palette.pageBg} ${palette.text}`}>
        <div className="flex flex-col items-center gap-3 text-center px-6">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <span className="text-sm font-medium">Could not load this passport profile</span>
          {error && <span className={`text-xs ${palette.muted} font-mono`}>{error}</span>}
          <button
            onClick={() => navigate(-1)}
            className={`mt-2 text-sm px-4 py-2 rounded-full border ${palette.backBtnBorder} ${palette.backBtnBg} hover:opacity-80 transition-opacity`}
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const accentColor = profile.flag?.accentRaw || "#3b82f6";
  const memberships = Object.entries(profile.memberships ?? {})
    .filter(([, active]) => active)
    .map(([key]) => key.toUpperCase());

  const matchedHeightStyle: React.CSSProperties | undefined = col1Height
    ? { height: col1Height }
    : undefined;

  return (
    <div className={`w-full min-h-screen ${palette.pageBg} ${palette.text} flex flex-col font-sans transition-colors duration-500`}>

      {/* --- MAIN 3-COLUMN GRID --- */}
        <main className="grid grid-cols-1 lg:grid-cols-[18fr_46fr_30fr] items-start">

        {/* ========================================================= */}
        {/* COLUMN 1: IDENTITY & INFORMATION */}
        {/* ========================================================= */}
        <motion.section
          ref={col1Ref}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={transition}
          className={`${palette.panelBg} border ${palette.panelBorder} flex flex-col `}
        >
            <div className={`relative h-auto shrink-0 rounded-r-2xl flex items-center justify-center border-b ${palette.hairline} overflow-hidden`}>
            <div
              className="absolute inset-0 opacity-20 blur-[60px]"
              style={{ backgroundColor: accentColor }}
            />
                <img
                src={`/passport-images/${flagIso}.png`}
                alt={`${profile.nameCommon} Passport`}
                className="relative h-full shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)] border w-fit object-cover transition-transform duration-500 hover:scale-101"
                style={{
                    filter: `
                    drop-shadow(0px 0px 1px rgba(255,255,255,0.3))
                    drop-shadow(0px 20px 40px rgba(0,0,0,${theme === 'dark' ? 0.8 : 0.25}))
                    `,
                }}
                onError={(e) => {
                    e.currentTarget.src = "/passport-images/default.png";
                }}
                />
            </div>

            <div className="px-3 pt-2 flex-1 flex flex-col gap-4">
                <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h1 className="text-3xl font-playfair font-bold tracking-wide leading-tight"
                        style={{ 
                          color: profile.flag.accentRaw,
                        }}>
                          {profile.nameCommon}
                        </h1>
                        {profile.nativeOfficial && profile.nativeOfficial !== profile.nameCommon && (
                          <h2 className={`text-base ${palette.muted} italic leading-snug`}>
                            {profile.nativeOfficial} 
                          </h2>
                        )}
                      </div>
                        <span 
                          className={`fi fi-${flagIso} shrink-0 block text-5xl border border-gray-600 leading-none !bg-cover !bg-center rounded-xs `} 
                        />
                    </div>
                </div>

          {/* --- 1. THE POWER METRICS --- */}
            <div className={`flex items-center gap-8 py-2 border-y ${palette.hairline} mt-2`}>
              <div className="flex flex-col gap-1">
                <span className={`text-[10px] font-bold ${palette.muted} uppercase tracking-widest`}>Global Rank</span>
                <span 
                  className="text-3xl font-cinzel font-black tracking-tighter" 
                  style={{ color: profile.flag.accentRaw }}
                >
                  {passportPower?.rank != null ? `#${String(passportPower.rank).padStart(2, "0")}` : "—"}
                </span>
              </div>
              
              <div className={`w-px h-12 border-l ${palette.hairline}`} />
              
              <div className="flex flex-col gap-1">
                <span className={`text-[10px] font-bold ${palette.muted} uppercase tracking-widest`}>Mobility Score</span>
                <div className="flex items-baseline gap-1.5">
                  <span 
                    className="text-3xl font-cinzel font-black tracking-tighter" 
                    style={{ color: profile.flag.accentRaw }}
                  >
                    {passportPower?.globalScore != null ? passportPower.globalScore : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* --- 2. DATA LIST --- */}
            <div className="flex flex-col">
              
              {/* GEOGRAPHY */}
              <div className={`pb-2  border-b ${palette.hairline}`}>
                <div className="grid grid-cols-2 gap-y-2">
                  <div className="flex flex-col">
                    <span className={`text-[10px] ${palette.muted} uppercase tracking-widest mb-0.5`}>Capital</span>
                    <span className="text-sm">{profile.capital || "—"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[10px] ${palette.muted} uppercase tracking-widest mb-0.5`}>Region</span>
                    <span className="text-sm">{profile.region || "—"}{" •"} {profile.subregion}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[10px] ${palette.muted} uppercase tracking-widest mb-0.5`}>Population</span>
                    <span className="text-sm font-mono">{profile.population ? formatCompactNumber(profile.population) : "—"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[10px] ${palette.muted} uppercase tracking-widest mb-0.5`}>Area</span>
                    <span className="text-sm font-mono">{profile.areaKm2 ? `${profile.areaKm2.toLocaleString()} km²` : "—"}</span>
                  </div>
                </div>
              </div>

              {/* SOCIETY & ECONOMY */}
              <div className={`py-2 border-b ${palette.hairline}`}>
                <div className="grid grid-cols-2 gap-y-4">
                  
                  <div className="flex flex-col">
                    <span className={`text-[10px] ${palette.muted} uppercase tracking-widest mb-1.5`}>Languages</span>
                    <div className="flex flex-col gap-1.5">
                      {profile.languages?.length > 0 ? (
                        profile.languages.map((lang, idx) => (
                          <div key={idx} className="leading-none pr-1">
                            <span className="text-[13px] font-medium">{lang.native_name}</span>
                            {lang.name !== lang.native_name && (
                              <span className={`text-[11px] ${palette.muted} ml-1.5`}>· {lang.name}</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <span className={`text-sm ${palette.muted}`}>—</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <span className={`text-[10px] ${palette.muted} uppercase tracking-widest mb-1.5`}>Currency</span>
                    <div className="flex flex-col gap-1.5">
                      {profile.currencies?.length > 0 ? (
                        profile.currencies.map((curr, idx) => (
                          <div key={idx} className="leading-none flex items-center gap-1.5">
                            <span className="text-sm font-mono font-medium">{curr.code}</span>
                            <span className={`text-[11px] ${palette.muted} truncate`}>{"• "} 
                              <span 
                                className="shrink-0 inline-flex items-center justify-center min-w-[20px] px-1 h-5 rounded-full text-[15px] font-serif font-bold border"
                                style={{ 
                                  backgroundColor: `${profile.flag.accentRaw}`, 
                                  color: profile.flag.accentText,                 
                                  borderColor: `${profile.flag.accentRaw}`      
                                }}
                              >
                                {curr.symbol}
                              </span>
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className={`text-sm ${palette.muted}`}>—</span>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* ALLIANCES & MEMBERSHIPS */}
              <div className="py-2">
                <SectionLabel muted={palette.muted}>Geopolitics Organizations</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {memberships.length > 0 ? (
                    memberships.map((m) => (
                      <span
                        key={m}
                        className={`px-2 py-0.5 text-[13px] font-mono font-medium rounded border`}
                        style={{ 
                          borderColor: profile.flag.accentBorder, 
                          color: profile.flag.accentText,
                          backgroundColor: `${profile.flag.accentRaw}`
                        }}
                      >
                        {m}
                      </span>
                    ))
                  ) : (
                    <span className={`text-xs ${palette.muted}`}>—</span>
                  )}
                </div>
              </div>

            </div>
          </div>
        </motion.section>

        {/* ========================================================= */}
        {/* COLUMN 2: VISA MAP & TIMELINE GRAPH                       */}
        {/* ========================================================= */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transition, delay: 0.1 }}
          className="flex flex-col min-h-0"
          style={matchedHeightStyle}
        >
          <div style={{ flex: 1.1 }} className={`${palette.mapBg} border ${palette.panelBorder} relative overflow-hidden flex flex-col`}>
            
            <div className={`absolute inset-0 w-full h-full flex items-center justify-center ${palette.mapInnerBg}`}>
              <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] ${palette.radialFrom} to-transparent pointer-events-none z-0`} />
              
              <div className="w-full h-full z-0">
                <VisaMap destinationMap={filteredMapData} theme={theme} />
              </div>
            </div>
          </div>

          <div style={{ flex: 1 }} className={`${palette.mapBg} border ${palette.panelBorder} p-3 flex flex-col min-h-0`}>
            
            {/* --- HEADER & TOGGLE BUTTONS --- */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-2">
              <div>
                <h3 className="text-sm font-medium tracking-tight flex items-center gap-2">
                  <Activity className={`w-4 h-4 ${palette.mutedIcon}`} />
                  Passport Power Over Time 
                </h3>
              </div>
              
              {/* Nút Toggle dạng Minimalist Text (Có thanh ngăn cách |) */}
              <div className="flex items-center gap-2">
                {(['mobility', 'rank', 'openness'] as const).map((metric, index, array) => (
                  <React.Fragment key={metric}>
                    <button
                      onClick={() => setChartMetric(metric)}
                      className={`text-[11px] font-bold uppercase tracking-wider transition-colors duration-200 ${
                        chartMetric === metric 
                          ? `opacity-100` 
                          : `${palette.muted} opacity-60 hover:opacity-100`
                      }`}
                      // Áp dụng màu cờ cho tab đang active để tạo điểm nhấn nghệ thuật
                      style={chartMetric === metric ? { color: accentColor } : {}}
                    >
                      {metric}
                    </button>
                    
                    {/* Thanh ngăn cách | (Không in ở phần tử cuối cùng) */}
                    {index < array.length - 1 && (
                      <span className={`text-[11px] ${palette.muted} font-bold font-mono`}>
                        |
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* --- RECHARTS CONTAINER --- */}
            <div className="flex-1 min-h-0 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -25, bottom: 0 }}>
                    
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={accentColor} stopOpacity={theme === 'dark' ? 0.3 : 0.3} />
                        <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid 
                      vertical={true} 
                      horizontal={true} 
                      stroke={accentColor} 
                      strokeOpacity={theme === 'dark' ? 0.5 : 0.45} 
                      strokeDasharray="2 4" 
                    />
                    
                    <XAxis
                      dataKey="period"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: palette.chartTick, fontWeight: 500, fontSize: 10, opacity: 1, fontFamily: "'JetBrains Mono', 'Space Mono', monospace" }}
                      dy={10}
                    />

                    <YAxis 
                      domain={chartConfig.domain}
                      reversed={chartConfig.reversed} 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: palette.chartTick, fontWeight: 500, fontSize: 10, opacity: 1, fontFamily: "'JetBrains Mono', 'Space Mono', monospace" }}
                      dx={-10}
                    />

                    <RechartsTooltip
                      cursor={{ stroke: accentColor, strokeWidth: 1, strokeDasharray: "4 4", opacity: 0.4 }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className={`bg-amber-100/20 border ${palette.tooltipBorder} p-3 rounded-sm shadow-2xl z-50 relative backdrop-blur-md`}>
                              <p className={`text-[12px] font-sans text-gray-${theme === 'dark' ? '50' : '800'} mb-1.5 font-semibold uppercase tracking-wide`}>
                                Period: {data.period}
                              </p>
                              
                              {chartMetric === 'mobility' && (
                                <>
                                  <p className="text-lg font-bold">Mobility Score: <span style={{ color: accentColor }}>{data.score}</span></p>
                                  <p className={`text-xs ${palette.muted} mt-0.5`}>Rank: #{data.rank}</p>
                                </>
                              )}

                              {chartMetric === 'rank' && (
                                <>
                                  <p className="text-lg font-bold">Global Rank: <span style={{ color: accentColor }}>#{data.rank}</span></p>
                                  <p className={`text-xs ${palette.muted} mt-0.5`}>Score: {data.score}</p>
                                </>
                              )}

                              {chartMetric === 'openness' && (
                                <>
                                  <p className="text-lg font-bold">Openness: <span style={{ color: accentColor }}>{data.opennessScore}</span></p>
                                  <p className={`text-xs ${palette.muted} mt-0.5`}>Welcoming {data.opennessScore} passports</p>
                                </>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    
                    <Area
                      type="linear" 
                      dataKey={chartConfig.dataKey}
                      stroke={accentColor}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorScore)" 
                      dot={{ 
                        r: 4, 
                        fill: theme === 'dark' ? '#050505' : '#ffffff', 
                        stroke: accentColor, 
                        strokeWidth: 2 
                      }}
                      activeDot={{ 
                        r: 6, 
                        fill: accentColor, 
                        stroke: theme === 'dark' ? '#050505' : '#ffffff', 
                        strokeWidth: 2 
                      }}
                      isAnimationActive={true}
                      animationBegin={0}
                      animationDuration={600}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full w-full">
                  <span className={`text-sm ${palette.muted}`}>No historical data available.</span>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* ========================================================= */}
        {/* COLUMN 3: DESTINATION LIST — REAL DATA                    */}
        {/* ========================================================= */}
        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...transition, delay: 0.2 }}
          className={`${palette.mapBg} border ${palette.panelBorder} flex flex-col min-h-0 relative`}
          style={matchedHeightStyle}
        >
          {/* --- HEADER: tiêu đề kiểu editorial + legend màu có thể bật/tắt --- */}
          <div className={`shrink-0 p-5 backdrop-blur-md z-10 border-b ${palette.hairline}`}>
            <div className="flex items-center gap-2 mb-0.5">
              <Globe2 className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
              <h3
                className="text-[19px] font-cinzel font-black uppercase tracking-[0.04em] leading-none bg-clip-text text-transparent"
                style={{
                  color: `${accentColor}`,
                }}
              >
                Visa Requirements
              </h3>
            </div>
            <p className={`text-accent ${palette.muted} mb-4 pl-6`}>
              <span className="font-medium" style={{ color: accentColor }}>{profile.nameCommon}</span> passport ·{" "}
              {destinationsLoading
                ? "Loading…"
                : searchQuery !== debouncedSearchQuery
                ? "Searching…"
                : `${filteredDestinations.length} of ${destinations.length} destinations shown`}
                {destinationsError && !destinationsLoading && (
                  <span className="text-red-400"> · error loading data</span>
                )}
            </p>

            {/* Legend / toggle row */}
            <div className="flex flex-wrap gap-1.5">
              {STATUS_META.map((meta) => {
                const count = statusCounts[meta.key];
                if (count === 0) return null;
                const isActive = activeStatuses[meta.key];
                return (
                  <button
                    key={meta.key}
                    type="button"
                    onClick={() => toggleStatus(meta.key)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm border text-[10px] font-bold uppercase tracking-wide transition-all duration-200 ${
                      isActive
                        ? `${meta.chipBg} ${meta.chipText} ${meta.chipBorder}`
                        : `${palette.chip}`
                    }`}
                    title={isActive ? `Hide ${meta.label}` : `Show ${meta.label}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isActive ? meta.dot : "bg-current opacity-80"}`} />
                    {meta.label}
                    <span className="font-mono opacity-80">{count}</span>
                  </button>
                );
              })}
            </div>
            {/* Thanh tìm kiếm quốc gia */}
            <div className={`relative mt-3 flex items-center rounded-md border ${palette.subtleBorder} ${palette.subtleBg} transition-colors duration-200 focus-within:border-current`} style={{ color: searchQuery ? accentColor : undefined }}>
              <Search className={`w-3.5 h-3.5 ml-3 shrink-0 ${searchQuery ? "" : palette.mutedIcon}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search destination country…"
                className={`w-full bg-transparent py-2 px-2 text-sm ${palette.text} placeholder:${palette.muted} focus:outline-none`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className={`mr-2 shrink-0 rounded-full p-0.5 ${palette.muted} hover:opacity-70 transition-opacity`}
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            {destinationsLoading && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className={`w-5 h-5 animate-spin ${palette.muted}`} />
              </div>
            )}
            {!destinationsLoading && filteredDestinations.length === 0 && (
              <div className={`flex flex-col items-center justify-center py-14 gap-2 ${palette.muted}`}>
                <Globe2 className="w-5 h-5 opacity-50" />
                <span className="text-xs">                
                 {debouncedSearchQuery
                   ? `No destinations match "${debouncedSearchQuery}"`
                    : "No destinations match the active filters"}
                </span>
              </div>
            )}
            {!destinationsLoading && filteredDestinations.map((dest) => {
              const { category, displayText, note } = parseDestinationStatus(dest.status);
              
              // Nút chỉ tương tác nếu thuộc các nhóm này
              const isInteractive = ["evisa", "eta"].includes(category);
              
              return (
                <motion.div
                  key={dest.iso}
                  initial="rest"
                  whileHover={isInteractive ? "hover" : "rest"}
                  animate="rest"
                  className={`group relative grid grid-cols-2 items-center h-12 transition-colors duration-300 border border-b-slate-300 ${
                    isInteractive ? `cursor-pointer ${palette.rowHover}` : ""
                  }`}
                >
                  {/* CỘT 1: Cờ và Tên nước */}
                  <div className="flex items-center gap-3 overflow-hidden pr-2 pl-1">
                    <span className={`fi fi-${dest.iso} shrink-0 block text-3xl border border-gray-600 leading-none !bg-cover !bg-center rounded-xs`} />
                    <span className="text-base font-semibold font-playfair tracking-tight truncate">{dest.name}</span>
                  </div>

                  {/* CỘT 2: Trạng thái Visa / CTA */}
                  <div 
                    className={`relative h-full w-full flex items-center justify-between overflow-hidden transition-all duration-500 ${(() => {
                      // Bắt màu siêu ngắn gọn dựa trên Category
                      switch(category) {
                        case "free": return "bg-emerald-300 text-emerald-900 border-emerald-400";
                        case "arrival": return "bg-amber-300 text-amber-950 border-amber-400";
                        case "eta": return "bg-fuchsia-300 text-fuchsia-950 border-fuchsia-400";
                        case "evisa": return "bg-blue-300 text-blue-950 border-blue-400";
                        case "required": return "bg-gray-300 text-gray-900 border-gray-400";
                        case "restricted": return "bg-rose-400 text-rose-950 border-rose-400";
                        default: return "bg-slate-300 text-slate-900 border-slate-400";
                      }
                    })()}`}
                    // Gắn Note vào object để màn hình khác xài
                    onClick={() => isInteractive && setApplyTarget({ ...dest, extractedNote: note })}
                  >
                    
                    {/* Lớp nền TRƯỢT QUA KHI HOVER */}
                    {isInteractive && (
                      <motion.div
                        variants={{ rest: { x: "100%", opacity: 0 }, hover: { x: "0%", opacity: 1 } }}
                        transition={{ type: "spring", stiffness: 250, damping: 25 }}
                        className={`absolute inset-0 z-20 px-4 flex items-center justify-between ${(() => {
                          switch(category) {
                            case "eta": return "bg-purple-500 text-white";
                            case "evisa": return "bg-blue-500 text-white";
                            default: return "bg-emerald-500 text-white";
                          }
                        })()}`}
                      >
                        <span className="text-[13px] font-semibold uppercase tracking-wide flex items-center gap-2 drop-shadow-md">
                          Apply Now
                          <motion.div animate={{ x: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
                            <Plane className="w-4 h-4 fill-white/20 rotate-45 transform origin-center" />
                          </motion.div>
                        </span>
                        <ArrowRight strokeWidth={3} size={16} className="drop-shadow-sm" />
                      </motion.div>
                    )}

                    {/* NỘI DUNG TĨNH: Gọi đúng biến displayText sạch bóng */}
                    <div className="relative z-10 flex items-center justify-between w-full px-3">
                      <span className="text-[12px] font-black tracking-tight uppercase drop-shadow-sm">
                        {displayText}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        {dest.duration && (
                          <span className="bg-white/60 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold tracking-wider">
                            {dest.duration}
                          </span>
                        )}
                        {isInteractive && <ChevronRight size={20} strokeWidth={3} className="opacity-60" />}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

      </main>
      
      {/* ========================================================= */}
      {/* APPLY MODAL */}
      {/* ========================================================= */}
      <AnimatePresence>
        {applyTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 overscroll-contain"
            onClick={() => setApplyTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[420px] bg-white dark:bg-[#121214] border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <button 
                onClick={() => setApplyTarget(null)}
                className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={18} />
              </button>

              <div className="p-6 pb-4 border-b border-zinc-100 dark:border-white/[0.06]">
                <div className="flex items-center gap-3 mb-1">
                  <span className={`fi fi-${applyTarget.iso} text-2xl rounded-sm overflow-hidden shadow-sm`} />
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 font-playfair tracking-tight">
                    {applyTarget.name}
                  </h3>
                </div>
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400 font-medium tracking-wide">
                  Select your preferred method to apply for <span className="font-bold text-zinc-700 dark:text-zinc-300">{applyTarget.status}</span>.
                </p>
              </div>

              <div className="p-4 flex flex-col gap-3">
                <a 
                  href={`https://www.google.com/search?q=${encodeURIComponent(`${applyTarget.name} official ${applyTarget.status} application portal`)}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex gap-4 p-4 rounded-xl border border-zinc-400 dark:border-white/10 hover:border-zinc-600 dark:hover:border-white/20 bg-zinc-100/90 dark:bg-white/[0.02] hover:bg-zinc-200/80 dark:hover:bg-white/[0.04] transition-all"
                >
                  <div className="shrink-0 mt-0.5">
                    <Landmark size={22} strokeWidth={1.5} className="text-emerald-600 dark:text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      Official {
                        applyTarget.status.includes("ETA") || applyTarget.status.includes("Electronic") 
                          ? "ETA" 
                          : applyTarget.status.replace(" Required", "")
                      } Portal
                    </h4>
                    <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                      Standard processing. Apply directly through the {applyTarget.name} government portal at officially established fees.
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center">
                    <ExternalLink size={16} className="text-zinc-400 dark:text-zinc-800 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors" />
                  </div>
                </a>

                <a 
                  href={`https://www.ivisa.com/?affiliate=hau_borderless_demo`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex gap-4 p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 hover:border-blue-300 dark:hover:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                >
                  <div className="shrink-0 mt-0.5">
                    <Zap size={22} strokeWidth={1.5} className="text-blue-600 dark:text-blue-400 fill-blue-600/10 dark:fill-blue-400/10" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[14px] font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                      iVisa Premium Service
                    </h4>
                    <p className="text-[12px] text-blue-700/70 dark:text-blue-300/70 mt-1 leading-relaxed">
                      Fast-tracked {
                        applyTarget.status.includes("ETA") || applyTarget.status.includes("Electronic") 
                          ? "ETA" 
                          : "Visa"
                      } application with 24/7 expert support. Additional service fee applies.
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center">
                    <ExternalLink size={16} className="text-blue-300 dark:text-blue-800 group-hover:text-blue-500 dark:group-hover:text-blue-500 transition-colors" />
                  </div>
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 0px;
          background: transparent;
        }
      `}</style>
    </div>
  );
}

// -----------------------------------------------------------------------------
// UTIL
// -----------------------------------------------------------------------------
function formatCompactNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}