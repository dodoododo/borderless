// src/components/FlightResultsDisplay.tsx
import React from 'react';

export interface FlightOption {
  flights: any[];
  layovers?: any[];
  total_duration: number;
  price: number;
  type: string;
  airline_logo: string;
  departure_token?: string; // Có khi là chuyến đi khứ hồi
  booking_token?: string;   // Có khi là chuyến 1 chiều hoặc chuyến về
}

interface Props {
  flights: FlightOption[];
  onSelect: (flight: FlightOption) => void;
  btnLabel?: string;
}

const formatDuration = (minutes: number) => {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
};

const formatTime = (timeStr: string) => timeStr.split(' ')[1];

export default function FlightResultsDisplay({ flights, onSelect, btnLabel = "Chọn" }: Props) {
  if (!flights || flights.length === 0) {
    return <div className="text-stone-400 text-center py-10 bg-stone-900 rounded-xl border border-stone-800">Không tìm thấy chuyến bay nào phù hợp.</div>;
  }

  return (
    <div className="space-y-4">
      {flights.map((option, index) => {
        const stopsCount = option.flights.length - 1;

        return (
          <div key={index} className="bg-stone-900 border border-stone-800 rounded-xl p-5 hover:border-stone-700 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
            
            {/* Cột trái: Chi tiết các chặng */}
            <div className="flex-1 space-y-4 w-full">
              {option.flights.map((seg, segIdx) => (
                <div key={segIdx} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <img src={seg.airline_logo} alt={seg.airline} className="w-6 h-6 object-contain rounded bg-white" />
                      <span className="font-semibold text-white">{seg.airline}</span>
                      <span className="text-stone-400 text-xs bg-stone-950 px-2 py-0.5 rounded border border-stone-800">{seg.flight_number}</span>
                    </div>
                    <span className="text-stone-400 text-xs">{seg.airplane}</span>
                  </div>

                  <div className="flex items-center justify-between bg-stone-950 p-4 rounded-lg border border-stone-800/60">
                    <div className="text-left">
                      <div className="text-xl font-bold text-white">{formatTime(seg.departure_airport.time)}</div>
                      <div className="text-xs text-stone-400">{seg.departure_airport.id}</div>
                    </div>

                    <div className="text-center px-4 flex-1">
                      <div className="text-xs text-stone-500 mb-1">{formatDuration(seg.duration)}</div>
                      <div className="w-full h-[1px] bg-stone-700 relative flex items-center justify-center">
                        <span className="absolute w-2 h-2 bg-stone-500 rounded-full"></span>
                      </div>
                      <div className="text-[10px] text-stone-500 mt-1">{stopsCount === 0 ? 'Bay thẳng' : `${stopsCount} điểm dừng`}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-bold text-white flex items-center justify-end gap-1">
                        {formatTime(seg.arrival_airport.time)}
                        {seg.overnight && <span className="text-[10px] bg-amber-900/50 text-amber-400 px-1.5 py-0.5 rounded ml-1">+1</span>}
                      </div>
                      <div className="text-xs text-stone-400">{seg.arrival_airport.id}</div>
                    </div>
                  </div>

                  {option.layovers && option.layovers[segIdx] && (
                    <div className="text-center my-1">
                      <span className="text-xs bg-stone-800 text-stone-300 px-3 py-1 rounded-full border border-stone-700">
                        ⏳ Quá cảnh: {formatDuration(option.layovers[segIdx].duration)} tại {option.layovers[segIdx].id}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Cột phải: Giá và Call-to-action */}
            <div className="w-full md:w-48 flex md:flex-col justify-between items-center md:items-end border-t md:border-t-0 md:border-l border-stone-800 pt-4 md:pt-0 md:pl-6 shrink-0">
              <div className="text-left md:text-right mb-4">
                <div className="text-xs text-stone-400">Tổng thời gian: {formatDuration(option.total_duration)}</div>
                <div className="text-2xl font-black text-emerald-400 mt-1">${option.price}</div>
                <div className="text-[10px] text-stone-500">{option.type}</div>
              </div>

              <button 
                onClick={() => onSelect(option)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors shadow-lg shadow-blue-900/20"
              >
                {btnLabel}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}