import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, X, Bot, User, HelpCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIAssistant({ currentPage, activeSessionId, isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  // Fetch contextual greeting when page changes
  useEffect(() => {
    fetchContextGreeting();
  }, [currentPage, activeSessionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const fetchContextGreeting = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: "__context_init__",
          current_page: currentPage,
          session_id: activeSessionId || null
        })
      });
      const data = await response.json();
      setMessages([
        { sender: 'ai', text: data.reply, timestamp: new Date() }
      ]);
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error("AI Assistant init error:", error);
      setMessages([
        { 
          sender: 'ai', 
          text: "Hi! I'm your Smart Shopper AI. I'm ready to help you analyze deals, plan lists, or detect misleading marketing. Just type a question below!", 
          timestamp: new Date() 
        }
      ]);
      setSuggestions(["Compare a BOGO deal", "Review snack budget", "Combo Optimizer help"]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (textToSend) => {
    const messageText = textToSend || input;
    if (!messageText.trim()) return;

    if (!textToSend) setInput('');
    
    // Add user message
    setMessages(prev => [...prev, { sender: 'user', text: messageText, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          current_page: currentPage,
          session_id: activeSessionId || null
        })
      });
      const data = await response.json();
      
      setMessages(prev => [...prev, { sender: 'ai', text: data.reply, timestamp: new Date() }]);
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error("AI chat error:", error);
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          sender: 'ai', 
          text: "I had a temporary connection issue, but don't worry. I can calculate that a BOGO deal gives you a 50% discount per unit, whereas a 3-for-2 combo saves you 33%. What item sizes would you like me to compare?", 
          timestamp: new Date() 
        }]);
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-45 md:hidden"
          />

          {/* Assistant Sidebar panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] md:w-[480px] bg-slateBg/95 backdrop-blur-xl border-l border-white/5 shadow-glass z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-violet-950/20 to-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 shadow-glow-purple flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div>
                  <h2 className="text-md font-bold text-white flex items-center gap-1.5">
                    Aura Assistant <span className="text-[10px] bg-cyan-500/20 text-cyan-400 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">AI Copilot</span>
                  </h2>
                  <p className="text-[11px] text-slate-400">Contextual savings & offer optimizations</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conversation Flow */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, index) => (
                <div 
                  key={index}
                  className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-glass ${
                    msg.sender === 'user' 
                      ? 'bg-gradient-to-tr from-cyan-500 to-indigo-500 text-white' 
                      : 'bg-white/5 border border-white/10 text-cyan-400'
                  }`}>
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-br from-indigo-650/40 to-cyan-600/20 border border-cyan-500/20 text-white rounded-tr-none'
                        : 'bg-white/3 border border-white/5 text-slate-200 rounded-tl-none shadow-glass'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1 block px-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 max-w-[80%]">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-cyan-400 flex items-center justify-center flex-shrink-0 animate-pulse">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white/3 border border-white/5 text-slate-200 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                    <span className="text-xs text-slate-400 font-sans">Aura is calculating...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions Chips */}
            {suggestions.length > 0 && (
              <div className="px-6 py-2 flex flex-wrap gap-2 bg-slate-950/20 border-t border-white/5">
                {suggestions.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(sug)}
                    className="text-xs text-cyan-400 bg-cyan-950/20 hover:bg-cyan-900/30 border border-cyan-900/40 hover:border-cyan-500/30 px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 max-w-full text-left"
                  >
                    <HelpCircle className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{sug}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className="p-6 border-t border-white/5 bg-slate-950/50">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about brand math, budgets, BOGOs..."
                  className="w-full glass-input py-3 pl-4 pr-12 text-sm text-white placeholder-slate-500 font-sans"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 p-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black transition-all disabled:opacity-50 disabled:hover:bg-cyan-500"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
