import { useState, useMemo, useRef, useEffect } from 'react';
import { usePassportData } from '../hooks/usePassportData';
import { CountryModal } from './CountryModal';
import { 
  Plane, MapPinned, ShieldCheck, Globe,
  Ticket, Search, Sparkles, CheckCircle2, 
  AlertCircle, Clock, ChevronDown, Award, ListCheck
} from 'lucide-react';

// --- Constants & Utilities ---

const STATUS_LABELS: Record<string, string> = {
  'visa-free': 'Visa Free',
  'visa-on-arrival': 'Visa on Arrival',
  'e-visa': 'e-Visa',
  'eta': 'ETA',
  'visa-required': 'Visa Required',
  'no-admission': 'No Admission',
  'home': 'Home',
  'unknown': 'Unknown',
};

// The exact order we want to display the tags everywhere
const STATUS_ORDER = [
  'visa-free', 
  'visa-on-arrival', 
  'e-visa', 
  'eta', 
  'visa-required', 
  'no-admission'
];

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

const regionNamesVi = new Intl.DisplayNames(['en'], { type: 'region' });

export const getCountryName = (iso: string): string => {
  try { return regionNamesVi.of(iso.toUpperCase()) ?? iso; } 
  catch { return iso; }
};

const SORTED_COUNTRIES = ALL_COUNTRY_CODES
  .map((code) => ({ code, name: getCountryName(code) }))
  .sort((a, b) => a.name.localeCompare(b.name, 'en'));

export const parseVisaData = (status: unknown) => {
  if (status === null || status === undefined) return { category: 'unknown', text: 'Unknown', note: '', days: null };
  
  const raw = String(status).trim();
  let baseStatus = raw;
  let noteContent = "";

  // Regex gọt dứt điểm dấu gạch ngang và note
  const match = raw.match(/(\s+-\s+|\s+(?=["']))/);
  if (match && match.index !== undefined) {
    baseStatus = raw.substring(0, match.index).trim();
    noteContent = raw.substring(match.index + match[0].length).trim();
    noteContent = noteContent.replace(/^["']+|["']+$/g, "").trim();
  }

  const s = baseStatus.toLowerCase();
  let category = 'unknown';
  let days: number | null = null;

  // Xử lý các số trực tiếp (VD: "-1", "90")
  if (/^-?\d+$/.test(baseStatus)) {
    const num = parseInt(baseStatus, 10);
    if (num === -1 || num === 1) return { category: 'home', text: 'Home', note: noteContent, days: null };
    if (num < 0) return { category: 'unknown', text: 'Unknown', note: noteContent, days: null };
    return { category: 'visa-free', text: `Visa Free (${num} days)`, note: noteContent, days: num };
  }

  // Quét từ khóa chuẩn theo mức độ ưu tiên
  const isNumMatch = baseStatus.match(/^(\d+)/);
  if (isNumMatch) {
    category = 'visa-free';
    days = parseInt(isNumMatch[1], 10);
  } else if (
    s.includes('restricted') || s.includes('prohibited') || s.includes('no admission') || 
    s.includes('noadmission') || s.includes('refused') || s.includes('suspended') || 
    s.includes('banned') || /\bban\b/.test(s) || s.includes('covid')
  ) {
    category = 'no-admission';
  } else if (s.includes('required') || s.includes('tourist card')) {
    category = 'visa-required';
  } else if (s.includes('arrival') || s === 'voa' || s.includes('e-voa')) {
    category = 'visa-on-arrival';
  } else if (s.includes('eta') || s.includes('electronic travel') || s.includes('electronic border')) {
    category = 'eta';
  } else if (
    s.includes('e-visa') || s.includes('evisa') || s.includes('e visa') || 
    s.includes('electronic') || s.includes('online') || s.includes('smart service')
  ) {
    category = 'e-visa';
  } else if (s.includes('free') || s.includes('not required') || s.includes('freedom')) {
    category = 'visa-free';
  } else {
    category = 'visa-required';
  }

  // Tạo Text hiển thị đẹp
  let text = baseStatus.charAt(0).toUpperCase() + baseStatus.slice(1);
  if (category === 'visa-free' && days) text = `Visa Free (${days} days)`;
  else if (category === 'visa-free') text = 'Visa Free';

  return { category, text, note: noteContent, days };
};

export const normalizeStatus = (status: unknown): string => {
  return parseVisaData(status).category;
};

export const generateMapColors = (destinations?: Record<string, any>) => {
  const OPACITY = 100; 

  const colors: Record<string, [number, number, number, number]> = {};
  if (!destinations) return colors;

  Object.entries(destinations).forEach(([iso, val]) => {
    const status = normalizeStatus(val); 
    const upperIso = iso.toUpperCase();

    switch (status) {
      case 'home': 
        colors[upperIso] = [234, 179, 8, OPACITY]; break;      // Vàng đậm hơn, rõ hơn
      case 'visa-free': 
        colors[upperIso] = [22, 163, 74, OPACITY]; break;      // Xanh lá đậm, khác biệt rõ với xanh dương
      case 'visa-on-arrival': 
        colors[upperIso] = [217, 119, 6, OPACITY]; break;      // Cam cháy, tách biệt với vàng
      case 'e-visa': 
        colors[upperIso] = [37, 99, 235, OPACITY]; break;      // Xanh dương đậm chuẩn
      case 'eta': 
        colors[upperIso] = [124, 58, 237, OPACITY]; break;     // Tím đậm (Violet), không còn là xanh dương nhạt
      case 'visa-required': 
        colors[upperIso] = [71, 85, 105, OPACITY]; break;      // Xám Slate đậm, nhìn rất "chuyên nghiệp" và chìm
      case 'no-admission': 
        colors[upperIso] = [225, 29, 72, OPACITY]; break;      // Đỏ đậm, rất cảnh báo
      default:
        console.warn(`⚠️ Nước ${upperIso} có status lạ: "${status}" -> Bị bỏ qua không tô màu!`);
        break;
    }
  });

  return colors;
};

export const getStayDays = (status: unknown): number | null => {
  return parseVisaData(status).days;
};

// --- Flag color extraction ---
// Samples the real flag image and derives a readable "accent" color from it,
// so a country's name can be tinted with a color drawn from its own flag.

const flagColorCache = new Map<string, string | null>();

// Converts an averaged RGB sample into an HSL string clamped to a range that
// stays legible as text on a white/stone card, regardless of how light or
// saturated the source flag color actually is.
const rgbToAccentColor = (r: number, g: number, b: number): string => {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0, s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case rn: h = ((gn - bn) / d) % 6; break;
      case gn: h = (bn - rn) / d + 2; break;
      default: h = (rn - gn) / d + 4;
    }
    h = h * 60;
    if (h < 0) h += 360;
  }
  const clampedS = Math.min(Math.max(s * 100, 45), 70);
  const clampedL = Math.min(Math.max(l * 100, 26), 40);
  return `hsl(${Math.round(h)}, ${Math.round(clampedS)}%, ${Math.round(clampedL)}%)`;
};

// Draws the flag onto an offscreen canvas and averages only its "colorful"
// pixels (skipping near-white, near-black, and low-saturation pixels), so a
// mostly-white flag like Japan's reads as red instead of washing out to pink.
const extractFlagAccentColor = (iso: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 200) continue; // skip transparent
          const rr = data[i], gg = data[i + 1], bb = data[i + 2];
          const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
          const lightness = (max + min) / 2;
          const sat = max === min ? 0 : (max - min) / (255 - Math.abs(2 * lightness - 255));
          if (lightness > 235 || lightness < 20 || sat < 0.15) continue; // skip white/black/gray
          r += rr; g += gg; b += bb; n++;
        }

        if (n < 20) return resolve(null); // flag is essentially monochrome — no theme to extract
        resolve(rgbToAccentColor(Math.round(r / n), Math.round(g / n), Math.round(b / n)));
      } catch {
        resolve(null); // canvas read blocked (e.g. CORS) — fall back to default styling
      }
    };
    img.onerror = () => resolve(null);
    img.src = `https://flagcdn.com/w40/${iso.toLowerCase()}.png`;
  });
};

const useFlagAccentColor = (iso: string): string | null => {
  const [color, setColor] = useState<string | null>(flagColorCache.get(iso) ?? null);

  useEffect(() => {
    let cancelled = false;
    if (flagColorCache.has(iso)) {
      setColor(flagColorCache.get(iso) ?? null);
      return;
    }
    extractFlagAccentColor(iso).then((result) => {
      flagColorCache.set(iso, result);
      if (!cancelled) setColor(result);
    });
    return () => { cancelled = true; };
  }, [iso]);

  return color;
};

// Decorative dot-grid watermark (subtle SVG texture, no gradients)
const DOT_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Ccircle cx='1.5' cy='1.5' r='1.5' fill='%2378716c' fill-opacity='0.14'/%3E%3C/svg%3E\")";

// --- Sub-components ---

export const CompactCountrySelector = ({ value, onChange }: { value: string, onChange: (iso: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!query) return SORTED_COUNTRIES;
    return SORTED_COUNTRIES.filter(c => 
      c.name.toLowerCase().includes(query.toLowerCase()) || c.code.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  const selected = SORTED_COUNTRIES.find((c) => c.code === value);

  return (
    <div ref={wrapperRef} className="relative w-full z-40">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-stone-400 rounded-xs shadow-[0_1px_2px_rgba(28,27,25,0.04)] hover:border-stone-400 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/30 transition-all duration-200"
      >
        <div className="flex items-center gap-3 min-w-0">
          {selected && (
            <span className={`fi fi-${selected.code.toLowerCase()} text-2xl shrink-0 !bg-cover !bg-center overflow-hidden rounded-[1px] ring-1 ring-black/10 ring-inset`} />
          )}
          <div className="min-w-0 text-left">
            <span className="block text-md tracking-wide font-medium text-stone-900 truncate">
              {selected ? selected.name : 'Select Passport'}
            </span>
            {/* {selected && (
              <span className="block text-[10px] font-mono uppercase tracking-[0.12em] text-stone-400">
                {selected.code}
              </span>
            )} */}
          </div>
        </div>
        <ChevronDown size={16} className={`text-stone-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-400 rounded-md shadow-lg overflow-hidden flex flex-col max-h-[400px] animate-[fadeIn_150ms_ease-out]">
          <div className="flex items-center gap-2 px-3.5 py-3 border-b border-stone-400 bg-stone-50/70">
            <Search size={14} className="text-stone-400 shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Search a country or code…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-sm text-stone-900 placeholder:text-stone-400"
            />
          </div>
          <div className="overflow-y-auto p-1.5 custom-scrollbar">
            {filtered.map((c) => {
              const isSelected = c.code === value;
              return (
                <button
                  key={c.code}
                  onClick={() => { onChange(c.code); setIsOpen(false); setQuery(''); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-[2px] text-sm transition-colors duration-150 ${
                    isSelected ? 'bg-indigo-100/70' : 'hover:bg-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className={`fi fi-${c.code.toLowerCase()} text-2xl shrink-0 !bg-cover !bg-center overflow-hidden rounded-[1px] ring-1 ring-black/10 ring-inset`} />
                    <span className={`truncate text-accent ${isSelected ? 'text-indigo-900 font-mono' : 'text-stone-700'}`}>{c.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-stone-700 font-mono">{c.code}</span>
                    {isSelected && <CheckCircle2 size={13} className="text-indigo-500" />}
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-8 text-center text-sm text-stone-400">No results found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Maps a status colorClass to a matching solid accent-strip color — presentation only.
const STRIP_COLOR: Record<string, string> = {
  'text-emerald-700': 'bg-emerald-500',
  'text-amber-700': 'bg-amber-500',
  'text-blue-700': 'bg-blue-500',
  'text-indigo-700': 'bg-indigo-500',
  'text-slate-700': 'bg-slate-500',
  'text-rose-700': 'bg-rose-500',
  'text-stone-900': 'bg-stone-500',
};

const ACTIVE_STYLE: Record<string, string> = {
  'text-emerald-700': 'border-emerald-200 bg-emerald-50',
  'text-amber-700': 'border-amber-200 bg-amber-50',
  'text-blue-700': 'border-blue-200 bg-blue-50',
  'text-indigo-700': 'border-indigo-200 bg-indigo-50',
  'text-slate-700': 'border-slate-200 bg-slate-50',
  'text-rose-700': 'border-rose-200 bg-rose-50',
  'text-stone-900': 'border-stone-200 bg-stone-50',
};

const StatCard = ({ label, count, icon: Icon, isActive, onClick, colorClass }: any) => (
  <button
    onClick={onClick}
    className={`relative overflow-hidden p-5 rounded-sm border text-left transition-all duration-200 ease-out flex flex-col justify-between h-32 ${
      isActive
        ? `${ACTIVE_STYLE[colorClass] || 'border-stone-300 bg-stone-50'} ring-1 ${colorClass.replace('text-', 'ring-')}`
        : 'border-stone-300 bg-white shadow-[0_1px_2px_rgba(28,27,25,0.04)] hover:border-stone-500 hover:shadow-sm'
    }`}
  >
    {/* Accent strip always shown, always the solid color */}
    <span className={`absolute top-0 left-0 right-0 h-[3px] ${STRIP_COLOR[colorClass] || 'bg-stone-300'}`} />

    <div className="flex justify-between items-start w-full">
      <span className="text-[13px] font-mono font-semibold text-stone-500 uppercase tracking-[0.14em] leading-tight pr-2">
        {label}
      </span>
      <Icon size={15} className={isActive ? colorClass : 'text-stone-300'} />
    </div>

    <div className={`font-display text-[34px] leading-none font-semibold tracking-tight ${colorClass}`}>
      {count}
    </div>
  </button>
);

const DestinationCard = ({ 
  country, 
  status, 
  onClick 
}: { 
  country: string; 
  status: unknown; 
  onClick: () => void; // Thêm prop onClick
}) => {
  const normalized = normalizeStatus(status);
  const days = getStayDays(status);
  const flagColor = useFlagAccentColor(country);

  let style = { text: 'text-stone-600', bg: 'bg-stone-100', border: 'border-stone-200', icon: Globe };

  switch (normalized) {
    case 'visa-free': 
      style = { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 }; break;
    case 'visa-required':
      style = { text: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-200', icon: ShieldCheck }; break;
    case 'e-visa':
      style = { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: Ticket }; break;
    case 'visa-on-arrival':
      style = { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: MapPinned }; break;
    case 'eta':
      style = { text: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200', icon: ListCheck }; break;
    case 'no-admission':
      style = { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', icon: AlertCircle }; break;
  }

  const StatusIcon = style.icon;

  return (
    // Đổi div thành button để tăng tương tác và accessibility
    <button 
      onClick={onClick}
      className="group flex flex-col p-4 w-full text-left rounded-sm border border-stone-300 bg-white hover:border-stone-500 hover:shadow-md transition-all duration-200 ease-out active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer"
    >
      <div className="flex justify-between items-start mb-3">
        <span className={`fi fi-${country.toLowerCase()} text-3xl shrink-0 !bg-cover !bg-center overflow-hidden rounded-[1px] ring-1 ring-black/10 ring-inset`} />
        <div className={`flex items-center gap-2 pl-2 border-l-2 text-[12px] font-medium ${style.text} `}>
          {STATUS_LABELS[normalized] || normalized}
        </div>
      </div>

      <div className="border-t border-dashed border-stone-200 pt-3 w-full">
        <h4 
          className="font-display text-[17px] font-medium text-stone-900 truncate tracking-tight" 
          style={flagColor ? { color: flagColor } : undefined}
        >
          {getCountryName(country)}
        </h4>
        <div className="flex justify-between items-center mt-1.5">
          <span className="text-[11px] text-stone-400 font-mono uppercase tracking-wide">{country}</span>
          <div className="flex items-center gap-1 text-[11px] font-medium text-stone-500 bg-stone-50 rounded-full px-1.5 py-0.5">
            <Clock size={11} />
            {days ? `${days}d` : 'U/N '}
          </div>
        </div>
      </div>
    </button>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SidePanel = ({ data, iso }: { data: any; iso: string }) => {
  const flagColor = useFlagAccentColor(iso); // hook must run before any early return below

  if (!data?.destinations) return null;

  const counts = { free: 0, voa: 0, evisa: 0, eta: 0, req: 0, ban: 0 };
  
  Object.values(data.destinations).forEach(val => {
    const s = normalizeStatus(val);
    if (s === 'visa-free') counts.free++;
    if (s === 'visa-on-arrival') counts.voa++;
    if (s === 'e-visa') counts.evisa++;
    if (s === 'eta') counts.eta++;
    if (s === 'visa-required') counts.req++;
    if (s === 'no-admission') counts.ban++;
  });

  // Mobility score represents destinations you can travel to without applying for a traditional visa beforehand
  const mobilityScore = counts.free + counts.voa + counts.evisa + counts.eta;
  const total = Object.keys(data.destinations).length - 1; 
  const percentage = Math.round((mobilityScore / total) * 100) || 0;

  return (
    <div className="sticky bg-white border border-stone-200 rounded-xs shadow-[0_1px_3px_rgba(28,27,25,0.05)] p-7 flex flex-col gap-7">
      <div>
        <div className="flex flex-col gap-1.5 mb-4">
          {/* Tiêu đề chính (Country Name + Static Title) */}
          <div className="flex flex-col">
            <span className="text-2xl font-display tracking-tight text-stone-900 leading-tight uppercase"
              style={flagColor ? { color: flagColor } : { color: '#1c1b19' }}
            >
              {getCountryName(iso)} Passport
            </span>
          </div>
        </div>
        <div className="flex items-end justify-between mb-3">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-[44px] leading-none font-semibold tracking-tight text-stone-900">{mobilityScore}</span>
            <span className="text-sm text-stone-400">/{total}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xl font-bold text-emerald-500">{percentage}%</span>
          </div>
        </div>
        {/* Thanh bar 2 tang */}
        <div className="flex flex-col gap-1 w-full">
          {/* Thanh bar duy nhat, day du 6 loai, cong don 100% */}
          <div className="w-full h-2 flex rounded-full overflow-hidden bg-gray-100">
            <div className="h-full bg-emerald-500" style={{ width: `${(counts.free / total) * 100}%` }} title="Visa Free" />
            <div className="h-full bg-amber-400" style={{ width: `${(counts.voa / total) * 100}%` }} title="Visa on Arrival" />
            <div className="h-full bg-blue-500" style={{ width: `${(counts.evisa / total) * 100}%` }} title="e-Visa" />
            <div className="h-full bg-purple-500" style={{ width: `${(counts.eta / total) * 100}%` }} title="ETA" />
            <div className="h-full bg-red-500" style={{ width: `${(counts.ban / total) * 100}%` }} title="No Admission" />
            <div className="h-full bg-slate-300" style={{ width: `${(counts.req / total) * 100}%` }} title="Visa Required" />
          </div>
        </div>
      </div>

      <div className="divide-y divide-stone-100 -mt-1">
        <div className="flex justify-between items-center text-sm py-2.5">
          <div className="flex items-center gap-2.5 text-stone-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Visa Free
          </div>
          <span className="font-display font-semibold text-stone-900 tabular-nums">{counts.free}</span>
        </div>
        <div className="flex justify-between items-center text-sm py-2.5">
          <div className="flex items-center gap-2.5 text-stone-600">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Visa on Arrival
          </div>
          <span className="font-display font-semibold text-stone-900 tabular-nums">{counts.voa}</span>
        </div>
        <div className="flex justify-between items-center text-sm py-2.5">
          <div className="flex items-center gap-2.5 text-stone-600">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> e-Visa
          </div>
          <span className="font-display font-semibold text-stone-900 tabular-nums">{counts.evisa}</span>
        </div>
        <div className="flex justify-between items-center text-sm py-2.5">
          <div className="flex items-center gap-2.5 text-stone-600">
            <span className="w-2 h-2 rounded-full bg-indigo-500" /> ETA
          </div>
          <span className="font-display font-semibold text-stone-900 tabular-nums">{counts.eta}</span>
        </div>
        <div className="flex justify-between items-center text-sm py-2.5">
          <div className="flex items-center gap-2.5 text-stone-600">
            <span className="w-2 h-2 rounded-full bg-slate-400" /> Visa Required
          </div>
          <span className="font-display font-semibold text-stone-900 tabular-nums">{counts.req}</span>
        </div>
        <div className="flex justify-between items-center text-sm py-2.5">
          <div className="flex items-center gap-2.5 text-stone-600">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> No Admission
          </div>
          <span className="font-display font-semibold text-stone-900 tabular-nums">{counts.ban}</span>
        </div>
      </div>

      <div className="relative pl-3">
        {/* Duong vien nhan manh bang do day vua phai */}
        <div 
          className="absolute -left-[3px] top-0 bottom-0 w-[3px] rounded-full"  
          style={{ 
            backgroundColor: flagColor || '#1c1b19' 
          }}
        />
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-emerald-500">
            {percentage}%
          </span>
          <span className="text-lg font-medium text-stone-700">
            Global Access
          </span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-stone-600 max-w-[280px]">
          <span className="font-semibold" style={flagColor ? { color: flagColor } : { color: '#1c1b19' }}>
            {getCountryName(iso)}
          </span>{' '}
          has authorized entry to <span className="font-semibold text-stone-900">{mobilityScore}</span> territories via 
          visa-free, VOA, e-Visa, or ETA protocols.
        </p>
      </div>
    </div>
  );
};


// --- Main Component ---
export function PassportExplorer({ 
  iso, 
  data, 
  loading, 
  error,
  onOpenModal,
}: { 
  iso: string;
  data: any;
  loading: boolean;
  error: any;
  onOpenModal: (iso: string) => void;
}) {
  // const [iso, setIso] = useState(initialIso);
  // const { data, loading, error } = usePassportData(iso);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [selectedIso, setSelectedIso] = useState<string | null>(null);

  // Generates exactly 6 stat blocks, matching STATUS_ORDER
  const stats = useMemo(() => {
    if (!data?.destinations) return [];
    const counts: Record<string, number> = {};
    Object.values(data.destinations).forEach((val) => {
      const status = normalizeStatus(val);
      if (status === 'home') return;
      counts[status] = (counts[status] || 0) + 1;
    });
    
    return STATUS_ORDER.map(type => ({ type, count: counts[type] || 0 }));
  }, [data]);

  const allEntries = useMemo(() => {
    if (!data?.destinations) return [];
    return Object.entries(data.destinations)
      .filter(([, val]) => normalizeStatus(val) !== 'home')
      .sort(([a], [b]) => getCountryName(a).localeCompare(getCountryName(b), 'en'));
  }, [data]);

  const filteredDestinations = allEntries.filter(([code, val]) => {
    const matchesType = !selectedType || normalizeStatus(val) === selectedType;
    const matchesSearch = !search || getCountryName(code).toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  // ==========================================
  // HÀM TẠO NỘI DUNG HEADER ĐỘNG (THÊM MỚI)
  // ==========================================
  const getDynamicHeader = () => {
    const name = getCountryName(iso);
    const count = filteredDestinations.length;
    
    if (!selectedType) return {
       title: "Destination Roster",
       subtitle: `${count} territories found`
    };

    switch (selectedType) {
      case 'visa-free':
        return {
          title: "Visa-Free Travel",
          subtitle: `Citizens of ${name} can enter ${count} territories without a visa.`
        };
      case 'visa-required':
        return {
          title: "Visa Required",
          subtitle: `Citizens of ${name} must obtain a traditional visa for ${count} territories.`
        };
      case 'e-visa':
        return {
          title: "e-Visa Destinations",
          subtitle: `Citizens of ${name} can obtain an electronic visa for ${count} territories.`
        };
      case 'visa-on-arrival':
        return {
          title: "Visa on Arrival",
          subtitle: `Citizens of ${name} can acquire a visa upon arriving in ${count} territories.`
        };
      case 'eta':
        return {
          title: "Electronic Travel Authorization",
          subtitle: `Citizens of ${name} need an ETA before traveling to ${count} territories.`
        };
      case 'no-admission':
        return {
          title: "Admission Restricted",
          subtitle: `Citizens of ${name} are currently restricted from entering ${count} territories.`
        };
      default:
        return {
          title: "Destination Roster",
          subtitle: `${count} territories found`
        };
    }
  };

  const headerInfo = getDynamicHeader();
  // ==========================================

  return (
    <div className="relative min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-indigo-100">
      
      {/* Fonts, thin scrollbar, and subtle entrance animation */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&display=swap');
        .font-display { font-family: 'Fraunces', Georgia, ui-serif, serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #E7E5E2; border-radius: 20px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #D3CFC7; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Faint dotted watermark texture */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-40"
        style={{ backgroundImage: DOT_PATTERN, backgroundSize: '24px 24px' }}
      />

      <main className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-8 pt-2 pb-12">
        
        {/* EDITORIAL HEADER */}
        <header className="relative flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-6 mb-6 gap-6">
          <svg className="hidden lg:block pointer-events-none absolute -top-6 right-0 opacity-[0.06]" width="120" height="120" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="52" stroke="#1c1b19" strokeWidth="1.5" strokeDasharray="3 4" />
            <circle cx="60" cy="60" r="40" stroke="#1c1b19" strokeWidth="1" />
            <path d="M60 30 L64 52 L60 90 L56 52 Z" fill="#1c1b19" />
          </svg>
          <div>
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-stone-900">
              Passport Intelligence
            </h2>
            <div className="w-75 h-[2px] bg-amber-400 rounded-full my-3" />
            <p className="text-[17px] text-stone-700 max-w-lg leading-relaxed">
              Detailed analysis of the {getCountryName(iso)} passport's global mobility power.
            </p>
          </div>
        </header>

        {loading && (
          <div className="h-64 flex items-center justify-center text-sm text-stone-500">
            <div className="w-5 h-5 border-2 border-stone-300 border-t-indigo-500 rounded-full animate-spin mr-3" />
            Synchronizing data...
          </div>
        )}
        
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
            Error parsing passport data: {error}
          </div>
        )}

        {!loading && !error && data && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            
            {/* MAIN CONTENT AREA */}
            <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-4">
              
              {/* Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                {stats.map(({ type, count }) => {
                  let config = { icon: Globe, colorClass: 'text-stone-900' };
                  if (type === 'visa-free') config = { icon: CheckCircle2, colorClass: 'text-emerald-700' };
                  if (type === 'visa-required') config = { icon: ShieldCheck, colorClass: 'text-slate-700' };
                  if (type === 'e-visa') config = { icon: Ticket, colorClass: 'text-blue-700' };
                  if (type === 'visa-on-arrival') config = { icon: MapPinned, colorClass: 'text-amber-700' };
                  if (type === 'eta') config = { icon: ListCheck, colorClass: 'text-indigo-700' };
                  if (type === 'no-admission') config = { icon: AlertCircle, colorClass: 'text-rose-700' };

                  return (
                    <StatCard
                      key={type}
                      label={STATUS_LABELS[type] || type}
                      count={count}
                      icon={config.icon}
                      colorClass={config.colorClass}
                      isActive={selectedType === type}
                      onClick={() => setSelectedType(selectedType === type ? null : type)}
                    />
                  );
                })}
              </div>

              {/* ==========================================
                  CẬP NHẬT GIAO DIỆN HEADER Ở ĐÂY
                  ========================================== */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white px-5 py-4 rounded-sm border border-stone-300 shadow-[0_1px_2px_rgba(28,27,25,0.04)]">
                <div className="max-w-xl">
                  <h3 className="font-display text-base font-semibold text-stone-900 transition-colors">
                    {headerInfo.title}
                  </h3>
                  <p className={`mt-0.5 leading-relaxed ${selectedType ? 'text-[13px] text-stone-600' : 'text-[11px] font-mono uppercase tracking-wide text-stone-400'}`}>
                    {headerInfo.subtitle}
                  </p>
                </div>
                
                <div className="relative w-full sm:w-64 mt-4 sm:mt-0 shrink-0">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search destination..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Destinations card */}
              <div className="relative overflow-hidden rounded-sm border border-stone-300 bg-gradient-to-br from-stone-50 via-white to-stone-100 p-5 sm:p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_20px_40px_-24px_rgba(41,37,36,0.28)]">

                {/* ambient aurora wash — two soft blurred color blobs, not a repeating pattern */}
                <div className="pointer-events-none absolute -top-16 -left-16 h-56 w-56 rounded-full bg-amber-50/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-stone-300/40 blur-3xl" />



                {/* Scrollable Compact Grid */}
                <div className="relative max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-4">
                    {filteredDestinations.map(([country, status]) => (
                      <DestinationCard key={country} country={country} status={status} onClick={() => onOpenModal(country)} />
                    ))}
                  </div>

                  {filteredDestinations.length === 0 && (
                    <div className="py-24 text-center border-2 border-dashed border-stone-200 rounded-xl text-stone-400 text-sm font-mono uppercase tracking-wide">
                      No destinations match current criteria.
                    </div>
                  )}
                </div>
              </div>
              
              {/* MODAL SECTION */}
              {/* <CountryModal 
                iso={selectedIso} 
                isOpen={!!selectedIso} 
                onClose={() => setSelectedIso(null)} 
              /> */}
            </div>

            {/* SIDEBAR AREA */}
            <div className="lg:col-span-4 xl:col-span-3">
              <SidePanel data={data} iso={iso} />
            </div>

          </div>
        )}
      </main>
    </div>
  );
}