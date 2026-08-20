import { useRef, useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Globe2, ArrowRight, CalendarDays } from "lucide-react";
import { RankingService } from "../api/ranking.api";
import type { RankingData } from "../types/ranking.type";
import { useNavigate } from "react-router-dom";
import { MobilityMap } from "../components/MobilityMap";

const getCountryName = (isoCode: string) => {
  try {
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return regionNames.of(isoCode.toUpperCase()) || isoCode;
  } catch (error) {
    return isoCode;
  }
};

type Segment = { key: string; label: string; count: number; color: string; };
type TooltipState = { x: number; y: number; pos: 'top' | 'bottom'; segments: Segment[]; };

export function GlobalPower() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [baseRankings, setBaseRankings] = useState<RankingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await RankingService.getGlobalRanking();
        setBaseRankings(data);
        
        // Trích xuất tự động danh sách các kỳ (periods) có trong history
        const periods = new Set<string>();
        data.forEach(r => r.history?.forEach(h => periods.add(h.period)));
        const sortedPeriods = Array.from(periods).sort((a, b) => b.localeCompare(a));
        
        if (sortedPeriods.length > 0) {
          setSelectedPeriod(sortedPeriods[0]); // Mặc định chọn kỳ mới nhất
        }
      } catch (error) {
        console.error("Lỗi khi tải bảng xếp hạng:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!tooltip) return;
    const handleScroll = () => setTooltip(null);
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [tooltip]);

  // Cập nhật mảng Ranking dựa vào Period đang chọn
  const activeRankings = useMemo(() => {
    if (!selectedPeriod) return baseRankings;
    return baseRankings.map(r => {
      const hist = r.history?.find(h => h.period === selectedPeriod);
      if (hist) {
        return { ...r, globalScore: hist.globalScore, rank: hist.rank, details: hist.details };
      }
      return r;
    }).sort((a, b) => a.rank - b.rank); // Sắp xếp lại theo hạng mới
  }, [baseRankings, selectedPeriod]);

  // Lọc theo thanh tìm kiếm
  const filteredRankings = activeRankings.filter((item) => {
    const countryName = getCountryName(item.iso).toLowerCase();
    return (
      countryName.includes(searchTerm.toLowerCase()) ||
      item.iso.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const availablePeriods = useMemo(() => {
    const periods = new Set<string>();
    baseRankings.forEach(r => r.history?.forEach(h => periods.add(h.period)));
    return Array.from(periods).sort((a, b) => b.localeCompare(a));
  }, [baseRankings]);

  const handleBarMouseEnter = (segments: Segment[]) => (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos: 'top' | 'bottom' = rect.top < 220 ? 'bottom' : 'top';
    setTooltip({ x: rect.left + rect.width / 2, y: pos === 'top' ? rect.top : rect.bottom, pos, segments });
  };

  const handleBarMouseLeave = () => setTooltip(null);

  return (
    // Bố cục chia 2 cột trên Desktop (lg)
    <div className="flex flex-col lg:flex-row bg-background font-sans">
      
      {/* CỘT TRÁI: BẢN ĐỒ THẾ GIỚI (Cố định khi cuộn) */}
      <div className="w-full lg:w-1/2 h-[50vh] lg:h-[calc(100vh-5rem)] border-b-gray-500 lg:sticky top-20 border-b lg:border-b-0 lg:border-r-2 border-gray-400 light:bg-[#7294d4] bg-[#accae6] dark:bg-[#6387a8]">
        <MobilityMap rankings={activeRankings} theme="dark" />
      </div>

      {/* CỘT PHẢI: DANH SÁCH & TÌM KIẾM */}
      <div className="w-full lg:w-1/2 h-auto lg:h-[calc(100vh-5rem)] overflow-y-auto py-2 lg:py-2 custom-scrollbar">
        
        <div className="max-w-2xl mx-auto mb-3 flex flex-col gap-1.5">
          <h1 
            className="text-3xl md:text-[40px] leading-none tracking-tight text-foreground" 
            style={{ fontFamily: "'Fraunces', 'Times New Roman', serif", fontWeight: 500 }}
          >
            Global Passport <span className="italic text-emerald-500">Power</span>.
          </h1>
          <p className="text-sm md:text-[15px] text-muted-foreground leading-snug">
            Explore global travel privileges. Brighter green indicates a higher Mobility Score.
          </p>
        </div>

        {/* Thanh công cụ: Dropdown Năm & Thanh tìm kiếm */}
        <div className="max-w-2xl mx-auto mb-4 flex flex-col sm:flex-row gap-4 items-center">
          
          <div className="relative w-full sm:w-1/3">
            <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full h-12 pl-11 pr-4 bg-foreground/[0.1] border border-border/50 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-foreground font-bold appearance-none cursor-pointer"
            >
              {availablePeriods.map(p => {
                // Map specific timeline keys to include descriptive COVID period labels
                let label = p;
                if (p === '2020-02') label = '2020-02 (covid-19)';
                else if (p === '2020-05') label = '2020-05 (initial border closures)';
                else if (p === '2020-11') label = '2020-11 (severe covid-19 restrictions)';
                else if (p === '2021-12') label = '2021-12 (early reopening phase)';

                return (
                  <option key={p} value={p}>{label}</option>
                );
              })}
            </select>
          </div>

          <div className="relative w-full sm:w-2/3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-11 pr-4 bg-foreground/[0.1] border border-border/50 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Bảng Xếp Hạng */}
        <div className="max-w-3xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 sm:gap-3">
              <AnimatePresence mode="popLayout">
                {filteredRankings.map((item, index) => {
                  const { free, voa, evisa, eta, req, ban } = item.details || { free: 0, voa: 0, evisa: 0, eta: 0, req: 0, ban: 0 };
                  const total = free + voa + evisa + eta + req + ban || 1;

                  const segments: Segment[] = [
                    { key: 'free', label: 'Visa Free', count: free, color: 'bg-emerald-500' },
                    { key: 'evisa', label: 'e-Visa', count: evisa, color: 'bg-blue-400' },
                    { key: 'eta', label: 'ETA', count: eta, color: 'bg-teal-400' },
                    { key: 'voa', label: 'Visa on Arrival', count: voa, color: 'bg-amber-500' },
                    { key: 'req', label: 'Visa Required', count: req, color: 'bg-slate-500' },
                    { key: 'ban', label: 'No Admission', count: ban, color: 'bg-rose-500' },
                  ].filter((seg) => seg.count > 0);

                  return (
                    <motion.div
                      layout
                      key={`${item.iso}-${selectedPeriod}`}
                      initial={{ opacity: 0, y: 15 }} // Hiệu ứng trượt lên nhẹ nhàng hơn scale
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.3, delay: Math.min(index * 0.015, 0.1), ease: "easeOut" }}
                      
                      // CẬP NHẬT GIAO DIỆN CONTAINER (Đẹp, mềm mại & nghệ thuật hơn)
                      className="group flex items-center justify-between p-3 sm:p-4 gap-3 sm:gap-4 bg-slate-900/[0.05] border border-slate-900/[0.2] hover:bg-slate-900/[0.1] hover:border-slate-900/[0.9] hover:shadow-sm rounded-sm transition-all duration-300 cursor-pointer"
                      onClick={() => navigate(`/passport/${item.iso.toLowerCase()}`, { state: { passportPower: item } })}
                    >
                      {/* KHỐI TRÁI: Rank + Cờ + Tên Nước */}
                      <div className="flex items-center gap-4 sm:gap-4 flex-1 min-w-0">
                        {/* Rank */}
                        <span className="text-lg sm:text-xl font-mono font-semibold text-slate-900 w-5 sm:w-6 text-right shrink-0 transition-colors group-hover:text-slate-950">
                          {item.rank}
                        </span>
                        
                        {/* Cờ */}
                        <div className="shrink-0 rounded-[1px] overflow-hidden border border-foreground/100 shadow-sm flex items-center justify-center">
                          <span className={`fi fi-${item.iso.toLowerCase()} block text-[28px] sm:text-[32px] leading-none !bg-cover !bg-center`} />
                        </div>
                        
                        {/* Tên Nước (Sử dụng min-w-0 và truncate để cắt chữ hoàn hảo nếu quá dài) */}
                        <div className="flex-1 min-w-0 pr-2">
                          <h3 className="text-sm sm:text-lg font-bold text-foreground truncate group-hover:text-emerald-800 transition-colors duration-300 overflow-hidden">
                            {getCountryName(item.iso)}
                          </h3>
                        </div>
                      </div>

                      {/* KHỐI PHẢI: Điểm số + Thanh Progress + Arrow */}
                      <div className="flex items-center gap-3 sm:gap-5 shrink-0">
                        {/* Điểm số */}
                        <span className="text-lg sm:text-lg font-black text-emerald-500 w-8 sm:w-10 text-right shrink-0">
                          {item.globalScore}
                        </span>

                        {/* Wrapper Thanh Progress (Thu gọn chiều cao, bo tròn trịa) */}
                        <div className="flex items-center gap-3 w-[70px] sm:w-[120px] md:w-[300px] shrink-0">
                          <div
                            onMouseEnter={handleBarMouseEnter(segments)}
                            onMouseLeave={handleBarMouseLeave}
                            className="relative flex h-2 sm:h-2.5 w-full bg-foreground/10 rounded-xs overflow-hidden"
                          >
                            {segments.map((seg) => {
                              const widthPercent = (seg.count / total) * 100;
                              return (
                                <div
                                  key={seg.key}
                                  className={`relative h-full border-background/20 last:border-none ${seg.color} hover:brightness-110 transition-all`}
                                  style={{ width: `${widthPercent}%` }}
                                />
                              );
                            })}
                          </div>
                          
                          {/* Icon Mũi Tên (Hiệu ứng trượt nhẹ sang phải khi hover) */}
                          <ArrowRight className="hidden sm:block h-4 w-4 text-muted-foreground/30 group-hover:text-emerald-500 shrink-0 transition-all duration-300 transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* TOOLTIP PORTAL */}
      {tooltip &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[9999] w-48 sm:w-56"
            style={{
              left: tooltip.x,
              top: tooltip.pos === 'top' ? tooltip.y - 12 : tooltip.y + 12,
              transform: `translate(-50%, ${tooltip.pos === 'top' ? '-100%' : '0'})`,
            }}
          >
            <div className="flex flex-col gap-2 rounded-lg border border-slate-700/50 bg-[#1e293b]/95 p-3 sm:p-4 text-xs text-white shadow-2xl backdrop-blur-md">
              {tooltip.segments.map((seg) => (
                <div key={`tooltip-${seg.key}`} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-sm ${seg.color}`} />
                    <span className="font-medium text-slate-200">{seg.label}</span>
                  </div>
                  <span className="font-bold text-white">{seg.count}</span>
                </div>
              ))}
            </div>
            <div
              className={`absolute left-1/2 -translate-x-1/2 border-8 border-transparent ${
                tooltip.pos === 'top' ? 'top-full border-t-[#1e293b]/95' : 'bottom-full border-b-[#1e293b]/95'
              }`}
            />
          </div>,
          document.body
        )}
    </div>
  );
}