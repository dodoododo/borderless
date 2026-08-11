import React, { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type ElementType } from "react";
import { X, Ruler, Coins, Languages, Clock, Phone, Car, Thermometer, ArrowRight, Compass } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCountryProfile } from '../hooks/useCountryProfile';
import type { CountryProfile } from "../types/country.type";

interface CountryModalProps {
  iso: string | null;
  isOpen: boolean;
  onClose: () => void;
}

// Chấp nhận biến CSS có dấu --
interface CustomCSSProperties extends CSSProperties {
  [key: `--${string}`]: string | number | undefined;
}

/* ============================================================================
   COLOR UTILITIES — every accent on this panel is derived at runtime from
   flag.colors.swatches, never hard-coded per country.
   ============================================================================ */

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

// If a flag color is too pale to read as text on a light panel, darken it
// just enough to stay legible while keeping its hue.
function readableAccent(hex: string) {
  if (!hex) return "#3F3F46";
  const lum = relativeLuminance(hex);
  if (lum > 0.62) return mixHex(hex, "#16161A", 0.6);
  if (lum > 0.42) return mixHex(hex, "#16161A", 0.25);
  return hex;
}

/* ============================================================================
   DATA NORMALIZATION — adapts the raw restcountries-style payload
   ( { data: { objects: [ ... ] } } ) into the flat shape this UI consumes.
   ============================================================================ */

function normalizeCountry(raw: any): CountryProfile | null {
  if (!raw) return null;

  const nativeEntries = raw.names?.native ? Object.values(raw.names.native) : [];
  const nativeOfficial = (nativeEntries[0] as any)?.official || null;

  const swatches = raw.flag?.colors?.swatches || {};
  const rawAccent =
    swatches.vibrant || swatches.dark_vibrant || raw.flag?.colors?.prominent || "#52525B";
  const rawMuted =
    swatches.muted || swatches.dark_muted || raw.flag?.colors?.dominant || "#71717A";

  return {
    nameCommon: raw.names?.common || "Unknown territory",
    nameOfficial: raw.names?.official || "",
    nativeOfficial,
    iso2: raw.codes?.alpha_2 || "—",
    iso3: raw.codes?.alpha_3 || "—",
    capital: raw.capitals?.[0]?.name || null,
    region: raw.region || null,
    subregion: raw.subregion || null,
    population: typeof raw.population === "number" ? raw.population : null,
    areaKm2: raw.area?.kilometers ?? null,
    borders: raw.borders || [],
    landlocked: !!raw.landlocked,
    currencies: raw.currencies || [],
    languages: raw.languages || [],
    timezones: raw.timezones || [],
    callingCodes: raw.calling_codes || [],
    drivingSide: raw.cars?.driving_side || null,
    measurementSystem: raw.units?.measurement_system || null,
    temperatureScale: raw.units?.temperature_scale || null,
    memberships: raw.memberships || {},
    lastUpdated: raw._meta?.lastUpdatedTimestamp
      ? new Date(raw._meta.lastUpdatedTimestamp * 1000)
      : null,
    flag: {
      svgUrl: raw.flag?.url_svg || "",
      description: raw.flag?.description || "",
      accentRaw: rawAccent,
      accentText: readableAccent(rawAccent),
      accentMuted: rawMuted,
      accentSoft: hexToRgba(rawAccent, 0.09),
      accentSoftStrong: hexToRgba(rawAccent, 0.16),
      accentBorder: hexToRgba(rawAccent, 0.35),
    },
  };
}

const MEMBERSHIP_LABELS = [
  ["un", "United Nations"],
  ["eu", "European Union"],
  ["schengen", "Schengen Area"],
  ["nato", "NATO"],
  ["g7", "G7"],
  ["g20", "G20"],
  ["oecd", "OECD"],
  ["asean", "ASEAN"],
  ["arab_league", "Arab League"],
  ["african_union", "African Union"],
  ["brics", "BRICS"],
  ["commonwealth", "Commonwealth"],
  ["opec", "OPEC"],
  ["eurozone", "Eurozone"],
];

/* ============================================================================
   SAMPLE PAYLOAD — used only as an offline fallback so this file renders a
   real dossier in a preview with no backend attached. Swap for your live
   endpoint response; nothing else in the component needs to change.
   ============================================================================ */

const SAMPLE_RAW = {
  names: {
    common: "Syria",
    official: "Syrian Arab Republic",
    native: { ara: { common: "سوريا", official: "الجمهورية العربية السورية" } },
  },
  codes: { alpha_2: "SY", alpha_3: "SYR" },
  capitals: [{ name: "Damascus" }],
  region: "Asia",
  subregion: "Western Asia",
  area: { kilometers: 185180 },
  borders: ["IRQ", "ISR", "JOR", "LBN", "TUR"],
  landlocked: false,
  currencies: [{ code: "SYP", name: "Syrian pound", symbol: "£" }],
  languages: [{ name: "Arabic", native_name: "العربية" }],
  timezones: ["UTC+02:00"],
  calling_codes: ["963"],
  cars: { driving_side: "right" },
  units: { measurement_system: "metric", temperature_scale: "Celsius" },
  population: 26019711,
  memberships: {
    african_union: false,
    arab_league: true,
    asean: false,
    brics: false,
    commonwealth: false,
    eu: false,
    eurozone: false,
    g20: false,
    g7: false,
    nato: false,
    oecd: false,
    opec: false,
    schengen: false,
    un: true,
  },
  flag: {
    url_svg: "https://flags.restcountries.com/v5/svg/sy.svg",
    description:
      "The flag of Syria is composed of three equal horizontal bands of red, white and black. At the center of the white band are two small five-pointed green stars arranged in a horizontal line.",
    colors: {
      dominant: "#fbfaf5",
      prominent: "#0a7d41",
      swatches: {
        dark_muted: "#000000",
        dark_vibrant: null,
        light_muted: "#fbfaf5",
        light_vibrant: null,
        muted: "#0a7d41",
        vibrant: "#d22728",
      },
    },
  },
  _meta: { lastUpdatedTimestamp: 1784314005 },
};

/* ============================================================================
   MINIMAL RAW CSS — only what Tailwind's utility classes genuinely can't do:
   the webfont import and the three custom font-family stacks. Everything
   else (layout, color, spacing, states, animation) is Tailwind.
   ============================================================================ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;1,8..60,400&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
.font-display { font-family: 'Fraunces', Georgia, serif; }
.font-editorial { font-family: 'Source Serif 4', Georgia, serif; }
.font-ui { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
.font-data { font-family: 'Syne', 'IBM Plex Mono', monospace; }
`;

/* ============================================================================
   SMALL UI ATOMS
   ============================================================================ */

function SectionHead({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-baseline gap-4 mb-4">
      {/* Index được làm nhỏ, thanh mảnh và có màu nhấn */}
      
      
      {/* Tiêu đề dùng font-display hoặc font-editorial để tạo sự sang trọng */}
      <h3 className="font-display text-[20px] font-medium text-neutral-900 tracking-tight">
        {title}
      </h3>
    </div>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-data font-bold text-[13px] tracking-[0.14em] uppercase text-neutral-600">{label}</span>
      <span className="font-ui text-base font-medium text-slate-900">{value}</span>
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="font-data text-[11px] tracking-wide text-slate-700 px-2.5 py-1 rounded-full bg-[color:var(--cm-accent-soft)] border border-[color:var(--cm-accent-border)]">
      {children}
    </span>
  );
}

function LangChip({ native, english }: { native?: string; english?: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 px-3 py-1 rounded-full bg-[color:var(--cm-accent-soft)] border border-[color:var(--cm-accent-border)] text-[13.5px]">
      <span className="font-ui font-medium text-slate-900">{native}</span>
      {native && english && native !== english && (
        <>
          <span className="text-neutral-300 text-xs">/</span>
          <span className="font-ui text-neutral-500 text-[12.5px]">{english}</span>
        </>
      )}
    </span>
  );
}

function InfoRow({ icon: Icon, label, children, last }: { icon: ElementType; label: string; children: ReactNode; last?: boolean }) {
  return (
    <div className={"grid grid-cols-[22px_130px_1fr] items-start gap-3.5 py-3.5" + (last ? "" : " border-b border-neutral-200")}>
      <div className="text-[color:var(--cm-accent)] pt-0.5">
        <Icon size={15} strokeWidth={1.6} />
      </div>
      <span className="font-data font-medium text-[13px] tracking-[0.08em] uppercase text-neutral-700 pt-0.5">{label}</span>
      <div className="font-ui text-[15px] font-medium text-slate-900">{children}</div>
    </div>
  );
}

function MembershipBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={
        "font-data text-[10px] font-medium tracking-[0.08em] uppercase px-3.5 py-1.5 rounded-md border inline-flex items-center transition-all duration-200 " +
        (active
          ? "text-white font-semibold bg-[color:var(--cm-accent-raw)] shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_2px_4px_var(--cm-accent-border)] [text-shadow:0_1px_1px_rgba(0,0,0,0.25)]"
          : "bg-neutral-50 text-slate-500 border-slate-300")
      }
    >
      {label}
    </span>
  );
}

/* ============================================================================
   MAIN COMPONENT
   ============================================================================ */

export function CountryModal({ iso, isOpen, onClose }: CountryModalProps) {
  // 1. Dùng Hook 1 dòng duy nhất (truyền null nếu chưa mở để chặn fetch thừa)
  const { data: country, loading, error } = useCountryProfile(isOpen ? iso : null);
  const navigate = useNavigate();
  // 2. Chuyển đổi state từ hook sang status để giữ nguyên logic render UI bên dưới
  let status: "idle" | "loading" | "ready" | "error" = "idle";
  if (loading) status = "loading";
  else if (error) status = "error";
  else if (country) status = "ready";

  // 3. Giữ lại nguyên vẹn phần xử lý Animation và DOM Refs
  const [entered, setEntered] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const lastFocused = useRef<Element | null>(null);

  // Close on escape, close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Entrance transition + focus handling
  useEffect(() => {
    if (isOpen) {
      lastFocused.current = document.activeElement;
      const t = setTimeout(() => setEntered(true), 20);
      const focusT = setTimeout(() => closeBtnRef.current?.focus(), 60);
      return () => {
        clearTimeout(t);
        clearTimeout(focusT);
      };
    }
    setEntered(false);

    if (lastFocused.current && lastFocused.current instanceof HTMLElement) {
      lastFocused.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const header = document.querySelector('header'); // Hoặc đổi thành class header của bác: document.querySelector('.nav-bar')

    if (isOpen && header) {
      header.classList.add('nav-hidden');
    }

    return () => {
      if (header) {
        header.classList.remove('nav-hidden');
      }
    };
  }, [isOpen]);

  const c = country;

  const borderStatus = useMemo(() => {
    if (!c) return null;
    if (c.borders.length > 0) return null;
    return c.landlocked ? "Landlocked" : "Island nation";
  }, [c]);

  const availableMemberships = useMemo(() => {
    if (!c) return [];
    return MEMBERSHIP_LABELS.filter(([key]) => key in c.memberships);
  }, [c]);

  if (!isOpen) return null;

  const accentVars: CustomCSSProperties = c
    ? {
        "--cm-accent": c.flag.accentText,
        "--cm-accent-raw": c.flag.accentRaw,
        "--cm-accent-muted": c.flag.accentMuted,
        "--cm-accent-soft": c.flag.accentSoft,
        "--cm-accent-soft-strong": c.flag.accentSoftStrong,
        "--cm-accent-border": c.flag.accentBorder,
      }
    : {};

  return (
    <div
      className={
        "fixed inset-0 z-[999] flex items-start justify-center overflow-y-auto bg-neutral-900/60 p-0 sm:p-10 font-ui transition-opacity duration-200 overscroll-contain" +
        (entered ? "opacity-100" : "opacity-0")
      }
      role="presentation"
    >
      <style>{CSS}</style>

      <div
        ref={panelRef}
        className={
          "relative w-full max-w-[1050px] max-h-screen sm:max-h-[88vh] bg-white text-slate-900 overflow-y-auto flex flex-col transition-all duration-200 sm:rounded sm:shadow-2xl overscroll-contain" +
          (entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3.5")
        }
        style={accentVars}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cm-heading"
      >
        <span className="block h-[3px] w-full flex-shrink-0 bg-gradient-to-r from-[color:var(--cm-accent-raw)] to-[color:var(--cm-accent-muted)]" />

        <div className="flex-shrink-0 flex items-center justify-between px-6 sm:px-10 py-4 bg-white/90 backdrop-blur-md border-b border-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-[color:var(--cm-accent-raw)]" />
            <span className="font-data text-[11px] tracking-[0.14em] text-neutral-900">
              {c ? `${c.iso2} · ${c.iso3}` : "DOSSIER"}
            </span>
          </div>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Close dossier"
            className="w-8 h-8 flex items-center justify-center bg-transparent border border-neutral-400 rounded-full text-neutral-500 cursor-pointer transition-colors duration-150 hover:border-neutral-400 hover:text-slate-900 hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--cm-accent-raw)]"
          >
            <X size={16} strokeWidth={1.6} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {status === "loading" && !c ? (
            <div className="p-14 space-y-5">
              <div className="w-32 h-3 rounded bg-neutral-100 animate-pulse" />
              <div className="w-64 h-11 rounded bg-neutral-100 animate-pulse" />
              <div className="w-80 h-4 rounded bg-neutral-100 animate-pulse" />
              <div className="w-full h-40 rounded bg-neutral-100 animate-pulse" />
            </div>
          ) : status === "error" ? (
            <div className="p-16 text-center">
              <p className="font-ui text-base font-medium text-slate-900 mb-1.5">Unable to retrieve this dossier right now.</p>
              <span className="font-ui text-[13px] text-neutral-500">Check the connection and try again.</span>
            </div>
          ) : c ? (
            <article>
              {/* ---------------- HERO / IDENTITY ---------------- */}
              <header className="px-6 sm:px-10 pt-10 sm:pt-5 pb-8 sm:pb-5 border-b border-neutral-400">
                <div className="flex flex-col-reverse gap-8 sm:flex-row sm:items-start sm:gap-12">
                  <div className="flex-1 min-w-0 sm:flex-[1_1_60%]">
                    <h1 id="cm-heading" className="font-display font-medium text-[44px] sm:text-[58px] leading-[1.02] tracking-tight text-slate-900 mb-3.5">
                      {c.nameCommon}
                    </h1>
                    <p className="font-editorial italic text-[17px] text-neutral-800 mb-5 flex flex-wrap items-center gap-x-2">
                      {/* ... (Đoạn render uniqueNames giữ nguyên) ... */}
                      {(() => {
                        const names = [c.nativeOfficial, c.nameOfficial].filter((name): name is string => !!name);
                        const uniqueNames = Array.from(new Set(names));
                        return uniqueNames.map((name, index) => (
                          <React.Fragment key={name}>
                            <span>{name}</span>
                            {index < uniqueNames.length - 1 && (
                              <span className="not-italic font-bold opacity-50 text-[15px] select-none text-neutral-800">
                                •
                              </span>
                            )}
                          </React.Fragment>
                        ));
                      })()}
                    </p>
                    
                    {c.flag.description && (
                      <p className="font-editorial text-[17px] leading-relaxed text-slate-700 max-w-[56ch]">
                        {c.flag.description}
                      </p>
                    )}

                  </div>

                  <div className="flex flex-col items-end sm:items-end justify-end gap-4 flex-shrink-0">
                    
                    {/* Lá cờ */}
                    <div className="w-[220px] h-[147px] sm:w-[260px] sm:h-[173px] flex items-end justify-end">
                      <img src={c.flag.svgUrl} alt={`Flag of ${c.nameCommon}`} className="max-w-full max-h-full object-contain block border border-[color:var(--cm-accent-border)] bg-neutral-50 shadow-sm" />
                    </div>

                    {/* Nút bấm (Được set width bằng đúng width của lá cờ để nhìn vuông vắn) */}
                    <button
                      onClick={() => {
                        onClose(); 
                        navigate(`/discover/${c.iso2.toLowerCase()}`); 
                      }}
                      className="group flex items-center justify-center w-[220px] sm:w-[300px] gap-2.5 px-2 py-3.5 bg-[color:var(--cm-accent-raw)] text-white font-data text-[12px] uppercase tracking-[0.1em] font-bold rounded-[4px] shadow-sm transition-all duration-300 hover:brightness-110 hover:shadow-[0_8px_16px_-4px_var(--cm-accent-border)] active:scale-[0.98] active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[color:var(--cm-accent-raw)]"
                    >
                      <Compass size={16} strokeWidth={2.5} className="opacity-90" />
                      VIEW FULL PROFILE
                      <ArrowRight size={16} strokeWidth={2.5} className="transition-transform duration-300 group-hover:translate-x-1.5 opacity-90 ml-1" />
                    </button>
                    
                  </div>
                  {/* ======================================================= */}
                </div>
              </header>

               {/* ---------------- GEOGRAPHY & DEMOGRAPHICS ---------------- */}
              <section className="px-6 sm:px-10 py-8 sm:py-6 border-b border-neutral-400">
                <SectionHead index="02" title="Geography & Demographics" />
 
                <div className="grid grid-cols-2 sm:grid-cols-4 border border-neutral-400 divide-x divide-y divide-neutral-400 sm:divide-y-0 mb-5">
                  <div className="p-4 flex flex-col gap-1.5 bg-[color:var(--cm-accent-raw)]">
                    <span className="font-data text-[13px] tracking-[0.14em] uppercase text-white/90">Capital</span>
                    <span className="font-ui text-lg font-semibold text-white">{c.capital || "—"}</span>
                  </div>
                  <div className="p-4 flex flex-col gap-1.5">
                    <span className="font-data text-[13px] tracking-[0.14em] uppercase text-neutral-600">Region</span>
                    <span className="font-ui text-lg font-semibold text-slate-900">{c.region || "—"}</span>
                  </div>
                  <div className="p-4 flex flex-col gap-1.5">
                    <span className="font-data text-[13px] tracking-[0.14em] uppercase text-neutral-600">Population</span>
                    <span className="font-ui text-lg font-semibold text-slate-900">
                      {c.population != null ? new Intl.NumberFormat().format(c.population) : "—"}
                    </span>
                  </div>
                  <div className="p-4 flex flex-col gap-1.5">
                    <span className="font-data text-[13px] tracking-[0.14em] uppercase text-neutral-600">Area</span>
                    <span className="font-ui text-lg font-semibold text-slate-900">
                      {c.areaKm2 != null ? `${new Intl.NumberFormat().format(c.areaKm2)} km²` : "—"}
                    </span>
                  </div>
                </div>
 
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Field label="Subregion" value={c.subregion || "—"} />
                  <div className="flex flex-col gap-2">
                    <span className="font-data font-bold text-[13px] tracking-[0.14em] uppercase text-neutral-600">Land Borders</span>
                    {borderStatus ? (
                      <span className="font-ui text-base font-medium text-slate-900">{borderStatus}</span>
                    ) : (
                      <div className="font-ui text-[15px] leading-relaxed text-neutral-700">
                        {c.borders.map((b, index) => (
                          <span key={b} className="inline-flex items-center">
                            <span className="font-medium hover:text-[color:var(--cm-accent-raw)] transition-colors cursor-default">{b}</span>
                            {index < c.borders.length - 1 && (
                              <span className="mx-2 text-[color:var(--cm-accent-border)] select-none">•</span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
 
              {/* ---------------- TRAVEL INTELLIGENCE ---------------- */}
              <section className="px-6 sm:px-10 py-8 sm:py-10 border-b border-neutral-400">
                <SectionHead index="03" title="Travel Intelligence" />
 
                <div className="flex flex-col">
                  <InfoRow icon={Coins} label="Currency">
                    {c.currencies.length
                      ? c.currencies.map((cur) => `${cur.name}${cur.symbol ? ` (${cur.symbol})` : ""}`).join(", ")
                      : "—"}
                  </InfoRow>
 
                  <InfoRow icon={Languages} label="Languages">
                    <div className="font-editorial text-[16px] text-neutral-800 leading-relaxed">
                      {c.languages.length ? (
                        c.languages.map((l, i) => (
                          <span key={i} className="inline-block mr-3">
                            <span className="italic font-semibold text-slate-900">{l.native_name}</span>
                            <span className="ml-1.5 text-neutral-500 font-data text-[11px] not-italic uppercase tracking-wider">{l.name}</span>
                            {i < c.languages.length - 1 && <span className="ml-3 text-[color:var(--cm-accent-raw)] not-italic">—</span>}
                          </span>
                        ))
                      ) : (
                        <span className="text-neutral-400 font-data not-italic">—</span>
                      )}
                    </div>
                  </InfoRow>
 
                  <InfoRow icon={Clock} label="Timezone">{c.timezones.join(", ") || "—"}</InfoRow>
 
                  <InfoRow icon={Car} label="Driving side">
                    {c.drivingSide ? `${c.drivingSide.charAt(0).toUpperCase()}${c.drivingSide.slice(1)}-hand traffic` : "—"}
                  </InfoRow>
 
                  <InfoRow icon={Phone} label="Calling code">
                    {c.callingCodes.length ? `+${c.callingCodes.join(", +")}` : "—"}
                  </InfoRow>
 
                  <InfoRow icon={Ruler} label="Measurement">
                    {c.measurementSystem ? c.measurementSystem.charAt(0).toUpperCase() + c.measurementSystem.slice(1) : "—"}
                  </InfoRow>
 
                  <InfoRow icon={Thermometer} label="Temperature" last>{c.temperatureScale || "—"}</InfoRow>
                </div>
              </section>

              {/* ---------------- GEOPOLITICAL MEMBERSHIP ---------------- */}
              <section className="px-6 sm:px-10 py-6 sm:py-6">
                <SectionHead index="04" title="Geopolitical Membership" />

                {availableMemberships.length ? (
                  <div className="flex flex-wrap gap-2.5">
                    {availableMemberships.map(([key, label]) => (
                      <MembershipBadge key={key} label={label} active={!!c.memberships[key]} />
                    ))}
                  </div>
                ) : (
                  <span className="font-editorial italic text-[15px] text-neutral-500">No membership data available</span>
                )}
              </section>

              {/* ---------------- FOOTER ---------------- */}
              <footer className="flex flex-col gap-2 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-10 font-data text-[10.5px] tracking-[0.08em] uppercase text-neutral-600">
                <span>
                  {c.lastUpdated
                    ? `Record verified ${new Date(c.lastUpdated).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}`
                    : "Record verification date unavailable"}
                </span>
              </footer>
            </article>
          ) : null}
        </div>
      </div>
    </div>
  );
}