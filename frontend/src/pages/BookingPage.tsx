import React from 'react';
import type { FlightOption } from '../types/types';
import { 
  Clock, 
  Wifi, 
  MonitorPlay, 
  BatteryCharging, 
  MoveHorizontal,
  Info,
  Leaf
} from 'lucide-react';

interface Props {
  bookingData: any[];
  itinerary: { outbound: FlightOption | null; return: FlightOption | null };
  onReset: () => void;
}

const formatTime = (t: string) => t.split(' ')[1];
const formatDate = (t: string) => t.split(' ')[0];
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

export default function BookingPage({ bookingData, itinerary, onReset }: Props) {
  const { outbound, return: returnFlight } = itinerary;

  const calculatedTotal = (outbound?.price || 0) + (returnFlight?.price || 0);

  if (!bookingData.length) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 font-sans">
        <div className="border border-gray-300 bg-white p-8 text-center text-gray-600 rounded-none">
          No booking providers available for this itinerary.
        </div>
        <button onClick={onReset} className="mt-4 text-xs font-semibold uppercase tracking-wider text-blue-600 hover:underline">
          ← Return to search
        </button>
      </div>
    );
  }

  // --- HÀM HIỂN THỊ CHI TIẾT ĐƯỜNG BAY ĐÃ CHỌN (CHUẨN STYLE FLIGHT ROW) ---
  const renderFlightDetails = (flight: FlightOption, title: string) => {
    return (
      <div className="border border-gray-300 bg-white rounded-none mb-6 shadow-sm">
        
        {/* Tiêu đề Chiều đi / Chiều về */}
        <div className="bg-gray-100 border-b border-gray-300 px-5 py-3 flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-700 uppercase tracking-widest">
            {title}
          </span>
        </div>

        {/* Danh sách các chặng bay */}
        <div className="p-6">
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
                      <span className="text-xs text-gray-400 font-normal ml-2">{formatDate(seg.departure_airport.time)}</span>
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
                      {seg.overnight && <span className="text-xs text-red-600 font-bold ml-2">+1 day</span>}
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
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-300">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Review Selected Itinerary</h2>
          <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Verify flight segments and choose a booking provider</p>
        </div>
        <button 
          onClick={onReset}
          className="text-xs font-semibold uppercase tracking-wider text-blue-600 hover:underline"
        >
          Start Over
        </button>
      </div>

      {/* ==========================================
          PHẦN 1: HIỂN THỊ CHI TIẾT ĐƯỜNG BAY (CHẶNG, LAYOVER)
      ========================================== */}
      <div className="mb-10">
        {outbound && renderFlightDetails(outbound, 'Outbound Itinerary')}
        {returnFlight && renderFlightDetails(returnFlight, 'Return Itinerary')}
      </div>

      {/* ==========================================
          PHẦN 2: CHỌN NHÀ CUNG CẤP (BOOKING OPTIONS)
      ========================================== */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Available Booking Providers</h3>
        
        <div className="border border-gray-300 bg-white rounded-none">
          {bookingData.map((option, i) => {
            const provider = option.together || option.departing;
            if (!provider) return null;
            const req = provider.booking_request;

            return (
              <div key={i} className="flex items-center justify-between p-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
                
                <div className="flex items-center gap-4">
                  {provider.airline_logos ? (
                    <img src={provider.airline_logos[0]} alt="Logo" className="w-8 h-8 object-contain bg-white border border-gray-200 p-0.5" />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs">
                      {provider.book_with?.[0] || 'P'}
                    </div>
                  )}
                  <div>
                    <div className="text-[14px] font-bold text-gray-900">{provider.book_with}</div>
                    <div className="text-[12px] text-gray-500">{provider.option_title || 'Standard Verified Fare'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <span className="text-lg font-bold text-gray-900">
                    {provider.price && provider.price > 0 ? (
                      `$${provider.price}`
                    ) : (
                      <span className="text-xs font-normal text-stone-400 uppercase tracking-widest">Price on request</span>
                    )}
                  </span>
                  
                  {req?.post_data ? (
                    <form action={req.url} method="POST" target="_blank">
                      <input type="hidden" name="u" value={req.post_data.replace('u=', '')} />
                      <button type="submit" className="bg-gray-900 hover:bg-black text-white px-5 py-2 text-xs uppercase tracking-wider font-semibold transition-colors rounded-none">
                        Select
                      </button>
                    </form>
                  ) : (
                    <a href={req?.url || '#'} target="_blank" rel="noopener noreferrer" className="bg-gray-900 hover:bg-black text-white px-5 py-2 text-xs uppercase tracking-wider font-semibold transition-colors rounded-none inline-block">
                      Select
                    </a>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}