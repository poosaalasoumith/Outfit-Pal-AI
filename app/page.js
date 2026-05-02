'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, MessageSquare, Image as ImageIcon, Zap, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  const handleStart = () => {
    router.push('/chat');
  };

  return (
    <div className="min-h-screen bg-transparent text-[#2C2724] font-sans overflow-hidden flex flex-col">
      {/* Navbar */}
      <nav className="w-full px-6 py-6 md:px-12 flex items-center justify-between z-10 sticky top-0 bg-transparent backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#2C2724] flex items-center justify-center shadow-md">
            <Sparkles size={20} className="text-[#FAF9F6]" />
          </div>
          <span className="text-xl font-bold tracking-tight">Outfit Pal</span>
        </div>
        
        <button 
          onClick={handleStart}
          className="group flex items-center gap-2 text-sm font-semibold text-[#2C2724] hover:text-[#a48466] transition-colors"
        >
          Start Styling <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row w-full max-w-7xl mx-auto px-6 md:px-12 items-center relative gap-12 lg:gap-0">
        
        {/* Left Content */}
        <div className="w-full lg:w-1/2 pt-12 lg:pt-0 z-10 lg:pr-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f0eee4] text-[#a48466] text-xs font-bold uppercase tracking-wide mb-6 border border-[#e5e5e0]">
              <Sparkles size={14} /> AI-Powered Fashion
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[1.1] mb-6 text-[#2C2724]">
              Your Personal<br /> <span className="italic font-serif font-light text-[#8b6f56]">Style Assistant</span>
            </h1>
            
            <p className="text-lg md:text-xl text-[#6d665f] mb-10 max-w-lg leading-relaxed mix-blend-multiply">
              Elevate your wardrobe seamlessly. Outfit Pal uses multimodal AI to curate premium looks, suggest combinations, and elevate your personal aesthetic.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleStart}
                className="px-8 py-4 bg-[#2C2724] text-white rounded-full font-semibold text-lg hover:bg-[#1a1715] hover:shadow-[0_10px_30px_rgba(44,39,36,0.2)] transition-all duration-300 flex items-center justify-center gap-2"
              >
                <MessageSquare size={20} />
                Start Chatting
              </button>
              
              <button 
                onClick={handleStart}
                className="px-8 py-4 bg-transparent text-[#2C2724] rounded-full font-semibold text-lg border border-[#e5e5e0] hover:border-[#2C2724] hover:shadow-sm transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Sparkles size={20} />
                Start Styling
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6"
          >
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-full bg-[#fdf9f1] flex items-center justify-center text-[#c9a78a] mb-2 border border-[#f5ead9]">
                <MessageSquare size={18} />
              </div>
              <h3 className="font-semibold text-sm">Conversational AI</h3>
              <p className="text-xs text-[#8b8b82]">Chat naturally about your fashion needs.</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-full bg-[#fdf9f1] flex items-center justify-center text-[#c9a78a] mb-2 border border-[#f5ead9]">
                <ImageIcon size={18} />
              </div>
              <h3 className="font-semibold text-sm">Visual Recs</h3>
              <p className="text-xs text-[#8b8b82]">Upload inspiration, get curated matches.</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-full bg-[#fdf9f1] flex items-center justify-center text-[#c9a78a] mb-2 border border-[#f5ead9]">
                <Zap size={18} />
              </div>
              <h3 className="font-semibold text-sm">Context-Aware</h3>
              <p className="text-xs text-[#8b8b82]">Personalized to your unique aesthetic.</p>
            </div>
          </motion.div>
        </div>

        {/* Right Content - Hero Image */}
        <div className="w-full lg:w-1/2 h-[50vh] lg:h-[80vh] relative min-h-[400px]">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="absolute inset-4 lg:inset-y-12 lg:inset-x-8 rounded-[40px] overflow-hidden shadow-2xl"
          >
            <img 
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80" 
              alt="Premium fashion style" 
              className="w-full h-full object-cover object-center"
            />
            {/* Soft overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
          </motion.div>

          {/* Floating Suggestion Card */}
          <motion.div
            initial={{ opacity: 0, y: 50, x: -20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            transition={{ delay: 0.8, type: "spring", bounce: 0.4 }}
            className="absolute bottom-12 lg:bottom-24 left-0 lg:-left-12 bg-transparent backdrop-blur-xl p-5 rounded-3xl shadow-xl border border-white max-w-[280px]"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                <img src="/hero_tuxedo.png" alt="Tuxedo snippet" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#8b6f56]">Outfit Pal AI</p>
                <p className="text-[10px] text-gray-500">Just recommended</p>
              </div>
            </div>
            <p className="text-sm font-medium text-[#2C2724] leading-tight">
              "A premium midnight tuxedo paired with sharp contrast pieces."
            </p>
          </motion.div>
        </div>

      </main>
    </div>
  );
}
