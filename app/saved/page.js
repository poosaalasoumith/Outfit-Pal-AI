"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Heart, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function SavedPage() {
  const [saved, setSaved] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSaved() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from("user_outfits")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "saved")
        .order("created_at", { ascending: false });
        
      if (!error && data) {
        // We stored the outfit object as jsonb in product_ids
        setSaved(data.map(d => d.product_ids));
      }
      setIsLoading(false);
    }
    
    fetchSaved();
  }, []);

  return (
    <div className="min-h-screen bg-transparent text-[#2C2724] font-sans pb-20">
      <header className="p-4 md:p-6 bg-transparent backdrop-blur-xl border-b border-gray-200/50 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link href="/chat" className="p-2 hover:bg-[#f0eee4] rounded-full transition-colors">
            <ArrowLeft size={20} className="text-[#2C2724]" />
          </Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Heart size={18} className="text-[#c9a78a] fill-[#c9a78a]" />
              Saved Outfits
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <Sparkles size={32} className="text-[#c9a78a] animate-pulse mb-4" />
            <p className="font-medium">Loading your wardrobe...</p>
          </div>
        ) : saved.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center opacity-60">
            <Heart size={48} className="text-[#c9a78a] mb-4" />
            <h2 className="text-xl font-bold mb-2">No outfits saved yet</h2>
            <p className="text-sm">Swipe right on outfits you love in the chat to save them here.</p>
            <Link href="/chat" className="mt-6 px-6 py-2 bg-[#2C2724] text-white rounded-full font-semibold text-sm hover:bg-[#4a423a] transition-colors">
              Find Outfits
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {saved.map((outfit, i) => (
              <div key={i} className="bg-transparent border border-[#e5e5e0] rounded-[24px] p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-2">
                  {outfit.top && <img src={outfit.top.image} className="w-full h-32 object-cover rounded-xl" />}
                  <div className="flex gap-2">
                    {outfit.bottom && <img src={outfit.bottom.image} className="w-1/2 h-32 object-cover rounded-xl" />}
                    {outfit.shoes && <img src={outfit.shoes.image} className="w-1/2 h-32 object-cover rounded-xl" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
