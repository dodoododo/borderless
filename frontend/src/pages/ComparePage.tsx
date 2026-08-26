import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart2, 
  TableProperties, 
  ChevronDown, 
  Plane, 
  X, 
  Landmark, 
  ExternalLink, 
  Zap,
  Loader2 , ArrowRight, Search
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip 
} from "recharts";

// --- IMPORTS TỪ SOURCE CỦA BÁC ---
import { RankingService } from "../api/ranking.api";
import { fetchPassportStatus } from "../api/passport.api";
import { resolveStatusLabel } from "../types/visa.type";
import type { RankingData } from "../types/ranking.type";
import { parseDestinationStatus, type StatusCategory } from "../utils/visaParser";


const CHART_COLORS = ["#059669", "#2563eb", "#d97706", "#7c3aed", "#e11d48"];

// Helper: Dịch mã ISO thành Tên quốc gia
const getCountryName = (isoCode: string) => {
  if (!isoCode) return "";
  try {
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return regionNames.of(isoCode.toUpperCase()) || isoCode.toUpperCase();
  } catch (error) {
    return isoCode.toUpperCase();
  }
};

export function ComparePage() {
  const [viewMode, setViewMode] = useState<"table" | "chart">("table");
  const [chartMetric, setChartMetric] = useState<"mobility" | "rank" | "openness">("mobility");
  
  // Trạng thái load dữ liệu tổng
  const [isGlobalLoading, setIsGlobalLoading] = useState(true);
  
  // Danh sách toàn bộ ranking data
  const [allRankings, setAllRankings] = useState<RankingData[]>([]);
  
  // ĐÃ FIX TS: Khai báo mảng rõ ràng (string | null)[]
  const [selectedPassports, setSelectedPassports] = useState<(string | null)[]>([null, null, null, null, null]);
  
  // Cache data visa detail
  const [visaDataMap, setVisaDataMap] = useState<Record<string, Record<string, string>>>({});
  
  // Loading state riêng cho từng cột
  const [loadingCols, setLoadingCols] = useState<Record<string, boolean>>({});
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [dropdownSearch, setDropdownSearch] = useState("");

  // Target cho modal Apply
  const [applyTarget, setApplyTarget] = useState<{ iso: string; name: string; status: string; fromPassport: string; extractedNote?: string; } | null>(null);

  // 1. FETCH GLOBAL RANKING 
  useEffect(() => {
    const loadGlobalData = async () => {
      try {
        setIsGlobalLoading(true);
        const data = await RankingService.getGlobalRanking();
        const sorted = data.sort((a, b) => getCountryName(a.iso).localeCompare(getCountryName(b.iso)));
        setAllRankings(sorted);
      } catch (error) {
        console.error("Failed to load global rankings", error);
      } finally {
        setIsGlobalLoading(false);
      }
    };
    loadGlobalData();
  }, []);

  // 2. XỬ LÝ CHỌN PASSPORT & FETCH VISA STATUS
  const handleSelectPassport = async (index: number, iso: string) => {
    const newSelected = [...selectedPassports];
    newSelected[index] = iso === "" ? null : iso.toLowerCase();
    setSelectedPassports(newSelected);

    if (iso && !visaDataMap[iso.toLowerCase()]) {
      const targetIso = iso.toLowerCase();
      try {
        setLoadingCols(prev => ({ ...prev, [targetIso]: true }));
        const res = await fetchPassportStatus(targetIso);
        
        if (res && res.destinations) {
          const normalizedDestinations: Record<string, string> = {};
          Object.entries(res.destinations).forEach(([destIso, status]) => {
            normalizedDestinations[destIso.toLowerCase()] = status;
          });
          
          setVisaDataMap(prev => ({ ...prev, [targetIso]: normalizedDestinations }));
        }
      } catch (error) {
        console.error(`Lỗi fetch visa cho ${targetIso}`, error);
      } finally {
        setLoadingCols(prev => ({ ...prev, [targetIso]: false }));
      }
    }
  };

  const handleRemovePassport = (index: number) => {
    const newSelected = [...selectedPassports];
    newSelected[index] = null;
    setSelectedPassports(newSelected);
  };

  // 3. CHUẨN BỊ DỮ LIỆU BIỂU ĐỒ (CHART)
  const chartData = useMemo(() => {
    const periodsSet = new Set<string>();
    
    selectedPassports.forEach(iso => {
      if (iso) {
        const ranking = allRankings.find(r => r.iso.toLowerCase() === iso);
        if (ranking && ranking.history) {
          ranking.history.forEach(h => periodsSet.add(h.period));
        }
      }
    });

    const sortedPeriods = Array.from(periodsSet).sort();

    return sortedPeriods.map(period => {
      const dataPoint: any = { period };
      selectedPassports.forEach(iso => {
        if (iso) {
          const ranking = allRankings.find(r => r.iso.toLowerCase() === iso);
          const historyRecord = ranking?.history?.find(h => h.period === period);
          if (historyRecord) {
            dataPoint[iso] = chartMetric === "mobility" ? historyRecord.globalScore 
                           : chartMetric === "rank" ? historyRecord.rank 
                           : historyRecord.opennessScore;
          }
        }
      });
      return dataPoint;
    });
  }, [selectedPassports, allRankings, chartMetric]);

  // 4. HELPER: TRẠNG THÁI MÀU SẮC DỰA TRÊN CHUỖI GỐC
  const getStatusColor = (rawStatus: string) => {
    const s = rawStatus.toLowerCase();
    if (s.includes("home") || s === "-1") return "bg-indigo-200 text-indigo-900 border-indigo-400";
    if (s.includes("free") || !isNaN(Number(s))) return "bg-emerald-200 text-emerald-900 border-emerald-400";
    if (s.includes("arrival")) return "bg-amber-200 text-amber-900 border-amber-400";
    if (s.includes("eta") || s.includes("evisa") || s.includes("electronic")) return "bg-blue-500 text-blue-900 border-blue-400";
    if (s.includes("required")) return "bg-slate-200 text-slate-800 border-slate-400";
    if (s.includes("ban") || s.includes("restricted") || s.includes("no admission")) return "bg-rose-300 text-rose-950 border-rose-500";
    return "bg-gray-100 text-gray-800 border-gray-300";
  };

  return (
    <div className="bg-[#fafafa] dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-500/30">
      <div className="mx-auto">
        
        {/* HEADER SECTION */}
        <header className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 px-4 md:px-0">
          <div className="flex flex-col gap-1 md:gap-3 md:ml-5">
            {/* 2. Tiêu đề chính (Font Playfair, nhấn mạnh chữ Passports) */}
            <h1 
              className="text-3xl md:text-[46px] font-bold tracking-tight text-slate-900 dark:text-white leading-none" 
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Compare <span className="italic text-emerald-600 dark:text-emerald-500">Passports</span>.
            </h1>
            
            {/* 3. Description giãn dòng mềm mại */}
            <p className="text-[13px] md:text-[15px] text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed mt-1 md:mt-1 font-medium">
              Select up to 5 passports to compare visa requirements globally or view historical mobility trends side-by-side.
            </p>
          </div>
          
          {/* VIEW TOGGLES */}
          <div className="flex items-center gap-3 shrink-0 md:mr-5 mt-2 md:mt-0">
            {/* Nút GRID */}
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
                viewMode === "table" 
                  ? "text-emerald-600 dark:text-emerald-500 opacity-100" 
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-500 dark:hover:text-slate-800 hover:opacity-100"
              }`}
            >
              <TableProperties size={14} className={viewMode === "table" ? "stroke-[2.5]" : "stroke-2"} /> 
              Grid
            </button>
            
            {/* DẤU NGĂN CÁCH | */}
            <span className="text-slate-500 dark:text-zinc-700 font-mono font-bold text-sm -mt-0.5">
              |
            </span>
            
            {/* Nút CHART VIEW */}
            <button
              onClick={() => setViewMode("chart")}
              className={`flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
                viewMode === "chart" 
                  ? "text-emerald-600 dark:text-emerald-500 opacity-100" 
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:opacity-100"
              }`}
            >
              <BarChart2 size={14} className={viewMode === "chart" ? "stroke-[2.5]" : "stroke-2"} /> 
              Chart View
            </button>
          </div>
        </header>

        {isGlobalLoading ? (
          <div className="flex flex-col items-center justify-center py-32 opacity-60">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
            <span className="text-sm font-bold uppercase tracking-widest text-slate-500">Loading Datasets...</span>
          </div>
        ) : (
          <>
            {/* ========================================= */}
            {/* VIEW: TABLE (GRID)                        */}
            {/* ========================================= */}
            {viewMode === "table" && (
              <div className="bg-white dark:bg-[#121212] border-y md:border-x md:border border-slate-500 dark:border-zinc-800 md:rounded-sm shadow-sm overflow-x-auto overflow-y-auto custom-scrollbar max-h-[calc(100dvh-120px)] md:max-h-[calc(100dvh)] relative">
                <div className="min-w-fit md:min-w-[900px]">
                  
                  {/* STICKY HEADER (PASSPORT SELECTORS) */}
                  <div className="sticky top-0 z-20 flex bg-slate-100 dark:bg-zinc-900 border-b border-slate-500 dark:border-zinc-800 shadow-sm">
                    {/* Destination Column Header */}
                    <div className="w-36 md:w-60 shrink-0 p-3 md:p-4 border-r border-slate-500 dark:border-zinc-800 flex items-center justify-start bg-slate-100 dark:bg-zinc-900">
                        <span className="text-sm md:text-xl font-bold uppercase tracking-widest text-slate-500">Destination</span>
                    </div>
                    
                    {/* 5 Cột: Passport Selectors (Custom Dropdown) */}
                    {selectedPassports.map((iso, index) => {
                      const isOpen = openDropdown === index;

                      // Lọc danh sách quốc gia dựa trên ô search
                      const filteredRankings = allRankings.filter(r => 
                        getCountryName(r.iso).toLowerCase().includes(dropdownSearch.toLowerCase())
                      );

                      return (
                        <div key={index} className="flex-1 min-w-[130px] md:min-w-40 p-2 md:p-3 border-r last:border-0 border-slate-500 dark:border-zinc-800 relative bg-slate-100 dark:bg-zinc-900 z-30">
                          {iso && (
                            <button 
                              onClick={() => handleRemovePassport(index)}
                              className="absolute top-1 md:top-2 right-1 md:right-2 p-1 text-slate-400 hover:text-rose-500 transition-colors z-10"
                            >
                              <X className="w-3 h-3 md:w-3.5 md:h-3.5" strokeWidth={3} />
                            </button>
                          )}
                          
                          <label className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 md:mb-1.5 flex items-center gap-1.5 md:gap-2">
                            Passport {index + 1}
                            {iso && loadingCols[iso] && <Loader2 className="w-2.5 h-2.5 md:w-3 md:h-3 animate-spin text-emerald-500" />}
                          </label>
                          
                          {/* KHỐI CUSTOM DROPDOWN */}
                          <div className="relative">
                            
                            {/* 1. NÚT TRIGGER (Hiện Cờ + Tên Nước đã chọn) */}
                            <button
                              onClick={() => {
                                setOpenDropdown(isOpen ? null : index);
                                setDropdownSearch(""); // Reset thanh search mỗi khi đóng/mở
                              }}
                              className={`w-full flex items-center justify-between bg-white dark:bg-zinc-800 border ${isOpen ? 'border-emerald-500 shadow-sm' : 'border-slate-300 dark:border-zinc-700'} rounded-sm py-1.5 px-2 md:py-2 md:px-3 transition-all duration-200 focus:outline-none`}
                            >
                              {iso ? (
                                <div className="flex items-center gap-2 md:gap-2.5 overflow-hidden">
                                  <span className={`fi fi-${iso.toLowerCase()} shrink-0 block text-lg md:text-2xl border border-gray-500 dark:border-gray-600 leading-none !bg-cover !bg-center shadow-sm`} />
                                  <span className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate font-playfair tracking-tight">
                                    {getCountryName(iso)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[11px] md:text-sm text-slate-400 font-medium">-- Select --</span>
                              )}
                              <ChevronDown className={`w-3 h-3 md:w-3.5 md:h-3.5 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-emerald-500' : ''}`} />
                            </button>

                            {/* 2. MENU OPTIONS (Danh sách nước có Search) */}
                            <AnimatePresence>
                              {isOpen && (
                                <>
                                  {/* Lớp Overlay vô hình để bắt sự kiện click ra ngoài thì đóng menu */}
                                  <div className="fixed inset-0 z-40" onClick={() => { setOpenDropdown(null); setDropdownSearch(""); }} />
                                  
                                  <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    transition={{ duration: 0.15, ease: "easeOut" }}
                                    className="absolute top-full left-0 mt-1.5 w-[200px] md:w-full md:min-w-[220px] bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-xl rounded-sm z-50 overflow-hidden flex flex-col"
                                  >
                                    {/* THANH TÌM KIẾM CỐ ĐỊNH TRÊN ĐỈNH MENU */}
                                    <div className="p-1.5 md:p-2 border-b border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800">
                                      <div className="relative">
                                        <Search className="absolute left-2 md:left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3 md:w-3.5 md:h-3.5" />
                                        <input
                                          type="text"
                                          placeholder="Search country..."
                                          value={dropdownSearch}
                                          onChange={(e) => setDropdownSearch(e.target.value)}
                                          autoFocus 
                                          className="w-full bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-600 rounded-sm py-1.5 md:py-1.5 pl-6 md:pl-8 pr-2 md:pr-3 text-[11px] md:text-sm focus:outline-none focus:border-emerald-500 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 transition-colors"
                                        />
                                      </div>
                                    </div>

                                    {/* DANH SÁCH TÙY CHỌN */}
                                    <div className="max-h-[220px] md:max-h-[260px] overflow-y-auto custom-scrollbar p-1 md:p-1.5 flex flex-col gap-0.5">
                                      
                                      <button
                                        onClick={() => { handleSelectPassport(index, ""); setOpenDropdown(null); setDropdownSearch(""); }}
                                        className="w-full text-left px-2 md:px-3 py-1.5 md:py-2 text-[11px] md:text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-700/50 rounded-sm transition-colors font-medium"
                                      >
                                        -- Remove Selection --
                                      </button>

                                      {filteredRankings.length === 0 ? (
                                        <div className="px-3 py-4 text-center text-[11px] md:text-sm text-slate-400">
                                          No countries found.
                                        </div>
                                      ) : (
                                        filteredRankings.map(r => {
                                          const rIso = r.iso.toLowerCase();
                                          const isDisabled = selectedPassports.includes(rIso) && rIso !== iso;
                                          const isSelected = rIso === iso;

                                          return (
                                            <button
                                              key={rIso}
                                              disabled={isDisabled}
                                              onClick={() => { handleSelectPassport(index, rIso); setOpenDropdown(null); setDropdownSearch(""); }}
                                              className={`w-full flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1.5 md:py-2 text-[11px] md:text-sm rounded-sm transition-all duration-200 ${
                                                isDisabled
                                                  ? 'opacity-40 cursor-not-allowed bg-slate-50/50 dark:bg-zinc-900/30'
                                                  : isSelected
                                                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                                  : 'hover:bg-slate-100 dark:hover:bg-zinc-700/60 text-slate-700 dark:text-slate-300'
                                              }`}
                                            >
                                              <span className={`fi fi-${rIso.toLowerCase()} shrink-0 block text-lg md:text-2xl border border-gray-500 dark:border-gray-600 leading-none !bg-cover !bg-center shadow-sm`} />
                                              <span className={`truncate text-left ${isSelected ? 'font-bold' : 'font-medium font-playfair'}`}>
                                                {getCountryName(rIso)}
                                              </span>
                                            </button>
                                          )
                                        })
                                      )}
                                    </div>
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>

                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* TABLE BODY (DESTINATION ROWS) */}
                  <div className="flex flex-col border-t border-slate-200 dark:border-zinc-800">
                    {allRankings.map((destRanking) => {
                      const destIso = destRanking.iso.toLowerCase();
                      const destName = getCountryName(destIso);

                      return (
                        <div key={destIso} className="flex border-b border-slate-500 dark:border-zinc-800 hover:bg-slate-300/80 dark:hover:bg-zinc-800/40 transition-colors items-stretch">
                          
                          {/* CỘT 1: CỜ VÀ TÊN NƯỚC (Theo style nghệ thuật cũ) */}
                          <div className="w-36 md:w-60 shrink-0 p-2 md:p-3 border-r border-slate-500 dark:border-zinc-800 flex items-center gap-2 md:gap-3 overflow-hidden">
                            <span className={`fi fi-${destIso} shrink-0 block text-[20px] md:text-[28px] border border-gray-400 dark:border-gray-600 leading-none !bg-cover !bg-center rounded-xs shadow-sm`} />
                            <span className="text-[12px] md:text-[15px] font-semibold font-playfair tracking-tight truncate dark:text-slate-100">
                              {destName}
                            </span>
                          </div>

                          {/* CÁC CỘT VISA STATUS (Tái sinh Animation cũ) */}
                          {/* CÁC CỘT VISA STATUS (Đã tích hợp hàm Parse chuẩn) */}
                          {selectedPassports.map((iso, index) => {
                            if (!iso) {
                              return <div key={index} className="flex-1 min-w-[130px] md:min-w-40 border-r last:border-0 border-slate-500 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30" />;
                            }

                            if (loadingCols[iso]) {
                              return (
                                <div key={index} className="flex-1 min-w-[130px] md:min-w-40 p-2 md:p-3 border-r last:border-0 border-slate-200 dark:border-zinc-800 flex items-center justify-center">
                                  <div className="h-1.5 md:h-2 w-8 md:w-12 bg-slate-200 dark:bg-zinc-700 rounded-sm animate-pulse" />
                                </div>
                              );
                            }

                            const destMap = visaDataMap[iso];
                            const rawStatus = destMap ? destMap[destIso] : undefined;
                            
                            // Trạng thái trống (VD: Database chưa có thông tin)
                            if (!rawStatus) {
                              return (
                                <div key={index} className="flex-1 min-w-[130px] md:min-w-40 p-2 md:p-3 border-r last:border-0 border-slate-200 dark:border-zinc-800 flex items-center ">
                                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400 pl-2">-</span>
                                </div>
                              );
                            }

                            // XỬ LÝ TRẠNG THÁI "QUÊ NHÀ" (-1)
                            const isHome = rawStatus.trim() === "-1";
                            
                            // 🚀 GỌI HÀM PARSE CHUẨN (Đồng bộ với hệ thống)
                            const { category, displayText, note } = isHome 
                              ? { category: "home", displayText: "Home Country", note: "" }
                              : parseDestinationStatus(rawStatus);

                            // Chỉ cho phép click Apply Now với eVisa và ETA
                            const isInteractive = ["evisa", "eta"].includes(category);
                            
                            // Bộ màu nền Solid (Theo Category chuẩn)
                            const getCellBg = () => {
                              switch(category) {
                                case "home": return "bg-pink-300 dark:bg-pink-200 text-indigo-950";
                                case "free": return "bg-emerald-300 dark:bg-emerald-400/90 text-emerald-950";
                                case "arrival": return "bg-amber-300 dark:bg-amber-400/90 text-amber-950";
                                case "eta": return "bg-fuchsia-300 dark:bg-fuchsia-400/90 text-fuchsia-950"; 
                                case "evisa": return "bg-blue-200 dark:bg-blue-300 text-blue-950";
                                case "required": return "bg-gray-300 dark:bg-gray-400/90 text-gray-900";
                                case "restricted": return "bg-rose-400 dark:bg-rose-500/90 text-rose-950";
                                default: return "bg-slate-300 dark:bg-slate-400/90 text-slate-900";
                              }
                            };

                            // Bộ màu nền khi trượt Hover
                            const getHoverBg = () => {
                              switch(category) {
                                case "eta": return "bg-purple-500 text-white";
                                case "evisa": return "bg-blue-500 text-white";
                                default: return "bg-emerald-500 text-white"; // Fallback an toàn
                              }
                            };

                            return (
                              <motion.div
                                key={index}
                                initial="rest"
                                whileHover={isInteractive ? "hover" : "rest"}
                                animate="rest"
                                // Đẩy cả thông tin Ghi chú (note) vào ApplyTarget Modal
                                onClick={() => isInteractive && setApplyTarget({ 
                                  iso: destIso, 
                                  name: destName, 
                                  status: displayText, 
                                  fromPassport: getCountryName(iso),
                                  extractedNote: note 
                                })}
                                className={`flex-1 min-w-[130px] md:min-w-40 border-r border-slate-500 dark:border-zinc-700 last:border-r-0 relative flex items-center justify-between overflow-hidden transition-colors duration-300 ${getCellBg()} ${isInteractive ? 'cursor-pointer' : ''}`}
                              >
                                {/* LỚP NỀN TRƯỢT KHI HOVER */}
                                {isInteractive && (
                                  <motion.div
                                    variants={{
                                      rest: { x: "100%", opacity: 0 },
                                      hover: { x: "0%", opacity: 1 },
                                    }}
                                    transition={{ type: "spring", stiffness: 250, damping: 25 }}
                                    className={`absolute inset-0 z-20 px-2 md:px-3 flex items-center justify-between ${getHoverBg()}`}
                                  >
                                    <span className="text-[10px] md:text-[12px] font-semibold uppercase tracking-wide flex items-center gap-1 md:gap-1.5 drop-shadow-md">
                                      Apply Now
                                      <motion.div 
                                        className="flex items-center justify-center"
                                        animate={{ x: [0, 4, 0] }} 
                                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                      >
                                        <Plane className="w-3 h-3 md:w-3.5 md:h-3.5 fill-white/20 rotate-45 transform origin-center" />
                                      </motion.div>
                                    </span>
                                    <ArrowRight strokeWidth={3} className="w-3 h-3 md:w-3.5 md:h-3.5 drop-shadow-sm shrink-0" />
                                  </motion.div>
                                )}

                                {/* NỘI DUNG TĨNH (Sử dụng displayText đã được filter sạch bóng) */}
                                <div className="relative z-10 flex items-center justify-between w-full px-2 py-1.5 md:px-3 md:py-2">
                                  <span className="text-[10px] md:text-[11px] font-black tracking-tight uppercase drop-shadow-sm truncate pr-1 md:pr-2">
                                    {displayText}
                                  </span>
                                  
                                  {isInteractive && (
                                    <ChevronDown strokeWidth={3} className="w-3 h-3 md:w-3.5 md:h-3.5 opacity-50 shrink-0 -rotate-90" />
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================= */}
            {/* VIEW: CHART                               */}
            {/* ========================================= */}
            {viewMode === "chart" && (
              <div className="bg-white dark:bg-[#121212] border border-slate-300 dark:border-zinc-800 md:rounded-sm shadow-sm p-4 md:p-6 mx-4 md:mx-0">
                
                {/* Toggles Metric */}
                <div className="flex items-center flex-wrap gap-2 md:gap-4 border-b border-slate-200 dark:border-zinc-800 pb-3 md:pb-4 mb-4 md:mb-8">
                  <span className="text-xs md:text-sm font-bold uppercase tracking-widest text-slate-600">Metric:</span>
                  
                  {(['mobility', 'rank', 'openness'] as const).map((metric, index, array) => (
                    <React.Fragment key={metric}>
                      <button
                        onClick={() => setChartMetric(metric)}
                        className={`text-xs md:text-sm font-bold uppercase tracking-wide transition-colors ${
                          chartMetric === metric 
                            ? 'text-emerald-600 dark:text-emerald-500' 
                            : 'text-slate-600 hover:text-slate-800 dark:hover:text-slate-900'
                        }`}
                      >
                        {metric} 
                      </button>
                      
                      {/* Thêm dấu | ở giữa, bỏ qua phần tử cuối cùng */}
                      {index < array.length - 1 && (
                        <span className="text-slate-300 dark:text-zinc-700 font-mono font-bold text-sm hidden md:inline">
                          |
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Recharts Area */}
                {selectedPassports.filter(Boolean).length === 0 ? (
                  <div className="h-64 md:h-[400px] flex items-center justify-center border border-dashed border-slate-300 dark:border-zinc-700 rounded-sm p-4 text-center">
                    <span className="text-sm md:text-base text-slate-500 font-medium">Select at least one passport in the Data Grid to view charts.</span>
                  </div>
                ) : (
                  <div className="h-[300px] md:h-[450px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#929ba6" strokeOpacity={0.9} />
                        <XAxis 
                          dataKey="period" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }} 
                          dy={10} 
                        />
                        <YAxis 
                          reversed={chartMetric === 'rank'}
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }} 
                        />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '4px', padding: '10px md:12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          itemStyle={{ fontSize: '11px md:13px', fontWeight: 600, color: '#1e293b' }}
                          labelStyle={{ fontSize: '10px md:11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px' }}
                        />
                        
                        {/* Render Lines dynamically */}
                        {selectedPassports.map((iso, index) => {
                          if (!iso) return null;
                          return (
                            <Line 
                              key={iso}
                              type="linear" 
                              dataKey={iso} 
                              name={getCountryName(iso)}
                              stroke={CHART_COLORS[index]} 
                              strokeWidth={3}
                              dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}
                              activeDot={{ r: 5, strokeWidth: 0, fill: CHART_COLORS[index] }}
                            />
                          );
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                
                {/* Chart Legend Custom */}
                {selectedPassports.filter(Boolean).length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 mt-6 md:mt-8">
                    {selectedPassports.map((iso, index) => {
                      if (!iso) return null;
                      return (
                        <div key={iso} className="flex items-center gap-1.5 md:gap-2">
                          <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm" style={{ backgroundColor: CHART_COLORS[index] }} />
                          <span className="text-[11px] md:text-sm font-semibold">{getCountryName(iso)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ========================================================= */}
      {/* APPLY MODAL */}
      {/* ========================================================= */}
      <AnimatePresence>
        {applyTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
            onClick={() => setApplyTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[90vw] md:max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-sm shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-start p-4 md:p-5 border-b border-slate-100 dark:border-zinc-800">
                <div>
                  <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2">
                    <span className={`fi fi-${applyTarget.iso.toLowerCase()} shrink-0 block text-xl md:text-2xl  border border-gray-400 dark:border-gray-600 leading-none !bg-cover !bg-center rounded-sm shadow-sm`} />
                    <h3 className="text-lg md:text-xl font-bold font-serif">{applyTarget.name}</h3>
                  </div>
                  <p className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wide font-bold">
                    Applying with {applyTarget.fromPassport} Passport
                  </p>
                </div>
                <button onClick={() => setApplyTarget(null)} className="p-1 text-slate-400 hover:text-slate-800 transition-colors">
                  <X className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>

              <div className="p-4 md:p-5 flex flex-col gap-3 bg-slate-50 dark:bg-[#0a0a0a]">
                
                {/* Official Portal */}
                <a 
                  href={`https://www.google.com/search?q=${encodeURIComponent(`${applyTarget.name} official ${applyTarget.status} portal`)}`} 
                  target="_blank" rel="noopener noreferrer"
                  className="flex gap-3 md:gap-4 p-3 md:p-4 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 hover:border-slate-500 transition-colors rounded-sm group"
                >
                  <Landmark className="text-slate-700 dark:text-slate-300 shrink-0 mt-0.5 w-4 h-4 md:w-5 md:h-5" />
                  <div className="flex-1">
                    <h4 className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-100">Official Government Portal</h4>
                    <p className="text-[10px] md:text-xs text-slate-500 mt-0.5 md:mt-1">Standard processing directly via official channels.</p>
                  </div>
                  <ExternalLink className="text-slate-400 group-hover:text-slate-800 transition-colors w-3.5 h-3.5 md:w-4 md:h-4" />
                </a>

                {/* Third Party Service */}
                <a 
                  href="https://www.ivisa.com/" 
                  target="_blank" rel="noopener noreferrer"
                  className="flex gap-3 md:gap-4 p-3 md:p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900 hover:border-blue-400 transition-colors rounded-sm group"
                >
                  <Zap className="text-blue-600 shrink-0 mt-0.5 w-4 h-4 md:w-5 md:h-5" />
                  <div className="flex-1">
                    <h4 className="text-xs md:text-sm font-bold text-blue-900 dark:text-blue-100">Premium Expedited Service</h4>
                    <p className="text-[10px] md:text-xs text-blue-700/70 dark:text-blue-300/70 mt-0.5 md:mt-1">Fast-tracked application with expert support (Additional fee).</p>
                  </div>
                  <ExternalLink className="text-blue-400 group-hover:text-blue-600 transition-colors w-3.5 h-3.5 md:w-4 md:h-4" />
                </a>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        @media (min-width: 768px) {
          .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
        }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 4px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #3f3f46; }
      `}</style>
    </div>
  );
}