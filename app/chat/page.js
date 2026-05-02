'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Paperclip, Send, X, Sparkles, Image as ImageIcon, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../../components/ProductCard';
import SwipeCard from '../../components/SwipeCard';
import Link from 'next/link';
import { getSupabase } from '../lib/supabaseClient';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [outfit, setOutfit] = useState({ top: null, bottom: null, shoes: null, accessories: [] });
  const [outfits, setOutfits] = useState([]);
  const [saved, setSaved] = useState([]);
  const [index, setIndex] = useState(0);
  const [outfitMeta, setOutfitMeta] = useState(null);
  const [showLookbookMobile, setShowLookbookMobile] = useState(false);
  const [user, setUser] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user);
    });
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addToHistory = async (outfitData) => {
    if (!user) return;
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      await supabase.from("outfit_history").insert([{ user_id: user.id, outfit: outfitData }]);
    } catch (err) {
      console.error("Failed to add to history", err);
    }
  };

  const handleSubmit = async (e, directQuery = null) => {
    if (e) e.preventDefault();
    const query = directQuery || input.trim();
    if (!query && !imageFile) return;

    const userMsg = query;
    const currentMessages = [...messages, { 
      role: 'user', 
      content: userMsg, 
      image: imagePreview,
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }];
    
    setMessages(currentMessages);
    setInput('');
    setIsLoading(true);
    setIndex(0);

    let base64Data = null;
    let mimeType = null;

    if (imageFile) {
      base64Data = imagePreview.split(',')[1];
      mimeType = imageFile.type;
      removeImage();
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentMessages.map(m => ({ role: m.role, content: m.content })),
          imageBase64: base64Data,
          mimeType: mimeType,
          imageName: imageFile ? imageFile.name : null
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        console.error("Failed to parse JSON response:", parseErr);
        data = {};
      }

      if (response.ok) {
        let newOutfits = [];
        if (data.outfits && Array.isArray(data.outfits)) {
          setOutfits(data.outfits);
          setOutfit(data.outfits[0]?.outfit || { top: null, bottom: null, shoes: null, accessories: [] });
          newOutfits = data.outfits;
        } else {
          setOutfit(data.outfit || data.products || { top: null, bottom: null, shoes: null, accessories: [] });
          if (data.outfit) {
            setOutfits([{ outfit: data.outfit, score: data.message?.score }]);
            newOutfits = [{ outfit: data.outfit }];
          }
        }
        
        // Log to history
        newOutfits.forEach(o => addToHistory(o.outfit));

        setOutfitMeta({
          score: data.message?.score || 0,
          breakdown: data.message?.score_breakdown || null,
          why_it_works: data.message?.why_it_works || []
        });

        setMessages(prev => [
          ...prev, 
          { 
            role: 'model', 
            content: data.message || { title: "Here's what I found", description: "I've curated some options for you." },
            id: (Date.now() + 1).toString(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            hasRecommendations: !!(data.outfits || data.outfit)
          }
        ]);
        if (window.innerWidth < 1024) {
          setShowLookbookMobile(true);
        }
      } else {
        throw new Error(data.error || 'Server responded with an error');
      }
    } catch (error) {
      console.error("Chat submission error:", error);
      setMessages(prev => [
        ...prev,
        { 
          role: 'model', 
          content: { title: "Oops!", description: "Something went wrong while fetching recommendations. Please try again." }, 
          id: Date.now().toString(), 
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }
      ]);
      setOutfit({ top: null, bottom: null, shoes: null, accessories: [] });
      setOutfits([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChipClick = (suggestion) => {
    handleSubmit(null, suggestion);
  };

  const handleRegenerate = () => {
    handleSubmit(null, "Show me completely different outfit combinations for my last request. Use alternative pieces.");
  };

  const saveOutfitToDB = async (outfitData, type) => {
    if (!user) {
      alert("Please login to save outfits!");
      return;
    }
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      await supabase.from("user_outfits").insert([{ user_id: user.id, product_ids: outfitData, type }]);
    } catch (err) {
      console.error(`Failed to save outfit as ${type}`, err);
    }
  };

  function handleLike(likedOutfit) {
    setSaved(prev => [...prev, likedOutfit]);
    setIndex(i => i + 1);
    saveOutfitToDB(likedOutfit, "liked");
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_outfit", outfit: likedOutfit })
    }).catch(e => console.error(e));
  }

  function handleDislike(dislikedOutfit) {
    setIndex(i => i + 1);
    saveOutfitToDB(dislikedOutfit, "rejected");
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dislike_outfit", outfit: dislikedOutfit })
    }).catch(e => console.error(e));
  }

  function handleSave(savedOutfit) {
    setIndex(i => i + 1);
    saveOutfitToDB(savedOutfit, "saved");
  }

  const handleLogout = async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    window.location.href = "/login";
  };

  const itemCount = outfits.reduce((total, o) => total + [o.outfit?.top, o.outfit?.bottom, o.outfit?.shoes].filter(Boolean).length, 0);

  const suggestions = ["Brunch date", "Work outfit", "Festival look", "Date night look"];

  return (
    <div className="flex h-screen bg-transparent text-[#2C2724] font-sans">
      
      {/* Chat Section */}
      <div className="flex flex-col flex-1 transition-all duration-700 ease-in-out bg-transparent">
        
        {/* Header */}
        <header className="p-4 md:p-6 bg-transparent backdrop-blur-xl border-b border-gray-200/50 flex items-center justify-between gap-4 z-20">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#c9a78a] to-[#8b6f56] flex items-center justify-center shadow-md shadow-[#c9a78a]/20">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#2C2724]">Outfit Pal</h1>
              <p className="text-xs text-[#8b6f56] font-semibold tracking-wide uppercase">AI Stylist</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/history" className="text-sm font-semibold text-[#8b6f56] hover:text-[#2C2724] transition-colors hidden md:block">History</Link>
            <Link href="/saved" className="text-sm font-semibold text-[#8b6f56] hover:text-[#2C2724] transition-colors hidden md:block">Saved</Link>
            {user ? (
              <button onClick={handleLogout} className="text-sm font-semibold text-[#8b6f56] hover:text-[#2C2724] transition-colors hidden md:flex items-center gap-1"><LogOut size={14}/> Logout</button>
            ) : (
              <Link href="/login" className="text-sm font-semibold text-[#c9a78a] hover:text-[#2C2724] transition-colors hidden md:block">Login</Link>
            )}
            
            {messages.length > 0 && itemCount > 0 && (
              <button 
                onClick={() => setShowLookbookMobile(true)}
                className="lg:hidden flex items-center gap-2 bg-transparent text-[#8b6f56] px-4 py-2 rounded-full text-xs font-bold border border-[#e5e5e0] shadow-sm hover:bg-[#f0eee4] transition-colors"
              >
                <Sparkles size={14} className="text-[#c9a78a]"/> View Lookbook
              </button>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
          <div className="max-w-3xl mx-auto flex flex-col min-h-full"> 
            
            {/* Empty State */}
            {messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex-1 flex flex-col items-center justify-center text-center pb-10"
              >
                <div className="w-16 h-16 rounded-full bg-[#f0eee4] flex items-center justify-center mb-6 shadow-sm border border-[#e5e5e0]">
                  <Sparkles size={28} className="text-[#a48466]" />
                </div>
                <h2 className="text-2xl md:text-3xl font-semibold text-[#2C2724] mb-3">
                  Hey! I'm Outfit Pal, your personal stylist.
                </h2>
                <p className="text-[#6d665f] text-[15px] max-w-md mx-auto mb-10 leading-relaxed">
                  Ready to upgrade your wardrobe? Tell me where you are going, what you like, or upload a photo of a piece you want to style.
                </p>

                <div className="flex flex-wrap justify-center gap-3">
                  {suggestions.map((sug, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 + 0.3 }}
                      whileHover={{ scale: 1.05, boxShadow: "0px 10px 20px rgba(201,167,138,0.15)", borderColor: "#c9a78a" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleChipClick(sug)}
                      className="px-5 py-2.5 rounded-full bg-transparent border border-[#e5e5e0] text-[#4a423a] text-[13px] font-semibold shadow-sm transition-all duration-300"
                    >
                      {sug}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Message List */}
            <div className="space-y-6 flex flex-col justify-end flex-1 pb-4">
              <AnimatePresence initial={false}>
                {messages.map((message, index) => (
                  <motion.div 
                    key={message.id || index}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4, type: "spring", stiffness: 250, damping: 25 }}
                    className={`flex w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="flex gap-3 max-w-[85%] md:max-w-[75%]">
                      {message.role !== 'user' && (
                        <div className="w-9 h-9 flex-shrink-0 rounded-full bg-gradient-to-br from-[#c9a78a] to-[#8b6f56] flex items-center justify-center shadow-md shadow-[#c9a78a]/20 hidden md:flex">
                          <Sparkles size={16} className="text-white" />
                        </div>
                      )}
                      <div className={`rounded-[24px] p-5 shadow-sm border ${
                        message.role === 'user' 
                          ? 'bg-[#2C2724] text-[#FAF9F6] rounded-br-sm border-transparent shadow-[0_4px_15px_rgba(44,39,36,0.1)]' 
                          : 'bg-transparent backdrop-blur-2xl border-gray-100 text-[#2C2724] rounded-bl-sm shadow-[0_4px_15px_rgba(0,0,0,0.02)]'
                      }`}>
                        {message.image && (
                          <div className="mb-4 overflow-hidden rounded-xl ring-1 ring-black/5">
                            <img src={message.image} alt="User upload" className="rounded-xl w-full object-cover max-h-72" />
                          </div>
                        )}
                        {message.content && (
                          <div className="whitespace-pre-line leading-relaxed text-[15px] font-normal">
                            {message.role === 'model' && message.hasRecommendations && (
                              <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fdf9f1] text-[#a48466] text-[11px] font-bold uppercase tracking-wider border border-[#f5ead9] shadow-sm">
                                 <Sparkles size={12} className="text-[#c9a78a]"/> Recommended Outfit Generated
                              </div>
                            )}
                            {typeof message.content === 'object' && message.content.title && (
                               <h3 className="font-bold text-[16px] text-[#2C2724] mb-1.5">{message.content.title}</h3>
                            )}
                            <p>{typeof message.content === 'object' ? (message.content.description || message.content.conversational_text) : message.content}</p>
                            
                            {/* Styling Tips Block */}
                            {typeof message.content === 'object' && message.content.styling_tips && message.content.styling_tips.length > 0 && (
                              <div className="mt-5 bg-[#faf9f6]/80 border border-[#e5e5e0] rounded-2xl p-4 shadow-sm">
                                <h4 className="text-[11px] font-bold text-[#8b6f56] uppercase tracking-widest mb-3 flex items-center gap-2">
                                   <Sparkles size={14} className="text-[#8b6f56]" /> Styling Tips
                                </h4>
                                <ul className="text-[13px] font-medium space-y-2 text-[#4a423a] list-none pl-1">
                                   {message.content.styling_tips.map((tip, i) => (
                                     <li key={i} className="flex gap-2.5 items-start leading-relaxed">
                                        <span className="text-[#c9a78a] mt-1 text-[10px]">♦</span> 
                                        <span>{tip}</span>
                                     </li>
                                   ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                        <div className={`text-[10px] mt-2 opacity-50 font-semibold tracking-wide flex items-center gap-1.5 ${message.role === 'user' ? 'justify-end text-white' : 'justify-start text-gray-500'}`}>
                          {message.timestamp || 'Just now'}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, type: "spring", stiffness: 250, damping: 25 }}
                    className="flex w-full justify-start mt-4"
                  >
                    <div className="flex gap-3 max-w-[85%] md:max-w-[75%]">
                      <div className="w-9 h-9 flex-shrink-0 rounded-full bg-gradient-to-br from-[#c9a78a] to-[#8b6f56] flex items-center justify-center shadow-md shadow-[#c9a78a]/20 hidden md:flex">
                        <Sparkles size={16} className="text-white" />
                      </div>
                      <div className="bg-transparent backdrop-blur-2xl border border-gray-100 rounded-[20px] rounded-bl-sm px-5 py-4 flex items-center gap-3 shadow-[0_4px_15px_rgba(0,0,0,0.02)]">
                        <span className="text-[#8b6f56] text-[13px] font-semibold tracking-wide">
                          Outfit Pal is typing
                        </span>
                        <div className="flex gap-1">
                          <motion.div animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut", delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-[#c9a78a]"></motion.div>
                          <motion.div animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut", delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-[#c9a78a]"></motion.div>
                          <motion.div animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut", delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-[#c9a78a]"></motion.div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* Auto Scroll Anchor */}
            <div ref={messagesEndRef} className="h-2" />
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 md:p-6 bg-transparent border-t border-[#e5e5e0]">
          <div className="max-w-3xl mx-auto w-full">
            <form onSubmit={handleSubmit} className="relative bg-transparent border border-[#e5e5e0] rounded-3xl p-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 focus-within:shadow-[0_8px_30px_rgba(201,167,138,0.15)] focus-within:border-[#c9a78a] flex flex-col focus-within:-translate-y-1">
              
              <AnimatePresence>
                {imagePreview && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    className="flex items-center gap-3 px-4 pt-3 pb-1"
                  >
                    <div className="relative group shadow-sm transition-transform hover:scale-105">
                      <img src={imagePreview} alt="Preview" className="h-[88px] w-[88px] object-cover rounded-2xl border border-gray-100 shadow-sm" />
                      <motion.button 
                        type="button" 
                        onClick={removeImage}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }} 
                        className="absolute -top-2 -right-2 bg-transparent border border-gray-200 hover:border-[#2C2724] hover:text-[#2C2724] p-1.5 rounded-full text-gray-500 shadow-md transition-colors"
                      >
                        <X size={14} strokeWidth={2.5}/>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="flex items-end gap-2 px-2 py-1">
                <label className="p-3 bg-transparent text-[#a48466] hover:text-[#2C2724] hover:bg-[#f0eee4] rounded-full cursor-pointer transition-all mb-1 group shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                  <Paperclip size={20} className="stroke-[2] group-hover:scale-110 transition-transform" />
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/webp" 
                    className="hidden"
                    onChange={handleImageChange}
                    ref={fileInputRef}
                  />
                </label>
                
                <textarea 
                  className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none text-[#2C2724] text-[15px] md:text-base placeholder-[#8b8b82] focus:outline-none focus:ring-0 resize-none py-3 px-2 font-medium"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your style, or ask for an outfit..."
                  rows={1}
                />
                
                <motion.button 
                  type="submit" 
                  disabled={isLoading || (!input.trim() && !imageFile)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mb-1 p-3 ml-2 rounded-full bg-[#2C2724] text-white disabled:bg-[#f0eee4] disabled:text-[#a0a09a] shadow-md flex items-center justify-center hover:shadow-[0_4px_15px_rgba(44,39,36,0.25)] transition-all duration-300 disabled:shadow-none"
                >
                  <Send size={18} className="translate-x-[1px] translate-y-[-1px] stroke-[2.5]" />
                </motion.button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <AnimatePresence>
        {messages.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            className={`
              w-full lg:w-[450px] border-l border-gray-200 overflow-y-auto bg-transparent flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.03)]
              fixed inset-0 z-50 lg:static lg:z-30 lg:flex
              ${showLookbookMobile ? 'flex' : 'hidden'}
            `}
          >
            <div className="p-6 border-b border-gray-100 bg-transparent backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2 text-[#2C2724]">
                  <Sparkles size={18} className="text-[#c9a78a]" />
                  Your Lookbook
                </h2>
                <p className="text-[11px] text-[#a48466] mt-1 uppercase tracking-wider font-bold">Recommendations</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-transparent text-[#8b6f56] px-3 py-1 rounded-full text-[11px] font-bold border border-[#e5e5e0] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                  {itemCount} Items
                </div>
                <button 
                  onClick={() => setShowLookbookMobile(false)}
                  className="lg:hidden p-2 bg-[#f0eee4] text-[#2C2724] rounded-full shadow-sm hover:bg-[#e5e5e0] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 p-6 flex flex-col gap-8 custom-scrollbar">
              
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full w-full opacity-50 py-20 text-center">
                  <div className="mb-4">
                    <Sparkles size={32} className="text-[#c9a78a] animate-pulse" />
                  </div>
                  <p className="text-[#2C2724] font-medium text-lg">Loading Outfit Pal...</p>
                </div>
              ) : (!outfits || outfits.length === 0) ? (
                <div className="flex flex-col items-center justify-center h-full w-full opacity-50 py-20 text-center">
                  <ImageIcon size={48} className="text-[#c9a78a] mb-4" />
                  <p className="text-[#2C2724] font-medium text-lg">No outfits structured yet</p>
                  <p className="text-[#8b6f56] text-sm">Describe your ideal occasion or style.</p>
                </div>
              ) : (
                <div className="space-y-8 pb-10 flex flex-col items-center">
                  
                  {/* Score Header */}
                  {outfitMeta && outfitMeta.score > 0 && index < outfits.length && (
                    <div className="flex flex-col gap-4 mb-2 w-full max-w-sm">
                      <div className="flex items-center gap-5 pb-2">
                         <div className="w-14 h-14 shrink-0 rounded-full bg-gradient-to-tr from-[#2C2724] to-[#4a423a] text-[#FAF9F6] flex items-center justify-center font-bold text-xl shadow-lg ring-4 ring-[#f0eee4]">
                            {outfits[index]?.score || outfitMeta.score}
                         </div>
                         <div>
                            <h3 className="text-lg font-bold text-[#2C2724] leading-tight">Style Score</h3>
                            {outfitMeta.breakdown && (
                              <p className="text-[11px] text-[#8b6f56] uppercase tracking-wider font-semibold mt-1 flex gap-2 flex-wrap items-center">
                                 <span className="bg-[#f0eee4] px-2 py-0.5 rounded-md border border-[#e5e5e0]">Option {index + 1} of {outfits.length}</span>
                                 {outfits[index]?.visualTag && (
                                   <span className="bg-[#2C2724] text-white px-2 py-0.5 rounded-md border border-[#2C2724] flex items-center gap-1">
                                     <Sparkles size={10} className="text-[#c9a78a]"/>
                                     {outfits[index].visualTag}
                                   </span>
                                 )}
                              </p>
                            )}
                         </div>
                      </div>
                    </div>
                  )}

                  {/* Swipe Card Area */}
                  {index < outfits.length ? (
                    <div className="w-full pb-6">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: 50, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: -50, scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        >
                          <SwipeCard
                            outfit={outfits[index].outfit}
                            onLike={handleLike}
                            onDislike={handleDislike}
                            onSave={handleSave}
                          />
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-transparent rounded-3xl border border-[#e5e5e0] shadow-sm w-full max-w-sm mx-auto p-6">
                      <Sparkles size={40} className="text-[#c9a78a] mb-4" />
                      <h2 className="text-xl font-bold mb-2">All caught up!</h2>
                      <p className="text-sm text-[#8b6f56] mb-6">You've swiped through all recommended options.</p>
                      
                      <div className="flex gap-3">
                        <Link href="/saved" className="px-5 py-2.5 rounded-full bg-[#f0eee4] text-[#2C2724] text-[13px] font-semibold transition-colors hover:bg-[#e5e5e0]">
                          View Saved
                        </Link>
                        <button onClick={handleRegenerate} className="px-5 py-2.5 rounded-full bg-[#2C2724] text-white text-[13px] font-semibold transition-colors hover:bg-[#4a423a]">
                          Regenerate
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Regenerate Button (if still swiping) */}
                  {index < outfits.length && (
                    <div className="pt-4 pb-4 flex justify-center w-full">
                      <motion.button
                        onClick={handleRegenerate}
                        whileHover={{ scale: 1.03, boxShadow: "0px 10px 25px rgba(201,167,138,0.2)" }}
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-transparent border border-[#e5e5e0] text-[#2C2724] font-semibold text-sm shadow-[0_4px_15px_rgba(0,0,0,0.04)] hover:border-[#c9a78a] transition-all group"
                      >
                        <Sparkles size={16} className="text-[#a48466] group-hover:text-[#c9a78a] transition-colors" />
                        Regenerate Options
                      </motion.button>
                    </div>
                  )}
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
