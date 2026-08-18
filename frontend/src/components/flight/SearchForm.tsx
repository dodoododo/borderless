// src/components/flight/SearchForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import type { FlightSearchParams } from '../../types/types';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { searchAirportsCached, type AirportSuggestion } from '../../api/airport.api';

interface Props {
  params: FlightSearchParams;
  onSearch: (p: FlightSearchParams) => void;
  compact?: boolean;
  loading: boolean;
  initialDeparture?: string; 
  initialArrival?: string;
}

const formatDate = (date: Date | null) => {
  if (!date) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0];
};

function PassengerSelector({ 
  value, 
  onChange 
}: { 
  value: number, 
  onChange: (val: number) => void 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Đóng pop-up khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const increment = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value < 9) onChange(value + 1); // Giới hạn tối đa 9 khách
  };

  const decrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value > 1) onChange(value - 1); // Tối thiểu 1 khách
  };

  return (
    <div className="w-full flex-1 relative z-40" ref={wrapperRef}>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">Passengers</label>
      
      {/* Nút bấm hiển thị trạng thái */}
      <div 
        className={`flex items-center justify-between w-full h-[48px] border rounded-lg px-3 bg-white text-[15px] font-semibold text-gray-900 cursor-pointer transition-all ${
          isOpen ? 'border-[#00604A] ring-1 ring-[#00604A]' : 'border-gray-300 hover:border-gray-400'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{value} Adult{value > 1 ? 's' : ''}</span>
        <svg className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>

      {/* Pop-up thả xuống */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-full min-w-[280px] bg-white border border-gray-200 shadow-xl rounded-2xl p-5 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-gray-900 text-base">Adults</div>
              <div className="text-sm text-gray-500">Age 12+</div>
            </div>
            
            {/* Cụm nút + / - */}
            <div className="flex items-center gap-4">
              <button 
                type="button" // Rất quan trọng để không kích hoạt Submit Form
                onClick={decrement}
                disabled={value <= 1}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-[#00604A] hover:text-[#00604A] disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:text-gray-600 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
              
              <span className="font-bold text-gray-900 w-4 text-center text-lg">{value}</span>
              
              <button 
                type="button"
                onClick={increment}
                disabled={value >= 9}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-[#00604A] hover:text-[#00604A] disabled:opacity-30 transition-colors cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AutocompleteInput({ 
  value, // Đây luôn luôn là Mã IN HOA (VD: SGN, IST)
  onChange,
  initialValue,
  placeholder
}: { 
  value: string, 
  onChange: (val: string) => void,
  initialValue?: string,
  placeholder: string
}) {
  // `term` dùng để hiển thị trên ô input (có thể là tên thành phố, hoặc mã nhập tay)
  const [term, setTerm] = useState(initialValue || value);
  const [suggestions, setSuggestions] = useState<AirportSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [specialNote, setSpecialNote] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  // Flag để biết user đang bấm vào input hay không
  const [isFocused, setIsFocused] = useState(false); 
  const skipSearchRef = useRef(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Nhận initialValue (khi link từ trang khác sang)
  useEffect(() => {
    if (initialValue) {
      setTerm(initialValue);
    }
  }, [initialValue]);

  // Đồng bộ term khi value bị đổi từ bên ngoài (Bấm nút Swap)
  useEffect(() => {
    if (value && !isFocused) { // Chỉ đổi nếu user không đang gõ
      setTerm(value);
    }
  }, [value, isFocused]);

  // Click ra ngoài thì đóng Pop-up và tắt Focus
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Gọi API Debounce - CHỈ GỌI KHI ĐƯỢC FOCUS VÀ ĐANG GÕ
  useEffect(() => {
    if (skipSearchRef.current) { skipSearchRef.current = false; return; }
    
    // Nếu không Focus, hoặc chuỗi < 2 ký tự thì dọn dẹp và ngưng
    if (!isFocused || term.trim().length < 2) { 
      setSuggestions([]); 
      setSpecialNote("");
      return; 
    }

    const delay = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await searchAirportsCached(term);
        setSuggestions(res.data || []);
        setSpecialNote(res.special_note || "");
        setIsOpen(true);
      } catch (err) {
        console.error("Lỗi khi load danh sách sân bay:", err);
      } finally {
        setIsLoading(false);
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [term, isFocused]); // Thêm isFocused vào dependency

  // Logic gom nhóm (Group) theo Thành phố / Quốc gia (Giữ y chang bản gốc của anh)
  const groupedSuggestions = React.useMemo(() => {
    const groups: Record<string, { cityNode: any, airports: any[] }> = {};
    
    suggestions.forEach(item => {
      const key = `${item.city}, ${item.country}`; 
      if (!groups[key]) groups[key] = { cityNode: null, airports: [] };
      
      if (item.type === 'city') {
        groups[key].cityNode = item;
      } else {
        groups[key].airports.push(item);
      }
    });

    Object.values(groups).forEach(group => {
      if (group.airports.length === 0 && group.cityNode) {
        group.airports.push({
          ...group.cityNode,
          type: 'airport',
          name: group.cityNode.main_airport_name || `${group.cityNode.name} Airport`
        });
      }
    });

    return groups;
  }, [suggestions]);

  // Tự động mở group đầu tiên
  useEffect(() => {
    if (suggestions.length > 0) {
      const firstCity = `${suggestions[0].city}, ${suggestions[0].country}`;
      setExpandedGroups({ [firstCity]: true });
    } else {
      setExpandedGroups({});
    }
  }, [suggestions]);

  const toggleGroup = (cityName: string) => {
    setExpandedGroups(prev => ({ ...prev, [cityName]: !prev[cityName] }));
  };

  const handleSelect = (airport: AirportSuggestion) => {
    skipSearchRef.current = true; 
    // Ghi tên thành phố và mã để user thấy đẹp mắt (VD: "Ho Chi Minh City (SGN)")
    setTerm(`${airport.city} (${airport.code})`);
    
    // Gửi MÃ IN HOA lên form cha để gọi API
    onChange(airport.code.toUpperCase()); 
    
    setIsOpen(false); 
    setIsFocused(false);
  };

  return (
    <div className="flex-1 relative w-full" ref={wrapperRef}>
      {/* Ô Input có Icon máy bay (UI Mytrip) */}
      <div className="relative flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden focus-within:border-[#00604A] focus-within:ring-1 focus-within:ring-[#00604A] transition-all h-[48px]">
        <div className="pl-3 text-gray-500">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.7l-1.2 3.6 7.6 4.4-2.7 2.7-3.9-.9-.9 1.1 3 3.6 3.6 3 1.1-.9-.9-3.9 2.7-2.7 4.4 7.6 3.6-1.2c.5-.2.8-.6.7-1.1z"></path></svg>
        </div>
        <input 
          type="text"
          className="w-full py-2 px-3 text-[15px] outline-none bg-transparent text-gray-900" 
          value={term} 
          onChange={e => { 
            skipSearchRef.current = false; 
            setTerm(e.target.value); 
            // Nếu user tự gõ, truyền thẳng chữ hoa lên (đề phòng bấm Search luôn)
            onChange(e.target.value.toUpperCase()); 
          }}
          onFocus={() => {
            setIsFocused(true);
            if (term.length >= 2) setIsOpen(true);
          }} 
          required
          placeholder={placeholder}
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute right-3">
            <div className="w-4 h-4 border-2 border-[#00604A] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      
      {/* DROPDOWN KẾT QUẢ GOM NHÓM THEO THÀNH PHỐ */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[300px] z-50 bg-white border border-gray-200 shadow-xl rounded-lg overflow-hidden">
          
          {specialNote && (
            <div className="bg-amber-50 px-4 py-2 border-b border-amber-100 text-amber-800 text-xs font-medium leading-relaxed">
              💡 {specialNote}
            </div>
          )}

          {suggestions.length === 0 && !isLoading ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No results found for "{term}"
            </div>
          ) : (
            <div className="max-h-[350px] overflow-y-auto">
              {Object.entries(groupedSuggestions).map(([fullCityName, group]) => {
                const isExpanded = expandedGroups[fullCityName];
                
                return (
                  <div key={fullCityName} className="border-b border-gray-100 last:border-0">
                    
                    {/* Header Thành phố */}
                    <div 
                      className="px-4 py-3 bg-[#F8F9FA] hover:bg-[#F1F3F4] cursor-pointer flex items-center justify-between transition-colors"
                      onClick={() => toggleGroup(fullCityName)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="opacity-40 text-gray-900">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-[14px]">{fullCityName}</div>
                          <div className="text-[11px] text-gray-500 uppercase tracking-wider mt-0.5">All Airports</div>
                        </div>
                      </div>
                      <div className="text-gray-400">
                        {isExpanded ? (
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                        ) : (
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        )}
                      </div>
                    </div>

                    {/* Danh sách Sân bay bên trong */}
                    {isExpanded && (
                      <ul className="bg-white">
                        {group.airports.map((airport, idx) => (
                          <li 
                            key={`${airport.code}-${idx}`} 
                            className="px-4 py-3 pl-12 hover:bg-teal-50 cursor-pointer border-t border-gray-50 transition-colors flex items-start gap-3 group"
                            onClick={() => handleSelect(airport)}
                          >
                            <div className="mt-0.5 text-[#00604A] opacity-60 group-hover:opacity-100 shrink-0 transition-opacity">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.7l-1.2 3.6 7.6 4.4-2.7 2.7-3.9-.9-.9 1.1 3 3.6 3.6 3 1.1-.9-.9-3.9 2.7-2.7 4.4 7.6 3.6-1.2c.5-.2.8-.6.7-1.1z"></path></svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-0.5">
                                <span className="font-semibold text-gray-900 text-[14px] pr-2">
                                  {airport.name}
                                </span>
                                <span className="text-[11px] font-mono bg-gray-100 text-gray-700 group-hover:bg-[#00604A] group-hover:text-white px-1.5 py-0.5 rounded shrink-0 font-bold transition-colors">
                                  {airport.code}
                                </span>
                              </div>
                              <div className="text-[11px] text-gray-500 truncate">
                                {airport.country}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ... (Các phần import và AutocompleteInput, PassengerSelector giữ nguyên ở trên) ...

export default function SearchForm({ params: initialParams, onSearch, compact, loading, initialDeparture, initialArrival }: Props) {
  const [params, setParams] = useState(initialParams);
  const [passengerCount, setPassengerCount] = useState(1);
  const [formError, setFormError] = useState(""); // Thêm state quản lý lỗi
  const [isDirectOnly, setIsDirectOnly] = useState(false);
  useEffect(() => {
    if (initialDeparture || initialArrival) {
      setParams(prev => ({ ...prev, departure_id: initialDeparture || prev.departure_id, arrival_id: initialArrival || prev.arrival_id }));
    }
  }, [initialDeparture, initialArrival]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(""); // Reset lỗi mỗi lần bấm search

    // 1. Kiểm tra Mã Sân Bay (Phải đúng 3 chữ cái IATA Code)
    const iataRegex = /^[A-Z]{3}$/;
    
    if (!params.departure_id || !iataRegex.test(params.departure_id)) {
      setFormError("Please select a valid Origin from the dropdown (e.g., SGN).");
      return;
    }
    if (!params.arrival_id || !iataRegex.test(params.arrival_id)) {
      setFormError("Please select a valid Destination from the dropdown (e.g., IST).");
      return;
    }
    
    // 2. Điểm đi và đến không được trùng nhau
    if (params.departure_id === params.arrival_id) {
      setFormError("Origin and destination cannot be the same.");
      return;
    }

    // 3. Kiểm tra Ngày (Nếu khứ hồi thì phải có ngày về)
    if (!params.outbound_date) {
      setFormError("Please select a departure date.");
      return;
    }
    if (params.flight_type === '1' && !params.return_date) {
      setFormError("Please select a return date for round trips.");
      return;
    }

    // Nếu tất cả hợp lệ, gửi data đi (Kèm theo số lượng khách)
    onSearch({
      ...params,
      adults: passengerCount // Gửi số khách lên API (SerpApi dùng param 'adults')
    });
  };

  // NẾU LÀ GIAO DIỆN COMPACT (THU GỌN TRÊN THANH MENU)
  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="w-full relative font-sans">
        {formError && (
          <div className="absolute top-full left-0 mt-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-xs w-full z-50 shadow-lg">
            ⚠️ {formError}
          </div>
        )}

        <div className="flex flex-wrap lg:flex-nowrap items-center gap-4">
          
          {/* 1. Điểm Đi & Đến */}
          <div className="flex items-center gap-1 flex-1 min-w-[240px]">
            <div className="flex-1">
              <AutocompleteInput value={params.departure_id} placeholder="From" initialValue={initialDeparture} onChange={(code) => setParams({...params, departure_id: code})} />
            </div>
            
            <div 
              className="p-2 text-gray-400 hover:text-[#00604A] cursor-pointer transition-transform hover:rotate-180"
              onClick={() => setParams(prev => ({ ...prev, departure_id: prev.arrival_id, arrival_id: prev.departure_id }))}
              title="Swap"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10L3 14L7 18"/><path d="M21 10H3"/><path d="M17 6L21 10L17 14"/><path d="M3 14H21"/></svg>
            </div>

            <div className="flex-1">
              <AutocompleteInput value={params.arrival_id} placeholder="To" initialValue={initialArrival} onChange={(code) => setParams({...params, arrival_id: code})} />
            </div>
          </div>

          {/* 2. Ngày Đi & Về (Compact) */}
          <div className="flex items-center gap-4 flex-1 min-w-[220px]">
            <div className="w-full relative border border-gray-300 rounded-lg h-[48px] bg-white flex items-center px-2">
              <DatePicker 
                selected={params.outbound_date ? new Date(params.outbound_date) : new Date()}
                onChange={(date: any) => setParams({ ...params, outbound_date: formatDate(date) })}
                monthsShown={2} 
                minDate={new Date()}
                dateFormat="YYYY/MM/dd"
                className="w-full text-[13px] font-semibold text-gray-900 outline-none bg-transparent cursor-pointer"
                popperClassName="z-[100]"
              />
            </div>

            {params.flight_type === '1' && (
              <div className="w-full relative border border-gray-300 rounded-lg h-[48px] bg-white flex items-center px-2">
                <DatePicker 
                  selected={params.return_date ? new Date(params.return_date) : null}
                  onChange={(date: any) => setParams({ ...params, return_date: formatDate(date) })}
                  monthsShown={2} 
                  minDate={params.outbound_date ? new Date(params.outbound_date) : new Date()}
                  dateFormat="YYYY/MM/dd"
                  placeholderText="Return"
                  className="w-full text-[13px] font-semibold text-gray-900 outline-none bg-transparent cursor-pointer"
                  popperClassName="z-[100]"
                />
              </div>
            )}
          </div>

          {/* 3. Hành khách & Hạng ghế thu gọn */}
          <div className="w-[150px] shrink-0 relative">
            <select 
              value={params.travel_class}
              onChange={e => setParams({...params, travel_class: e.target.value as '1' | '2' | '3' | '4'})}
              className="w-full h-[48px] border border-gray-300 rounded-lg pl-3 pr-8 bg-white text-[13px] font-semibold text-gray-900 outline-none focus:border-[#00604A] cursor-pointer appearance-none"
            >
              <option value="1">Economy</option>
              <option value="2">Premium</option>
              <option value="3">Business</option>
              <option value="4">First</option>
            </select>
            
            {/* Custom Icon Mũi tên nhỏ tinh tế để không bị phụ thuộc vào trình duyệt */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>

          {/* 4. Nút Search */}
          <button 
            disabled={loading}
            className="bg-[#00604A] hover:bg-[#004a39] text-white px-6 h-[48px] rounded-lg text-[14px] font-bold transition-colors disabled:bg-gray-400 whitespace-nowrap"
          >
            {loading ? '...' : 'Search'}
          </button>
        </div>
      </form>
    );
  }

  // GIAO DIỆN FULL TẠI TRANG CHỦ MÔ PHỎNG HÌNH ẢNH MYTRIP
  return (
    <form onSubmit={handleSubmit} className="w-full font-sans">
      
      {/* Hiển thị lỗi nếu Validation thất bại */}
      {formError && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <span className="font-medium">{formError}</span>
        </div>
      )}

      {/* RADIOS */}
      <div className="flex gap-6 mb-5">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input type="radio" name="type" checked={params.flight_type === '1'} onChange={() => setParams({...params, flight_type: '1'})} className="w-4 h-4 accent-[#00604A]" /> 
          <span className="text-sm font-medium text-gray-700">Return</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer group">
          <input type="radio" name="type" checked={params.flight_type === '2'} onChange={() => {
            setParams({...params, flight_type: '2', return_date: ''}); // Reset ngày về khi đổi sang 1 chiều
            setFormError(""); // Tắt lỗi nếu có
          }} className="w-4 h-4 accent-[#00604A]" /> 
          <span className="text-sm font-medium text-gray-700">One-Way</span>
        </label>
      </div>

      <div className="flex flex-col gap-4">
        
        {/* ROW 1: Từ -> Đến & Nút Tìm kiếm */}
        <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
          
          <div className="flex flex-1 flex-col lg:flex-row items-end gap-2">
            <div className="w-full flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">From</label>
              <AutocompleteInput value={params.departure_id} placeholder="Origin city or airport" initialValue={initialDeparture} onChange={(code) => setParams({...params, departure_id: code})} />
            </div>

            {/* Icon Đảo Ngược */}
            <div 
              className="hidden lg:flex items-center justify-center p-2 mb-1 text-gray-400 hover:text-[#00604A] cursor-pointer transition-all duration-300 hover:rotate-180 active:scale-90"
              onClick={() => {
                setParams(prev => ({
                  ...prev,
                  departure_id: prev.arrival_id,
                  arrival_id: prev.departure_id
                }));
              }}
              title="Swap origin and destination"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10L3 14L7 18"/><path d="M21 10H3"/><path d="M17 6L21 10L17 14"/><path d="M3 14H21"/></svg>
            </div>

            <div className="w-full flex-1 mt-2 lg:mt-0">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">To</label>
              <AutocompleteInput value={params.arrival_id} placeholder="Destination city or airport" initialValue={initialArrival} onChange={(code) => setParams({...params, arrival_id: code})} />
            </div>
          </div>

          <div className="w-full lg:w-auto mt-4 lg:mt-0">
            <button 
              disabled={loading}
              className="w-full lg:w-44 bg-[#00604A] hover:bg-[#004a39] text-white rounded-lg h-[48px] text-[15px] font-bold shadow-sm transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Searching...' : 'Search flights'}
            </button>
          </div>
        </div>

        {/* ROW 2: Ngày tháng, Hành khách, Hạng vé */}
        <div className="flex flex-col lg:flex-row gap-4 mt-2">
          
          {/* === KHOANG 2: DATE PICKERS === */}
          <div className="flex flex-1 gap-2 relative">
            
            {/* Ô DEPARTURE */}
            <div className="w-full flex-1 relative">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Departure</label>
              <div className="relative border border-gray-300 rounded-lg h-[48px] focus-within:border-[#00604A] focus-within:ring-1 focus-within:ring-[#00604A] transition-all bg-white overflow-visible">
                <DatePicker 
                  selected={params.outbound_date ? new Date(params.outbound_date) : new Date()}
                  onChange={(date: any) => {
                    setParams({ ...params, outbound_date: formatDate(date) });
                    if (params.flight_type === '1') {
                      setTimeout(() => document.getElementById('return-date-picker')?.focus(), 100);
                    }
                  }}
                  monthsShown={2} 
                  minDate={new Date()}
                  selectsStart
                  startDate={params.outbound_date ? new Date(params.outbound_date) : new Date()}
                  endDate={params.return_date ? new Date(params.return_date) : undefined}
                  dateFormat="EEE, MMM dd"
                  className="w-full h-[48px] px-3 text-[15px] font-semibold text-gray-900 outline-none bg-transparent cursor-pointer z-50"
                  popperClassName="z-[100]" 
                  popperPlacement="bottom-start"
                  required
                />
                <svg className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </div>
            </div>
            
            {/* Ô RETURN */}
            <div className="w-full flex-1 relative">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Return</label>
              <div className={`relative border rounded-lg h-[48px] overflow-visible transition-all ${params.flight_type === '2' ? 'bg-gray-100 border-gray-200 opacity-60' : 'border-gray-300 bg-white focus-within:border-[#00604A] focus-within:ring-1 focus-within:ring-[#00604A]'}`}>
                <DatePicker 
                  id="return-date-picker" 
                  selected={params.return_date ? new Date(params.return_date) : null}
                  onChange={(date: any) => setParams({ ...params, return_date: formatDate(date) })}
                  disabled={params.flight_type === '2'}
                  monthsShown={2} 
                  minDate={params.outbound_date ? new Date(params.outbound_date) : new Date()}
                  selectsEnd
                  startDate={params.outbound_date ? new Date(params.outbound_date) : new Date()}
                  endDate={params.return_date ? new Date(params.return_date) : undefined}
                  dateFormat="EEE, MMM dd"
                  placeholderText={params.flight_type === '2' ? "One way" : "Add return"}
                  className="w-full h-[48px] px-3 text-[15px] font-semibold text-gray-900 outline-none bg-transparent cursor-pointer disabled:cursor-not-allowed z-50"
                  popperClassName="z-[100]" 
                  popperPlacement="bottom-start"
                  required={params.flight_type === '1'}
                />
                <svg className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </div>
            </div>

          </div>

          {/* Hành khách & Hạng ghế */}
          <div className="flex flex-1 gap-4 items-end">
             <PassengerSelector 
                value={passengerCount} 
                onChange={setPassengerCount} 
             />
             
             {/* 3. Hành khách & Hạng ghế thu gọn */}
              <div className="w-[200px] shrink-0 relative">
                <select 
                  value={params.travel_class}
                  onChange={e => setParams({...params, travel_class: e.target.value as '1' | '2' | '3' | '4'})}
                  className="w-full h-[49px] border border-gray-300 rounded-lg pl-3 pr-8 bg-white text-[13px] font-semibold text-gray-900 outline-none focus:border-[#00604A] cursor-pointer appearance-none"
                >
                  <option value="1">Economy</option>
                  <option value="2">Premium</option>
                  <option value="3">Business</option>
                  <option value="4">First</option>
                </select>
                
                {/* Custom Icon Mũi tên nhỏ tinh tế để không bị phụ thuộc vào trình duyệt */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>
             {/* Checkbox */}
             <div className="hidden xl:flex items-center gap-2 h-[48px] px-2 w-full flex-1">
                <input type="checkbox" className="w-4 h-4 accent-[#00604A] cursor-pointer rounded" />
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap cursor-pointer">Direct only</span>
             </div>
          </div>

        </div>
      </div>
    </form>
  );
}