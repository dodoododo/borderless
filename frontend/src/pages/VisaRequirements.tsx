import React, { useState } from 'react';
import { ArrowRight, Search, Plane, Info, PlaneTakeoff, BookOpen, Compass, Star, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import 'flag-icons/css/flag-icons.min.css';
import { useNavigate } from "react-router-dom";

// --- IMPORT API GỌI DATABASE ---
import { fetchCountryMiniInfo } from "../api/country.api";
import { fetchSingleDestinationStatus } from "../api/passport.api";
import { RankingService } from "../api/ranking.api";

// --- FULL DATA 200+ QUỐC GIA (ISO 3166-1 alpha-2) ---
// Không cần gọi Backend, Frontend tự xử lý siêu tốc 0ms
const COUNTRIES = [
  { iso: 'AF', name: 'Afghanistan' }, { iso: 'AL', name: 'Albania' }, { iso: 'DZ', name: 'Algeria' },
  { iso: 'AD', name: 'Andorra' }, { iso: 'AO', name: 'Angola' }, { iso: 'AG', name: 'Antigua and Barbuda' },
  { iso: 'AR', name: 'Argentina' }, { iso: 'AM', name: 'Armenia' }, { iso: 'AU', name: 'Australia' },
  { iso: 'AT', name: 'Austria' }, { iso: 'AZ', name: 'Azerbaijan' }, { iso: 'BS', name: 'Bahamas' },
  { iso: 'BH', name: 'Bahrain' }, { iso: 'BD', name: 'Bangladesh' }, { iso: 'BB', name: 'Barbados' },
  { iso: 'BY', name: 'Belarus' }, { iso: 'BE', name: 'Belgium' }, { iso: 'BZ', name: 'Belize' },
  { iso: 'BJ', name: 'Benin' }, { iso: 'BT', name: 'Bhutan' }, { iso: 'BO', name: 'Bolivia' },
  { iso: 'BA', name: 'Bosnia and Herzegovina' }, { iso: 'BW', name: 'Botswana' }, { iso: 'BR', name: 'Brazil' },
  { iso: 'BN', name: 'Brunei' }, { iso: 'BG', name: 'Bulgaria' }, { iso: 'BF', name: 'Burkina Faso' },
  { iso: 'BI', name: 'Burundi' }, { iso: 'CV', name: 'Cabo Verde' }, { iso: 'KH', name: 'Cambodia' },
  { iso: 'CM', name: 'Cameroon' }, { iso: 'CA', name: 'Canada' }, { iso: 'CF', name: 'Central African Republic' },
  { iso: 'TD', name: 'Chad' }, { iso: 'CL', name: 'Chile' }, { iso: 'CN', name: 'China' },
  { iso: 'CO', name: 'Colombia' }, { iso: 'KM', name: 'Comoros' }, { iso: 'CG', name: 'Congo' },
  { iso: 'CD', name: 'Congo (DRC)' }, { iso: 'CR', name: 'Costa Rica' }, { iso: 'HR', name: 'Croatia' },
  { iso: 'CU', name: 'Cuba' }, { iso: 'CY', name: 'Cyprus' }, { iso: 'CZ', name: 'Czechia' },
  { iso: 'DK', name: 'Denmark' }, { iso: 'DJ', name: 'Djibouti' }, { iso: 'DM', name: 'Dominica' },
  { iso: 'DO', name: 'Dominican Republic' }, { iso: 'EC', name: 'Ecuador' }, { iso: 'EG', name: 'Egypt' },
  { iso: 'SV', name: 'El Salvador' }, { iso: 'GQ', name: 'Equatorial Guinea' }, { iso: 'ER', name: 'Eritrea' },
  { iso: 'EE', name: 'Estonia' }, { iso: 'SZ', name: 'Eswatini' }, { iso: 'ET', name: 'Ethiopia' },
  { iso: 'FJ', name: 'Fiji' }, { iso: 'FI', name: 'Finland' }, { iso: 'FR', name: 'France' },
  { iso: 'GA', name: 'Gabon' }, { iso: 'GM', name: 'Gambia' }, { iso: 'GE', name: 'Georgia' },
  { iso: 'DE', name: 'Germany' }, { iso: 'GH', name: 'Ghana' }, { iso: 'GR', name: 'Greece' },
  { iso: 'GD', name: 'Grenada' }, { iso: 'GT', name: 'Guatemala' }, { iso: 'GN', name: 'Guinea' },
  { iso: 'GW', name: 'Guinea-Bissau' }, { iso: 'GY', name: 'Guyana' }, { iso: 'HT', name: 'Haiti' },
  { iso: 'HN', name: 'Honduras' }, { iso: 'HK', name: 'Hong Kong' }, { iso: 'HU', name: 'Hungary' },
  { iso: 'IS', name: 'Iceland' }, { iso: 'IN', name: 'India' }, { iso: 'ID', name: 'Indonesia' },
  { iso: 'IR', name: 'Iran' }, { iso: 'IQ', name: 'Iraq' }, { iso: 'IE', name: 'Ireland' },
  { iso: 'IL', name: 'Israel' }, { iso: 'IT', name: 'Italy' }, { iso: 'JM', name: 'Jamaica' },
  { iso: 'JP', name: 'Japan' }, { iso: 'JO', name: 'Jordan' }, { iso: 'KZ', name: 'Kazakhstan' },
  { iso: 'KE', name: 'Kenya' }, { iso: 'KI', name: 'Kiribati' }, { iso: 'KP', name: 'North Korea' },
  { iso: 'KR', name: 'South Korea' }, { iso: 'XK', name: 'Kosovo' }, { iso: 'KW', name: 'Kuwait' },
  { iso: 'KG', name: 'Kyrgyzstan' }, { iso: 'LA', name: 'Laos' }, { iso: 'LV', name: 'Latvia' },
  { iso: 'LB', name: 'Lebanon' }, { iso: 'LS', name: 'Lesotho' }, { iso: 'LR', name: 'Liberia' },
  { iso: 'LY', name: 'Libya' }, { iso: 'LI', name: 'Liechtenstein' }, { iso: 'LT', name: 'Lithuania' },
  { iso: 'LU', name: 'Luxembourg' }, { iso: 'MO', name: 'Macau' }, { iso: 'MG', name: 'Madagascar' },
  { iso: 'MW', name: 'Malawi' }, { iso: 'MY', name: 'Malaysia' }, { iso: 'MV', name: 'Maldives' },
  { iso: 'ML', name: 'Mali' }, { iso: 'MT', name: 'Malta' }, { iso: 'MH', name: 'Marshall Islands' },
  { iso: 'MR', name: 'Mauritania' }, { iso: 'MU', name: 'Mauritius' }, { iso: 'MX', name: 'Mexico' },
  { iso: 'FM', name: 'Micronesia' }, { iso: 'MD', name: 'Moldova' }, { iso: 'MC', name: 'Monaco' },
  { iso: 'MN', name: 'Mongolia' }, { iso: 'ME', name: 'Montenegro' }, { iso: 'MA', name: 'Morocco' },
  { iso: 'MZ', name: 'Mozambique' }, { iso: 'MM', name: 'Myanmar' }, { iso: 'NA', name: 'Namibia' },
  { iso: 'NR', name: 'Nauru' }, { iso: 'NP', name: 'Nepal' }, { iso: 'NL', name: 'Netherlands' },
  { iso: 'NZ', name: 'New Zealand' }, { iso: 'NI', name: 'Nicaragua' }, { iso: 'NE', name: 'Niger' },
  { iso: 'NG', name: 'Nigeria' }, { iso: 'MK', name: 'North Macedonia' }, { iso: 'NO', name: 'Norway' },
  { iso: 'OM', name: 'Oman' }, { iso: 'PK', name: 'Pakistan' }, { iso: 'PW', name: 'Palau' },
  { iso: 'PS', name: 'Palestine' }, { iso: 'PA', name: 'Panama' }, { iso: 'PG', name: 'Papua New Guinea' },
  { iso: 'PY', name: 'Paraguay' }, { iso: 'PE', name: 'Peru' }, { iso: 'PH', name: 'Philippines' },
  { iso: 'PL', name: 'Poland' }, { iso: 'PT', name: 'Portugal' }, { iso: 'QA', name: 'Qatar' },
  { iso: 'RO', name: 'Romania' }, { iso: 'RU', name: 'Russia' }, { iso: 'RW', name: 'Rwanda' },
  { iso: 'KN', name: 'Saint Kitts and Nevis' }, { iso: 'LC', name: 'Saint Lucia' }, 
  { iso: 'VC', name: 'Saint Vincent and the Grenadines' }, { iso: 'WS', name: 'Samoa' },
  { iso: 'SM', name: 'San Marino' }, { iso: 'ST', name: 'Sao Tome and Principe' }, { iso: 'SA', name: 'Saudi Arabia' },
  { iso: 'SN', name: 'Senegal' }, { iso: 'RS', name: 'Serbia' }, { iso: 'SC', name: 'Seychelles' },
  { iso: 'SL', name: 'Sierra Leone' }, { iso: 'SG', name: 'Singapore' }, { iso: 'SK', name: 'Slovakia' },
  { iso: 'SI', name: 'Slovenia' }, { iso: 'SB', name: 'Solomon Islands' }, { iso: 'SO', name: 'Somalia' },
  { iso: 'ZA', name: 'South Africa' }, { iso: 'SS', name: 'South Sudan' }, { iso: 'ES', name: 'Spain' },
  { iso: 'LK', name: 'Sri Lanka' }, { iso: 'SD', name: 'Sudan' }, { iso: 'SR', name: 'Suriname' },
  { iso: 'SE', name: 'Sweden' }, { iso: 'CH', name: 'Switzerland' }, { iso: 'SY', name: 'Syria' },
  { iso: 'TW', name: 'Taiwan' }, { iso: 'TJ', name: 'Tajikistan' }, { iso: 'TZ', name: 'Tanzania' },
  { iso: 'TH', name: 'Thailand' }, { iso: 'TL', name: 'Timor-Leste' }, { iso: 'TG', name: 'Togo' },
  { iso: 'TO', name: 'Tonga' }, { iso: 'TT', name: 'Trinidad and Tobago' }, { iso: 'TN', name: 'Tunisia' },
  { iso: 'TR', name: 'Turkey' }, { iso: 'TM', name: 'Turkmenistan' }, { iso: 'TV', name: 'Tuvalu' },
  { iso: 'UG', name: 'Uganda' }, { iso: 'UA', name: 'Ukraine' }, { iso: 'AE', name: 'United Arab Emirates' },
  { iso: 'GB', name: 'United Kingdom' }, { iso: 'US', name: 'United States' }, { iso: 'UY', name: 'Uruguay' },
  { iso: 'UZ', name: 'Uzbekistan' }, { iso: 'VU', name: 'Vanuatu' }, { iso: 'VA', name: 'Vatican City' },
  { iso: 'VE', name: 'Venezuela' }, { iso: 'VN', name: 'Vietnam' }, { iso: 'YE', name: 'Yemen' },
  { iso: 'ZM', name: 'Zambia' }, { iso: 'ZW', name: 'Zimbabwe' }
];

// Hàm sinh câu văn mô tả tự nhiên
const generateDescription = (type: string, origin: string, dest: string) => {
  switch(type) {
    case 'free': 
      return <span>You <strong>do not need a visa</strong> for {dest} if you have a {origin} passport.</span>;
    case 'evisa': 
      return <span>You <strong>need an e-Visa or ETA</strong> for {dest} if you have a {origin} passport.</span>;
    case 'voa': 
      return <span>You can get a <strong>Visa on Arrival</strong> for {dest} if you have a {origin} passport.</span>;
    case 'banned': 
      return <span>Entry is <strong>restricted or refused</strong> for {dest} if you have a {origin} passport.</span>;
    default: 
      return <span>You <strong>need a visa</strong> for {dest} if you have a {origin} passport.</span>;
  }
};

// Bảng màu cho Card Trực quan (Dựa theo hình ảnh)
const visualTheme = {
  free: { badge: 'bg-[#10B981] text-white', icon: 'text-[#10B981]' }, // Emerald (Xanh lá)
  evisa: { badge: 'bg-[#F59E0B] text-white', icon: 'text-[#F59E0B]' }, // Amber (Vàng/Cam)
  voa: { badge: 'bg-[#3B82F6] text-white', icon: 'text-[#3B82F6]' }, // Blue (Xanh dương)
  required: { badge: 'bg-[#EF4444] text-white', icon: 'text-[#EF4444]' }, // Red (Đỏ y hệt ảnh)
  banned: { badge: 'bg-[#27272A] text-white', icon: 'text-[#27272A]' }, // Zinc (Đen)
};

// --- HÀM PARSE DATA ---
const parseVisaData = (rawString: string) => {
  if (!rawString || rawString === '-1') {
    return { status: 'ENTRY REFUSED / UNKNOWN', type: 'banned', duration: '', notes: ['Information unavailable or entry restricted.'] };
  }

  const parts = rawString.split(' - ');
  let rawStatus = parts[0].trim().toLowerCase();
  let type = 'required';
  let duration = '';
  
  if (!isNaN(Number(rawStatus))) {
    duration = `${rawStatus} days`;
    rawStatus = 'visa free';
    type = 'free';
  } else if (rawStatus.includes('free')) {
    type = 'free';
  } else if (rawStatus.includes('e-visa') || rawStatus.includes('evisa') || rawStatus.includes('eta')) {
    type = 'evisa';
  } else if (rawStatus.includes('arrival')) {
    type = 'voa';
  } else if (rawStatus.includes('ban') || rawStatus.includes('admission')) {
    type = 'banned';
  }

  let notes: string[] = [];
  if (parts[1]) {
    let noteStr = parts[1].trim().replace(/^"|"$/g, '');
    notes = noteStr.split(';').map(n => n.trim()).filter(Boolean);
    if (notes[0] && notes[0].match(/^\d+\s*(days|months|month|weeks)$/i)) {
      duration = notes.shift() || '';
    }
  }

  return { status: rawStatus.toUpperCase(), type, duration, notes };
};

// --- BẢNG MÀU ORGANIC ---
const themeMap = {
  free: { bg: 'bg-[#F2F7F4]', text: 'text-[#2C5E3E]', border: 'border-[#D9EBDF]' }, 
  evisa: { bg: 'bg-[#FFF9EC]', text: 'text-[#9C6C1B]', border: 'border-[#FCE5B8]' }, 
  voa: { bg: 'bg-[#F2F6FA]', text: 'text-[#2D5B8C]', border: 'border-[#DAE6F2]' }, 
  required: { bg: 'bg-[#FCF5F3]', text: 'text-[#9B3A36]', border: 'border-[#F8DED9]' }, 
  banned: { bg: 'bg-[#F5F5F4]', text: 'text-[#44403C]', border: 'border-[#E7E5E4]' }, 
};

// ==========================================
// COMPONENT CHÍNH
// ==========================================
export default function VisaRequirements() {
  const navigate = useNavigate();
  const [passport, setPassport] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkedRoute, setCheckedRoute] = useState<{origin: string, dest: string} | null>(null);

  // Quản lý trạng thái mở của Dropdown
  const [openDropdown, setOpenDropdown] = useState<'passport' | 'destination' | null>(null);

  const [isLoadingPassport, setIsLoadingPassport] = useState(false);

  // THÊM HÀM NÀY: Xử lý lấy Data Lịch sử rồi mới chuyển trang
  const handleViewPassport = async () => {
    if (!checkedRoute) return;
    setIsLoadingPassport(true);
    
    try {
      // 1. Gọi API lấy toàn bộ dữ liệu Ranking Lịch sử
      const rankings = await RankingService.getGlobalRanking();
      
      // 2. Trích xuất đúng cục data của Origin
      const targetIso = checkedRoute.origin.toUpperCase();
      const passportData = rankings.find((r: any) => r.iso === targetIso);
      
      // 3. Chuyển trang và Tặng kèm cục Data lịch sử (Hệt như bên GlobalPower đang làm)
      navigate(`/passport/${targetIso.toLowerCase()}`, {
        state: { passportPower: passportData }
      });
    } catch (error) {
      console.error("Failed to fetch passport historical data", error);
      // Fallback: Lỗi mạng thì vẫn cho sang trang (dù thiếu biểu đồ)
      navigate(`/passport/${checkedRoute.origin.toLowerCase()}`);
    } finally {
      setIsLoadingPassport(false);
    }
  };

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passport || !destination || passport === destination) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Gọi song song 3 API thông qua các Service chuyên biệt
      const [visaData, originInfo, destInfo] = await Promise.all([
        fetchSingleDestinationStatus(passport, destination),
        fetchCountryMiniInfo(passport),
        fetchCountryMiniInfo(destination)
      ]);

      if (visaData && visaData.status) {
        const parsedData = parseVisaData(visaData.status);
        
        setResult({
          ...parsedData,
          // Lấy coverImage từ API, nếu null/undefined thì fallback về ảnh mặc định
          originCover: originInfo?.coverImage || "https://images.unsplash.com/photo-1488085061387-422e29b40080?q=80&w=1000&auto=format&fit=crop",
          destCover: destInfo?.coverImage || "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1000&auto=format&fit=crop"
        });
        setCheckedRoute({ origin: passport, dest: destination });
      } else {
        setError('We currently do not have visa data for this route.');
      }
    } catch (err) {
      setError('Connection interrupted. Please try checking again.');
    } finally {
      setLoading(false);
    }
  };

  const getCountryName = (iso: string) => {
    return COUNTRIES.find(c => c.iso === iso)?.name || iso;
  };

  // --- SUB-COMPONENT DROPDOWN ORGANIC ---
  const CountryDropdown = ({ 
    type, 
    value, 
    onChange, 
    disabledIso 
  }: { 
    type: 'passport' | 'destination', 
    value: string, 
    onChange: (iso: string) => void,
    disabledIso: string 
  }) => {
    const isOpen = openDropdown === type;
    const [search, setSearch] = useState('');

    const filteredCountries = COUNTRIES.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.iso.toLowerCase().includes(search.toLowerCase())
    );

    return (
      <div className="relative inline-block align-middle">
        <button
          type="button"
          onClick={() => {
            setOpenDropdown(isOpen ? null : type);
            setSearch("");
          }}
          className={`flex items-center gap-2.5 border-b-2 transition-all duration-300 pb-1 cursor-pointer outline-none font-serif
            ${isOpen ? 'border-[#1A1A19] text-[#1A1A19]' : 'border-[#D4D3CD] hover:border-[#1A1A19] text-[#1A1A19]'}`}
        >
          {value ? (
            <>
              <span className={`fi fi-${value.toLowerCase()} shrink-0 text-3xl rounded-sm overflow-hidden shadow-lg`} />
              <span className="font-bold">{getCountryName(value)}</span>
            </>
          ) : (
            <span className="text-[#6E6D67] italic font-light">Select country</span>
          )}
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => { setOpenDropdown(null); setSearch(""); }} />
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute top-full left-0 mt-2 w-64 md:w-72 bg-[#FDFBF7] border border-[#E7E5E4] shadow-xl rounded-2xl z-50 overflow-hidden flex flex-col font-sans"
              >
                <div className="p-3 border-b border-[#E7E5E4] bg-white">
                  <div className="">
                    <input
                      type="text"
                      placeholder="Search country..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      autoFocus 
                      className="w-full bg-[#F5F5F4] border-none rounded-xl py-2 pl-3 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#E7E5E4] text-[#1A1A19] placeholder:text-[#A8A6A1] transition-all"
                    />
                  </div>
                </div>

                <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1 bg-white">
                  {filteredCountries.length === 0 ? (
                    <div className="px-3 py-6 text-center text-sm text-[#A8A6A1] italic">
                      No countries found.
                    </div>
                  ) : (
                    filteredCountries.map(c => {
                      const isDisabled = disabledIso === c.iso;
                      const isSelected = value === c.iso;

                      return (
                        <button
                          key={c.iso}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => { onChange(c.iso); setOpenDropdown(null); setSearch(""); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all duration-200 ${
                            isDisabled
                              ? 'opacity-40 cursor-not-allowed bg-transparent'
                              : isSelected
                              ? 'bg-[#F2F7F4] text-[#2C5E3E] font-bold'
                              : 'hover:bg-[#F5F5F4] text-[#44403C] font-medium'
                          }`}
                        >
                          <span className={`fi fi-${c.iso.toLowerCase()} shrink-0 text-xl rounded-sm shadow-sm`} />
                          <span className="truncate">{c.name}</span>
                        </button>
                      )
                    })
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // ==========================================
  // RENDER GIAO DIỆN
  // ==========================================
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C2C2A] py-16 pt-5 px-8 font-sans">
      <div className="mx-auto">
        
        <header className="mb-3 flex flex-col items-start">
          {/* Tiêu đề chính */}
          <h1 className="font-serif text-5xl md:text-5xl lg:text-5xl text-[#1A1A19] tracking-tight leading-[0.95] mb-6 md:mb-1">
            Visa Requirements Checker<br className="hidden md:block" />
          </h1>
          <div className="">
            <p className="text-lg md:text-xl text-[#6E6D67] font-light leading-relaxed max-w-7xl">
              Quickly check if you need a visa for a specific destination. Navigate borders with confidence.
            </p>
          </div>
        </header>

        <form onSubmit={handleCheck} className="mb-8">
          <div className="text-2xl md:text-3xl font-serif leading-loose text-[#1A1A19] flex flex-wrap items-center gap-x-3 gap-y-6">
            <span>I hold a passport from</span>
            <CountryDropdown 
              type="passport" 
              value={passport} 
              onChange={setPassport} 
              disabledIso={destination} 
            />
            <span>and I plan to visit</span>
            <CountryDropdown 
              type="destination" 
              value={destination} 
              onChange={setDestination} 
              disabledIso={passport} 
            />
            <span>.</span>
            <button 
                type="submit"
                disabled={loading || passport === destination}
                className="bg-[#7a9b65] hover:bg-[#3D3C3A] text-white px-3 py-2 rounded-xl font-sm transition-all disabled:opacity-50 flex items-center gap-3 shadow-lg shadow-black/5 text-base md:text-xl"
            >
                {loading ? 'Consulting Database...' : 'Check Status'}
                {!loading && <Search className="w-4 h-4" />}
            </button>
          </div>
        </form>

        {error && (
          <div className="animate-in fade-in duration-500 rounded-3xl p-8 border border-[#E7E5E4] bg-[#F5F5F4] text-[#44403C]">
            <p className="font-serif text-xl md:text-2xl">{error}</p>
          </div>
        )}

        {/* Kết quả trả về */}
        {result && checkedRoute && !error && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out flex flex-col mt-8">
            <div className="relative w-full h-[400px] md:h-[360px] rounded-t-[2rem] overflow-hidden shadow-xl flex flex-col md:flex-row border border-black/5">
              
              {/* Nửa Trái: Hộ chiếu (Origin) */}
              <div className="w-full md:w-1/2 h-1/2 md:h-full relative bg-slate-200">
                <img 
                  src={result.originCover} 
                  alt={`${getCountryName(checkedRoute.origin)} Landscape`} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                
                <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30 text-white flex flex-col gap-3 min-w-[140px]">
                  <span className={`fi fi-${checkedRoute.origin.toLowerCase()} text-3xl rounded-sm shadow-sm leading-none`} />
                  <div>
                    <div className="font-bold text-lg leading-tight tracking-wide">{getCountryName(checkedRoute.origin)}</div>
                    <div className="text-xs font-medium opacity-80 mt-1 uppercase tracking-wider">Your Passport</div>
                  </div>
                </div>
              </div>

              {/* Nửa Phải: Điểm đến (Destination) */}
              <div className="w-full md:w-1/2 h-1/2 md:h-full relative bg-slate-300">
                <img 
                  src={result.destCover} 
                  alt={`${getCountryName(checkedRoute.dest)} Landscape`} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                
                <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30 text-white flex flex-col items-end gap-3 min-w-[140px] text-right">
                  <span className={`fi fi-${checkedRoute.dest.toLowerCase()} text-3xl rounded-sm shadow-sm leading-none`} />
                  <div>
                    <div className="font-bold text-lg leading-tight tracking-wide">{getCountryName(checkedRoute.dest)}</div>
                    <div className="text-xs font-medium opacity-80 mt-1 uppercase tracking-wider">Destination</div>
                  </div>
                </div>
              </div>

              {/* Icon Máy bay nối ở giữa */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-1 z-10 shadow-2xl">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${visualTheme[result.type as keyof typeof visualTheme].badge}`}>
                  <Plane className="w-6 h-6 fill-current" />
                </div>
              </div>

              {/* Badge Báo Trạng thái */}
              <div className="absolute left-1/2 bottom-0 translate-y-1/2 md:bottom-8 md:translate-y-0 -translate-x-1/2 z-10">
                <div className={`px-8 py-3 rounded-full font-bold text-sm uppercase tracking-widest shadow-xl backdrop-blur-md whitespace-nowrap border-2 border-white ${visualTheme[result.type as keyof typeof visualTheme].badge}`}>
                  {result.status}
                </div>
              </div>
            </div>

            {/* Khối Điều kiện chi tiết & Nút Hành Động (Action Hub) */}
            <div className=" bg-blue-100/50 rounded-b-[2rem] p-6 md:px-8 py-4 border border-4-[#000000] shadow-xl">
                <h2 className="font-serif text-3xl md:text-2xl text-[#1A1A19] leading-snug mb-4">
                    {generateDescription(result.type, getCountryName(checkedRoute.origin), getCountryName(checkedRoute.dest))}
                    
                    {result.duration && (
                    <span className="font-semibold">
                        {" "}Max stay: {result.duration}
                    </span>
                    )}
                </h2>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-1">
                <h3 className="text-xl font-bold font-cinzel tracking-[0.2em] uppercase text-[#1A1A19] opacity-90">
                  Entry Conditions & Notes
                </h3>
              </div>
              
              {/* Danh sách Notes (Typography tương phản cao, compact) */}
              {result.notes.length > 0 ? (
                <div className="grid gap-2.5 mb-10">
                  {result.notes.map((note: string, idx: number) => (
                    <div key={idx} className="flex gap-2 items-start">
                      {/* Dấu chấm custom: Luôn nằm chuẩn ở dòng đầu tiên, không bị lệch */}
                      <Star className="mt-1.5 w-3.5 h-3.5 text-[#1A1A19] fill-[#1A1A19] shrink-0" />
                      
                      {/* Text: Chữ đen tuyền, thu hẹp khoảng cách chữ và dòng để tạo độ "đanh" */}
                      <p className="text-[#1A1A19] leading-snug font-medium text-[1.05rem] tracking-tight">
                        {note}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mb-10 text-[#6E6D67] italic font-light">
                  No additional entry conditions specified.
                </div>
              )}

              {/* 3 Nút Điều Hướng Cốt Lõi (Call To Actions) */}
              <div className="mb-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Nút Đặt vé máy bay (Nổi bật nhất) */}
                <button 
                  onClick={() => {
                    // Có thể thêm logic xử lý ở đây nếu muốn
                    navigate(`/book-flight?origin=${encodeURIComponent(getCountryName(checkedRoute.origin))}&dest=${encodeURIComponent(getCountryName(checkedRoute.dest))}`);
                  }}
                  className="flex items-center justify-center gap-2.5 border border-slate-500 bg-[#F5F5F4] hover:bg-[#1A1A19] text-[#1A1A19] hover:text-white px-6 py-4 rounded-xl font-medium transition-all group cursor-pointer w-full"
                >
                  <PlaneTakeoff className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                  <span>Book Flight to {getCountryName(checkedRoute.dest)}</span>
                </button>

                {/* 2. Nút Xem thông tin Hộ Chiếu */}
                <button 
                  type="button"
                  onClick={handleViewPassport}
                  disabled={isLoadingPassport}
                  className="flex items-center justify-center gap-2.5 border border-slate-500 bg-[#F5F5F4] hover:bg-[#1A1A19] text-[#1A1A19] hover:text-white px-6 py-4 rounded-xl font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoadingPassport ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <BookOpen className="w-5 h-5" />
                  )}
                  <span>{getCountryName(checkedRoute.origin)} Passport</span>
                </button>

                {/* 3. Nút Khám phá Quốc gia */}
                <a 
                  href={`/discover/${checkedRoute.dest.toLowerCase()}`}
                  className="flex items-center justify-center gap-2.5 border border-slate-500 bg-[#F5F5F4] hover:bg-[#1A1A19] text-[#1A1A19] hover:text-white px-6 py-4 rounded-xl font-medium transition-colors group"
                >
                  <Compass className="w-5 h-5 group-hover:rotate-45 transition-transform duration-500" />
                  <span>Explore {getCountryName(checkedRoute.dest)}</span>
                </a>

              </div>
            </div>

            {/* Nút Khám phá */}
            {/* <div className="mt-6 flex justify-end">
              <a 
                href={`/discover/${checkedRoute.dest.toLowerCase()}`}
                className="group flex items-center gap-3 text-lg font-serif text-[#6E6D67] hover:text-[#1A1A19] transition-colors"
              >
                <i>Explore {getCountryName(checkedRoute.dest)}</i>
                <span className="w-12 h-[1px] bg-[#D4D3CD] group-hover:bg-[#1A1A19] transition-all duration-300"></span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div> */}

          </div>
        )}

      </div>
    </div>
  );
}