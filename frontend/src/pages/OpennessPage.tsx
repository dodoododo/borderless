import { useRef, useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Unlock, ArrowRight, CalendarDays } from "lucide-react";
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

// Mở rộng interface để chứa rank tự tính cho Openness
interface OpennessData extends RankingData {
  opennessRank?: number;
}

export function OpennessPage() {
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
        
        const periods = new Set<string>();
        data.forEach(r => r.history?.forEach(h => periods.add(h.period)));
        const sortedPeriods = Array.from(periods).sort((a, b) => b.localeCompare(a));
        
        if (sortedPeriods.length > 0) {
          setSelectedPeriod(sortedPeriods[0]);
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu Openness:", error);
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

  // CẬP NHẬT LOGIC TÍNH HẠNG (RANK) - DENSE RANKING
  const activeRankings = useMemo(() => {
    if (!baseRankings.length) return [];
    
    // 1. Ánh xạ dữ liệu theo kỳ VÀ TẠO BẢN SAO
    let list: OpennessData[] = baseRankings.map(r => {
      const hist = selectedPeriod ? r.history?.find(h => h.period === selectedPeriod) : null;
      return { 
        ...r, 
        opennessScore: hist ? hist.opennessScore : (r.opennessScore || 0) 
      };
    });

    // 2. Sắp xếp danh sách dựa trên điểm Openness từ cao xuống thấp
    list.sort((a, b) => (b.opennessScore || 0) - (a.opennessScore || 0));

    // 3. Tính toán Hạng: Dense Ranking (Đồng hạng tính là 1 hạng, hạng kế tiếp chỉ cộng 1)
    // Ví dụ: Điểm [198, 198, 195, 195, 190] -> Hạng [1, 1, 2, 2, 3]
    let currentRank = 1;
    list.forEach((item, index) => {
      // Nếu không phải item đầu tiên VÀ điểm thấp hơn người đứng ngay trước nó
      if (index > 0 && (item.opennessScore || 0) < (list[index - 1].opennessScore || 0)) {
        currentRank += 1; // Chỉ tăng lên 1 hạng duy nhất
      }
      item.opennessRank = currentRank;
    });

    return list;
  }, [baseRankings, selectedPeriod]);

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
    <div className="flex flex-col lg:flex-row min-h-screen bg-background pt-20 font-sans">
      
      {/* CỘT TRÁI: BẢN ĐỒ THẾ GIỚI - Đổi màu biển sang tone Tím sẫm */}
      <div className="w-full lg:w-1/2 h-[50vh] lg:h-[calc(100vh-5rem)] border-b-gray-500 lg:sticky top-20 border-b lg:border-b-0 lg:border-r-2 border-gray-400 light:bg-[#ddd6fe] bg-[#c4b5fd] dark:bg-[#2e1065]">
        <MobilityMap rankings={activeRankings} theme="dark" metric="openness" />
      </div>

      {/* CỘT PHẢI: DANH SÁCH & TÌM KIẾM */}
      <div className="w-full lg:w-1/2 h-auto lg:h-[calc(100vh-5rem)] overflow-y-auto py-4 lg:py-6 custom-scrollbar">
        
        {/* Header Editorial Style (Đã mang từ bản Mock sang) */}
        <div className="max-w-2xl mx-auto mb-6 flex flex-col px-4 md:px-0">
          <h1 
            className="text-3xl md:text-[36px] leading-tight tracking-tight text-foreground mb-2" 
            style={{ fontFamily: "'Fraunces', 'Times New Roman', serif", fontWeight: 700 }}
          >
            The world's most <span className=" text-violet-500 relative inline-block">
              welcoming
            </span> borders.
          </h1>
          <p className="text-sm md:text-[15px] text-muted-foreground leading-snug mt-1">
            Measuring how welcoming a country is based on the number of nationalities allowed entry without a traditional visa.
          </p>
        </div>

        {/* Thanh công cụ: Dropdown Năm & Thanh tìm kiếm */}
        <div className="max-w-2xl mx-auto mb-6 flex flex-col sm:flex-row gap-4 items-center px-4 md:px-0">
          <div className="relative w-full sm:w-1/3">
            <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full h-12 pl-11 pr-4 bg-foreground/[0.1] border border-border/50 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-foreground font-bold appearance-none cursor-pointer"
            >
              {availablePeriods.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-2/3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-11 pr-4 bg-foreground/[0.1] border border-border/50 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Bảng Xếp Hạng */}
        <div className="max-w-3xl mx-4 md:mx-auto px-0 md:px-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 sm:gap-3">
              <AnimatePresence mode="popLayout">
                {filteredRankings.map((item, index) => {
                  const score = item.opennessScore || 0;
                  // Tổng số quốc gia trên thế giới quy ước là 198
                  const maxNationalities = 198; 
                  const widthPercent = Math.min((score / maxNationalities) * 100, 100);
                  
                  // Chỉ cần 1 dải duy nhất cho Openness
                  const segments: Segment[] = [
                    { key: 'open', label: 'Nationalities Allowed', count: score, color: 'bg-violet-500' }
                  ];

                  return (
                    <motion.div
                      layout
                      key={`${item.iso}-${selectedPeriod}`}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.3, delay: Math.min(index * 0.015, 0.1), ease: "easeOut" }}
                      className="group flex items-center justify-between p-3 sm:p-4 gap-3 sm:gap-4 bg-slate-900/[0.05] border border-slate-900/[0.2] hover:bg-violet-500/[0.05] hover:border-violet-500/[0.5] hover:shadow-sm rounded-sm transition-all duration-300 cursor-pointer"
                      onClick={() => navigate(`/passport/${item.iso.toLowerCase()}`, { state: { passportPower: item } })}
                    >
                      {/* KHỐI TRÁI: Rank + Cờ + Tên Nước */}
                      <div className="flex items-center gap-4 sm:gap-4 flex-1 min-w-0">
                        
                        {/* Hạng (Openness Rank) */}
                        <span className="text-lg sm:text-xl font-mono font-semibold text-slate-900 w-5 sm:w-8 text-right shrink-0 transition-colors group-hover:text-slate-950">
                          {item.opennessRank}
                        </span>
                        
                        <div className="shrink-0 rounded-[1px] overflow-hidden border border-foreground/100 shadow-sm flex items-center justify-center">
                          <span className={`fi fi-${item.iso.toLowerCase()} block text-[28px] sm:text-[32px] leading-none !bg-cover !bg-center`} />
                        </div>
                        
                        <div className="flex-1 min-w-0 pr-2">
                          <h3 className="text-sm sm:text-lg font-bold text-foreground truncate group-hover:text-violet-700 transition-colors duration-300 overflow-hidden">
                            {getCountryName(item.iso)}
                          </h3>
                        </div>
                      </div>

                      {/* KHỐI PHẢI: Điểm số + Thanh Progress đơn + Arrow */}
                      <div className="flex items-center gap-3 sm:gap-5 shrink-0">
                        <span className="text-lg sm:text-lg font-black text-violet-500 w-8 sm:w-10 text-right shrink-0">
                          {score}
                        </span>

                        <div className="flex items-center gap-3 w-[70px] sm:w-[120px] md:w-[250px] shrink-0">
                          <div
                            onMouseEnter={handleBarMouseEnter(segments)}
                            onMouseLeave={handleBarMouseLeave}
                            className="relative flex h-2 sm:h-2.5 w-full bg-foreground/10 rounded-xs overflow-hidden"
                          >
                            <div
                              className="relative h-full bg-violet-500 hover:brightness-110 transition-all"
                              style={{ width: `${widthPercent}%` }}
                            />
                          </div>
                          
                          <ArrowRight className="hidden sm:block h-4 w-4 text-muted-foreground/30 group-hover:text-violet-500 shrink-0 transition-all duration-300 transform group-hover:translate-x-1" />
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