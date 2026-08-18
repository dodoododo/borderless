import React, { useState, useMemo } from 'react';
import type { FlightOption, PriceInsights } from '../types/types';
import FlightRow from '../components/flight/FlightRow';

interface Props {
  title: string;
  flights: FlightOption[];
  priceInsights?: PriceInsights;
  loading: boolean;
  onSelect: (f: FlightOption) => void;
}

type SortOption = 'price_asc' | 'price_desc' | 'duration_asc';

export default function FlightResultsPage({ title, flights, priceInsights, loading, onSelect }: Props) {
  const [sortOption, setSortOption] = useState<SortOption>('price_asc');
  
  // State lưu thông tin điểm đang được Hover trên biểu đồ
  const [hoveredPoint, setHoveredPoint] = useState<{
    index: number;
    x: number;
    y: number;
    price: number;
    date: string;
  } | null>(null);

  const sortedFlights = useMemo(() => {
    const flightsCopy = [...flights];
    switch (sortOption) {
      case 'price_asc': return flightsCopy.sort((a, b) => a.price - b.price);
      case 'price_desc': return flightsCopy.sort((a, b) => b.price - a.price);
      case 'duration_asc': return flightsCopy.sort((a, b) => a.total_duration - b.total_duration);
      default: return flightsCopy;
    }
  }, [flights, sortOption]);

  if (loading) {
    return (
      <div className="py-12 border-t border-gray-200 mt-8">
        <div className="text-gray-600 text-[15px] font-medium animate-pulse tracking-wide">
          Retrieving flight schedules and market data...
        </div>
      </div>
    );
  }

  if (flights.length === 0) {
    return (
      <div className="py-16 border-t border-gray-200 mt-8">
        <h2 className="text-2xl text-gray-900 font-medium mb-3">No flights available</h2>
        <p className="text-gray-600 text-[15px]">
          We could not find any flights matching your criteria. Please try adjusting your dates or destinations.
        </p>
      </div>
    );
  }

  // --- CẤU HÌNH MÀU SẮC ---
  const levelConfig = {
    high: { 
      // Đỏ Neon (Neon Crimson) - Cảnh báo mạnh
      badge: 'bg-[#FF0050] text-white border-[#FF0050] font-bold tracking-widest', 
      text: 'Prices are high',
      chartLine: 'stroke-[#FF0050]', 
      chartFill: 'fill-[#FF0050]',
      gradFrom: '#FFD6E0', // Đỏ hồng nhạt (Mã HEX đặc, không opacity)
      gradTo: '#FFFFFF'    // Trắng tinh
    },
    typical: { 
      // Xanh Điện (Electric Blue) - Hiện đại, tin cậy
      badge: 'bg-[#2962FF] text-white border-[#2962FF] font-bold tracking-widest', 
      text: 'Prices are typical',
      chartLine: 'stroke-[#2962FF]', 
      chartFill: 'fill-[#2962FF]',
      gradFrom: '#D6E4FF', // Xanh dương nhạt (Mã HEX đặc)
      gradTo: '#FFFFFF'
    },
    low: { 
      // Xanh Ngọc (Vibrant Mint) - Tích cực, bắt mắt
      badge: 'bg-[#00B67A] text-white border-[#00B67A] font-bold tracking-widest', 
      text: 'Prices are low',
      chartLine: 'stroke-[#00B67A]', 
      chartFill: 'fill-[#00B67A]',
      gradFrom: '#D1F5E8', // Xanh mint nhạt (Mã HEX đặc)
      gradTo: '#FFFFFF'
    }
  };

  const currentLevel = priceInsights ? levelConfig[priceInsights.price_level as keyof typeof levelConfig] : null;

  // --- HÀM VẼ BIỂU ĐỒ CHUYÊN NGHIỆP CÓ TỌA ĐỘ TRỤC ---
  // --- HÀM VẼ BIỂU ĐỒ CHUYÊN NGHIỆP CÓ TỌA ĐỘ TRỤC (GIÁ + NGÀY TỐI GIẢN) ---
  const drawChart = () => {
    if (!priceInsights || !priceInsights.price_history || priceInsights.price_history.length < 2) return null;

    const history = priceInsights.price_history;
    const prices = history.map(h => h[1]);
    const lowest = priceInsights.lowest_price;
    const [typMin, typMax] = priceInsights.typical_price_range;

    const maxVal = Math.max(...prices, lowest, typMax);
    const minVal = Math.min(...prices, lowest, typMin);
    const buffer = (maxVal - minVal) * 0.15 || 50;
    const chartMax = Math.round(maxVal + buffer);
    const chartMin = Math.max(0, Math.round(minVal - buffer));
    const range = chartMax - chartMin;

    // Phục hồi lại lề dưới (bottom: 25) để có chỗ vẽ mốc thời gian
    const viewBoxW = 800;
    const viewBoxH = 260;
    const pad = { top: 20, right: 80, bottom: 25, left: 50 }; 
    const chartW = viewBoxW - pad.left - pad.right;
    const chartH = viewBoxH - pad.top - pad.bottom;

    const getX = (index: number) => pad.left + (index / (prices.length - 1)) * chartW;
    const getY = (val: number) => pad.top + chartH - ((val - chartMin) / range) * chartH;

    const points = prices.map((p, i) => `${getX(i)},${getY(p)}`).join(' ');
    const areaPoints = `${getX(0)},${pad.top + chartH} ${points} ${getX(prices.length - 1)},${pad.top + chartH}`;

    const currentY = getY(lowest);
    const typTopY = getY(typMax);
    const typBotY = getY(typMin);

    // Mốc Trục Y (Giá)
    const yTicks = [chartMax, typMax, typMin, chartMin].map(val => ({ y: getY(val), label: `$${Math.round(val)}` }));

    // HÀM FORMAT TIMESTAMP SANG NGÀY THÁNG (VD: Jun 18)
    const formatDate = (ts: number) => new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Mốc Trục X: Lấy đúng 3 điểm (Đầu - Giữa - Cuối) kèm textAnchor để không tràn viền
    const len = history.length;
    const xTicks = [
      { x: getX(0), date: formatDate(history[0][0]), anchor: "start" },
      { x: getX(Math.floor(len / 2)), date: formatDate(history[Math.floor(len / 2)][0]), anchor: "middle" },
      { x: getX(len - 1), date: formatDate(history[len - 1][0]), anchor: "end" }
    ];

    return (
      <svg viewBox={`0 0 ${viewBoxW} ${viewBoxH}`} className="w-full h-full overflow-visible font-sans" onMouseLeave={() => setHoveredPoint(null)}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={currentLevel?.gradFrom} />
            <stop offset="100%" stopColor={currentLevel?.gradTo} />
          </linearGradient>
        </defs>

        {/* 1. Lưới nền (Grid lines) & Nhãn trục Y */}
        {yTicks.map((tick, i) => (
          <g key={`y-${i}`}>
            <line x1={pad.left} y1={tick.y} x2={viewBoxW - pad.right} y2={tick.y} stroke="#f1f5f9" strokeWidth="1" />
            <text x={pad.left - 10} y={tick.y + 4} fill="#64748b" fontSize="12" fontWeight="500" textAnchor="end">
              {tick.label}
            </text>
          </g>
        ))}

        {/* 2. Nhãn trục X (Ngày: Đầu - Giữa - Cuối) */}
        {xTicks.map((tick, i) => (
          <text key={`x-${i}`} x={tick.x} y={viewBoxH - 5} fill="#94a3b8" fontSize="12" fontWeight="600" textAnchor={tick.anchor as "start" | "middle" | "end"}>
            {tick.date}
          </text>
        ))}

        {/* 3. Dải giá thông thường (Typical Range Background) */}
        <rect 
          x={pad.left} y={typTopY} width={chartW} height={Math.max(0, typBotY - typTopY)} 
          fill="#f8fafc" // slate-50
        />

        {/* 4. Đường xu hướng (Trend Line) */}
        <polygon points={areaPoints} fill="url(#areaGradient)" />
        <polyline points={points} fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* 5. Điểm neo "Giá chuyến bay thấp nhất hiện tại" */}
        <line x1={pad.left} y1={currentY} x2={viewBoxW - pad.right + 20} y2={currentY} className={currentLevel?.chartLine} strokeWidth="1.5" strokeDasharray="6 4" />
        <circle cx={viewBoxW - pad.right + 20} cy={currentY} r="4" className={currentLevel?.chartFill} />
        <circle cx={viewBoxW - pad.right + 20} cy={currentY} r="12" className={currentLevel?.chartFill} opacity="0.2">
          <animate attributeName="r" values="4; 14; 4" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3; 0; 0.3" dur="2s" repeatCount="indefinite" />
        </circle>
        
        {/* Hộp đen báo Giá thấp nhất ngay lúc này */}
        <rect x={viewBoxW - pad.right + 28} y={currentY - 14} width="70" height="28" fill="#111827" />
        <text x={viewBoxW - pad.right + 63} y={currentY + 4} fill="#ffffff" fontSize="12" fontWeight="600" textAnchor="middle">
          ${lowest}
        </text>

        {/* 6. LỚP BẮT SỰ KIỆN HOVER (Chia lưới chẻ dọc bắt điểm chuột) */}
        {prices.map((price, i) => (
          <rect
            key={`hover-${i}`}
            x={getX(i) - (chartW / prices.length) / 2}
            y={pad.top} width={chartW / prices.length} height={chartH}
            fill="transparent"
            onMouseEnter={() => setHoveredPoint({
              index: i, 
              x: getX(i), 
              y: getY(price), 
              price: price, 
              date: formatDate(history[i][0]) // Khôi phục việc tính ngày
            })}
          />
        ))}

        {/* 7. TOOLTIP NỔI LÊN KHI HOVER */}
        {hoveredPoint && (
          <g className="pointer-events-none transition-all duration-75">
            {/* Đường gióng dọc */}
            <line x1={hoveredPoint.x} y1={pad.top} x2={hoveredPoint.x} y2={pad.top + chartH} stroke="#64748b" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="5" fill="#111827" stroke="#ffffff" strokeWidth="2" />
            
            {/* Khung Tooltip được mở rộng để chứa cả Date và Price */}
            {(() => {
              const tipW = 100; // Tăng width lên để nhét vừa chữ
              const tipH = 30;
              let rectX = hoveredPoint.x - tipW / 2;
              
              // Kỹ thuật tránh tràn khung hình
              if (rectX < pad.left) rectX = pad.left;
              if (rectX + tipW > viewBoxW - pad.right) rectX = viewBoxW - pad.right - tipW;
              
              return (
                <g>
                  <rect x={rectX} y={hoveredPoint.y - tipH - 12} width={tipW} height={tipH} fill="#111827" />
                  <text x={rectX + tipW / 2} y={hoveredPoint.y - tipH + 8} fill="#ffffff" fontSize="13" fontWeight="600" textAnchor="middle">
                    {hoveredPoint.date} <tspan fill="#94a3b8" fontWeight="400">|</tspan> ${hoveredPoint.price}
                  </text>
                </g>
              );
            })()}
          </g>
        )}
      </svg>
    );
  };

  return (
    <div className="font-sans max-w-7xl mx-auto px-2">
      {/* HEADER & SORT CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
        <h2 className="text-xl text-gray-900 font-medium tracking-tight">
          {title}
        </h2>
        
        <div className="flex items-center gap-3">
          <label htmlFor="sortParams" className="text-[12px] text-gray-500 uppercase tracking-widest font-semibold">
            Sort by
          </label>
          <div className="relative">
            <select 
              id="sortParams"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="appearance-none border border-gray-300 bg-white text-gray-900 text-[14px] px-4 py-2 pr-10 rounded-none focus:outline-none focus:border-gray-900 transition-colors cursor-pointer"
            >
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="duration_asc">Duration: Shortest</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* DATA GRID */}
      <div className="border border-gray-300 bg-white mb-4">
        <div className="hidden md:flex border-b border-gray-300 bg-gray-50 px-5 py-3 text-[11px] uppercase tracking-widest text-gray-500 font-semibold">
          <div className="w-10 mr-8">Flight</div>
          <div className="w-40 mr-8">Departure & Arrival</div>
          <div className="w-28 mr-8">Duration</div>
          <div className="w-32 mr-8">Stops</div>
        </div>

        <div className="flex flex-col">
          {sortedFlights.map((flight, i) => (
            <div key={i} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
              <FlightRow flight={flight} onSelect={onSelect} />
            </div>
          ))}
        </div>
      </div>
      
      
      {/* 🚀 BẢNG PHÂN TÍCH THỊ TRƯỜNG CHUYÊN NGHIỆP 🚀 */}
      {priceInsights && currentLevel && (
        <div className="mb-8 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col xl:flex-row max-w-8xl">
          
          {/* PANEL TRÁI: Text & Đánh giá */}
          <div className="p-7 xl:w-1/3 bg-slate-50 border-b xl:border-b-0 xl:border-r border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-[12px] uppercase tracking-widest text-slate-700 font-bold">
                Market Insights
              </h3>
            </div>
            
            <div className="mb-4">
              <span className={`inline-block px-4 py-1.5 text-[12px] font-bold uppercase tracking-wider border rounded-full ${currentLevel.badge}`}>
                {currentLevel.text}
              </span>
            </div>
            
            <p className="text-slate-600 text-[14px] leading-relaxed">
              The lowest for current route is <strong className="text-slate-900">${priceInsights.lowest_price}</strong>. 
              Usually, prices range between <strong className="text-slate-900">${priceInsights.typical_price_range[0]}</strong> and <strong className="text-slate-900">${priceInsights.typical_price_range[1]}</strong>.
            </p>
          </div>

          {/* PANEL PHẢI: Biểu đồ SVG */}
          <div className="p-6 xl:w-2/3 flex flex-col bg-white">
            <div className="flex items-center justify-between mb-6">
               <div className="text-[12px] text-slate-700 uppercase tracking-widest font-bold">60-Day Price Insights</div>
            </div>
            <div className="relative w-full h-40 md:h-48 lg:h-56 mt-auto select-none">
              {drawChart()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}