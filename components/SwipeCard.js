"use client";

import { motion } from "framer-motion";

export default function SwipeCard({ outfit, onLike, onDislike, onSave }) {
  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(e, info) => {
        if (info.offset.x > 100) onLike(outfit);
        else if (info.offset.x < -100) onDislike(outfit);
      }}
      className="bg-white rounded-[28px] shadow-2xl p-6 w-full max-w-sm mx-auto border border-[#e5e5e0] relative cursor-grab active:cursor-grabbing overflow-hidden"
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex flex-col gap-4 pointer-events-none">
        {outfit.top && (
          <div className="relative h-48 rounded-2xl overflow-hidden shadow-sm">
            <img src={outfit.top.image} className="w-full h-full object-cover" alt="Top" />
            <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full">TOP</div>
          </div>
        )}
        {outfit.bottom && (
          <div className="relative h-48 rounded-2xl overflow-hidden shadow-sm">
            <img src={outfit.bottom.image} className="w-full h-full object-cover" alt="Bottom" />
            <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full">BOTTOM</div>
          </div>
        )}
        {outfit.shoes && (
          <div className="relative h-40 rounded-2xl overflow-hidden shadow-sm">
            <img src={outfit.shoes.image} className="w-full h-full object-cover" alt="Shoes" />
            <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full">SHOES</div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-6 px-2">
        <button onClick={() => onDislike(outfit)} className="flex flex-col items-center gap-1 text-red-500 hover:text-red-600 transition-colors">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-red-50 shadow-sm border border-red-100">
            ❌
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Reject</span>
        </button>
        
        <button onClick={() => onSave && onSave(outfit)} className="flex flex-col items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-50 shadow-sm border border-blue-100 text-xl">
            💾
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Save</span>
        </button>

        <button onClick={() => onLike(outfit)} className="flex flex-col items-center gap-1 text-green-500 hover:text-green-600 transition-colors">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-green-50 shadow-sm border border-green-100">
            ❤️
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Like</span>
        </button>
      </div>
    </motion.div>
  );
}
