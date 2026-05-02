'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ImageIcon } from 'lucide-react';
import Image from 'next/image';

export default function ProductCard({ product, idx = 0 }) {
  if (!product) return null;

  const fallbackSearch = product?.link || `https://www.google.com/search?q=${encodeURIComponent((product?.brand || '') + ' ' + (product?.name || ''))}`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.1, duration: 0.5, type: "spring", damping: 25, stiffness: 200 }}
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-[#c9a78a]/10 transition-shadow duration-500 border border-gray-100 hover:border-[#e5e5e0] flex flex-col h-full"
    >
      <div className="h-[220px] bg-[#f9f9f9] relative overflow-hidden flex-shrink-0">
        <img
          src={product.image}
          alt={product?.name || 'Product'}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
        />

        
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2C2724]/60 via-[#2C2724]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center pb-6">
           <motion.a 
              href={fallbackSearch}
              target="_blank"
              rel="noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2.5 rounded-full bg-white text-[#2C2724] font-semibold transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-out shadow-xl cursor-pointer text-sm"
           >
              View Product
           </motion.a>
        </div>

        {/* Rating stars */}
        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white flex items-center gap-1.5 shadow-sm">
          <span className="text-yellow-500 text-xs">⭐</span>
          <span className="font-bold text-xs text-[#2C2724]">{product?.rating ? parseFloat(product.rating).toFixed(1) : '4.5'}</span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-4 mb-2">
          <h3 className="font-semibold text-base leading-tight line-clamp-2 text-[#2C2724]">{product?.name || 'Unknown Product'}</h3>
        </div>
        <p className="text-[11px] text-[#a48466] font-bold tracking-wider uppercase mb-3">{product?.brand || 'Unknown Brand'}</p>
        
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-100">
           <span className="font-black text-xl text-[#2C2724]">
             ${product?.price || 'N/A'}
           </span>
           <a 
              href={fallbackSearch} 
              target="_blank" 
              rel="noreferrer"
              className="lg:hidden bg-[#f0eee4] hover:bg-[#e5e5e0] text-[#2C2724] text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full transition-colors"
           >
              Shop
           </a>
        </div>
      </div>
    </motion.div>
  );
}
