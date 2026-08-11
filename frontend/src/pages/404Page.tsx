import { motion } from "framer-motion";
import { ArrowLeft, Compass, Map, Home } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#020617] text-white">
      
      {/* Background số 404 khổng lồ chìm vào nền (Watermark) */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none">
        <h1 
          className="text-[40vw] font-black text-white/[0.1] leading-none tracking-tighter"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          404
        </h1>
      </div>

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center">

        {/* Headline - Phong cách Editorial */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 
            className="text-[40px] md:text-[56px] leading-[1.1] tracking-[-0.03em] text-white mb-6"
            style={{ fontFamily: "'Fraunces', 'Times New Roman', serif", fontWeight: 700 }}
          >
            Uncharted <span className="italic text-blue-500">territory.</span>
          </h2>
        </motion.div>

        {/* Đoạn mô tả */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-md text-lg text-slate-400 leading-relaxed mb-10"
        >
          The destination you are looking for does not exist on our map. The border might be closed, or the page has moved.
        </motion.p>

        {/* Các nút hành động chính (Góc cạnh, sắc nét) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col w-full sm:w-auto sm:flex-row gap-4 mb-16"
        >
          <button 
            onClick={() => navigate(-1)}
            className="group flex h-12 items-center justify-center gap-3 border border-white/10 bg-white/5 px-8 text-sm font-semibold transition-all hover:bg-white/10 hover:border-white/20"
          >
            <ArrowLeft className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
            <span>Go Back</span>
          </button>

          <Link 
            to="/explore"
            className="group relative flex h-12 items-center justify-center gap-3 bg-blue-600 px-8 text-sm font-semibold text-white overflow-hidden transition-all hover:bg-blue-500"
          >
            <Map className="h-4 w-4" />
            <span>Open Map</span>
            {/* Hiệu ứng line chạy ngang dưới nút */}
            <span className="absolute bottom-0 left-0 h-[2px] w-full bg-white/30 translate-y-full group-hover:translate-y-0 transition-transform" />
          </Link>
        </motion.div>

        {/* Alternative Routes (Thay thế cho Help Card lộn xộn cũ) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="w-full max-w-lg border-t border-white/10 pt-8"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Alternative Routes
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/" className="flex items-center justify-between p-4 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-colors group">
              <div className="flex items-center gap-3">
                <Home className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-300">Headquarters</span>
              </div>
              <span className="text-xs font-mono text-slate-600 group-hover:text-blue-400 transition-colors">/home</span>
            </Link>
            
            <Link to="/rank/global" className="flex items-center justify-between p-4 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-colors group">
              <div className="flex items-center gap-3">
                <Compass className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-300">Global Rank</span>
              </div>
              <span className="text-xs font-mono text-slate-600 group-hover:text-blue-400 transition-colors">/rank</span>
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
}