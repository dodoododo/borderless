import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchOutboundFlights, searchReturnFlights, getBookingOptions } from '../api/FlightSearchService';
import type { FlightSearchParams, FlightOption, PriceInsights } from '../types/types';
import SearchForm from '../components/flight/SearchForm';
import FlightResultsPage from './FlightResultsPage';
import BookingPage from './BookingPage';

type AppStep = 'search' | 'outbound' | 'return' | 'multicity-overview' | 'booking';

export default function FlightApp() {
  const [searchParams, setSearchParams] = useSearchParams();
  const prefillOrigin = searchParams.get('origin') || '';
  const prefillDest = searchParams.get('dest') || '';
  
  const step = (searchParams.get('step') as AppStep) || 'search';
  const bookingId = searchParams.get('id');

  // Đọc thêm tham số origin và dest từ URL nếu có (VD: /flights?origin=vce&dest=ist)
  const urlOrigin = searchParams.get('origin');
  const urlDest = searchParams.get('dest');

  const [priceInsights, setPriceInsights] = useState<PriceInsights | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [params, setParams] = useState<FlightSearchParams>({
    departure_id: '', arrival_id: '',
    outbound_date: '', return_date: '',
    flight_type: '1', travel_class: '1', currency: '', use_cache: true
  });

  const [outboundFlights, setOutboundFlights] = useState<FlightOption[]>([]);
  const [returnFlights, setReturnFlights] = useState<FlightOption[]>([]);
  const [bookingData, setBookingData] = useState<any[]>([]);
  
  const [selectedOutbound, setSelectedOutbound] = useState<FlightOption | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<FlightOption | null>(null);

  // Safeguard: Nếu user f5 ở bước giữa mà mất data
  useEffect(() => {
    if (step === 'outbound' && outboundFlights.length === 0 && !loading && !urlOrigin) {
      setSearchParams({}); 
    }
    if (step === 'return' && (!selectedOutbound || returnFlights.length === 0)) {
      setSearchParams({});
    }
  }, [step, outboundFlights.length, returnFlights.length, selectedOutbound, setSearchParams, loading, urlOrigin]);

  // URL-Driven Booking Fetch
  useEffect(() => {
    if (step === 'booking' && bookingId && bookingData.length === 0) {
      const fetchBooking = async () => {
        setLoading(true);
        try {
          const res = await getBookingOptions(params, bookingId);
          setBookingData(res.data.booking_options || []);
        } catch (e: any) {
          setError(e.message || 'Failed to load booking options.');
        }
        setLoading(false);
      };
      fetchBooking();
    }
  }, [step, bookingId, params, bookingData.length]);

  const handleSearch = async (newParams: FlightSearchParams) => {
    setParams(newParams);
    setLoading(true);
    setError('');
    try {
      if (newParams.flight_type === '3') {
        setSearchParams({ step: 'multicity-overview' });
      } else {
        const res = await searchOutboundFlights(newParams);
        setOutboundFlights([...(res.data.best_flights || []), ...(res.data.other_flights || [])]);
        setPriceInsights(res.data.price_insights);
        
        // Giữ lại origin và dest trên URL kết hợp với step outbound
        setSearchParams({ 
          step: 'outbound', 
          origin: newParams.departure_id.toLowerCase(), 
          dest: newParams.arrival_id.toLowerCase() 
        });
      }
    } catch (e: any) { setError(e.message || 'Failed to fetch flights.'); }
    setLoading(false);
  };

  const handleSelectOutbound = async (flight: FlightOption) => {
    setSelectedOutbound(flight);
    
    if (params.flight_type === '2') {
      if (!flight.booking_token) return setError('Missing booking token.');
      setSearchParams({ step: 'booking', id: flight.booking_token });
    } else {
      if (!flight.departure_token) return setError('Missing departure token.');
      setLoading(true);
      try {
        const res = await searchReturnFlights(params, flight.departure_token);
        setReturnFlights([...(res.data.best_flights || []), ...(res.data.other_flights || [])]);
        
        setSearchParams({ 
          step: 'return', 
          origin: params.departure_id.toLowerCase(), 
          dest: params.arrival_id.toLowerCase() 
        });
      } catch (e: any) { setError(e.message); }
      setLoading(false);
    }
  };

  const handleSelectReturn = async (flight: FlightOption) => {
    setSelectedReturn(flight);
    if (!flight.booking_token) return setError('Missing booking token.');
    setSearchParams({ step: 'booking', id: flight.booking_token });
  };

  const startOver = () => {
    setSelectedOutbound(null);
    setSelectedReturn(null);
    setBookingData([]);
    setSearchParams({}); 
  };

  return (
    <div className="min-h-dvh bg-white text-[#202124] font-sans">
      
      {/* ==========================================
          HEADER / HERO SECTION 
      ========================================== */}
      <div 
        className={`transition-all duration-500 ease-in-out ${
          step === 'search' 
            ? 'pt-8 md:pt-16' 
            : 'py-4 md:py-6 shadow-sm sticky top-0 bg-white z-20 border-b border-gray-200'
        }`}
      >
        {/* Background Gradient mờ ảo (Chỉ hiện ở màn hình Search chính) */}
        {step === 'search' && (
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[100%] rounded-full bg-blue-100/40 blur-[100px]"></div>
            <div className="absolute top-[20%] right-[-5%] w-[40%] h-[80%] rounded-full bg-indigo-50/60 blur-[100px]"></div>
          </div>
        )}

        <div className={`mx-auto relative z-10 ${step === 'search' ? 'px-2 sm:px-4 md:px-24 lg:px-32 xl:px-40' : 'px-3 md:px-4 max-w-[1440px]'}`}>
          
          {/* Bọc SearchForm trong một khung nổi bật khi ở màn hình chính */}
          <div className={`${
            step === 'search' 
              ? 'bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-gray-100 p-3 md:p-4' 
              : ''
          }`}>
            { step === 'search' ? 
              <h1 className="text-2xl md:text-[30px] leading-tight font-medium text-gray-900 mb-4 tracking-tight pl-1 md:pl-0">
                Book Flights
              </h1> : 
              ''
            }
            <SearchForm 
              params={params} 
              onSearch={handleSearch} 
              initialDeparture={prefillOrigin} 
              initialArrival={prefillDest} 
              compact={step !== 'search'} 
              loading={loading} 
            />
          </div>

        </div>
      </div>

      <main className="w-full max-w-[1440px] mx-auto px-3 md:px-4 py-6 md:py-8">
        {error && (
          <div className="mb-6 p-3 md:p-4 border border-[#FAD2CF] bg-[#FCE8E6] text-[#A50E0E] rounded-md text-[14px] md:text-[15px]">
            {error}
          </div>
        )}

        {/* LOADING STATE KHI LINK TỪ NGOÀI VÀO TỰ ĐỘNG SEARCH */}
        {loading && step === 'search' && (
          <div className="py-20 text-center text-gray-500 font-medium px-4">
            Fetching live flight schedules from {params.departure_id} → {params.arrival_id}
          </div>
        )}

        {step === 'outbound' && (
          <FlightResultsPage 
            title={`Choose an outbound flight to ${params.arrival_id}`}
            flights={outboundFlights} 
            loading={loading} 
            onSelect={handleSelectOutbound} 
            priceInsights={priceInsights}
          />
        )}

        {step === 'return' && (
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            
            {/* SIDEBAR: YOUR SELECTION CHI TIẾT CHIỀU ĐI (Đưa lên trên ở Mobile) */}
            <div className="w-full lg:w-96 shrink-0 order-1 lg:order-2">
              <div className="static lg:sticky top-32 border border-gray-300 bg-white rounded-xl lg:rounded-none p-4 lg:p-6 shadow-sm">
                
                <div className="flex items-center justify-between pb-3 lg:pb-4 border-b border-gray-200 mb-4 lg:mb-5">
                  <h3 className="text-[11px] lg:text-[12px] font-bold text-gray-500 uppercase tracking-widest">
                    Your Selection
                  </h3>
                  <span className="text-[11px] lg:text-[12px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-200 uppercase">
                    Outbound Flight
                  </span>
                </div>

                {selectedOutbound && (() => {
                  const firstSeg = selectedOutbound.flights[0];
                  const lastSeg = selectedOutbound.flights[selectedOutbound.flights.length - 1];
                  const stops = selectedOutbound.flights.length - 1;

                  return (
                    <div className="space-y-4 lg:space-y-5">
                      <div>
                        <div className="text-[12px] lg:text-[13px] text-gray-500 font-medium uppercase tracking-wider">Route</div>
                        <div className="text-[15px] lg:text-[16px] font-bold text-gray-900 mt-0.5 flex items-center gap-2">
                          <span>{firstSeg.departure_airport.id}</span>
                          <span className="text-gray-400 font-normal">→</span>
                          <span>{lastSeg.arrival_airport.id}</span>
                          <span className="text-[11px] lg:text-xs text-gray-500 font-normal ml-auto">{params.outbound_date}</span>
                        </div>
                      </div>

                      <div className="p-3 lg:p-4 bg-gray-50 border border-gray-200 rounded-lg lg:rounded-none">
                        <div className="flex items-center gap-2 lg:gap-3 mb-3">
                          <img src={firstSeg.airline_logo} alt="Airline" className="w-5 h-5 lg:w-6 lg:h-6 object-contain" />
                          <div>
                            <div className="text-[12px] lg:text-[13px] font-semibold text-gray-900">{firstSeg.airline}</div>
                            <div className="text-[10px] lg:text-[11px] font-mono text-gray-500">{firstSeg.flight_number}</div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[13px] lg:text-[14px] text-gray-900 font-medium pt-3 border-t border-gray-200">
                          <div>
                            <span className="text-base lg:text-lg font-bold">{firstSeg.departure_airport.time.split(' ')[1]}</span>
                            <div className="text-[10px] lg:text-[11px] text-gray-500 font-normal">{firstSeg.departure_airport.id}</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-[10px] lg:text-[11px] text-gray-400 uppercase">{stops === 0 ? 'Direct' : `${stops} stop`}</div>
                            <div className="w-10 lg:w-12 h-[1px] bg-gray-300 my-1 mx-auto"></div>
                            <div className="text-[10px] lg:text-[11px] text-gray-500">{Math.floor(selectedOutbound.total_duration / 60)}h {selectedOutbound.total_duration % 60}m</div>
                          </div>

                          <div className="text-right">
                            <span className="text-base lg:text-lg font-bold">
                              {lastSeg.arrival_airport.time.split(' ')[1]}
                              {lastSeg.overnight && <sup className="text-[10px] text-red-600 ml-0.5">+1</sup>}
                            </span>
                            <div className="text-[10px] lg:text-[11px] text-gray-500 font-normal">{lastSeg.arrival_airport.id}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>

            {/* LIST: Chọn chiều về (Nằm dưới trên Mobile, bên trái trên Desktop) */}
            <div className="flex-1 order-2 lg:order-1">
              <FlightResultsPage 
                title={`Choose a return flight to ${params.departure_id}`}
                flights={returnFlights} 
                loading={loading} 
                onSelect={handleSelectReturn} 
              />
            </div>

          </div>
        )}

        {step === 'booking' && (
          <>
            {loading ? (
              <div className="text-[#5F6368] py-20 text-[14px] md:text-[15px] text-center px-4">Contacting booking providers...</div>
            ) : (
              <BookingPage bookingData={bookingData} itinerary={{outbound: selectedOutbound, return: selectedReturn}} onReset={startOver} />
            )}
          </>
        )}
      </main>
    </div>
  );
}