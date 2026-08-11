import { useEffect, useState, useMemo } from "react";
// Import thêm hàm generateMapColors và hook usePassportData
import { PassportExplorer, CompactCountrySelector, generateMapColors } from "../components/PassportExplorer";
import { WorldMap } from "../components/WorldMap";
import { usePassportData } from "../hooks/usePassportData";
import { Globe, Compass } from 'lucide-react'
import { CountryModal } from "../components/CountryModal";

interface ExplorerPageProps {
  theme: 'light' | 'dark';
}

// ─────────────────────────────────────────────────────────────
// FlightRouteBackground
// Great-circle-style arcs across the hero, like an airline route
// map. Pure SVG paths — not text, not a repeating tile. Sits at
// very low opacity as atmosphere behind the content.
// ─────────────────────────────────────────────────────────────
function FlightRouteBackground() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 1200 300"
      preserveAspectRatio="none"
      fill="none"
    >
      <g stroke="#1C1C1E" strokeWidth="1" opacity="0.06">
        <path d="M -50,250 Q 250,40 550,190 T 1250,70" />
        <path d="M -50,110 Q 350,270 700,90 T 1250,230" />
        <path d="M 100,-30 Q 420,190 760,10 T 1150,210" />
      </g>
      <g fill="#1C1C1E" opacity="0.12">
        <circle cx="550" cy="190" r="2.5" />
        <circle cx="700" cy="90" r="2.5" />
        <circle cx="760" cy="10" r="2.5" />
        <circle cx="1150" cy="210" r="2.5" />
        <circle cx="100" cy="-30" r="2.5" />
      </g>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// StampRing
// Circular motif with airport codes running around the
// circumference via textPath — a passport-stamp / departure-
// board reference that's structural, not decorative icon.
// ─────────────────────────────────────────────────────────────
function StampRing() {
  return (
    <svg
      className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none"
      width="160"
      height="160"
      viewBox="0 0 160 160"
    >
      <defs>
        <path id="ringPath" d="M 80,14 A 66,66 0 1 1 79.9,14" />
      </defs>
      <circle cx="80" cy="80" r="66" fill="none" stroke="#1C1C1E" strokeOpacity="0.08" strokeDasharray="1 5" strokeWidth="1.5" />
      <circle cx="80" cy="80" r="52" fill="none" stroke="#1C1C1E" strokeOpacity="0.06" strokeWidth="1" />
      <text fontFamily="ui-monospace, monospace" fontSize="8.5" letterSpacing="2.5" fill="#1C1C1E" opacity="0.28">
        <textPath href="#ringPath" startOffset="0%">
          SGN • HAN • DXB • LHR • JFK • SIN • NRT •&#160;
        </textPath>
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// PaperGrain — faint noise texture instead of a flat gradient,
// so the card reads as a document surface, not a UI panel.
// ─────────────────────────────────────────────────────────────
function PaperGrain() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
      <filter id="paperNoise">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.1  0 0 0 0 0.08  0 0 0 0 0.05  0 0 0 0.4 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#paperNoise)" opacity="0.035" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// AirmailBorder — the diagonal red/navy stripe from vintage
// airmail envelopes, as a thin top edge. Real color, contained.
// ─────────────────────────────────────────────────────────────
function AirmailBorder() {
  return (
    <div
      className="absolute top-0 left-0 right-0 h-[2px]"
      style={{
        backgroundImage: `repeating-linear-gradient(
          -45deg,
          #A63A2E 0px, #A63A2E 10px,
          #FAF6EE 10px, #FAF6EE 14px,
          #1B3358 14px, #1B3358 24px,
          #FAF6EE 24px, #FAF6EE 28px
        )`,
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// InkStampOverprint — signature element. A rough, rotated
// "PASSPORT" outline stamped diagonally in customs-ink red,
// distorted via feTurbulence so it reads as physically inked.
// ─────────────────────────────────────────────────────────────
function InkStampOverprint() {
  return (
    <svg
      className="absolute -right-10 -bottom-10 pointer-events-none"
      width="480"
      height="220"
      viewBox="0 0 480 220"
    >
      <filter id="inkRough">
        <feTurbulence type="fractalNoise" baseFrequency="0.012 0.04" numOctaves="2" result="noise" seed="7" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" />
      </filter>
      <g filter="url(#inkRough)" transform="rotate(-10 240 110)">
        <text
          x="20" y="130"
          fontFamily="'Fraunces', ui-serif, Georgia, serif"
          fontWeight="900"
          fontSize="86"
          letterSpacing="4"
          fill="none"
          stroke="#A63A2E"
          strokeWidth="2.5"
          opacity="0.14"
        >
          PASSPORT
        </text>
      </g>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// PassportIllustration
// An open passport booklet with an overlapping visa stamp —
// original line-art, not a stock photo, not a repeating pattern.
// Sits large and low-opacity on the right side of the hero.
// ─────────────────────────────────────────────────────────────
// function PassportIllustration() {
//   return (
//     <svg
//       className="hidden md:block absolute -right-6 -top-10 pointer-events-none"
//       width="420"
//       height="340"
//       viewBox="0 0 420 340"
//       fill="none"
//     >
//       <g opacity="0.07">
//         {/* Left page */}
//         <rect x="60" y="40" width="150" height="220" rx="4" stroke="#1C1C1E" strokeWidth="1.5" transform="rotate(-6 135 150)" />
//         {/* Right page */}
//         <rect x="205" y="40" width="150" height="220" rx="4" stroke="#1C1C1E" strokeWidth="1.5" transform="rotate(4 280 150)" />
//         {/* Spine gutter */}
//         <line x1="205" y1="35" x2="205" y2="265" stroke="#1C1C1E" strokeWidth="1" transform="rotate(-1 205 150)" />

//         {/* Photo square, left page */}
//         <rect x="82" y="66" width="58" height="72" rx="2" stroke="#1C1C1E" strokeWidth="1.2" transform="rotate(-6 111 102)" />

//         {/* Bio-data lines, left page */}
//         <g transform="rotate(-6 170 90)">
//           <line x1="150" y1="72" x2="200" y2="72" stroke="#1C1C1E" strokeWidth="1" />
//           <line x1="150" y1="86" x2="195" y2="86" stroke="#1C1C1E" strokeWidth="1" />
//           <line x1="150" y1="100" x2="198" y2="100" stroke="#1C1C1E" strokeWidth="1" />
//           <line x1="150" y1="114" x2="185" y2="114" stroke="#1C1C1E" strokeWidth="1" />
//         </g>

//         {/* MRZ lines, bottom of left page */}
//         <g transform="rotate(-6 135 230)">
//           <line x1="72" y1="222" x2="198" y2="222" stroke="#1C1C1E" strokeWidth="1" strokeDasharray="2 2" />
//           <line x1="72" y1="234" x2="198" y2="234" stroke="#1C1C1E" strokeWidth="1" strokeDasharray="2 2" />
//         </g>

//         {/* Visa stamp, overlapping right page */}
//         <g transform="rotate(14 300 190)">
//           <circle cx="300" cy="190" r="52" stroke="#1C1C1E" strokeWidth="1.4" strokeDasharray="1 4" />
//           <circle cx="300" cy="190" r="38" stroke="#1C1C1E" strokeWidth="1" />
//           <path id="stampRing" d="M 300,152 A 38,38 0 1 1 299.9,152" fill="none" />
//           <text fontFamily="ui-monospace, monospace" fontSize="7.5" letterSpacing="2" fill="#1C1C1E">
//             <textPath href="#stampRing" startOffset="0%">ENTRY • VISA • ARRIVAL •&#160;</textPath>
//           </text>
//         </g>

//         {/* Boarding-pass stub, sliding out lower-right */}
//         <g transform="rotate(10 355 260)">
//           <rect x="300" y="235" width="110" height="52" rx="3" stroke="#1C1C1E" strokeWidth="1.2" />
//           <line x1="352" y1="235" x2="352" y2="287" stroke="#1C1C1E" strokeWidth="1" strokeDasharray="1 3" />
//           <line x1="308" y1="248" x2="340" y2="248" stroke="#1C1C1E" strokeWidth="1" />
//           <line x1="308" y1="260" x2="335" y2="260" stroke="#1C1C1E" strokeWidth="1" />
//           <line x1="362" y1="248" x2="400" y2="248" stroke="#1C1C1E" strokeWidth="1" />
//           <line x1="362" y1="260" x2="395" y2="260" stroke="#1C1C1E" strokeWidth="1" />
//         </g>
//       </g>
//     </svg>
//   );
// }


export function ExplorePage({ theme }: ExplorerPageProps) {
  const [selectedPassport, setSelectedPassport] = useState<string>("");
  
  // 1. CHỈ DÙNG 1 STATE DUY NHẤT CHO MODAL (Xóa bỏ modalIso bị dư)
  const [selectedIso, setSelectedIso] = useState<string | null>(null);
  
  const { data, loading, error } = usePassportData(selectedPassport);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const mapColors = useMemo(() => {
    return generateMapColors(data?.destinations);
  }, [data]);

  return (
    <main className="pt-16 md:pt-16 w-full flex flex-col items-center">      
      
      {/* 2. THÊM z-30 VÀO ĐÂY ĐỂ ĐẢM BẢO DROPDOWN ĐÈ LÊN BẢN ĐỒ */}
      <section className="relative w-full z-30">
        <div
          className="relative border border-stone-200 py-2 pt-7"
          style={{ background: 'linear-gradient(to bottom, #FFFFFF 0%, #FCFCFB 100%)' }}
        >
          <FlightRouteBackground />
          <StampRing />
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <PaperGrain />
            <InkStampOverprint />
          </div>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url('/images/hero-passport.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.4,
              mixBlendMode: 'plus-darker',
              maskImage: `
                linear-gradient(to right, transparent 0%, black 8%), 
                linear-gradient(to top, transparent 0%, black 30%)
              `,
              WebkitMaskComposite: 'destination-in',
              maskComposite: 'intersect',
            }}
          />

          <span className="absolute -top-px -left-px w-3 h-3 border-t border-l border-slate-300" />
          <span className="absolute -top-px -right-px w-3 h-3 border-t border-r border-slate-300" />
          <span className="absolute -bottom-px -left-px w-3 h-3 border-b border-l border-slate-300" />
          <span className="absolute -bottom-px -right-px w-3 h-3 border-b border-r border-slate-300" />

          <div className="z-20 relative grid md:grid-cols-[1fr_auto_450px] items-center gap-6 md:gap-10 px-6 md:px-10 py-9 md:py-2">

            <div
              className="text-center md:text-left transition-all duration-[220ms] ease-out"
              style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(6px)' }}
            >
              <h1
                className="text-[40px] md:text-[56px] leading-[1.1] tracking-[-0.03em] text-slate-800"
                style={{ 
                  fontFamily: "'Fraunces', 'Times New Roman', serif", 
                  fontWeight: 500, 
                  fontStyle: 'italic'
                }}
              >
                Discover the{' '}
                <span className="relative inline-block italic" style={{ color: '#0f60b8' }}>
                  power
                </span>{' '}
                of your passport.
              </h1>

              <p
                className="text-[14.5px] md:text-[15.5px] leading-[1.55] text-[#072b52]/90 mt-2 max-w-[900px] mx-auto md:mx-0"
                style={{ fontFamily: "'Fraunces', ui-serif, Georgia, serif" }}
              >
                Discover your global freedom, see where you can wander without a visa, and understand the requirements for wherever you choose to go.
              </p>
            </div>

            <div className="hidden md:block w-0 h-20 bg-stone-800" />

            <div
              className="relative flex flex-col items-center md:items-start gap-1 transition-all duration-[220ms] ease-out delay-[60ms]"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(6px)',
              }}
            >
              <div className="w-full md:w-[400px]">
                <CompactCountrySelector
                  value={selectedPassport}
                  onChange={(iso) => setSelectedPassport(iso)}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THÊM relative z-10 VÀO ĐÂY ĐỂ NÓ NẰM DƯỚI HEADER */}
      <div className="flex flex-col w-full animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out fill-mode-forwards relative z-10">
        
        <section className="w-full relative">
          <div className="">
            <WorldMap 
              height="550px" 
              theme={theme} 
              countryColors={mapColors} 
              onCountryClick={(iso) => setSelectedIso(iso)} // Bắn ra selectedIso
            />
          </div>
        </section>

        <section className="w-full border-t border-neutral-200">
          {!selectedPassport ? (
            <div className="flex flex-col items-center justify-center py-24 px-6 border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
              <div className="p-4 bg-white rounded-full shadow-sm border border-stone-100">
                <Globe className="w-12 h-12 text-stone-300" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-display font-medium text-stone-900 mb-3">No Passport Selected</h3>
              <p className="text-stone-500 text-center max-w-md leading-relaxed">
                Choose a passport from the dropdown above to unlock detailed visa requirements, global mobility scores, and a full destination roster.
              </p>
            </div>
          ) : (
            <PassportExplorer 
              iso={selectedPassport} 
              data={data}
              loading={loading}
              error={error}
              onOpenModal={(iso) => setSelectedIso(iso)} // CŨNG Bắn ra selectedIso
            />
          )}
        </section>

      </div> 
      {/* 3. DỜI MODAL RA KHỎI DIV ANIMATE-IN (Ra sát rìa ngoài cùng) */}

      {selectedIso && (
        <CountryModal 
          iso={selectedIso} 
          isOpen={!!selectedIso} 
          onClose={() => setSelectedIso(null)} 
        />
      )}  

    </main>
  );
}