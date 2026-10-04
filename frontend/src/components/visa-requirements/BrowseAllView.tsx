import React, { useState, useMemo } from 'react';
import { Compass, Loader2, Globe2, Landmark, Coins, Clock, Star, MessageSquare, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import 'flag-icons/css/flag-icons.min.css';

// --- IMPORT APIs ---
import { fetchPassportStatus } from '../../api/passport.api';
import { fetchAllCountries } from '../../api/country.api';

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

const getCountryName = (iso: string) => COUNTRIES.find(c => c.iso === iso)?.name || iso.toUpperCase();

// --- HELPER PARSE DỮ LIỆU ĐÃ BỔ SUNG NOTES ---
const parseVisaData = (rawString: string) => {
  if (!rawString || rawString === '-1') {
    return { status: 'ENTRY REFUSED / UNKNOWN', type: 'banned', duration: '', notes: ['Information unavailable or entry restricted.'] };
  }

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
    if (notes[0] && notes[0].match(/^\d+\s*(days|months|month|weeks)$/i)) { 
      duration = notes.shift() || ''; 
    }
  }
  return { status: rawStatus.toUpperCase(), type, duration, notes };
};

// --- STYLING HELPERS ---
const getBadgeStyle = (type: string) => {
  switch (type) {
    case 'free': return 'bg-[#10B981] text-white';
    case 'evisa': return 'bg-[#F59E0B] text-white';
    case 'voa': return 'bg-[#3B82F6] text-white';
    case 'banned': return 'bg-[#27272A] text-white';
    default: return 'bg-[#EF4444] text-white';
  }
};

const getCardStyle = (type: string) => {
  switch (type) {
    case 'free': return 'bg-emerald-50 border-emerald-200 hover:border-emerald-400';
    case 'evisa': return 'bg-amber-50 border-amber-200 hover:border-amber-400';
    case 'voa': return 'bg-blue-50 border-blue-200 hover:border-blue-400';
    case 'banned': return 'bg-zinc-100 border-zinc-300 hover:border-zinc-400';
    default: return 'bg-rose-50 border-rose-200 hover:border-rose-400'; // required
  }
};

// --- DROPDOWN COMPONENT ---
const CountryDropdown = ({ value, onChange }: { value: string, onChange: (iso: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filteredCountries = COUNTRIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.iso.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative inline-block align-middle w-full md:w-auto z-20">
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
            <span className="text-[#6E6D67] italic font-light">Select passport</span>
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
                    const isSelected = value === c.iso;
                    return (
                      <button
                        key={c.iso} type="button" onClick={() => { onChange(c.iso); setIsOpen(false); setSearch(""); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all duration-200 ${isSelected ? 'bg-[#F2F7F4] text-[#2C5E3E] font-bold' : 'hover:bg-[#F5F5F4] text-[#44403C] font-medium'}`}
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
export default function BrowseAllView() {
  const [browsePassport, setBrowsePassport] = useState('');
  const [browseLoading, setBrowseLoading] = useState(false);
  const [destinationsData, setDestinationsData] = useState<any[] | null>(null);

  // States lưu trữ bộ lọc
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('all');
  const [activeRegionFilter, setActiveRegionFilter] = useState<string>('all');

  const handleBrowse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!browsePassport) return;
    
    setBrowseLoading(true);
    try {
      const [passportData, allCountries] = await Promise.all([
        fetchPassportStatus(browsePassport),
        fetchAllCountries()
      ]);

      if (!passportData || !passportData.destinations) {
        setDestinationsData([]);
        return;
      }

      // Khớp dữ liệu
      const mergedData = Object.entries(passportData.destinations).map(([destIso, rawStatus]) => {
        const countryProfile = allCountries.find(c => c.iso2.toLowerCase() === destIso.toLowerCase());
        const parsedData = parseVisaData(rawStatus);

        // Bóc tách Tiền tệ: Ép kiểu (cur: any) để đảm bảo không bị lỗi mất field symbol
        const currencyString = countryProfile?.currencies?.length 
          ? countryProfile.currencies.map((cur: any) => `${cur.name} ${cur.symbol ? `(${cur.symbol})` : ''}`).join(', ') 
          : 'Unknown';

        // Bóc tách Ngôn ngữ: Hiển thị toàn bộ
        const languageString = countryProfile?.languages?.length
          ? countryProfile.languages.map((lang: any) => lang.name).join(', ')
          : 'Unknown';

        return {
          iso: destIso.toUpperCase(),
          name: countryProfile?.nameCommon || getCountryName(destIso.toUpperCase()),
          capital: countryProfile?.capital || 'Unknown',
          region: countryProfile?.region || 'Unknown',
          subregion: countryProfile?.subregion || 'Unknown',
          currency: countryProfile?.currencies?.length 
            ? countryProfile.currencies.map(cur => `${cur.name} ${cur.code ? `- ${cur.code} ` : ''}`).join(', ') 
            : 'Unknown',
          languages: languageString,
          flagUrl: countryProfile?.flag?.svgUrl || '',
          status: parsedData.status,
          type: parsedData.type,
          duration: parsedData.duration,
          notes: parsedData.notes,
        };
      });

      // Sắp xếp mặc định: Visa Free ưu tiên lên đầu
      const sortOrder: Record<string, number> = { free: 1, voa: 2, evisa: 3, required: 4, banned: 5 };
      mergedData.sort((a, b) => (sortOrder[a.type] || 99) - (sortOrder[b.type] || 99));

      setDestinationsData(mergedData);
      
      // Reset filter khi browse passport mới
      setActiveTypeFilter('all');
      setActiveRegionFilter('all');
    } catch (err) {
      console.error(err);
    } finally {
      setBrowseLoading(false);
    }
  };

  // Tự động tạo danh sách Region động dựa trên kết quả trả về
  const availableRegions = useMemo(() => {
    if (!destinationsData) return [];
    const regions = new Set(destinationsData.map(d => d.region).filter(r => r && r !== 'Unknown'));
    return Array.from(regions).sort();
  }, [destinationsData]);

  // Lọc dữ liệu DUAL (Type + Region)
  const filteredData = destinationsData?.filter(d => {
    const matchType = activeTypeFilter === 'all' || d.type === activeTypeFilter;
    const matchRegion = activeRegionFilter === 'all' || d.region === activeRegionFilter;
    return matchType && matchRegion;
  });

  return (
    <div className="animate-in fade-in duration-500">
      
      {/* KHU VỰC CHỌN HỘ CHIẾU */}
      <form onSubmit={handleBrowse} className="mb-6">
        <div className="text-xl md:text-2xl lg:text-3xl font-serif leading-loose text-[#1A1A19] flex flex-wrap items-center gap-x-3 gap-y-4 md:gap-y-6">
          <CountryDropdown value={browsePassport} onChange={setBrowsePassport} />
          <span className="hidden md:inline"></span>
          
          <button 
              type="submit" disabled={browseLoading || !browsePassport}
              className="mt-4 md:mt-0 w-full md:w-auto bg-[#1A1A19] hover:bg-[#3D3C3A] text-white px-4 py-3 md:px-5 md:py-2.5 rounded-xl font-sm transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-black/5 text-base md:text-xl ml-auto md:ml-0"
          >
              {browseLoading ? 'Analyzing...' : 'Browse'}
              {browseLoading ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Globe2 className="w-4 h-4 md:w-5 md:h-5" />}
          </button>
        </div>
      </form>

      {/* KHU VỰC RENDER KẾT QUẢ */}
      {destinationsData && !browseLoading && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Header Kết quả & Bộ Lọc Kép */}
          <div className="flex flex-col mb-8 border-b border-gray-200 pb-6">
            <div className="flex flex-col gap-4">
              {/* Lọc theo Visa Status */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-gray-400 uppercase tracking-widest mr-2 w-full md:w-auto">Status</span>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'free', label: 'Visa Free' },
                  { id: 'voa', label: 'Visa on Arrival' },
                  { id: 'evisa', label: 'e-Visa / ETA' },
                  { id: 'required', label: 'Visa Required' }
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveTypeFilter(filter.id)}
                    className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all duration-300 border ${
                      activeTypeFilter === filter.id 
                        ? 'bg-gray-900 text-white border-gray-900 shadow-md' 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Lọc theo Khu Vực (Region) */}
              {availableRegions.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-gray-400 uppercase tracking-widest mr-2 w-full md:w-auto">Region</span>
                  <button
                    onClick={() => setActiveRegionFilter('all')}
                    className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all duration-300 border ${
                      activeRegionFilter === 'all' 
                        ? 'bg-gray-900 text-white border-gray-900 shadow-md' 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    All Regions
                  </button>
                  {availableRegions.map(region => (
                    <button
                      key={region}
                      onClick={() => setActiveRegionFilter(region)}
                      className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all duration-300 border ${
                        activeRegionFilter === region 
                          ? 'bg-gray-900 text-white border-gray-900 shadow-md' 
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Lưới Grid Danh sách Quốc Gia */}
          {filteredData && filteredData.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {filteredData.map((country, idx) => (
                <div 
                  key={idx} 
                  className={`group relative rounded-2xl overflow-hidden shadow-sm border transition-all duration-300 hover:shadow-md flex flex-col h-full cursor-pointer ${getCardStyle(country.type)}`}
                >
                  
                  <div className="p-5 flex-1 flex flex-col">
                    {/* Header Card: Lá cờ hình tròn và Tên */}
                    <div className="flex items-start gap-3 mb-5">
                      {country.flagUrl ? (
                        <img src={country.flagUrl} alt={country.name} className="h-15 object-cover rounded-sm border border-black/10 shadow-sm shrink-0" />
                      ) : (
                        <span className={`fi fi-${country.iso.toLowerCase()} text-5xl rounded-full overflow-hidden shrink-0 border border-black/10 shadow-sm`} />
                      )}
                      <div>
                        <h3 className="font-serif font-bold text-lg text-gray-900 leading-tight">{country.name}</h3>
                        <span className={`inline-block mt-1.5 px-2.5 py-0.5 text-[10px] uppercase tracking-widest font-bold rounded-md shadow-sm ${getBadgeStyle(country.type)}`}>
                          {country.status}
                        </span>
                      </div>
                    </div>

                    {/* Dữ liệu được Merge từ Database */}
                    <div className="space-y-2.5 mt-0">
                      <div className="flex items-start gap-2.5 text-sm text-gray-700">
                        <Landmark className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">Capital: {country.capital}</span>
                      </div>

                      <div className="flex items-start gap-2.5 text-sm text-gray-700">
                        <Map className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{country.region} • {country.subregion}</span>
                      </div>
                      
                      {/* Tiền tệ & Symbol */}
                      <div className="flex items-start gap-2.5 text-sm text-gray-700">
                        <Coins className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">Currency: {country.currency}</span>
                      </div>

                      {/* Ngôn ngữ */}
                      <div className="flex items-start gap-2.5 text-sm text-gray-700">
                        <MessageSquare className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">Language: {country.languages}</span>
                      </div>
                    </div>
                    {/* KHU VỰC HIỂN THỊ DURATION VÀ NOTES */}
                    {(country.duration || (country.notes && country.notes.length > 0)) && (
                    <div className="pt-3 border-t border-black/5 mt-3 flex flex-col gap-2">
                        
                        {/* Duration */}
                        {country.duration && (
                        <div className="flex items-start gap-2.5 text-sm text-gray-700">
                            <Clock className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                            <span className="font-semibold text-gray-900 leading-snug">Max Stay: {country.duration}</span>
                        </div>
                        )}

                        {/* Danh sách Notes */}
                        {country.notes && country.notes.length > 0 && (
                        <div className="flex flex-col gap-1.5 mt-1">
                            {country.notes.map((note: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 text-[11px] md:text-xs text-gray-600 leading-snug">
                                <Star className="w-3 h-3 text-yellow-400 shrink-0 mt-0.5 fill-yellow-400" />
                                <span className="">{note}</span>
                            </div>
                            ))}
                        </div>
                        )}

                    </div>
                    )}
                  </div>

                  {/* Nút Khám phá */}
                  <a href={`/discover/${country.iso.toLowerCase()}`} className="border-t border-black/5 p-3 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-widest bg-white/40 hover:bg-white transition-colors text-gray-700">
                    Explore Profile <Compass className="w-3.5 h-3.5" />
                  </a>

                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center flex flex-col items-center justify-center opacity-70">
              <Globe2 className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-lg font-serif text-gray-500">No destinations found for this filter.</p>
            </div>
          )}

        </div>
      )}
    </div>
  );
}