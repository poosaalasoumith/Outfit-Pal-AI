"use client";

import { supabase } from "../lib/supabaseClient";
import { useState } from "react";
import { Sparkles, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/chat` : undefined
      }
    });
    
    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage("Check your email for the login link!");
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-transparent text-[#2C2724] font-sans flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md bg-transparent rounded-[32px] p-8 shadow-[0_12px_40px_rgba(201,167,138,0.12)] border border-[#e5e5e0] relative overflow-hidden">
        
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#fdf9f1] rounded-full blur-2xl opacity-70" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#f0eee4] rounded-full blur-2xl opacity-70" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#c9a78a] to-[#8b6f56] flex items-center justify-center shadow-lg shadow-[#c9a78a]/30 mb-6">
            <Sparkles size={32} className="text-white" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Welcome to Outfit Pal</h1>
          <p className="text-[#8b6f56] text-sm mb-8 font-medium">Your personal AI fashion stylist.</p>
          
          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail size={18} className="text-[#a48466]" />
              </div>
              <input
                type="email"
                required
                className="w-full pl-11 pr-4 py-3.5 bg-transparent border border-[#e5e5e0] rounded-2xl text-[15px] text-[#2C2724] focus:outline-none focus:ring-2 focus:ring-[#c9a78a] focus:border-transparent transition-all"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading || !email}
              className="w-full bg-[#2C2724] text-white py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all hover:bg-[#4a423a] disabled:bg-[#a48466] disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(44,39,36,0.15)]"
            >
              {loading ? "Sending link..." : "Continue with Email"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
          
          {message && (
            <div className={`mt-6 p-3 rounded-xl text-sm font-medium w-full ${message.includes("Error") ? "bg-red-50 text-red-600 border border-red-100" : "bg-green-50 text-green-600 border border-green-100"}`}>
              {message}
            </div>
          )}
          
          <div className="mt-8 pt-6 border-t border-[#e5e5e0] w-full">
            <Link href="/chat" className="text-sm font-bold text-[#8b6f56] hover:text-[#2C2724] transition-colors flex items-center justify-center gap-1.5">
              Continue as guest
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
