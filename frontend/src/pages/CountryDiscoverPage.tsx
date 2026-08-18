import React, { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mountain, Waves, TriangleAlert, ArrowUp, ArrowDown,
  Users, TrendingUp, TrendingDown, GraduationCap,
  Stethoscope, BedDouble, Biohazard, Building2, Map, ChevronDown, ChevronUp, ShieldAlert, Target, ChevronRight
} from 'lucide-react';
import { CountryLocatorMap } from '@/components/CountryLocatorMap';
// ============================================================================
// 1. RAW CSS
// ============================================================================
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,900;1,9..144,400;1,9..144,500&family=Outfit:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

.font-display { font-family: 'Fraunces', Georgia, serif; }
.font-ui { font-family: 'Outfit', -apple-system, sans-serif; }
.font-data { font-family: 'IBM Plex Mono', monospace; }

.bg-accent {
  background-color: var(--cm-accent-raw);
  color: #ffffff;
}

.text-accent {
  color: var(--cm-accent-raw);
  text-shadow: 0px 0px 1px rgba(0, 0, 0, 0.15);
}

.border-accent { border-color: var(--cm-accent); }

.bg-accent-raw { background-color: var(--cm-accent-raw); color: #ffffff; }

.bg-accent-soft {
  background-color: var(--cm-accent-soft);
  color: var(--cm-accent);
  border: 1px solid var(--cm-accent-border);
}

::selection { background-color: var(--cm-accent-raw); color: #ffffff; }
::-moz-selection { background-color: var(--cm-accent-raw); color: #ffffff; }

.timeline-line::before {
  content: '';
  position: absolute;
  top: 0; bottom: 0; left: 15px;
  width: 3px;
  background-color: var(--cm-accent-raw);
  opacity: 0.6;
}
`;
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Hàm logic lấy ảnh background dựa trên khu vực
const getHistoryBgImage = (continent = "", subContinent = "") => {
  const reg = continent.toLowerCase();
  const sub = subContinent.toLowerCase();

  // Ưu tiên Sub-continent (Khu vực nhỏ) trước
  if (sub.includes("south-eastern asia")) return "/history-bg/southeast-asia.jpg";
  if (sub.includes("central asia")) return "/history-bg/central-asia.jpg";
  if (sub.includes("western asia") || sub.includes("west asia")) return "/history-bg/west-asia.jpg";
  if (sub.includes("northern africa") || sub.includes("north africa")) return "/history-bg/north-africa.jpg";

  // Nếu không có sub-continent đặc biệt, fallback về Continent (Châu lục)
  if (reg.includes("africa")) return "/history-bg/africa.jpg";
  if (reg.includes("america")) return "/history-bg/america.jpg";
  if (reg.includes("asia")) return "/history-bg/asia.jpg";
  if (reg.includes("europe")) return "/history-bg/europe.jpg";
  if (reg.includes("oceania")) return "/history-bg/oceania.jpg";

  // Fallback an toàn nếu thiếu data
  return "/history-bg/europe.jpg"; 
};

// ============================================================================
// 2. COLOR UTILITIES & CONSTANTS
// ============================================================================
interface CustomCSSProperties extends CSSProperties {
  [key: `--${string}`]: string | number | undefined;
}

// Hàm map ảnh nền tôn giáo (Phiên bản chi tiết hóa từng nhánh)
const getReligionBg = (name: string) => {
  const lower = name.toLowerCase();
  
  // ==========================================
  // 1. CÁC NHÁNH CƠ ĐỐC GIÁO (CHRISTIANITY)
  // ==========================================
  if (lower.includes('catholic')) return '/religion-img/catholic.jpg'; 
  if (lower.includes('protestant')) return '/religion-img/protestant.jpg'; 
  if (lower.includes('orthodox')) return '/religion-img/orthodox.jpg'; 
  if (lower.includes('mormon')) return '/religion-img/mormon.jpg'; // Nhánh Mặc Môn
  if (lower.includes('jehovah')) return '/religion-img/jehovah.jpg'; // Nhân chứng Giê-hô-va
  if (lower.includes('evange')) return '/religion-img/evangelical.jpg'; // Anh giáo
  if (lower.includes('anglican') || lower.includes('luther')  ) return '/religion-img/anglican.jpg'; // Anh giáo
  if (lower.includes('christian') || lower.includes('church')) return '/religion-img/christian.jpg'; // Cơ Đốc giáo chung
  if (lower.includes('apost')) return '/religion-img/apostolic.jpg'; // apostle

  // ==========================================
  // 2. CÁC NHÁNH HỒI GIÁO (ISLAM)
  // ==========================================
  if (lower.includes('bektashi')) return '/religion-img/bektashi.jpg'; // Dòng Bektashi (phổ biến ở Albania)
  if (lower.includes('islam') || lower.includes('muslim')) return '/religion-img/islam.jpg'; 

  // ==========================================
  // 3. TÔN GIÁO TẠI VIỆT NAM
  // ==========================================
  if (lower.includes('cao dai')) return '/religion-img/caodai.jpg'; // Đạo Cao Đài
  if (lower.includes('hoa hao')) return '/religion-img/hoahao.jpg'; // Phật giáo Hòa Hảo

  // ==========================================
  // 4. CÁC TÔN GIÁO ĐẶC THÙ KHÁC
  // ==========================================
  if (lower.includes('shinto')) return '/religion-img/shinto.jpg'; // Thần đạo (Nhật Bản)
  if (lower.includes('sikh')) return '/religion-img/sikh.jpg'; // Đạo Sikh (Ấn Độ)
  if (lower.includes('druze')) return '/religion-img/druze.jpg'; // Đạo Druze (Trung Đông)
  if (lower.includes('baha')) return '/religion-img/bahai.jpg'; // Tôn giáo Baha'i
  if (lower.includes('shaman')) return '/religion-img/shamanism.jpg'; // Shaman giáo (Pháp sư)

  // ==========================================
  // 5. CÁC TÔN GIÁO LỚN CÒN LẠI
  // ==========================================
  if (lower.includes('buddhis')) return '/religion-img/buddhism.jpg'; 
  if (lower.includes('hindu')) return '/religion-img/hinduism.jpg'; 
  if (lower.includes('jew') || lower.includes('judaism')) return '/religion-img/judaism.jpg'; 

  // ==========================================
  // 6. TÍN NGƯỠNG DÂN GIAN (FOLK)
  // ==========================================
  if (lower.includes('folk') || lower.includes('indigenous') || lower.includes('animism')) 
    return '/religion-img/folk.jpg'; 
  
  if (lower.includes('animis')) return '/religion-img/animist.jpg'; // soul religion

  // ==========================================
  // 7. KHÔNG TÔN GIÁO / KHÔNG XÁC ĐỊNH / OTHER
  // ==========================================
  if ( lower.includes('unaffiliated') || lower.includes('unknown')|| lower.includes('other') || lower.includes('unspecified') || lower.includes('don\'t know') || lower.includes('refused')) 
    return '/religion-img/none.jpg'; 

  
  if (lower.includes('none') || lower.includes('non-believe') || lower.includes('atheis')) 
    return '/religion-img/non-believer.jpg'; 
  
  return '/religion-img/default.jpg'; 
};

function hexToRgb(hex: string) {
  if (!hex) return { r: 82, g: 82, b: 89 };
  let clean = hex.replace("#", "");
  if (clean.length === 3) clean = clean.split("").map((c) => c + c).join("");
  const int = parseInt(clean, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

function hexToRgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function mixHex(hexA: string, hexB: string, weightB: number) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round(a.r + (b.r - a.r) * weightB);
  const g = Math.round(a.g + (b.g - a.g) * weightB);
  const bl = Math.round(a.b + (b.b - a.b) * weightB);
  return `rgb(${r}, ${g}, ${bl})`;
}

function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const srgb = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function readableAccent(hex: string) {
  if (!hex) return "#3F3F46";
  const lum = relativeLuminance(hex);
  if (lum > 0.62) return mixHex(hex, "#16161A", 0.6);
  if (lum > 0.42) return mixHex(hex, "#16161A", 0.25);
  return hex;
}

const MEMBERSHIP_LABELS = [
  ["un", "United Nations"], ["eu", "European Union"], ["schengen", "Schengen Area"],
  ["nato", "NATO"], ["g7", "G7"], ["g20", "G20"], ["oecd", "OECD"],
  ["asean", "ASEAN"], ["arab_league", "Arab League"], ["african_union", "African Union"],
  ["brics", "BRICS"], ["commonwealth", "Commonwealth"], ["opec", "OPEC"], ["eurozone", "Eurozone"],
];

// ============================================================================
// 3. INTERFACES
// ============================================================================
interface ICoreCountry {
  nameCommon: string; nameOfficial: string; nativeOfficial: string | null;
  iso2: string; iso3: string;
  capital: string | null; region: string | null; subregion: string | null;
  population: number | null; areaKm2: number | null;
  borders: string[]; landlocked: boolean;
  currencies: Array<{ code: string; name: string; symbol: string }>;
  languages: Array<{ name: string; native_name: string }>;
  timezones: string[]; callingCodes: string[];
  drivingSide: string | null; measurementSystem: string | null; temperatureScale: string | null;
  memberships: Record<string, boolean>;
  flag: { svgUrl: string; description: string; accentRaw: string; accentText?: string; accentMuted?: string; accentSoft?: string; accentSoftStrong?: string; accentBorder?: string; };
}

interface DiscoverData {
  core: ICoreCountry;
  details: {
    iso2: string; coverImageUrl: string | null; introduction: string | null; etymology: string | null;
    nationalAnthem: { name: string | null; author: string | null; audioUrl: string | null };
    nationalSymbols: string[]; religions: Array<{ name: string; percent: number }>;
    
    // Đã thêm location và landBoundaries
    geography: { location: string | null; climate: string | null; terrain: string | null; elevation: { highestPoint: string | null; highestElevation: number | null; lowestPoint: string | null; lowestElevation: number | null }; landBoundaries: { totalKm: number | null; borderCountries: Array<{ country: string; borderLengthKm: number | null }> }; coastlineKm: number | null; naturalHazards: string[]; };
    
    // Đã thêm languages và totalFertilityRate
    demographics: { ethnicGroups: Array<{ name: string; percent: number }>; languages: { language: Array<{ name: string; percent: number | null; note: string | null }>; note: string | null }; majorUrbanAreas: Array<{ name: string; population: number }>; lifeExpectancy: number | null; literacyRate: number | null; totalFertilityRate: { childrenBornPerWoman: number | null; globalRank: number | null }; ageStructure: { "0_14": number|null; "15_24": number|null; "25_54": number|null; "55_64": number|null; "65_over": number|null; }; medianAge: number | null; populationGrowthRate: number | null; urbanizationRate: number | null; obesityRate: number | null; meanMaternalAge: number | null; sexRatioTotal: number | null; physiciansDensity: number | null; hospitalBedDensity: number | null; infectiousDiseasesRisk: string | null; schoolLifeExpectancy: number | null; };
    
    economy: { overview: string | null; gdpPpp: number | null; gdpPerCapita: number | null; realGrowthRate: number | null; unemploymentRate: number | null; povertyRate: number | null; agricultureProducts: string[]; industries: string[]; exportPartners: Array<{ name: string; percent: number }>; importPartners: Array<{ name: string; percent: number }>; budget: { revenues: number | null; expenditures: number | null }; publicDebt: number | null; inflationRate: number | null; };
    government: { type: string | null; independenceDate: string | null; nationalHolidays: Array<{ name: string; date: string }>; civics: { dualCitizenship: boolean | null; naturalizationYears: string | number | null; votingAge: number | null }; executiveBranch: string | null; legislativeBranch: string | null; judicialBranch: string | null; };
    infrastructure: { electricityAccess: number | null; electricitySources: { fossil: number | null; hydro: number | null; nuclear: number | null; renewable: number | null }; internetUsersPercent: number | null; roadwaysKm: number | null; waterwaysKm: number | null; airportsTotal: number | null; };
    
    // Đã đổi serviceAge thành serviceAgeAndObligation
    military: { expenditures: number | null; serviceAgeAndObligation: { years: number | null; note: string | null }; transnationalIssues: string[] };
    
    historyTimeline: Array<{ year: string; event: string; description: string }>;
    culturalNuances: { communicationStyle: string; etiquette: { dos: string[]; donts: string[] }; culinaryCulture: string; nationalVibe: string };
    faqs: Array<{ question: string; answer: string }>;
    nationalDishes: Array<{ name: string; description: string; imageUrl: string | null }>;
    funFacts: string[];
    mustVisitPlaces: Array<{ name: string; location: string; description: string; imageUrl: string | null }>;
  };
}

export default function CountryDiscover() {
  const { iso } = useParams<{ iso?: string }>();
  const navigate = useNavigate();
  const selectedIso2 = iso ? iso.toUpperCase() : null;
  const [data, setData] = useState<DiscoverData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEcoExpanded, setIsEcoExpanded] = useState(false);
  const [isIntroExpanded, setIsIntroExpanded] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<number[]>([]);
  const toggleHistoryItem = (index: number) => {
    setExpandedHistory(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index) // Nếu đang mở thì đóng lại
        : [...prev, index]              // Nếu đang đóng thì thêm vào danh sách mở
    );
  };
  useEffect(() => {
    setExpandedHistory([]);
  }, [selectedIso2]);
  
  useEffect(() => {
    const fetchCountryData = async () => {
      if (!selectedIso2) { setData(null); return; }
      try {
        setLoading(true);
        setError('');
        setData(null);
        setIsEcoExpanded(false);    // add this
        setIsIntroExpanded(false);  // add this
        const res = await fetch(`${API_BASE_URL}/countries/${selectedIso2}/discover`);
        if (!res.ok) throw new Error(`Server Error (${res.status})`);
        const result = await res.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCountryData();
  }, [selectedIso2]);

  // ==========================================
  // RENDER: IDLE (Editorial Classic Grid with Real Search)
  // ==========================================
  const ALL_COUNTRY_CODES = [
    'AF','AL','DZ','AD','AO','AG','AR','AM','AU','AT','AZ','BS','BH','BD','BB','BY','BE','BZ','BJ',
    'BT','BO','BA','BW','BR','BN','BG','BF','BI','KH','CM','CA','CV','CF','TD','CL','CN','CO','KM',
    'CG','CD','CR','CI','HR','CU','CY','CZ','DK','DJ','DM','DO','EC','EG','SV','GQ','ER','EE','SZ',
    'ET','FJ','FI','FR','GA','GM','GE','DE','GH','GR','GD','GT','GN','GW','GY','HT','HN','HK','HU',
    'IS','IN','ID','IR','IQ','IE','IL','IT','JM','JP','JO','KZ','KE','KI','XK','KW','KG','LA','LV',
    'LB','LS','LR','LY','LI','LT','LU','MO','MG','MW','MY','MV','ML','MT','MH','MR','MU','MX','FM',
    'MD','MC','MN','ME','MA','MZ','MM','NA','NR','NP','NL','NZ','NI','NE','NG','KP','MK','NO','OM',
    'PK','PW','PS','PA','PG','PY','PE','PH','PL','PT','QA','RO','RU','RW','KN','LC','WS','SM','ST',
    'SA','SN','RS','SC','SL','SG','SK','SI','SB','SO','ZA','KR','SS','ES','LK','VC','SD','SR','SE',
    'CH','SY','TW','TJ','TZ','TH','TL','TG','TO','TT','TN','TM','TV','TR','UG','UA','AE','GB','US',
    'UY','UZ','VU','VA','VE','VN','YE','ZM','ZW',
  ];

  const regionNamesEn = new Intl.DisplayNames(['en'], { type: 'region' });

  const getCountryName = (iso: string): string => {
    try { return regionNamesEn.of(iso.toUpperCase()) ?? iso; }
    catch { return iso; }
  };

  const SORTED_COUNTRIES = ALL_COUNTRY_CODES
    .map((code) => ({ code, name: getCountryName(code) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en'));

  const [searchQuery, setSearchQuery] = useState('');

  if (!selectedIso2 && !loading) {
    const filteredCountries = SORTED_COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="bg-[#F4F1EA] flex flex-col items-center pt-2 pb-0">
        <style>{CSS}</style>

        <div className="max-w-4xl w-full text-center px-6 mb-8">
          <h1 className="font-display text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-7">
            Where to next?
          </h1>

          <div className="max-w-md mx-auto relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Icon name="search" className="h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search by country name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/50 backdrop-blur-sm border border-slate-300 rounded-full py-3.5 pl-12 pr-6 text-slate-900 font-ui placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-sm focus:shadow-md"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-900 transition-colors"
              >
                <Icon name="close" className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {filteredCountries.length === 0 && (
          <div className="flex-1 flex items-center justify-center font-editorial text-xl italic text-slate-500">
            No territories found matching "{searchQuery}"
          </div>
        )}

        {filteredCountries.length > 0 && (
          <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 auto-rows-max">
            {filteredCountries.map((c) => (
              <button
                key={c.code}
                onClick={() => navigate(`/discover/${c.code}`)}
                className="h-full w-full relative aspect-[4/5] sm:aspect-square overflow-hidden group cursor-pointer focus:outline-none bg-slate-900"
              >
                <div 
                  className={`fi-${c.code.toLowerCase()} absolute inset-0 bg-cover bg-center grayscale-[30%] sepia-[20%] brightness-[0.7] group-hover:grayscale-0 group-hover:sepia-0 group-hover:brightness-[0.9] group-hover:scale-110 transition-all duration-700 ease-out`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 group-hover:from-black/70 group-hover:via-transparent group-hover:to-black/10 transition-all duration-700" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <span className="font-display text-2xl md:text-3xl lg:text-3xl text-white font-medium tracking-wide group-hover:-translate-y-1 transition-transform duration-500 [text-shadow:0_5px_2px_rgba(0,0,0,1),0_10px_8px_rgba(0,0,0,0.7)]">
                    {c.name}
                  </span>
                  <span className="absolute bottom-6 sm:bottom-10 font-data text-[11px] tracking-[0.3em] uppercase text-white/60 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                    {c.code}
                  </span>
                </div>
                <div className="absolute inset-3 sm:inset-4 border border-white/0 group-hover:border-white/20 scale-[0.95] group-hover:scale-100 transition-all duration-700 pointer-events-none" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#F4F1EA] flex flex-col items-center justify-center">
        <style>{CSS}</style>
        <div className="w-16 h-16 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mb-6" />
        <div className="font-data text-sm tracking-[0.15em] text-slate-900 animate-pulse">COMPILING DOSSIER...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4F1EA] flex flex-col items-center justify-center text-center p-6">
        <style>{CSS}</style>
        <div className="font-data text-xl text-red-600 mb-4">ACCESS DENIED</div>
        <p className="font-ui text-slate-700 mb-6">{error}</p>
        <button onClick={() => navigate('/discover')} className="px-6 py-2 bg-slate-900 text-white font-data text-sm rounded-lg hover:bg-slate-800">RETURN</button>
      </div>
    );
  }

  const { core, details: d } = data;

  const rawColor = core.flag?.accentRaw || '#52525B';
  const accentVars: CustomCSSProperties = {
    "--cm-accent": core.flag?.accentText || readableAccent(rawColor),
    "--cm-accent-raw": rawColor,
    "--cm-accent-muted": core.flag?.accentMuted || "#71717A",
    "--cm-accent-soft": core.flag?.accentSoft || hexToRgba(rawColor, 0.2),
    "--cm-accent-soft-strong": core.flag?.accentSoftStrong || hexToRgba(rawColor, 0.16),
    "--cm-accent-border": core.flag?.accentBorder || hexToRgba(rawColor, 0.35),
  };

  const availableMemberships = MEMBERSHIP_LABELS.filter(([key]) => core.memberships?.[key]);


  const ecoText = d.economy?.overview || '';
  // Đặt mốc khoảng 400 ký tự (hoặc tùy bác) để quyết định có hiện nút Read More hay không
  const isLongEco = ecoText.length > 1500;
  const introText = d.introduction || '';
  // Đoạn intro thường dài hơn kinh tế, nên ta có thể để mốc khoảng 600 - 800 ký tự
  const isLongIntro = introText.length > 1500;
  return (
    <div
      className="bg-[#F4F1EA] text-slate-800 pb-20 selection:bg-accent-raw selection:text-white"
      style={accentVars}
    >
      <style>{CSS}</style>

      {/* HERO */}
      <header className="relative mx-auto pb-8">
        {/* SỬA CHÍNH TẠI ĐÂY: 
            1. Đổi h-[46vh] md:h-[58vh] thành min-h-[46vh] md:min-h-[58vh]
            2. Thêm pt-28 md:pt-32 để tạo vùng an toàn, không bị đè lên nút Back 
        */}
        <div className="relative w-full overflow-hidden shadow-xl bg-slate-900 min-h-[46vh] md:min-h-[50vh] flex items-end p-8 pt-28 md:p-10 md:pt-16 group">
          
          <button
            onClick={() => navigate('/discover')}
            aria-label="Back to countries"
            className="absolute top-6 left-6 z-20 w-11 h-11 rounded-full bg-black/30 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/50 hover:border-white/40 transition-all"
          >
            <Icon name="arrowLeft" className="w-5 h-5" />
          </button>

          {d.coverImageUrl && (
            <img src={d.coverImageUrl} alt="Cover" className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-101 transition-all duration-1000" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-accent-raw via-slate-900/40 to-transparent pointer-events-none mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent pointer-events-none" />

          <div className="relative z-10 w-full flex items-end justify-between flex-wrap gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-accent-raw text-white px-3 py-1 rounded-sm font-data text-[12px] tracking-widest uppercase font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
                  {core.region}
                </span>
                <span className="bg-accent-raw text-white px-3 py-1 rounded-sm font-data text-[12px] tracking-widest uppercase font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
                  {core.subregion}
                </span>
                <span className="text-white font-data text-[13px] tracking-[0.2em] ml-2 drop-shadow-sm [text-shadow:-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000]">
                  {core.iso2} • {core.iso3}
                </span>
              </div>
              <h1 className="font-display text-5xl md:text-[80px] font-black text-white leading-none tracking-tight mb-2 drop-shadow-lg">
                {core.nameCommon}
              </h1>
              {(() => {
                // Lọc bỏ giá trị rỗng VÀ lọc bỏ giá trị trùng với nameCommon. Dùng Set để chống trùng lặp giữa native và official
                const subNames = Array.from(
                  new Set(
                    [core.nativeOfficial, core.nameOfficial].filter(
                      name => name && name !== core.nameCommon
                    )
                  )
                ).join(' • ');

                // Nếu có giá trị (subNames khác rỗng) thì mới render thẻ h2
                return subNames ? (
                  <h2 className="font-display text-2xl text-white/80 max-w-2xl drop-shadow-md">
                    {subNames}
                  </h2>
                ) : null;
              })()}
              <h3 className="font-display text-xl text-white/80 max-w-2xl drop-shadow-md mt-2">
                {d.etymology}
              </h3>
            </div>

            {/* KHỐI CỜ VÀ CHÚ THÍCH Ở GÓC TRÊN BÊN PHẢI */}
            <div className="flex flex-col items-end shrink-0 max-w-2xl">
              {/* 1. Xóa các class fix cứng (h-full), xóa border, xóa overflow-hidden ở div cha */}
              <div className="mb-4 shrink-0 flex items-center justify-center h-[120px] md:h-[150px]">
                
                <img 
                  src={core.flag.svgUrl} 
                  alt={`Flag of ${core.iso2}`} 
                  /* 2. Ép ảnh phải cao 100% (h-full) theo thằng cha, chiều ngang tự động scale (w-auto) */
                  className="h-full max-w-[300px] md:max-w-[350px] object-contain [filter:drop-shadow(0px_0px_1px_rgba(0,0,0,0.4))_drop-shadow(0px_2px_4px_rgba(0,0,0,0.15))]"
                />
                
              </div>
              {/* Chú thích lá cờ nằm ngay bên dưới */}
              {core.flag.description && (
                <div className="bg-white/90 backdrop-blur-md p-5 rounded-xs border border-slate-200/60 shadow-lg text-right">
                  <p className="font-ui text-md text-slate-700 leading-relaxed italic">
                    {core.flag.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* CORE IDENTITY & INTRO */}
      <div className="mx-auto mb-14">
        
        {/* KHỐI INTRODUCTION CHIẾM FULL WIDTH CÓ GẠCH NGĂN CÁCH GIỮA CÁC CỘT */}
        <div className="w-full mb-7 px-4 sm:px-6 ">
          <div className="w-full">
            {/* Kiểm tra nếu có introText thì mới render toàn bộ khối này */}
            {introText && (
              <div className="full bg-white/60 backdrop-blur-sm p-8 md:p-6 shadow-sm relative overflow-hidden border border-slate-200/80">
                
                <div 
                  className={`font-editorial text-lg md:text-base text-slate-700 leading-[1.8] columns-1 md:columns-2 lg:columns-3 gap-10 [column-rule:2px_solid_rgba(0,0,0,0.3)] [column-fill:_balance] transition-[max-height] duration-700 ease-in-out overflow-hidden ${
                    !isIntroExpanded && isLongIntro ? 'max-h-[300px]' : 'max-h-[1200px]'
                  }`}
                >
                  {/* Drop Cap cho ký tự đầu tiên */}
                  <span className="float-left text-5xl md:text-7xl font-display font-black text-accent mr-4 leading-none select-none mt-1.5">
                    {introText.charAt(0)}
                  </span>
                  
                  {/* Phần nội dung còn lại */}
                  {introText.slice(1)}
                </div>

                {/* Lớp phủ Gradient làm mờ chữ */}
                {!isIntroExpanded && isLongIntro && (
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/90 via-white/70 to-transparent pointer-events-none" />
                )}

                {/* Nút Read More / Show Less */}
                {isLongIntro && !isIntroExpanded && (
                  <div className="flex justify-center absolute bottom-0 left-0 right-0 z-10">
                    <button
                      onClick={() => setIsIntroExpanded(true)}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 text-slate-700 font-ui text-[11px] font-bold uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-300 shadow-[0_4px_15px_-3px_rgba(0,0,0,0.1)] mb-4"
                    >
                      Read More
                      <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                  </div>
                )}
                
              </div>
            )}
          </div>
        </div>
        
        <div className="w-full mb-8 px-4 sm:px-6">
          <div 
            className="bg-white/60 min-h-[350px] backdrop-blur-sm rounded-r-xs border-2 border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-stretch"
            style={{ borderLeft: '4px solid var(--cm-accent-raw)' }}
          >
            {/* Cột chữ (Bên trái) */}
            <div className="p-6 md:p-8 flex-1 flex flex-col items-start justify-start">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-[var(--cm-accent-raw)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h5 className="font-display text-[18px] uppercase tracking-[0.15em] text-[var(--cm-accent-raw)] font-semibold">
                  Geographic Positioning
                </h5>
              </div>
              {/* Bọc p trong thẻ flex-1 để nó tự động đẩy text ra giữa */}
              <div className="flex-1 flex items-start">
                <p className="font-ui text-base md:text-xl text-slate-700 leading-relaxed">
                  {/* Thay thế điều kiện hiển thị ở đây: Nếu không có thì hiện dấu "-" */}
                  {d?.geography?.location || "-"}
                </p>
              </div>
            </div>

            {/* Cột bản đồ (Bên phải) */}
            <div className="w-full md:w-3/5 lg:w-2/5 flex items-center justify-center relative border-t md:border-t-0 md:border-l-3 border-slate-200 bg-slate-50/50">
              <div className="absolute inset-0 w-full h-full">
                <CountryLocatorMap 
                  iso2={core.iso2} 
                  countryName={core.nameCommon} 
                  accentRaw={core.flag?.accentRaw}
                  accentMuted={core.flag?.accentMuted}
                />
              </div>
              {/* Placeholder để giữ chiều cao tối thiểu cho map trên mobile */}
              <div className="h-[350px] md:h-auto w-full pointer-events-none"></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-4 sm:px-6 ">
          <DataBox title="Quick Facts" tone="soft">
            {/* Đổi đường kẻ ngang thành trắng mờ (white/20) để hợp với nền tối */}
            <div className="flex flex-col divide-y divide-white/50">
              
              <div className="flex justify-between items-center py-3 first:pt-0">
                <span className="font-data text-[10px] uppercase tracking-[0.15em] text-white/90">Capital</span>
                <span className="font-ui font-semibold text-[15px] text-white text-right">{core.capital || 'N/A'}</span>
              </div>

              <div className="flex justify-between items-center py-3">
                <span className="font-data text-[10px] uppercase tracking-[0.15em] text-white/90">Area</span>
                <span className="font-ui font-semibold text-[15px] text-white text-right">
                  {core.areaKm2 ? `${core.areaKm2.toLocaleString()} km²` : 'N/A'}
                </span>
              </div>

              <div className="flex justify-between items-center py-3">
                <span className="font-data text-[10px] uppercase tracking-[0.15em] text-white/90">Timezone</span>
                <span className="font-ui font-semibold text-[15px] text-white text-right max-w-[60%] line-clamp-1" title={core.timezones?.join(', ')}>
                  {core.timezones?.join(', ')}
                </span>
              </div>

              <div className="flex justify-between items-center py-3">
                <span className="font-data text-[10px] uppercase tracking-[0.15em] text-white/90">Calling Code</span>
                <span className="font-ui font-semibold text-[15px] text-white text-right">
                  {core.callingCodes?.length ? `+${core.callingCodes[0]}` : 'N/A'}
                </span>
              </div>

              <div className="flex justify-between items-center py-3">
                <span className="font-data text-[10px] uppercase tracking-[0.15em] text-white/90">Measurement</span>
                <span className="font-ui font-semibold text-[15px] text-white text-right">
                  {core.measurementSystem ? core.measurementSystem.charAt(0).toUpperCase() + core.measurementSystem.slice(1) : 'N/A'}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 last:pb-0">
                <span className="font-data text-[10px] uppercase tracking-[0.15em] text-white/90">Temperature Scale</span>
                <span className="font-ui font-semibold text-[15px] text-white text-right">{core.temperatureScale || 'N/A'}</span>
              </div>

            </div>
          </DataBox>

          <DataBox title="Communication & Trade" tone="soft">
            <span className="block font-data text-[11px] uppercase tracking-[0.15em] text-white/80 font-semibold mb-2 mt-1">
              Currencies
            </span>
            {/* Thêm flex flex-col và gap-1 để xếp dọc và tạo khoảng cách nhẹ giữa các hàng */}
            <div className="font-semibold text-lg mb-5 flex flex-col gap-1">
              {core.currencies?.length > 0 ? (
                core.currencies.map((c, index) => (
                  <span key={index} className="block">
                    {c.name} 
                    {/* Làm mờ nhẹ cái symbol để nhìn typographic đẹp hơn */}
                    {c.symbol && (
                      <span className="inline-flex items-center justify-center min-w-[2rem] h-8 px-2 shrink-0 ml-2 rounded-full bg-white text-accent text-[15px] font-bold shadow-[0_2px_8px_-2px_rgba(0,0,0,0.5)] whitespace-nowrap">
                        {c.symbol}
                      </span>
                    )}
                  </span>
                ))
              ) : (
                <span>N/A</span>
              )}
            </div>

            <span className="block font-data text-[11px] uppercase tracking-[0.15em] text-white/80 font-semibold mb-2 mt-1">
              Languages
            </span>
            <div className="font-ui text-[15px] space-y-2">
              {core.languages?.length ? core.languages.map((l, i) => (
                <div key={i} className="flex items-baseline gap-2">
                  <span className="font-semibold text-xl text-slate-900 tracking-wide [-webkit-text-stroke:2px_white] [paint-order:stroke_fill]">
                    {l.native_name}
                  </span>
                  {l.native_name !== l.name && <span className="text-slate-100 text-xs font-data uppercase tracking-wider">{l.name}</span>}
                </div>
              )) : 'N/A'}
              {/* Thêm phần note ngôn ngữ ngay phía dưới */}
              {d?.demographics?.languages?.note && (
                <div className="text-slate-100/80 text-sm italic mt-3 pt-3 border-t border-white/50">
                  * Note: {d.demographics.languages.note}
                </div>
              )}
            </div>
          </DataBox>

          <DataBox title="National Identity">
            <div className="space-y-4">
              {/* Anthem */}
              <section>
                <span className="block text-[10px] uppercase tracking-[0.28em] text-slate-500 mb-2">
                  National Anthem
                </span>

                <h3 className="text-xl  font-display tracking-tight text-slate-900 leading-none">
                  {d.nationalAnthem?.name || "N/A"}
                </h3>

                {d.nationalAnthem?.author && (
                  <p className="mt-2 text-sm text-slate-500">
                    By {d.nationalAnthem.author}
                  </p>
                )}

                {/* {d.nationalAnthem?.audioUrl && (
                  <div className="mt-6 rounded-xl bg-slate-50 p-3">
                    <audio
                      controls
                      src={d.nationalAnthem.audioUrl}
                      className="w-full"
                    />
                  </div>
                )} */}
              </section>

              {/* Divider */}
              <div className="h-px bg-slate-300" />

              {/* Symbols */}
              <section>
                <div className="flex items-center justify-between mb-5">
                  <span className="text-[10px] uppercase tracking-[0.28em] text-slate-500">
                    National Symbols
                  </span>

                  {d.nationalSymbols?.length > 0 && (
                    <span className="text-xs text-slate-400">
                      {d.nationalSymbols.length}
                    </span>
                  )}
                </div>

                {d.nationalSymbols?.length ? (
                  <div className="grid grid-cols-2 gap-x-10 gap-y-3">
                    {d.nationalSymbols.map((symbol, index) => (
                      <div
                        key={index}
                        className="border-b border-slate-300 pb-2 text-[15px] text-slate-700 capitalize"
                      >
                        {symbol}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-slate-400">N/A</span>
                )}
              </section>
            </div>
          </DataBox>

          <div className="flex flex-col gap-5">
            <DataBox title="Geopolitical Memberships">
              {availableMemberships.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {availableMemberships.map(([key, label]) => (
                    <span key={key} className="font-data text-[12px] font-semibold tracking-[0.08em] uppercase px-3 py-1.5 rounded-md bg-accent-raw text-white  shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                      {label}
                    </span>
                  ))}
                </div>
              ) : <span className="font-ui text-sm text-slate-500">No major memberships recorded.</span>}
            </DataBox>

            {/* <DataBox title="Religions">
              {d.religions?.length > 0 ? (
                <div className="space-y-3">
                  {d.religions.map((rel, i) => <ProgressBar key={i} label={rel.name} percent={rel.percent} />)}
                </div>
              ) : <span className="font-ui text-sm text-slate-500">No religious data</span>}
            </DataBox> */}
          </div>
        </div>

        {/* RELIGIOUS DEMOGRAPHICS (FULL WIDTH SECTION) */}
        {d.religions?.length > 0 && (
          <div className="mx-auto w-full mb-14 mt-6">
            
            {/* Header của chuyên mục */}
            <div className="flex items-center justify-between pb-4 mb-2 px-4 sm:px-6 ">
              <h3 className="font-display text-xl md:text-2xl font-bold tracking-tight text-slate-900">
                Religious Beliefs
              </h3>
            </div>

            {/* Lưới động: Tự động điều chỉnh số cột, bọc outer bo tròn và ẩn tràn để dính liền nhau */}
            <div className={`grid overflow-hidden border border-slate-200/50 shadow-sm ${
              d.religions.length === 1 ? 'grid-cols-1 md:grid-cols-2' : 
              d.religions.length === 2 ? 'grid-cols-1 md:grid-cols-3' : 
              'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
            }`}>
              
              {/* CÁC CỘT ĐẦU: Lấy tối đa 3 tôn giáo lớn nhất */}
              {[...d.religions]
                .sort((a, b) => b.percent - a.percent)
                .slice(0, 3)
                .map((rel, idx) => (
                <div 
                  key={idx} 
                  // Tăng chiều cao lên 400px, gỡ bỏ border riêng của từng ô
                  className="relative aspect-square md:aspect-auto md:h-[380px] overflow-hidden group"
                >
                  {/* Background Image với hiệu ứng Zoom nhẹ khi hover */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-1000"
                    style={{ backgroundImage: `url(${getReligionBg(rel.name)})` }}
                  />
                  
                  {/* Lớp phủ Gradient làm tối nền để chữ trắng nổi bật */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 group-hover:from-black/90 transition-colors duration-500" />
                  
                  {/* Nội dung Tên và Tỉ lệ căn giữa */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <span className="font-display text-2xl md:text-3xl lg:text-2xl xl:text-3xl font-bold text-white mb-2 drop-shadow-md capitalize">
                      {rel.name}
                    </span>
                    {/* Chỉ hiển thị % nếu lớn hơn 0 */}
                    {Number(rel.percent) > 0 && (
                      <span className="font-ui text-lg font-medium text-white/90 drop-shadow-sm">
                        {rel.percent}%
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* CỘT CUỐI CÙNG: Bảng thống kê (Progress Bar Tổng quát) */}
              {/* Gỡ bỏ rounded-3xl và border để nó dính sát vào các ô ảnh */}
              <div className="bg-white/80 backdrop-blur-md p-6 xl:px-8 flex flex-col h-[380px] overflow-y-auto">
                <div className="space-y-4 my-auto">
                  {/* Lọc bỏ luôn các tôn giáo 0% ra khỏi bảng thống kê cho gọn */}
                  {d.religions
                    .filter(rel => Number(rel.percent) > 0)
                    .map((rel, i) => (
                      <ProgressBar key={i} label={rel.name} percent={rel.percent} />
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      <div className="mx-auto px-4 sm:px-6 space-y-6">
        {/* GEOGRAPHY & DEMOGRAPHICS */}
        <div>
          <div className="flex items-center gap-4 mb-6 md:mb-8">
            {/* Icon Box - Phát sáng nhẹ với màu Accent */}
            <Map className="w-8 h-8" strokeWidth={1.2} /> 
            
            {/* Typography Group */}
            <div className="flex flex-col">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 tracking-tight">
                Geography & Demographics
              </h2>
            </div>
          </div>
        
          {/* ROW 1: Environment (light) & Population (dark) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">
        
            {/* Environment & Terrain */}
            <div className="xl:col-span-8 bg-white rounded-xl p-8 border border-slate-300">
              <h3 className="flex items-center gap-2.5 font-display text-lg font-semibold text-slate-800 capitalize pb-4 mb-6 border-b border-slate-200">
                <Mountain className="w-[18px] h-[18px] fill-current text-slate-800" strokeWidth={1.75} />
                Environment &amp; Terrain
              </h3>
        
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                <div>
                  <span className="block font-data text-base capitalize text-slate-500 mb-1">Climate</span>
                  <span className="font-ui text-base text-slate-700 capitalize">{d.geography?.climate || 'N/A'}</span>
                </div>
                <div>
                  <span className="block font-data text-base capitalize text-slate-500 mb-1">Terrain</span>
                  <span className="font-ui text-base text-slate-700  capitalize">{d.geography?.terrain || 'N/A'}</span>
                </div>
                <div>
                  <span className="block font-data text-base capitalize text-slate-500 mb-1">Coastline</span>
                  <span className="font-ui text-base font-medium text-slate-800 inline-flex items-center gap-1.5">
                    <Waves className="w-3.5 h-3.5 text-teal-600" strokeWidth={1.75} />
                    {d.geography?.coastlineKm ? `${d.geography.coastlineKm.toLocaleString()} km` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="block font-data text-base capitalize text-slate-500">Borders</span>
                  <span
                    className="font-ui text-base text-slate-700 leading-snug"
                    title={d.geography?.landBoundaries?.borderCountries?.map(b => `${b.country} (${b.borderLengthKm} km)`).join(', ') || core.borders?.join(', ')}
                  >
                    {/* Nhãn Landlocked */}
                    {core.landlocked && (
                      <span className="">
                        Landlocked Country. {" "}
                      </span>
                    )}

                    {/* Danh sách biên giới */}
                    {d.geography?.landBoundaries?.borderCountries?.length ? (
                      <>
                        {d.geography.landBoundaries.totalKm && (
                          <span className=" text-slate-700 mr-1">
                            Sharing {d.geography.landBoundaries.totalKm.toLocaleString()} kms of borders with:
                          </span>
                        )}
                        {d.geography.landBoundaries.borderCountries.map(b => 
                          `${b.country} (${b.borderLengthKm ? `${b.borderLengthKm.toLocaleString()} km` : 'N/A'})`
                        ).join(', ')}
                      </>
                    ) : core.borders?.length ? (
                      core.borders.join(', ')
                    ) : (
                      !core.landlocked && 'Island / No land borders'
                    )}
                  </span>
                </div>
        
                {/* Elevation */}
                <div className="sm:col-span-2 flex flex-wrap gap-8 pt-5 border-t border-slate-200">
                  <div>
                    <span className="block font-data text-base capitalize text-slate-500 mb-1">Highest Point</span>
                    <span className="font-ui text-base text-slate-700 inline-flex items-center gap-1.5">
                      {d.geography?.elevation?.highestPoint || 'N/A'}
                      <span className="inline-flex items-center gap-0.5 text-emerald-600 font-medium">
                        <ArrowUp className="w-3 h-3" strokeWidth={2} />
                        {d.geography?.elevation?.highestElevation || 0}m
                      </span>
                    </span>
                  </div>
                  <div>
                    <span className="block font-data text-base capitalize text-slate-500 mb-1">Lowest Point</span>
                    <span className="font-ui text-base text-slate-700 inline-flex items-center gap-1.5">
                      {d.geography?.elevation?.lowestPoint || 'N/A'}
                      <span className="inline-flex items-center gap-0.5 text-rose-600 font-medium">
                        <ArrowDown className="w-3 h-3" strokeWidth={2} />
                        {d.geography?.elevation?.lowestElevation || 0}m
                      </span>
                    </span>
                  </div>
                </div>
              </div>
        
              {/* Natural Hazards */}
              {d.geography?.naturalHazards?.length > 0 && (
                <div className="mt-6 pt-5 border-t border-slate-200">
                  <span className="flex items-center gap-1.5 font-data text-base capitalize text-slate-500 mb-3">
                    <TriangleAlert className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.75} />
                    Natural Hazards
                  </span>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 capitalize">
                    {d.geography.naturalHazards.map((h, i) => (
                      <span key={i} className="font-ui text-base text-amber-700 border-b border-amber-400 pb-0.5">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
        
            {/* Population Core */}
            <div className="xl:col-span-4 bg-accent-raw text-white rounded-lg p-8 border border-white/20 shadow-2xl shadow-[color:var(--cm-accent-soft-strong)] transition-all">
              <div className="flex w-full gap-4 md:gap-6 mb-8">
        
                {/* Total Population */}
                <div className="flex-1  group">
                  <span className="flex items-center gap-2 text-[13px] uppercase tracking-widest font-semibold text-white/90 mb-2 group-hover:text-white transition-colors">
                    <Users className="w-4 h-4 opacity-90" strokeWidth={2} />
                    Total Population
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    {/* <span className="text-4xl font-bold font-cinzel text-white tracking-wide drop-shadow-sm">
                      {core.population ? (core.population / 1e6).toFixed(1) : '—'}
                    </span> */}
                    <span className="text-4xl font-bold font-cinzel text-white tracking-wide drop-shadow-sm">
                      {core.population != null 
                        ? (core.population >= 1e9 
                            ? `${(core.population / 1e9).toFixed(1)}B` 
                            : core.population.toLocaleString('en-US'))
                        : '—'}
                    </span>
                  </div>
                </div>
        
                {/* Vertical Divider */}
                <div className="w-[1px] bg-white/20 self-stretch my-2"></div>
        
                {/* Growth Rate */}
                <div className="flex-1 overflow-hidden group">
                  <span className="flex items-center gap-2 text-[13px] uppercase tracking-widest font-semibold text-white/90 mb-2 truncate group-hover:text-white transition-colors">
                    {Number(d.demographics?.populationGrowthRate) >= 0
                      ? <TrendingUp className="w-4 h-4 text-emerald-300" strokeWidth={2} />
                      : <TrendingDown className="w-4 h-4 text-rose-300" strokeWidth={2} />}
                    Growth Rate
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-4xl font-bold font-cinzel tracking-wide drop-shadow-sm ${
                      Number(d.demographics?.populationGrowthRate) > 0
                        ? 'text-emerald-300'
                        : Number(d.demographics?.populationGrowthRate) < 0
                          ? 'text-rose-300'
                          : 'text-white'
                    }`}>
                      {Number(d.demographics?.populationGrowthRate) > 0 ? '+' : ''}{d.demographics?.populationGrowthRate}
                    </span>
                    <span className="text-3xl text-white font-medium">%</span>
                  </div>
                </div>
              </div>
        
              {/* Age Structure */}
              <div className="space-y-4 pt-6 border-t border-white/20">
                <span className="block text-[11px] uppercase tracking-widest font-semibold text-white/90 mb-4">
                  Age Structure
                </span>
                
                {Object.entries({
                  "0-14 yrs": d.demographics?.ageStructure?.["0_14"],
                  "15-24 yrs": d.demographics?.ageStructure?.["15_24"],
                  "25-54 yrs": d.demographics?.ageStructure?.["25_54"],
                  "55-64 yrs": d.demographics?.ageStructure?.["55_64"],
                  "65+ yrs": d.demographics?.ageStructure?.["65_over"]
                }).map(([label, val], i) => (
                  <div key={i} className="flex items-center gap-2 group">
                    
                    {/* Label - Rõ ràng, đứng đắn */}
                    <span className="w-16 shrink-0 text-[12px] font-medium tracking-wider text-white/80 group-hover:text-white transition-colors">
                      {label}
                    </span>
                    
                    {/* Bar Chart Container - Có Border, padding nhẹ để lõm vào trong */}
                    <div className="flex-1 h-3 bg-black/20 rounded-xs border border-white/50 overflow-hidden shadow-inner">
                      {/* Bar Fill - Bo góc nhẹ nhàng để khớp với khung */}
                      <div 
                        className="h-full bg-white rounded-xs shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-all duration-700 ease-out" 
                        style={{ width: `${val || 0}%` }} 
                      />
                    </div>
                    
                    {/* Value - Chữ sắc nét */}
                    <span className="w-12 text-right text-[13px] font-semibold text-white/90 group-hover:text-white transition-colors">
                      {val || 0}%
                    </span>
                    
                  </div>
                ))}
              </div>
            </div>
        
          </div>
        
          {/* ROW 2: Health, Medical, Urban */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
            {/* Health & Education */}
            <div className="bg-white rounded-lg p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2.5 border-b border-slate-200 pb-4 mb-5">
                <h4 className="text-base uppercase font-display tracking-widest text-slate-900">
                  Health &amp; Education
                </h4>
              </div>
        
              <div className="flex flex-col space-y-1">
                {[
                  { label: "Life Expectancy", value: d.demographics?.lifeExpectancy, suffix: "years" },
                  { label: "Literacy Rate", value: d.demographics?.literacyRate, suffix: "%" },
                  { label: "School Life Expect.", value: d.demographics?.schoolLifeExpectancy, suffix: "years" },
                  { label: "Median Age", value: d.demographics?.medianAge, suffix: "years" },
                  { label: "Mean Maternal Age", value: d.demographics?.meanMaternalAge, suffix: "years" },
                  { label: "Fertility Rate", value: d.demographics?.totalFertilityRate?.childrenBornPerWoman, suffix: "children/woman" },
                  { label: "Obesity Rate", value: d.demographics?.obesityRate, suffix: "%" },
                  { label: "Sex Ratio", value: d.demographics?.sexRatioTotal, suffix: "male per female" }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-end py-2.5 border-b border-slate-200 last:border-0 group">
                    <span className="text-[13px] uppercase tracking-wider font-semibold text-slate-600 group-hover:text-slate-800 transition-colors">
                      {item.label}
                    </span>
                    <span className="text-[15px] font-bold text-slate-800">
                      {item.value ? `${item.value} ` : '— '}
                      {item.value && <span className="text-[15px] font-bold text-slate-600 ml-0.5">{item.suffix}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
        
            {/* Medical Infrastructure */}
            <div className="bg-white rounded-lg p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-center gap-2.5 border-b border-slate-200 pb-4 mb-6">
                <h4 className="text-base uppercase font-display tracking-widest text-slate-900">
                  Medical Infrastructure
                </h4>
              </div>
        
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Physicians */}
                <div className="flex flex-col">
                  <span className="text-4xl font-bold tracking-tight text-slate-800 drop-shadow-sm mb-1">
                    {d.demographics?.physiciansDensity || '—'}
                  </span>
                  <span className="text-[12px] uppercase tracking-widest font-bold text-slate-600">
                    Physicians / 1000 people
                  </span>
                </div>
                
                {/* Beds */}
                <div className="flex flex-col">
                  <span className="text-4xl font-bold tracking-tight text-slate-800 drop-shadow-sm mb-1">
                    {d.demographics?.hospitalBedDensity || '—'}
                  </span>
                  <span className="text-[12px] uppercase tracking-widest font-bold text-slate-600">
                    Beds / 1000 people
                  </span>
                </div>
              </div>
        
              {/* Disease Risk - Dạng Alert Box Kỹ thuật */}
              <div className="mt-auto bg-rose-50/50 border border-rose-100 rounded-md p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Biohazard className="w-7 h-7 text-rose-500" strokeWidth={2} />
                  <strong className="text-[15px] uppercase tracking-widest font-bold text-rose-600">
                    Disease Risk
                  </strong>
                </div>
                <span className="text-[15px] font-medium capitalize text-slate-700 leading-relaxed block">
                  {d.demographics?.infectiousDiseasesRisk || 'Standard / Unspecified'}
                </span>
              </div>
            </div>
        
            
            {/* Ethnicities & Urbanization */}
            <div className="bg-white rounded-lg p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              
              {/* Header đồng bộ với Medical Infra */}
              <div className="flex items-center gap-2.5 border-b border-slate-200 pb-4">
                <h4 className="text-base uppercase font-display tracking-widest text-slate-900">
                  Ethnicities & Urbanization
                </h4>
              </div>
              
              {/* Nội dung giữ nguyên */}
              <MiniRow 
                label="Urbanization Rate" 
                value={d.demographics?.urbanizationRate ? `${d.demographics.urbanizationRate}%` : undefined} 
              />
              
              <div className="mt-5 mb-5">
                <span className="block font-data text-[10px] uppercase tracking-widest text-slate-500 mb-3 font-semibold">
                  Ethnic Groups
                </span>
                {d.demographics?.ethnicGroups?.length > 0 ? (
                  <div className="space-y-2">
                    {d.demographics.ethnicGroups.map((e, i) => (
                      <ProgressBar key={i} label={e.name} percent={e.percent} />
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-slate-400">N/A</span>
                )}
              </div>
              
              <div className="mt-auto pt-5 border-t border-slate-200">
                <span className="block font-data text-[10px] uppercase tracking-widest text-slate-500 mb-3 font-semibold">
                  Major Urban Areas
                </span>
                <ul className="space-y-2 text-sm font-ui text-slate-700">
                  {d.demographics?.majorUrbanAreas?.map((u, i) => (
                    <li key={i} className="flex justify-between items-center group">
                      <span className="font-medium text-slate-600">{u.name}</span>
                      {/* Line kẻ chấm bi giữa tên và dân số */}
                      <div className="flex-1 border-b border-dotted border-slate-400 mx-3 relative top-[4px] group-hover:border-slate-500 transition-colors"></div>
                      <span className="font-bold text-slate-800">
                        {u.population >= 1e9 
                          ? `${(u.population / 1e9).toFixed(1)}B` 
                          : u.population.toLocaleString('en-US')}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              
            </div>
        
          </div>
        </div>
        {/* STATE, ECONOMY & INFRASTRUCTURE */}
        <div className="mb-8">
          <SectionHeader title="State, Economy & Infrastructure" icon="state" />
          
          {/* KHỐI ECONOMY ĐƯỢC THIẾT KẾ DẠNG BÁO CÁO TẠP CHÍ */}
          <div className="w-full bg-white/60 backdrop-blur-sm p-8 md:p-6 shadow-sm relative overflow-hidden border border-slate-200/80 mb-6">
            {/* Dải màu trang trí phía trên khung */}
            <span className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-raw via-accent-soft to-transparent opacity-60" />
            
            <div className="flex items-center justify-between border-b border-slate-400/70 pb-4 mb-6">
              <h3 className="font-display text-xl md:text-2xl font-bold tracking-tight text-slate-900">
                Economy Overview
              </h3>
            </div>
            {/* Khối bọc ngoài: Quản lý chiều cao và hiệu ứng mượt */}
            <div className="relative w-full">
              {/* Nội dung chính */}
              <div 
                className={`font-editorial text-lg md:text-base text-slate-700 leading-[1.8] columns-1 md:columns-2 lg:columns-3 gap-10 [column-rule:2px_solid_rgba(0,0,0,0.4)] [column-fill:_balance] transition-[max-height] duration-700 ease-in-out overflow-hidden ${
                  !isEcoExpanded && isLongEco ? 'max-h-[300px]' : 'max-h-[2500px]'
                }`}
              >
                {/* Drop Cap */}
                {ecoText && (
                  <span className="float-left text-5xl md:text-7xl font-display font-black text-accent mr-2 leading-none select-none mt-1.5">
                    {ecoText.charAt(0)}
                  </span>
                )}
                {/* Text còn lại */}
                {ecoText.slice(1)}
              </div>

              {/* Lớp phủ Gradient làm mờ chữ (Chỉ hiện khi đang đóng và text đủ dài) */}
              {!isEcoExpanded && isLongEco && (
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
              )}

              {/* Nút Read More / Show Less */}
              {isLongEco && !isEcoExpanded && (
                <div className="flex justify-center absolute bottom-0 left-0 right-0 z-10">
                  <button
                    onClick={() => setIsEcoExpanded(true)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 text-slate-700 font-ui text-[11px] font-bold uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-300 shadow-[0_4px_15px_-3px_rgba(0,0,0,0.1)]"
                  >
                    Read More
                    <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-5">
            <MetricCard label="GDP (PPP)" value={d.economy?.gdpPpp ? `$${(d.economy.gdpPpp/1e9).toFixed(0)}B` : '—'} />
            <MetricCard label="GDP/Capita (PPP)" value={d.economy?.gdpPerCapita ? `$${d.economy.gdpPerCapita.toLocaleString()}` : '—'} />
            <MetricCard label="Real Growth" value={d.economy?.realGrowthRate ? `${d.economy.realGrowthRate}%` : '—'} />
            <MetricCard label="Inflation" value={d.economy?.inflationRate ? `${d.economy.inflationRate}%` : '—'} />
            <MetricCard label="Unemployment" value={d.economy?.unemploymentRate ? `${d.economy.unemploymentRate}%` : '—'} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="bg-white p-7 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
              <h3 className="font-display text-2xl text-accent mb-5">Trade & Markets</h3>
              <MiniRow label="Poverty Rate" value={d.economy?.povertyRate ? `${d.economy.povertyRate}%` : undefined} />
              <MiniRow label="Public Debt" value={d.economy?.publicDebt ? `${d.economy.publicDebt}% GDP` : undefined} />
              <MiniRow label="Budget Revenues" value={d.economy?.budget?.revenues ? `$${(d.economy.budget.revenues/1e9).toFixed(1)}B` : undefined} />
              <MiniRow label="Budget Expend." value={d.economy?.budget?.expenditures ? `$${(d.economy.budget.expenditures/1e9).toFixed(1)}B` : undefined} />

              <div className="mt-4 pt-4">
                <span className="block font-data text-[12px] uppercase text-slate-500 mb-2">Industries</span>
                <div className="flex flex-wrap gap-2 mb-4 capitalize">{d.economy?.industries?.map((ind, i) => <Tag key={i} text={ind} color="bg-accent-raw text-accent" />)}</div>

                <span className="block font-data text-[12px] uppercase text-slate-500 mb-2">Agriculture</span>
                <div className="flex flex-wrap gap-2 capitalize">{d.economy?.agricultureProducts?.map((ag, i) => <Tag key={i} text={ag} color="bg-accent-raw text-accent" />)}</div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                {/* Exports */}
                <div>
                  <span className="block font-data text-[12px] uppercase text-slate-500 mb-2 font-bold tracking-widest">
                    Top Exports To
                  </span>
                  {d.economy?.exportPartners?.length > 0 ? (
                    <div className="space-y-2">
                      {d.economy.exportPartners.map((p, i) => (
                        <ProgressBar key={i} label={p.name} percent={p.percent} />
                      ))}
                    </div>
                  ) : (
                    <span className="text-[13px] font-semibold text-slate-400">—</span>
                  )}
                </div>
                
                {/* Imports */}
                <div>
                  <span className="block font-data text-[12px] uppercase text-slate-500 mb-2 font-bold tracking-widest">
                    Top Imports From
                  </span>
                  {d.economy?.importPartners?.length > 0 ? (
                    <div className="space-y-2">
                      {d.economy.importPartners.map((p, i) => (
                        <ProgressBar key={i} label={p.name} percent={p.percent} />
                      ))}
                    </div>
                  ) : (
                    <span className="text-[13px] font-semibold text-slate-400">—</span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white p-7 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
              <h3 className="font-display text-2xl text-accent mb-5">Government & Civics</h3>
              <MiniRow label="Government Type" value={d.government?.type} />
              <MiniRow label="Independence" value={d.government?.independenceDate} />
              <MiniRow label="Voting Age" value={d.government?.civics?.votingAge ? `${d.government.civics.votingAge} years old` : undefined} />
              <MiniRow label="Dual Citizenship" value={d.government?.civics?.dualCitizenship ? 'Allowed' : 'Not Allowed'} />
              <MiniRow label="Naturalization" value={d.government?.civics?.naturalizationYears ? `${d.government.civics.naturalizationYears} ` : undefined} />

              <div className="mt-4 pt-4 space-y-3">
                <div><span className="block font-data text-[12px] uppercase text-slate-500">Executive</span><p className="font-ui text-sm">{d.government?.executiveBranch}</p></div>
                <ExpandableBlock 
                  label="Legislative" 
                  text={d.government?.legislativeBranch} 
                  charLimit={120} 
                />
                <div><span className="block font-data text-[12px] uppercase text-slate-500">Judicial</span><p className="font-ui text-sm">{d.government?.judicialBranch}</p></div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-200">
                <span className="block font-data text-[12px] uppercase text-slate-500 mb-2">National Holidays</span>
                <ul className="text-sm font-ui space-y-1 overflow-y-auto pr-2">
                  {d.government?.nationalHolidays?.map((h, i) => (
                    <li key={i} className="flex gap-3"><span className="font-bold text-accent shrink-0">{h.date}</span><span className="text-slate-600 line-clamp-1">{h.name}</span></li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white p-7 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
              <h3 className="font-display text-2xl text-accent mb-5">Infrastructure</h3>
              <MiniRow label="Internet Access" value={d.infrastructure?.internetUsersPercent ? `${d.infrastructure.internetUsersPercent}%` : undefined} />
              <MiniRow label="Electricity Access" value={d.infrastructure?.electricityAccess ? `${d.infrastructure.electricityAccess}%` : undefined} />
              <MiniRow label="Roadways" value={d.infrastructure?.roadwaysKm ? `${d.infrastructure.roadwaysKm.toLocaleString()} km` : undefined} />
              <MiniRow label="Airports" value={d.infrastructure?.airportsTotal?.toLocaleString()} />
              <MiniRow label="Driving Side" value={core.drivingSide ? core.drivingSide.charAt(0).toUpperCase() + core.drivingSide.slice(1) : undefined} />

              <div className="mt-5">
                <span className="block font-data text-[10px] uppercase text-slate-500 mb-2">Electricity Sources</span>
                <div className="flex h-4 rounded-lg overflow-hidden mb-2 border border-slate-100">
                  <div style={{width: `${d.infrastructure?.electricitySources?.fossil || 0}%`}} className="bg-slate-700" title="Fossil" />
                  <div style={{width: `${d.infrastructure?.electricitySources?.hydro || 0}%`}} className="bg-blue-400" title="Hydro" />
                  <div style={{width: `${d.infrastructure?.electricitySources?.nuclear || 0}%`}} className="bg-purple-400" title="Nuclear" />
                  <div style={{width: `${d.infrastructure?.electricitySources?.renewable || 0}%`}} className="bg-accent" title="Renewable" />
                </div>
                <div className="flex gap-3 font-ui text-[10px] text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-slate-700 rounded-full" /> Fossil ({d.infrastructure?.electricitySources?.fossil}%)</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-400 rounded-full" /> Hydro ({d.infrastructure?.electricitySources?.hydro}%)</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-purple-400 rounded-full" /> Nuclear ({d.infrastructure?.electricitySources?.nuclear}%)</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-accent rounded-full" /> Renew. ({d.infrastructure?.electricitySources?.renewable}%)</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-2 pt-5 w-full">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row overflow-hidden">
              
              {/* CỘT TRÁI: Đã đổi sang theme Accent Raw giống Communication & Trade */}
              <div className="w-full md:w-1/4 bg-[var(--cm-accent-raw)]  p-4 md:px-5 md:py-6 flex flex-col text-white">
                <div className="flex items-center gap-3 mb-3">
                  {/* Icon đổi sang màu trắng */}
                  <ShieldAlert className="w-5 h-5 text-white" strokeWidth={2} />
                  <h3 className="font-display text-xl text-white font-semibold tracking-wide">
                    Defense & Military
                  </h3>
                </div>

                <div className="flex-1 flex flex-col gap-8">
                  {/* Expenditures */}
                  <div>
                    {/* Label mờ như DataBox */}
                    <span className="block font-mono text-[11px] uppercase tracking-[0.15em] text-white/80 font-semibold mb-2 mt-1">
                      Expenditures
                    </span>
                    
                    {/* flex-wrap để nếu trên mobile màn hình nhỏ nó sẽ tự rớt dòng đẹp mắt */}
                    <div className="flex items-baseline flex-wrap gap-y-1">
                      <span className="font-display text-4xl text-white font-bold mr-1.5">
                        {d.military?.expenditures || '—'}
                      </span>
                      
                      {d.military?.expenditures && (
                        <span className="font-display text-xl font-semibold text-white">
                          % GDP
                        </span>
                      )}
                      
                      {/* Tiền tệ ngang hàng, được ngăn cách bởi border-l (thanh dọc mờ) */}
                      {d.military?.expenditures && d.economy?.gdpPpp && (
                        <span className="text-white font-display text-4xl font-medium border-l border-white/80 pl-2.5 ml-2.5">
                          ${Math.ceil((d.economy.gdpPpp * (Number(d.military.expenditures) / 100)) / 1e9)} 
                          <span className="text-white font-display text-xl font-medium ml-2">
                            Billion
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Service Age */}
                  <div>
                    {/* Label mờ như DataBox */}
                    <span className="block font-mono text-[11px] uppercase tracking-[0.15em] text-white/80 font-semibold mb-2 mt-1">
                      Active Service Age
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display text-4xl text-white font-bold">
                        {d.military?.serviceAgeAndObligation?.years || '—'}
                      </span>
                      {d.military?.serviceAgeAndObligation?.years && (
                        <span className="font-ui text-2xl font-semibold text-white/90">
                          years old
                        </span>
                      )}
                    </div>

                    {/* Hiển thị trường note y hệt style note của Languages (có border trên) */}
                    {/* Hiển thị trường note ở dưới với thanh kẻ sọc dọc */}
                    {d.military?.serviceAgeAndObligation?.note && (
                      <p className="mt-2 text-white/80 font-ui text-sm leading-relaxed border-l-3 border-white/80 pl-3">
                        {d.military.serviceAgeAndObligation.note}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI: Các vấn đề tranh chấp (Giữ nguyên nền trắng để tạo độ tương phản mạnh) */}
              <div className="w-full md:w-3/4 p-6 md:p-6 bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-4 h-4 text-[color:var(--cm-accent-raw)]" strokeWidth={1.5} />
                  <h3 className="font-mono text-[15px] uppercase tracking-[0.15em] text-[color:var(--cm-accent-raw)]">
                    Transnational Issues & Disputes
                  </h3>
                </div>
                
                <div className="space-y-3">
                  {d.military?.transnationalIssues?.length > 0 ? (
                    d.military.transnationalIssues.map((issue, idx) => (
                      <div key={idx} className="flex items-start gap-4">
                        <span className="text-[color:var(--cm-accent-raw)] font-display font-medium text-lg leading-none mt-1.5 shrink-0">
                          —
                        </span>
                        <p className="font-editorial text-sm md:text-base text-slate-700 leading-[1.8]">
                          {issue}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-start gap-4">
                      <span className="text-slate-300 font-display font-medium text-lg leading-none mt-1.5 shrink-0">
                        —
                      </span>
                      <p className="font-editorial text-base md:text-lg text-slate-400 italic leading-[1.8]">
                        No major transnational issues reported.
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* THE CULTURE DOSSIER */}
        <div className="relative py-8">
          <div className="absolute inset-0 bg-white rounded-[1rem] shadow-2xl z-0" />
          <div className="relative z-10 px-6 lg:px-16">

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div>
                <h3 className="font-display text-3xl text-accent mb-5">National Vibe</h3>
                <p className="font-editorial text-xl text-slate-700 leading-[1.6] drop-cap mb-7">
                  {d.culturalNuances?.nationalVibe}
                </p>
                <div>
                  <h3 className="font-display text-3xl text-accent mb-5">
                    Communication Style
                  </h3>
                  {/* Thụt lề nhẹ để phân cấp thông tin bằng layout thay vì dùng Box */}
                  <div className="">
                    <p className="font-editorial text-xl text-slate-700 leading-[1.6] drop-cap mb-7">
                      {d.culturalNuances?.communicationStyle}
                    </p>
                  </div>
                </div>
              </div>

              {/* ===== CỘT PHẢI (5 CỘT): ETIQUETTE (DOS & DON'TS) ===== */}
              <div className="relative">
                
                {/* Đổi sang nền sáng (slate-50) để mọi màu chữ/icon đều tương phản tốt nhất */}
                <div className="h-full bg-slate-50 border border-slate-200/80 rounded-2xl p-8 relative overflow-hidden shadow-sm">
                  
                  {/* Dải màu nhấn ở mép trên cùng của thẻ */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[var(--cm-accent-raw)] to-[var(--cm-accent-soft)]" />
                  
                  <h3 className="font-display text-[22px] text-slate-900 font-bold mb-8">Etiquette & Conduct</h3>
                  
                  <div className="space-y-8">
                    
                    {/* DO'S */}
                    <div>
                      <h4 className="font-data text-xs md:text-sm tracking-[0.2em] font-bold text-emerald-700 mb-4 flex items-center gap-2 uppercase">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        To Embrace (Do's)
                      </h4>
                      <ul className="space-y-3">
                        {d.culturalNuances?.etiquette?.dos?.map((item, i) => (
                          <li key={i} className="flex gap-3 font-ui text-[14px] md:text-[15px] text-slate-700 leading-relaxed">
                            <span className="text-emerald-500 mt-1 flex-shrink-0">●</span> 
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Đường phân cách */}
                    <div className="h-px bg-slate-300 w-full" />

                    {/* DONT'S */}
                    <div>
                      <h4 className="font-data text-xs md:text-sm tracking-[0.2em] font-bold text-rose-700 mb-4 flex items-center gap-2 uppercase">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        To Avoid (Don'ts)
                      </h4>
                      <ul className="space-y-3">
                        {d.culturalNuances?.etiquette?.donts?.map((item, i) => (
                          <li key={i} className="flex gap-3 font-ui text-[14px] md:text-[15px] text-slate-700 leading-relaxed">
                            <span className="text-rose-500 mt-1 flex-shrink-0">■</span> 
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* KHUNG TIMELINE VỚI ẢNH NỀN CHÂU LỤC (FROSTED GLASS) */}
        <div className="relative w-full mb-8 rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm">
          
          {/* 1. LỚP ẢNH NỀN TỪ FOLDER PUBLIC */}
          {/* Dùng grayscale nhẹ và mix-blend để ảnh không bị gắt, hài hòa với mọi theme */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('${getHistoryBgImage(core.region ?? "", core.subregion ?? "")}')` 
            }}
          />

          {/* 2. LỚP PHỦ KÍNH TRẮNG MỜ (Giữ cho layout chữ của bác luôn nét) */}
          <div className="absolute inset-0 bg-gray-200/20 backdrop-blur-xs" />

          {/* 3. LỚP HỌA TIẾT CHẤM BI NHẸ (Tạo cảm giác bản đồ lịch sử) */}
          <div className="absolute inset-0 bg-[repeating-linear-gradient(70deg,transparent,transparent_4px,#00000008_4px,#00000008_5px),repeating-linear-gradient(-45deg,transparent,transparent_4px,#00000008_4px,#00000008_5px)]" />

          {/* ======================================================== */}
          {/* NỘI DUNG CHÍNH - BẮT ĐẦU TỪ ĐÂY LÀ GIỮ NGUYÊN CODE CỦA BÁC */}
          {/* ======================================================== */}
          <div className="relative p-8 md:p-8">
            {/* Tiêu đề căn trái */}
            <h3 className="font-display text-3xl md:text-5xl text-slate-900 mb-8 font-bold tracking-tight [text-shadow:-1.5px_-1.5px_0_#fff,1.5px_-1.5px_0_#fff,-1.5px_1.5px_0_#fff,1.5px_1.5px_0_#fff]">
              Historical Timeline
            </h3>
            
            {/* Khối Timeline bám lề trái */}
            <div className="relative border-l-4 border-[var(--cm-accent-raw)] ml-2 md:ml-0">
              {d.historyTimeline?.map((item, i) => (
                <div key={i} className="relative pl-8 md:pl-8 mb-8 group">
                  
                  {/* ===== NÚT TIMELINE (NODE) ===== */}
                  <div className="absolute -left-[2px] -translate-x-1/2 flex items-center justify-center w-8 h-8">
                    <div className="absolute w-4 h-4 rounded-full bg-white border-2 border-[var(--cm-accent-raw)] transition-colors duration-300 shadow-sm" />
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--cm-accent-raw)] group-hover:scale-150 transition-all duration-300" />
                  </div>

                  {/* ===== NỘI DUNG 3 TẦNG ===== */}
                  <div className="relative transition-transform duration-300 ease-out flex flex-col pt-0.5">
                    
                    {/* Tầng 1: BOX NĂM */}
                    <div className="w-fit bg-[var(--cm-accent-raw)] px-4 py-1.5 md:py-1">
                      <span className="block font-display text-lg md:text-xl font-semibold tracking-[0.1em] text-white">
                        {item.year}
                      </span>
                    </div>
                    
                    {/* Tầng 2: BOX SỰ KIỆN */}
                    <div className="w-fit bg-[var(--cm-accent-raw)] border border-t-slate-100/40 px-4 py-3 md:py-2 z-10 relative">
                      <h4 className="font-display text-xl md:text-xl text-white font-semibold duration-300">
                        {item.event}
                      </h4>
                    </div>
                    
                    {/* Tầng 3: BOX MÔ TẢ */}
                    <div className="max-w-5xl">
                      <div className="bg-white/70 backdrop-blur-md px-5 py-4 rounded-bl-2xl rounded-tr-2xl border border-white/60 shadow-sm ring-1 ring-slate-900/5 transition-all duration-300 relative">
                        
                        {/* Text Mô Tả (Sử dụng line-clamp để cắt bớt chữ) */}
                        <p className={`font-display text-[15px] md:text-[20px] text-slate-950 leading-[1.8] ${
                          expandedHistory.includes(i) ? "" : "line-clamp-1"
                        }`}>
                          {item.description}
                        </p>

                        {/* Chỉ hiện nút nếu đoạn text đủ dài (trên 20 ký tự) */}
                        {item.description && item.description.length > 20 && (
                          <button
                            onClick={() => toggleHistoryItem(i)}
                            className="mt-3 flex items-center gap-1.5 text-[12px] font-bold text-[var(--cm-accent-raw)] hover:text-slate-900 transition-colors uppercase tracking-widest"
                          >
                            {expandedHistory.includes(i) ? "Show Less" : "Read Full"}
                            
                            {/* Icon Mũi tên tự động lộn ngược khi mở */}
                            <svg 
                              className={`w-3.5 h-3.5 transition-transform duration-300 ${expandedHistory.includes(i) ? "rotate-180" : ""}`} 
                              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                        
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h3 className="font-display text-4xl text-slate-900 mb-9">Iconic Destinations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {d.mustVisitPlaces?.map((place, i) => (
              <a 
                key={i} 
                href={`https://www.google.com/search?q=${encodeURIComponent(place.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group cursor-pointer block"
              >
                <div className="w-full h-72 rounded-sm overflow-hidden mb-4 relative shadow-sm group-hover:shadow-3xl transition-all duration-500 transform group-hover:-translate-y-0.5">
                  {place.imageUrl ? (
                    <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center font-data text-xs text-slate-400">NO VISUAL</div>
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--cm-accent-raw)] via-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-multiply" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 text-white text-sm font-ui leading-tight">
                    {place.description}
                  </div>
                </div>
                <div className="font-data text-[13px] tracking-widest text-accent uppercase mb-1">{place.location}</div>
                <h4 className="font-display font-bold text-xl text-slate-900 leading-tight group-hover:text-accent-raw transition-colors duration-300">
                  {place.name}
                </h4>
              </a>
            ))}
          </div>
        </div>

        <div className="mb-20">
          <div>
            <h3 className="font-display text-3xl text-slate-900 mb-5">Culinary Heritage</h3>
            <p className="font-editorial text-lg text-slate-700 italic mb-5 border-l-2 border-[var(--cm-accent-raw)] pl-4">{d.culturalNuances?.culinaryCulture}</p>
            
            <div className="relative border border-slate-300/80 mt-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
                {d.nationalDishes?.map((dish, i) => (
                  <div 
                    key={i} 
                    onClick={() => {
                      const searchQuery = encodeURIComponent(dish.name);
                      window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank', 'noopener,noreferrer');
                    }}
                    /* 1. Thêm h-full để các card trong cùng 1 hàng có chiều cao bằng nhau */
                    /* 2. Đổi items-center thành items-stretch để ảnh và khối chữ kéo giãn bằng nhau */
                    className="group flex items-stretch bg-[#F4F1EA] border border-slate-300/80 hover:bg-white transition-colors duration-300 h-full"
                  >
                    
                    {/* 3. Thêm shrink-0 để ảnh không bị bóp */}
                    {/* 4. Xóa h-32/h-36 đi, để chiều cao tự động scale theo khối chữ bên phải */}
                    {/* 5. Thêm overflow-hidden để khi hover ảnh to lên không bị tràn ra ngoài */}
                    <div className="w-32 md:w-60 shrink-0 bg-slate-200 overflow-hidden relative">
                      {dish.imageUrl && (
                        <img 
                          src={dish.imageUrl} 
                          alt={dish.name} 
                          /* object-cover kết hợp items-stretch sẽ đảm bảo ảnh luôn full khung mà không méo */
                          className="absolute inset-0 w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0  transition-all duration-700" 
                        />
                      )}
                    </div>
                    
                    {/* 6. Thêm padding (p-5 md:p-6) để chữ có không gian thở, không đâm vào mép */}
                    {/* 7. Thêm flex flex-col justify-center để nếu chữ ngắn, nó vẫn căn giữa dọc đẹp mắt */}
                    <div className="flex-1 p-5 md:p-6 flex flex-col justify-center">
                      <h4 className="font-display font-bold text-lg md:text-xl text-slate-900 mb-2 group-hover:text-[var(--cm-accent-raw)] transition-colors">
                        {dish.name}
                      </h4>
                      {/* Không dùng line-clamp nữa, để chữ đổ tự nhiên xuống dưới */}
                      <p className="font-editorial text-[14px] md:text-[15px] text-slate-600 leading-relaxed">
                        {dish.description}
                      </p>
                    </div>
                    
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* CỘT TRÁI: CURIOSITIES (Phong cách Kể chuyện / Storytelling) */}
          <div className="bg-gradient-to-br from-[var(--cm-accent-soft)] to-white/40 p-4 md:p-4 rounded-[2rem] border border-[var(--cm-accent-border)] mb-7 relative overflow-hidden shadow-sm self-start">
            
            {/* Dấu ngoặc kép khổng lồ chìm ở background tạo Vibe "Trích dẫn/Kể chuyện" */}
            <div className="absolute -top-8 right-4 font-display text-[15rem] text-[var(--cm-accent-soft-strong)] opacity-40 rotate-12 pointer-events-none select-none leading-none">
              “
            </div>

            <h3 className="font-display text-3xl text-slate-900 mt-2 ml-2 mb-8 flex items-center gap-3 relative z-10">
              <span className="text-[var(--cm-accent-raw)] font-bold text-3xl">?</span>
              Did you know?
            </h3>
            
            <div className="space-y-6 relative z-10">
              {d.funFacts?.map((fact, i) => (
                <div key={i} className="group relative flex gap-4 md:gap-5 items-start">
                  
                  {/* Cột đánh số kiểu Hồ sơ lưu trữ (Archive) */}
                  <div className="flex-shrink-0 mt-1 flex flex-col items-center p-2 md:p-3 rounded-xs bg-[var(--cm-accent-soft)] border border-[var(--cm-accent-border)] shadow-sm">
                    <span className="font-data text-[12px] tracking-widest text-slate-800 font-bold uppercase">Fact</span>
                    <span className="font-display text-2xl text-[var(--cm-accent-raw)] font-bold group-hover:scale-110 transition-transform duration-300">
                      {i + 1}
                    </span>
                  </div>
                  
                  {/* Khối chữ: Thiết kế dạng bong bóng thoại (Speech Bubble) */}
                  {/* rounded-tl-none tạo góc nhọn ở trên cùng bên trái hướng về phía số đếm */}
                  <div className="bg-white/70 hover:bg-white backdrop-blur-sm p-5 md:p-6 rounded-2xl rounded-tl-none shadow-sm hover:shadow-md transition-all duration-300 border border-white/80 flex-1 relative">
                    
                    {/* Chữ in nghiêng, có chân, và bọc trong ngoặc kép tạo cảm giác 1 câu nói */}
                    <p className="font-editorial text-[15px] md:text-[17px] text-slate-800 leading-relaxed italic">
                      "{fact}"
                    </p>
                    
                  </div>
                  
                </div>
              ))}
            </div>
            
          </div>

          {/* CỘT PHẢI: TRAVELER FAQS (Fixed Theme: Minimalist Slate & White) */}
          <div>
            <h3 className="font-display text-3xl text-slate-900 mb-8 flex items-center gap-3">
              <span className="w-8 h-1.5 bg-slate-900 rounded-full"></span>
              Traveler FAQs
            </h3>
            
            <div className="space-y-4">
              {d.faqs?.map((faq, i) => (
                <details 
                  key={i} 
                  /* Xóa màu nền F4F1EA, dùng Trắng tinh + Viền nhạt, thêm đổ bóng khi hover */
                  className="group bg-white p-1 rounded-2xl cursor-pointer border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300"
                >
                  
                  {/* SUMMARY: Câu hỏi */}
                  {/* Thêm [&::-webkit-details-marker]:hidden để giấu triệt để mũi tên mặc định của Safari */}
                  <summary className="font-ui font-bold list-none [&::-webkit-details-marker]:hidden flex justify-between items-center text-slate-800 p-4">
                    <span className="pr-4 leading-relaxed">{faq.question}</span>
                    
                    {/* Icon mũi tên được bọc trong 1 nút tròn. Khi mở (group-open) sẽ đảo ngược màu đen/trắng */}
                    <span className="w-8 h-8 shrink-0 rounded-full bg-[var(--cm-accent-raw)]/70 flex items-center justify-center transition-colors duration-300">
                      <Icon 
                        name="chevronDown" 
                        className="w-4 h-4 text-white group-open:rotate-180 transition-transform duration-500" 
                      />
                    </span>
                  </summary>
                  
                  {/* NỘI DUNG CÂU TRẢ LỜI */}
                  {/* Hiệu ứng: Mờ (opacity-0) và bị đẩy lên trên (-translate-y-3) 
                      Khi thẻ details có thuộc tính 'open', nó lập tức Fade In và trượt xuống đúng vị trí */}
                  <div className="opacity-0 -translate-y-3 group-open:opacity-100 group-open:translate-y-0 transition-all duration-500 ease-out px-4 pb-4">
                    <p className="font-editorial text-slate-600 text-[15px] leading-relaxed pt-4 border-t border-slate-100">
                      {faq.answer}
                    </p>
                  </div>
                  
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// KITS / SUB-COMPONENTS
// ==========================================

type IconName = 'arrowLeft' | 'search' | 'close' | 'geo' | 'state' | 'gem' | 'chevronDown';

function Icon({ name, className }: { name: IconName; className?: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };

  switch (name) {
    case 'arrowLeft':
      return <svg {...common}><path d="M19 12H5M5 12l6-6M5 12l6 6" /></svg>;
    case 'search':
      return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>;
    case 'close':
      return <svg {...common}><path d="M6 6l12 12M18 6L6 18" /></svg>;
    case 'geo':
      // compass — orientation & terrain
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M14.6 9.4l-1.8 4.4a1 1 0 01-1.4 1.4L9.4 14.6l1.8-4.4a1 1 0 011.4-1.4z" strokeLinejoin="round" />
          <path d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21" />
        </svg>
      );
    case 'state':
      // classical pillars — government & economy
      return (
        <svg {...common}>
          <path d="M3 9l9-5.5L21 9" />
          <path d="M4 9h16" />
          <path d="M6 9v10M10.5 9v10M13.5 9v10M18 9v10" />
          <path d="M3 21h18" />
        </svg>
      );
    case 'gem':
      // faceted gem — curiosities / notable
      return (
        <svg {...common}>
          <path d="M6.5 4h11L21 9l-9 11L3 9z" strokeLinejoin="round" />
          <path d="M3 9h18M9 4L7 9l5 11 5-11-2-5" strokeLinejoin="round" />
        </svg>
      );
    case 'chevronDown':
      return <svg {...common}><path d="M6 9l6 6 6-6" /></svg>;
    default:
      return null;
  }
}

function SectionHeader({ title, icon }: { title: string, icon: Extract<IconName, 'geo' | 'state'> }) {
  return (
    <div className="flex items-center gap-4 mb-7">
      <span className="text-accent">
        <Icon name={icon} className="w-8 h-8" />
      </span>
      <h2 className="font-display font-black text-3xl md:text-4xl text-slate-900">{title}</h2>
    </div>
  );
}

function MetricCard({ label, value, highlight }: { label: string, value: string | number | undefined, highlight?: boolean }) {
  if (value === undefined) return null;
  return (
    <div className={`p-6 rounded-[2rem] ${highlight ? 'bg-accent-raw text-white shadow-xl shadow-[color:var(--cm-accent-soft-strong)]' : 'bg-white text-slate-800 shadow-sm border border-slate-100'}`}>
      <div className={`font-data text-[10px] tracking-widest uppercase mb-2 ${highlight ? 'text-white/80' : 'text-slate-400'}`}>{label}</div>
      <div className="font-ui font-bold text-3xl">{value}</div>
    </div>
  );
}

function DataBox({ title, children, tone = 'default' }: { title: string, children: ReactNode, tone?: 'default' | 'soft' }) {
  const toneClass = tone === 'soft'
    ? 'bg-accent-raw text-white border-white/20 shadow-2xl shadow-[color:var(--cm-accent-soft-strong)]'
    : 'bg-white text-slate-800 border-slate-100';

  // Nếu ở tone soft, tiêu đề và các nội dung mặc định bên trong nên chuyển sang sáng màu để tương phản cực mạnh
  const titleColor = tone === 'soft' ? 'text-white font-semibold' : 'text-slate-800';

  return (
    <div className={`p-6 rounded-xs shadow-sm border ${toneClass} flex flex-col h-full transition-all`}>
      <h3 className={`font-display text-xl mb-5 ${titleColor}`}>{title}</h3>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function ProgressBar({ label, percent }: { label: string, percent: number | null | undefined }) {
  if (percent === null || percent === undefined) return null;
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between text-xs font-ui mb-1">
        <span className="text-slate-600 line-clamp-1 flex-1 pr-2">{label}</span>
        <span className="font-bold text-slate-900 shrink-0">
          {percent ? `${percent}%` : '—'}
        </span>
      </div>
      <div className="w-full bg-slate-300/50 rounded-xs h-2 overflow-hidden">
        <div className="bg-accent-raw h-2 rounded-xs" style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
    </div>
  );
}

function MiniRow({ label, value, suffix }: { label: string, value: string | number | undefined | null, suffix?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (value === undefined || value === null || value === '') return null;

  // Chuyển value thành chuỗi để đếm ký tự
  const textValue = String(value);
  const CHAR_LIMIT = 60; // Giới hạn số ký tự trước khi cắt
  const isLong = textValue.length > CHAR_LIMIT;

  return (
    <div className="flex justify-between py-2 border-b border-slate-100 last:border-0 font-ui text-sm">
      <span className="text-slate-500 pr-4 shrink-0">{label}</span>
      
      <div className="font-semibold text-slate-800 text-right max-w-[65%] flex flex-col items-end">
        <span className="leading-snug break-words">
          {!isLong || isExpanded 
            ? textValue 
            : `${textValue.slice(0, CHAR_LIMIT).trim()}...`}
          {suffix && ` ${suffix}`}
        </span>
        
        {isLong && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors mt-1.5"
          >
            {isExpanded ? 'Show Less' : 'Read More'}
          </button>
        )}
      </div>
    </div>
  );
}

function Tag({ text, color = "bg-slate-100 text-slate-700" }: { text: string, color?: string }) {
  return (
    <span className={`${color} px-2.5 py-1 rounded-md text-xs font-ui font-medium`}>
      {text}
    </span>
  );
}


function ExpandableBlock({ label, text, charLimit = 100 }: { label: string, text: string | undefined | null, charLimit?: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Nếu không có dữ liệu thì hiện gạch ngang
  if (!text) return (
    <div>
      <span className="block font-data text-[12px] uppercase tracking-widest font-bold text-slate-500 mb-1.5">{label}</span>
      <span className="font-ui text-sm text-slate-400">—</span>
    </div>
  );

  const textValue = String(text);
  const isLong = textValue.length > charLimit;

  return (
    <div>
      <span className="block font-data text-[12px] uppercase text-slate-500">
        {label}
      </span>
      <div className="flex flex-col items-start">
        {/* Em đã bỏ class 'capitalize' vì nếu đoạn văn quá dài, viết hoa từng chữ cái sẽ rất rối mắt và khó đọc */}
        <p className="font-ui text-sm text-slate-800 leading-relaxed">
          {!isLong || isExpanded 
            ? textValue 
            : `${textValue.slice(0, charLimit).trim()}...`}
        </p>
        
        {isLong && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors"
          >
            {isExpanded ? 'Show Less' : 'Read More'}
          </button>
        )}
      </div>
    </div>
  );
}