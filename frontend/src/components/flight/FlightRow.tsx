import React, { useState } from 'react';
import type { FlightOption } from '../../types/types';
import { 
  ChevronDown, 
  ChevronUp, 
  Leaf, 
  Clock, 
  Wifi, 
  MonitorPlay, 
  BatteryCharging, 
  MoveHorizontal,
  Info
} from 'lucide-react';

interface Props {
  flight: FlightOption;
  onSelect: (f: FlightOption) => void;
}

// Helpers
const formatTime = (t: string) => t.split(' ')[1];
const formatDur = (m: number) => {
  const hrs = Math.floor(m / 60);
  const mins = m % 60;
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
};

// Hàm phụ trợ để map các extension thành Icon tương ứng
const renderExtensionIcon = (ext: string) => {
  const lowerExt = ext.toLowerCase();
  if (lowerExt.includes('wi-fi')) return <Wifi size={14} className="text-blue-500" />;
  if (lowerExt.includes('video') || lowerExt.includes('stream')) return <MonitorPlay size={14} className="text-purple-500" />;
  if (lowerExt.includes('usb') || lowerExt.includes('power')) return <BatteryCharging size={14} className="text-emerald-500" />;
  if (lowerExt.includes('legroom')) return <MoveHorizontal size={14} className="text-slate-500" />;
  if (lowerExt.includes('carbon')) return <Leaf size={14} className="text-green-500" />;
  return <Info size={14} className="text-slate-400" />;
};

export default function FlightRow({ flight, onSelect }: Props) {
  const [expanded, setExpanded] = useState(false);
  
  const stops = flight.flights.length - 1;
  const firstSeg = flight.flights[0];
  const lastSeg = flight.flights[flight.flights.length - 1];

  // Gom tên hãng bay (Nếu có nhiều hãng bay khác nhau trong 1 vé)
  const airlines = Array.from(new Set(flight.flights.map(f => f.airline)));
  const airlineName = airlines.length > 1 ? 'Multiple airlines' : airlines[0];

  // Xử lý khí thải (Carbon Emissions)
  const emissions = flight.carbon_emissions;
  const isGreen = emissions?.difference_percent && emissions.difference_percent < 0;

  return (
    <div className={` bg-white border ${expanded ? 'border-blue-300 shadow-md' : 'border-slate-100 shadow-sm'} overflow-hidden transition-all duration-300 hover:shadow-md`}>
      
      {/* ==========================================
          HEADER ROW (DÒNG TÓM TẮT CHÍNH)
      ========================================== */}
      <div 
        className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 cursor-pointer group"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-1 gap-4 md:gap-8 items-center">
          
          {/* Logo Hãng */}
          <div className="w-10 h-10 shrink-0 bg-white border border-slate-100 rounded-full flex items-center justify-center p-1 shadow-sm">
            <img src={flight.airline_logo} alt="Airline Logo" className="w-full h-full object-contain" />
          </div>
          
          {/* Cột 1: Thời gian & Hãng bay */}
          <div className="w-40 shrink-0">
            <div className="text-[18px] font-semibold text-slate-900 flex items-center">
              {formatTime(firstSeg.departure_airport.time)} – {formatTime(lastSeg.arrival_airport.time)}
              {lastSeg.overnight && <sup className="text-[10px] text-red-500 font-bold ml-1 mt-1">+1</sup>}
            </div>
            <div className="text-sm text-slate-500 font-medium mt-0.5 truncate" title={airlineName}>
              {airlineName}
            </div>
          </div>

          {/* Cột 2: Thời lượng bay */}
          <div className="w-28 shrink-0 hidden sm:block">
            <div className="text-[15px] font-medium text-slate-900">{formatDur(flight.total_duration)}</div>
            <div className="text-sm text-slate-500">{firstSeg.departure_airport.id} – {lastSeg.arrival_airport.id}</div>
          </div>

          {/* Cột 3: Số điểm dừng (Stops) */}
          <div className="w-32 shrink-0">
            <div className={`text-[15px] font-medium ${stops === 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
              {stops === 0 ? 'Nonstop' : `${stops} stop${stops > 1 ? 's' : ''}`}
            </div>
            {stops > 0 && flight.layovers && (
              <div className="text-sm text-slate-500 truncate" title={flight.layovers.map(l => l.name).join(', ')}>
                {flight.layovers.map(l => l.id).join(', ')}
              </div>
            )}
          </div>

          {/* Cột 4: Môi trường (Carbon) - Hiện trên màn hình to */}
          {emissions && (
            <div className="hidden lg:flex flex-col items-start w-32 shrink-0">
              <div className="text-[13px] text-slate-600">{Math.round(emissions.this_flight / 1000)} kg CO₂</div>
              <div className={`text-[12px] font-medium flex items-center gap-1 ${isGreen ? 'text-emerald-600' : 'text-slate-400'}`}>
                {isGreen && <Leaf size={12} />}
                {emissions.difference_percent > 0 ? `+${emissions.difference_percent}% emissions` : `${emissions.difference_percent}% emissions`}
              </div>
            </div>
          )}
        </div>

        {/* Cột 5: Giá tiền & Nút Action */}
        <div className="flex items-center justify-between md:justify-end gap-6 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
          <div className="text-left md:text-right">
            <div className="text-2xl font-semibold text-slate-700 leading-none">
              {flight.price && flight.price > 0 ? (
                `$${flight.price}`
              ) : (
                <span className="text-sm font-normal text-stone-400 uppercase tracking-widest">Price on request</span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 uppercase tracking-wide mt-1 font-semibold">{flight.type}</div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={(e) => { e.stopPropagation(); onSelect(flight); }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full text-[15px] font-medium transition-colors shadow-sm hover:shadow"
            >
              Select
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-slate-200 transition-colors">
              {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          EXPANDED ROW (CHI TIẾT LỊCH TRÌNH)
      ========================================== */}
      {expanded && (
        <div className="bg-slate-50 border-t border-slate-200 px-4 md:px-8 py-6 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-w-3xl mx-auto">
            {flight.flights.map((seg, i) => (
              <React.Fragment key={i}>
                {/* Một chặng bay (Flight Segment) */}
                <div className="flex gap-4">
                  {/* Timeline Graphic */}
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full border-2 border-slate-800 bg-white z-10"></div>
                    <div className="w-0.5 h-full bg-slate-300 my-1"></div>
                    <div className="w-3 h-3 rounded-full border-2 border-slate-800 bg-white z-10"></div>
                  </div>

                  {/* Nội dung chặng bay */}
                  <div className="flex-1 pb-6">
                    {/* Giờ đi */}
                    <div className="font-semibold text-slate-900 text-[15px]">
                      {formatTime(seg.departure_airport.time)} <span className="text-slate-500 font-normal mx-2">·</span> {seg.departure_airport.name} ({seg.departure_airport.id})
                    </div>
                    
                    {/* Chi tiết trên không */}
                    <div className="my-4 ml-2 pl-4 border-l-2 border-slate-200">
                      <div className="flex items-center gap-3 mb-2">
                        <img src={seg.airline_logo} alt="Logo" className="w-5 h-5 object-contain" />
                        <span className="font-medium text-slate-700">{seg.airline}</span>
                        <span className="text-slate-400 text-xs px-2 py-0.5 bg-slate-200/50 rounded-md font-mono">{seg.flight_number}</span>
                      </div>
                      <div className="text-slate-600 text-[13px] space-y-1 mb-3">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-slate-400"/> Travel time: {formatDur(seg.duration)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Info size={14} className="text-slate-400"/> {seg.airplane} <span className="text-slate-300">|</span> {seg.travel_class}
                        </div>
                      </div>

                      {/* Tiện ích chuyến bay (Extensions) */}
                      {seg.extensions && seg.extensions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {seg.extensions.map((ext, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[11px] bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-md">
                              {renderExtensionIcon(ext)}
                              {ext}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Giờ đến */}
                    <div className="font-semibold text-slate-900 text-[15px]">
                      {formatTime(seg.arrival_airport.time)} <span className="text-slate-500 font-normal mx-2">·</span> {seg.arrival_airport.name} ({seg.arrival_airport.id})
                    </div>
                  </div>
                </div>

                {/* Layover (Thời gian quá cảnh) */}
                {flight.layovers && flight.layovers[i] && (
                  <div className="flex gap-4 my-2">
                    <div className="flex flex-col items-center w-3">
                      <div className="w-0.5 h-full border-l-2 border-dashed border-slate-300"></div>
                    </div>
                    <div className="flex-1 py-4">
                      <div className="inline-block bg-orange-50 border border-orange-100 text-orange-800 text-[13px] px-4 py-2 rounded-lg font-medium">
                        Layover in {flight.layovers[i].name} ({flight.layovers[i].id}) for {formatDur(flight.layovers[i].duration)}
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}