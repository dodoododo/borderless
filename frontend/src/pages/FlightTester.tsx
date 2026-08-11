// src/components/FlightTester.tsx
import React, { useState } from 'react';
import { searchOutboundFlights, searchReturnFlights, getBookingOptions, type FlightSearchParams } from '../api/FlightSearchService';
import FlightResultsDisplay, { type FlightOption } from '../components/FlightResultsDisplay';
import BookingOptionsDisplay from '../components/BookingOptionsDisplay';

export default function FlightTester() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [params, setParams] = useState<FlightSearchParams>({
    departure_id: 'SGN', arrival_id: 'IST', 
    outbound_date: '2026-09-18', return_date: '2026-09-25',
    flight_type: '1', travel_class: '1', currency: 'USD', use_cache: true
  });

  // Data States
  const [outboundData, setOutboundData] = useState<FlightOption[]>([]);
  const [returnData, setReturnData] = useState<FlightOption[]>([]);
  const [bookingData, setBookingData] = useState<any[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(3000);

  // === STEP 1: TÌM CHUYẾN ĐI ===
  const handleSearchOutbound = async () => {
    setLoading(true); setError('');
    try {
      const res = await searchOutboundFlights(params);
      const flights = [...(res.data.best_flights || []), ...(res.data.other_flights || [])];
      setOutboundData(flights);
      setStep(1);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  // === STEP 2: CHỌN CHUYẾN ĐI ===
  const handleSelectOutbound = async (flight: FlightOption) => {
    if (params.flight_type === '2') {
      if (!flight.booking_token) return setError('Lỗi: Chuyến đi một chiều không có booking_token');
      await fetchBookingOptions(flight.booking_token);
    } else {
      if (!flight.departure_token) return setError('Lỗi: Chuyến đi không cung cấp departure_token để tìm chuyến về');
      setLoading(true); setError('');
      try {
        // 🔹 TRUYỀN THÊM params
        const res = await searchReturnFlights(params, flight.departure_token); 
        const flights = [...(res.data.best_flights || []), ...(res.data.other_flights || [])];
        setReturnData(flights);
        setStep(2);
      } catch (e: any) { setError(e.message); }
      setLoading(false);
    }
  };

  // === STEP 3: CHỌN CHUYẾN VỀ (Dành cho Khứ hồi) ===
  const handleSelectReturn = async (flight: FlightOption) => {
    if (!flight.booking_token) return setError('Lỗi: Không tìm thấy booking_token để thanh toán');
    await fetchBookingOptions(flight.booking_token);
  };

  // === FETCH LINK THANH TOÁN ===
  const fetchBookingOptions = async (token: string) => {
    setLoading(true); setError('');
    try {
      // 🔹 TRUYỀN THÊM params
      const res = await getBookingOptions(params, token); 
      setBookingData(res.data.booking_options || []);
      setStep(3);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const resetFlow = () => { setStep(1); setOutboundData([]); setReturnData([]); setBookingData([]); };

  // 🔹 Lọc giá ở Client
  const filteredOutbound = outboundData.filter(f => f.price <= maxPrice);
  const filteredReturn = returnData.filter(f => f.price <= maxPrice);

  return (
    <div className="py-30 max-w-5xl mx-auto bg-stone-950 text-stone-100 px-4 min-h-screen">
      <h1 className="text-3xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 text-center">
        ✈️ BorderLess Flight Engine
      </h1>

      {/* STEPPER UI */}
      <div className="flex items-center justify-center mb-10 text-sm font-semibold">
        <div className={`px-4 py-1 rounded-full border ${step >= 1 ? 'border-blue-500 text-blue-400 bg-blue-900/20' : 'border-stone-700 text-stone-500'}`}>1. Chiều đi</div>
        <div className={`w-10 h-0.5 mx-2 ${step >= 2 ? 'bg-blue-500' : 'bg-stone-800'}`}></div>
        <div className={`px-4 py-1 rounded-full border ${step >= 2 ? 'border-blue-500 text-blue-400 bg-blue-900/20' : 'border-stone-700 text-stone-500'}`}>2. Chiều về</div>
        <div className={`w-10 h-0.5 mx-2 ${step === 3 ? 'bg-blue-500' : 'bg-stone-800'}`}></div>
        <div className={`px-4 py-1 rounded-full border ${step === 3 ? 'border-emerald-500 text-emerald-400 bg-emerald-900/20' : 'border-stone-700 text-stone-500'}`}>3. Thanh toán</div>
      </div>

      {error && <div className="bg-red-900/40 border border-red-800 text-red-300 p-4 rounded-xl mb-6 text-center">{error}</div>}

      {/* TÌM KIẾM (CHỈ HIỆN Ở BƯỚC 1) */}
      <div className={`transition-all duration-300 ${step !== 1 ? 'hidden' : 'block'}`}>
        <div className="bg-stone-900 p-6 rounded-2xl border border-stone-800 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <select className="bg-stone-950 border border-stone-700 p-3 rounded-lg text-white" value={params.flight_type} onChange={(e) => setParams({...params, flight_type: e.target.value})}>
              <option value="1">Khứ hồi</option>
              <option value="2">Một chiều</option>
            </select>
            <input className="bg-stone-950 border border-stone-700 p-3 rounded-lg text-white uppercase" placeholder="Nơi đi (SGN)" value={params.departure_id} onChange={(e) => setParams({...params, departure_id: e.target.value.toUpperCase()})} />
            <input className="bg-stone-950 border border-stone-700 p-3 rounded-lg text-white uppercase" placeholder="Nơi đến (IST)" value={params.arrival_id} onChange={(e) => setParams({...params, arrival_id: e.target.value.toUpperCase()})} />
            <select className="bg-stone-950 border border-stone-700 p-3 rounded-lg text-white" value={params.travel_class} onChange={(e) => setParams({...params, travel_class: e.target.value})}>
              <option value="1">Phổ thông</option>
              <option value="3">Thương gia</option>
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div><label className="text-xs text-stone-400 ml-1">Ngày đi</label><input type="date" className="w-full bg-stone-950 border border-stone-700 p-3 rounded-lg text-white mt-1" value={params.outbound_date} onChange={(e) => setParams({...params, outbound_date: e.target.value})} /></div>
            {params.flight_type === '1' && (
              <div><label className="text-xs text-stone-400 ml-1">Ngày về</label><input type="date" className="w-full bg-stone-950 border border-stone-700 p-3 rounded-lg text-white mt-1" value={params.return_date || ''} onChange={(e) => setParams({...params, return_date: e.target.value})} /></div>
            )}
          </div>

          <div className="flex justify-between items-center border-t border-stone-800 pt-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-stone-400">
              <input type="checkbox" checked={params.use_cache} onChange={(e) => setParams({...params, use_cache: e.target.checked})} className="w-4 h-4 accent-blue-500" /> Dùng Cache (Dev)
            </label>
            <button onClick={handleSearchOutbound} disabled={loading} className="bg-blue-600 hover:bg-blue-500 disabled:bg-stone-700 px-8 py-3 rounded-xl font-bold transition-colors">
              {loading ? "Đang bay..." : "Tìm Chuyến Bay"}
            </button>
          </div>
        </div>

        {/* BỘ LỌC GIÁ */}
        {outboundData.length > 0 && (
          <div className="my-6 bg-stone-900 p-4 rounded-xl border border-stone-800 flex items-center justify-between">
            <span className="text-sm font-semibold">Lọc giá tối đa: <span className="text-emerald-400">${maxPrice}</span></span>
            <input type="range" min="300" max="5000" step="50" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-1/2 accent-emerald-500" />
          </div>
        )}

        {/* LIST CHUYẾN ĐI */}
        {loading ? <div className="text-center py-10 text-stone-400 animate-pulse">Đang quét dữ liệu hãng hàng không...</div> : 
          <FlightResultsDisplay flights={filteredOutbound} onSelect={handleSelectOutbound} btnLabel="Chọn Chuyến Này" />
        }
      </div>

      {/* STEP 2: CHỌN CHUYẾN VỀ */}
      {step === 2 && (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-bold">Lựa chọn chuyến về</h2>
            <button onClick={resetFlow} className="text-stone-400 hover:text-white text-sm bg-stone-800 px-3 py-1 rounded">← Hủy và đổi chuyến đi</button>
          </div>
          {loading ? <div className="text-center py-10 text-stone-400 animate-pulse">Đang tổng hợp giá combo khứ hồi...</div> : 
            <FlightResultsDisplay flights={filteredReturn} onSelect={handleSelectReturn} btnLabel="Chốt Hành Trình" />
          }
        </div>
      )}

      {/* STEP 3: THANH TOÁN */}
      {step === 3 && (
        <BookingOptionsDisplay bookingData={bookingData} onReset={resetFlow} />
      )}

    </div>
  );
}