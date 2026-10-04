import React, { useState } from 'react';
import { Search, Plane, PlaneTakeoff, BookOpen, Compass, Star, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import 'flag-icons/css/flag-icons.min.css';
import { useNavigate } from "react-router-dom";

// --- IMPORT API GỌI DATABASE CỦA BÁC ---
import { fetchCountryMiniInfo } from "../../api/country.api";
import { fetchSingleDestinationStatus } from "../../api/passport.api";
import { RankingService } from "../../api/ranking.api";

// --- CONSTANTS & HELPERS ---
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

const generateDescription = (type: string, origin: string, dest: string) => {
  switch(type) {
    case 'free': return <span>You <strong>do not need a visa</strong> for {dest} if you have a {origin} passport.</span>;
    case 'evisa': return <span>You <strong>need an e-Visa or ETA</strong> for {dest} if you have a {origin} passport.</span>;
    case 'voa': return <span>You can get a <strong>Visa on Arrival</strong> for {dest} if you have a {origin} passport.</span>;
    case 'banned': return <span>Entry is <strong>restricted or refused</strong> for {dest} if you have a {origin} passport.</span>;
    default: return <span>You <strong>need a visa</strong> for {dest} if you have a {origin} passport.</span>;
  }
};

const visualTheme = {
  free: { badge: 'bg-[#10B981] text-white', icon: 'text-[#10B981]' },
  evisa: { badge: 'bg-[#F59E0B] text-white', icon: 'text-[#F59E0B]' },
  voa: { badge: 'bg-[#3B82F6] text-white', icon: 'text-[#3B82F6]' },
  required: { badge: 'bg-[#EF4444] text-white', icon: 'text-[#EF4444]' },
  banned: { badge: 'bg-[#27272A] text-white', icon: 'text-[#27272A]' },
};

const parseVisaData = (rawString: string) => {
  if (!rawString || rawString === '-1') return { status: 'ENTRY REFUSED / UNKNOWN', type: 'banned', duration: '', notes: ['Information unavailable or entry restricted.'] };
  const parts = rawString.split(' - ');
  let rawStatus = parts[0].trim().toLowerCase();
  let type = 'required'; let duration = '';
  
  if (!isNaN(Number(rawStatus))) { duration = `${rawStatus} days`; rawStatus = 'visa free'; type = 'free'; } 
  else if (rawStatus.includes('free')) { type = 'free'; } 
  else if (rawStatus.includes('e-visa') || rawStatus.includes('evisa') || rawStatus.includes('eta')) { type = 'evisa'; } 
  else if (rawStatus.includes('arrival')) { type = 'voa'; } 
  else if (rawStatus.includes('ban') || rawStatus.includes('admission')) { type = 'banned'; }

  let notes: string[] = [];
  if (parts[1]) {
    let noteStr = parts[1].trim().replace(/^"|"$/g, '');
    notes = noteStr.split(';').map(n => n.trim()).filter(Boolean);
    if (notes[0] && notes[0].match(/^\d+\s*(days|months|month|weeks)$/i)) { duration = notes.shift() || ''; }
  }
  return { status: rawStatus.toUpperCase(), type, duration, notes };
};

const getCountryName = (iso: string) => {
  return COUNTRIES.find(c => c.iso === iso)?.name || iso;
};

// --- SUB-COMPONENT DROPDOWN ---
const CountryDropdown = ({ type, value, onChange, disabledIso }: { type: 'passport' | 'destination', value: string, onChange: (iso: string) => void, disabledIso: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filteredCountries = COUNTRIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.iso.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative inline-block align-middle w-full md:w-auto">
      <button
        type="button"
        onClick={() => { setIsOpen(!isOpen); setSearch(""); }}
        className={`flex items-center gap-2.5 border-b-2 transition-all duration-300 pb-1 cursor-pointer outline-none font-serif w-full md:w-auto justify-between md:justify-start ${isOpen ? 'border-[#1A1A19] text-[#1A1A19]' : 'border-[#D4D3CD] hover:border-[#1A1A19] text-[#1A1A19]'}`}
      >
        <div className="flex items-center gap-2.5">
          {value ? (
            <>
              <span className={`fi fi-${value.toLowerCase()} shrink-0 text-3xl md:text-3xl rounded-sm overflow-hidden shadow-lg`} />
              <span className="font-bold truncate max-w-[200px] md:max-w-none">{getCountryName(value)}</span>
            </>
          ) : (
            <span className="text-[#6E6D67] italic font-light">Select country</span>
          )}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => { setIsOpen(false); setSearch(""); }} />
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute top-full left-0 mt-2 w-[280px] sm:w-64 md:w-72 bg-[#FDFBF7] border border-[#E7E5E4] shadow-xl rounded-2xl z-50 overflow-hidden flex flex-col font-sans"
            >
              <div className="p-3 border-b border-[#E7E5E4] bg-white">
                <input type="text" placeholder="Search country..." value={search} onChange={(e) => setSearch(e.target.value)} autoFocus className="w-full bg-[#F5F5F4] border-none rounded-xl py-2 pl-3 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#E7E5E4] text-[#1A1A19] placeholder:text-[#A8A6A1] transition-all" />
              </div>
              <div className="max-h-[250px] md:max-h-[300px] overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1 bg-white">
                {filteredCountries.length === 0 ? <div className="px-3 py-6 text-center text-sm text-[#A8A6A1] italic">No countries found.</div> : (
                  filteredCountries.map(c => {
                    const isDisabled = disabledIso === c.iso;
                    const isSelected = value === c.iso;
                    return (
                      <button
                        key={c.iso} type="button" disabled={isDisabled} onClick={() => { onChange(c.iso); setIsOpen(false); setSearch(""); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all duration-200 ${isDisabled ? 'opacity-40 cursor-not-allowed bg-transparent' : isSelected ? 'bg-[#F2F7F4] text-[#2C5E3E] font-bold' : 'hover:bg-[#F5F5F4] text-[#44403C] font-medium'}`}
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
// MAIN COMPONENT EXPORT
// ==========================================
export default function QuickCheckView() {
  const navigate = useNavigate();
  const [passport, setPassport] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkedRoute, setCheckedRoute] = useState<{origin: string, dest: string} | null>(null);
  const [isLoadingPassport, setIsLoadingPassport] = useState(false);

  const handleViewPassport = async () => {
    if (!checkedRoute) return;
    setIsLoadingPassport(true);
    try {
      const rankings = await RankingService.getGlobalRanking();
      const targetIso = checkedRoute.origin.toUpperCase();
      const passportData = rankings.find((r: any) => r.iso === targetIso);
      navigate(`/passport/${targetIso.toLowerCase()}`, { state: { passportPower: passportData } });
    } catch (error) {
      console.error("Failed to fetch passport historical data", error);
      navigate(`/passport/${checkedRoute.origin.toLowerCase()}`);
    } finally {
      setIsLoadingPassport(false);
    }
  };

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passport || !destination || passport === destination) return;
    setLoading(true); setError(null); setResult(null);
    
    try {
      const [visaData, originInfo, destInfo] = await Promise.all([
        fetchSingleDestinationStatus(passport, destination),
        fetchCountryMiniInfo(passport),
        fetchCountryMiniInfo(destination)
      ]);

      if (visaData && visaData.status) {
        const parsedData = parseVisaData(visaData.status);
        setResult({
          ...parsedData,
          originCover: originInfo?.coverImage || "https://images.unsplash.com/photo-1488085061387-422e29b40080?q=80&w=1000&auto=format&fit=crop",
          destCover: destInfo?.coverImage || "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1000&auto=format&fit=crop"
        });
        setCheckedRoute({ origin: passport, dest: destination });
      } else {
        setError('We currently do not have visa data for this route.');
      }
    } catch (err) { setError('Connection interrupted. Please try checking again.'); } 
    finally { setLoading(false); }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <form onSubmit={handleCheck} className="mb-8">
        <div className="text-xl md:text-2xl lg:text-3xl font-serif leading-loose text-[#1A1A19] flex flex-wrap items-center gap-x-3 gap-y-4 md:gap-y-6">
          <span className="w-full md:w-auto">I hold a passport from</span>
          <CountryDropdown type="passport" value={passport} onChange={setPassport} disabledIso={destination} />
          <span className="w-full md:w-auto">and I plan to visit</span>
          <CountryDropdown type="destination" value={destination} onChange={setDestination} disabledIso={passport} />
          <span className="hidden md:inline">.</span>
          <button 
              type="submit" disabled={loading || passport === destination || !passport || !destination}
              className="mt-4 md:mt-0 w-full md:w-auto bg-[#7a9b65] hover:bg-[#3D3C3A] text-white px-4 py-3 md:px-3 md:py-2 rounded-xl font-sm transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-black/5 text-base md:text-xl"
          >
              {loading ? 'Consulting...' : 'Check Status'}
              {!loading && <Search className="w-4 h-4 md:w-5 md:h-5" />}
          </button>
        </div>
      </form>

      {error && (
        <div className="animate-in fade-in duration-500 rounded-3xl p-6 md:p-8 border border-[#E7E5E4] bg-[#F5F5F4] text-[#44403C]">
          <p className="font-serif text-lg md:text-xl lg:text-2xl">{error}</p>
        </div>
      )}

      {result && checkedRoute && !error && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out flex flex-col mt-8">
          <div className="relative w-full h-[450px] md:h-[360px] rounded-t-[2rem] overflow-hidden shadow-xl flex flex-col md:flex-row border border-black/5">
            
            {/* Nửa Trái */}
            <div className="w-full h-1/2 md:w-1/2 md:h-full relative bg-slate-200">
              <img src={result.originCover} alt="Origin" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 bg-white/20 backdrop-blur-md rounded-2xl p-3 md:p-4 border border-white/30 text-white flex flex-col gap-2 md:gap-3 min-w-[120px] md:min-w-[140px]">
                <span className={`fi fi-${checkedRoute.origin.toLowerCase()} text-2xl md:text-3xl rounded-sm shadow-sm leading-none`} />
                <div>
                  <div className="font-bold text-base md:text-lg leading-tight tracking-wide">{getCountryName(checkedRoute.origin)}</div>
                  <div className="text-[10px] md:text-xs font-medium opacity-80 mt-1 uppercase tracking-wider">Your Passport</div>
                </div>
              </div>
            </div>

            {/* Nửa Phải */}
            <div className="w-full h-1/2 md:w-1/2 md:h-full relative bg-slate-300">
              <img src={result.destCover} alt="Destination" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 bg-white/20 backdrop-blur-md rounded-2xl p-3 md:p-4 border border-white/30 text-white flex flex-col items-end gap-2 md:gap-3 min-w-[120px] md:min-w-[140px] text-right">
                <span className={`fi fi-${checkedRoute.dest.toLowerCase()} text-2xl md:text-3xl rounded-sm shadow-sm leading-none`} />
                <div>
                  <div className="font-bold text-base md:text-lg leading-tight tracking-wide">{getCountryName(checkedRoute.dest)}</div>
                  <div className="text-[10px] md:text-xs font-medium opacity-80 mt-1 uppercase tracking-wider">Destination</div>
                </div>
              </div>
            </div>

            {/* Icon Máy bay nối ở giữa */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-1 z-10 shadow-2xl">
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center ${visualTheme[result.type as keyof typeof visualTheme].badge}`}>
                <Plane className="w-5 h-5 md:w-6 md:h-6 fill-current" />
              </div>
            </div>

            {/* Badge Báo Trạng thái */}
            <div className="absolute left-1/2 bottom-0 translate-y-1/2 md:bottom-8 md:translate-y-0 -translate-x-1/2 z-10">
              <div className={`px-6 md:px-8 py-2 md:py-3 rounded-full font-bold text-xs md:text-sm uppercase tracking-widest shadow-xl backdrop-blur-md whitespace-nowrap border-2 border-white ${visualTheme[result.type as keyof typeof visualTheme].badge}`}>
                {result.status}
              </div>
            </div>
          </div>

          <div className="bg-blue-100/50 rounded-b-[2rem] px-5 pt-10 pb-6 md:px-8 md:py-6 border border-[#000000] shadow-xl">
              <h2 className="font-serif text-2xl md:text-3xl lg:text-2xl text-[#1A1A19] leading-snug mb-4">
                {generateDescription(result.type, getCountryName(checkedRoute.origin), getCountryName(checkedRoute.dest))}
                {result.duration && <span className="font-semibold block md:inline mt-1 md:mt-0"> Max stay: {result.duration}</span>}
              </h2>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-2 md:mb-1">
              <h3 className="text-lg md:text-xl font-bold font-cinzel tracking-[0.15em] md:tracking-[0.2em] uppercase text-[#1A1A19] opacity-90">
                Entry Conditions & Notes
              </h3>
            </div>
            
            {result.notes.length > 0 ? (
              <div className="grid gap-3 md:gap-2.5 mb-8 md:mb-10">
                {result.notes.map((note: string, idx: number) => (
                  <div key={idx} className="flex gap-2.5 md:gap-2 items-start">
                    <Star className="mt-1 md:mt-1.5 w-3.5 h-3.5 text-[#1A1A19] fill-[#1A1A19] shrink-0" />
                    <p className="text-[#1A1A19] leading-relaxed md:leading-snug font-medium text-[0.95rem] md:text-[1.05rem] tracking-tight">{note}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-8 md:mb-10 text-[#6E6D67] italic font-light text-sm md:text-base">No additional entry conditions specified.</div>
            )}

            <div className="mb-2 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              <button 
                onClick={() => navigate(`/book-flight?origin=${encodeURIComponent(getCountryName(checkedRoute.origin))}&dest=${encodeURIComponent(getCountryName(checkedRoute.dest))}`)}
                className="flex items-center justify-center gap-2.5 border border-slate-500 bg-[#F5F5F4] hover:bg-[#1A1A19] text-[#1A1A19] hover:text-white px-4 py-3.5 md:px-6 md:py-4 rounded-xl font-medium transition-all group cursor-pointer w-full text-sm md:text-base"
              >
                <PlaneTakeoff className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                <span>Book Flight to {getCountryName(checkedRoute.dest)}</span>
              </button>
              <button 
                type="button" onClick={handleViewPassport} disabled={isLoadingPassport}
                className="flex items-center justify-center gap-2.5 border border-slate-500 bg-[#F5F5F4] hover:bg-[#1A1A19] text-[#1A1A19] hover:text-white px-4 py-3.5 md:px-6 md:py-4 rounded-xl font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed text-sm md:text-base"
              >
                {isLoadingPassport ? <Loader2 className="w-5 h-5 animate-spin" /> : <BookOpen className="w-5 h-5" />}
                <span className="truncate">{getCountryName(checkedRoute.origin)} Passport</span>
              </button>
              <a 
                href={`/discover/${checkedRoute.dest.toLowerCase()}`}
                className="flex items-center justify-center gap-2.5 border border-slate-500 bg-[#F5F5F4] hover:bg-[#1A1A19] text-[#1A1A19] hover:text-white px-4 py-3.5 md:px-6 md:py-4 rounded-xl font-medium transition-colors group text-sm md:text-base"
              >
                <Compass className="w-5 h-5 group-hover:rotate-45 transition-transform duration-500" />
                <span className="truncate">Explore {getCountryName(checkedRoute.dest)}</span>
              </a>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}