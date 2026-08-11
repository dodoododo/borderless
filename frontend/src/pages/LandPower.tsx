import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Map, ArrowRight, Navigation2, Filter } from "lucide-react";

// Dữ liệu mẫu (Tập trung vào sức mạnh khu vực/lục địa)
const MOCK_LANDPOWER = [
  { rank: 1, country: "Germany", code: "DE", score: 45, region: "Europe", treaty: "Schengen Area", openBorders: 27 },
  { rank: 2, country: "France", code: "FR", score: 44, region: "Europe", treaty: "Schengen Area", openBorders: 27 },
  { rank: 3, country: "United Arab Emirates", code: "AE", score: 18, region: "Middle East", treaty: "GCC", openBorders: 5 },
  { rank: 4, country: "Singapore", code: "SG", score: 15, region: "Asia", treaty: "ASEAN", openBorders: 9 },
  { rank: 5, country: "Brazil", code: "BR", score: 12, region: "South America", treaty: "Mercosur", openBorders: 4 },
  { rank: 6, country: "United States", code: "US", score: 5, region: "North America", treaty: "USMCA", openBorders: 2 },
];

const REGIONS = ["All", "Europe", "Asia", "Americas", "Middle East", "Africa"];

export function LandPower() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeRegion, setActiveRegion] = useState("All");

  const filteredRankings = MOCK_LANDPOWER.filter((item) => {
    const matchesSearch = item.country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = activeRegion === "All" || item.region === activeRegion;
    return matchesSearch && matchesRegion;
  });

  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-6 md:px-10 font-sans">
      
      {/* 1. Header (Editorial Style - Emerald Theme) */}
      <div className="max-w-5xl mx-auto mb-12">
        <h3 
          className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-500 mb-4 flex items-center gap-2"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          <Navigation2 className="w-4 h-4" />
          Index / Landpower
        </h3>
        
        <h1 
          className="text-[40px] md:text-[56px] leading-[1.1] tracking-[-0.03em] text-foreground mb-6"
          style={{ fontFamily: "'Fraunces', 'Times New Roman', serif", fontWeight: 700 }}
        >
          Your <span className="italic text-emerald-500 relative inline-block">
            continental
            <span className="absolute bottom-1 left-0 w-full h-[2px] bg-emerald-500/30" />
          </span> footprint.
        </h1>
        
        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Đo lường sức mạnh di chuyển đường bộ và quyền tự do đi lại trong các khu vực địa lý liền kề. Bảng xếp hạng bị chi phối mạnh mẽ bởi các hiệp ước liên minh như Schengen hay ASEAN.
        </p>
      </div>

      {/* 2. Thanh Công cụ (Search & Filter) */}
      <div className="max-w-5xl mx-auto mb-8 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-foreground/[0.03] border border-border/50 rounded-none focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-foreground font-medium placeholder:text-muted-foreground"
          />
        </div>
        
        {/* Region Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
          <Filter className="w-4 h-4 text-muted-foreground mr-2 hidden md:block" />
          {REGIONS.map((region) => (
            <button
              key={region}
              onClick={() => setActiveRegion(region)}
              className={`whitespace-nowrap px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border ${
                activeRegion === region
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                  : "border-border/50 bg-foreground/[0.02] text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Bảng Xếp Hạng (Block List) */}
      <div className="max-w-5xl mx-auto">
        {/* Tiêu đề cột (Desktop) */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 mb-4">
          <div className="col-span-1">Rank</div>
          <div className="col-span-4">Passport</div>
          <div className="col-span-3">Zone & Treaty</div>
          <div className="col-span-2 text-center">Land Score</div>
          <div className="col-span-2 text-right">Open Borders</div>
        </div>

        {/* Danh sách */}
        <div className="flex flex-col gap-3">
          {filteredRankings.map((item, index) => (
            <motion.div 
              key={item.code}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 md:px-6 md:py-4 bg-foreground/[0.02] border border-border/50 hover:bg-foreground/[0.04] hover:border-emerald-500/30 transition-all cursor-pointer"
            >
              {/* Cột Rank */}
              <div className="col-span-1 flex items-center justify-between md:justify-start">
                <span className="text-lg font-mono font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                  #{String(item.rank).padStart(2, '0')}
                </span>
                <span className="md:hidden font-bold text-lg">{item.country}</span>
              </div>

              {/* Cột Tên Quốc gia */}
              <div className="hidden md:flex col-span-4 items-center gap-4">
                <div className="w-8 h-6 bg-foreground/10 flex items-center justify-center text-[10px] font-mono border border-foreground/10">
                  {item.code}
                </div>
                <span className="text-lg font-semibold text-foreground">
                  {item.country}
                </span>
              </div>

              {/* Cột Khu vực & Hiệp ước */}
              <div className="col-span-12 md:col-span-3 flex flex-col py-2 md:py-0 border-y border-border/50 md:border-none my-2 md:my-0">
                <span className="md:hidden text-xs font-bold text-muted-foreground uppercase mb-1">Zone Info</span>
                <span className="text-sm font-semibold text-foreground">{item.treaty}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Map className="w-3 h-3" />
                  {item.region}
                </span>
              </div>

              {/* Cột Land Score */}
              <div className="col-span-6 md:col-span-2 flex flex-col md:items-center justify-center">
                <span className="md:hidden text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Score</span>
                <span className="text-2xl font-black text-emerald-500 tracking-tight">
                  {item.score}
                </span>
              </div>

              {/* Cột Open Borders & Nút */}
              <div className="col-span-6 md:col-span-2 flex justify-end md:justify-between items-center gap-4">
                <div className="flex flex-col items-end md:items-center text-sm">
                  <span className="text-foreground font-semibold">{item.openBorders}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Neighbors</span>
                </div>
                
                <div className="hidden md:flex w-8 h-8 bg-foreground/5 items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors border border-border/50 group-hover:border-transparent">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}