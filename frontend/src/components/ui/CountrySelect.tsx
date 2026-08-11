// import { useState, useMemo, useRef, useEffect } from "react";
// import { Search, X, Check } from "lucide-react";
// import { COUNTRIES } from "@/utils/constants";

// interface Props {
//   value: string | null;
//   onChange: (code: string | null) => void;
//   placeholder?: string;
//   compact?: boolean;
// }

// export function CountrySelect({ value, onChange, placeholder = "Select country", compact }: Props) {
//   const [open, setOpen] = useState(false);
//   const [query, setQuery] = useState("");
//   const ref = useRef<HTMLDivElement>(null);

//   const selected = COUNTRIES.find((c) => c.code === value) ?? null;

//   const results = useMemo(() => {
//     const q = query.trim().toLowerCase();
//     if (!q) return COUNTRIES;
//     return COUNTRIES.filter(
//       (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
//     );
//   }, [query]);

//   useEffect(() => {
//     if (!open) return;
//     function onDoc(e: MouseEvent) {
//       if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
//     }
//     document.addEventListener("mousedown", onDoc);
//     return () => document.removeEventListener("mousedown", onDoc);
//   }, [open]);

//   return (
//     <div ref={ref} className="relative">
//       <button
//         type="button"
//         onClick={() => setOpen((v) => !v)}
//         className={`flex items-center gap-2 rounded-md hairline bg-white/[0.03] px-3 hover:bg-white/[0.06] transition-colors ${
//           compact ? "h-8" : "h-9"
//         }`}
//       >
//         {selected ? (
//           <>
//             <span className="text-base leading-none">{selected.flag}</span>
//             <span className="font-mono text-xs tracking-widest text-foreground">
//               {selected.code}
//             </span>
//             <span className="text-sm text-foreground/80 hidden sm:inline">
//               {selected.name}
//             </span>
//           </>
//         ) : (
//           <>
//             <Search size={14} strokeWidth={1.5} className="text-muted-foreground" />
//             <span className="text-sm text-muted-foreground">{placeholder}</span>
//           </>
//         )}
//       </button>

//       {open && (
//         <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-72 glass-panel rounded-lg overflow-hidden shadow-2xl">
//           <div className="flex items-center gap-2 border-b border-border px-3 h-10">
//             <Search size={14} strokeWidth={1.5} className="text-muted-foreground" />
//             <input
//               autoFocus
//               value={query}
//               onChange={(e) => setQuery(e.target.value)}
//               placeholder="Search 199 countries"
//               className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
//             />
//             {value && (
//               <button
//                 type="button"
//                 onClick={() => {
//                   onChange(null);
//                   setOpen(false);
//                 }}
//                 aria-label="Clear"
//                 className="text-muted-foreground hover:text-foreground"
//               >
//                 <X size={14} strokeWidth={1.5} />
//               </button>
//             )}
//           </div>
//           <ul className="max-h-72 overflow-y-auto">
//             {results.map((c) => (
//               <li key={c.code}>
//                 <button
//                   type="button"
//                   onClick={() => {
//                     onChange(c.code);
//                     setOpen(false);
//                     setQuery("");
//                   }}
//                   className="w-full flex items-center gap-3 px-3 h-10 text-left hover:bg-white/[0.04] border-b border-border/50 last:border-0"
//                 >
//                   <span className="text-base leading-none">{c.flag}</span>
//                   <span className="font-mono text-[11px] tracking-widest text-muted-foreground w-8">
//                     {c.code}
//                   </span>
//                   <span className="text-sm flex-1 truncate">{c.name}</span>
//                   {value === c.code && <Check size={14} strokeWidth={1.5} className="text-primary" />}
//                 </button>
//               </li>
//             ))}
//             {results.length === 0 && (
//               <li className="px-3 py-6 text-center text-sm text-muted-foreground">
//                 No countries match "{query}"
//               </li>
//             )}
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// }
