import React, { useState, useEffect } from 'react';
import { Sparkles, Bot, AlertCircle } from 'lucide-react';
import FloatingNav from './components/FloatingNav';
import AIAssistant from './components/AIAssistant';

// Pages
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Planner from './pages/Planner';
import Comparison from './pages/Comparison';
import LiveMonitor from './pages/LiveMonitor';
import Analytics from './pages/Analytics';
import History from './pages/History';
import Settings from './pages/Settings';

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [activeSession, setActiveSession] = useState(null);
  const [assistantOpen, setAssistantOpen] = useState(false);

  // Initialize and check active session status on load
  useEffect(() => {
    fetchActiveSession();
  }, []);

  const fetchActiveSession = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/sessions');
      const data = await response.json();
      // Find session that is active or planned
      const active = data.find(s => s.status === 'active' || s.status === 'planned');
      if (active) {
        setActiveSession(active);
      }
    } catch (error) {
      console.error("Error connecting to Smart Shopper Backend:", error);
    }
  };

  // Render current tab page helper
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard 
            setCurrentPage={setCurrentPage} 
            activeSession={activeSession} 
            setActiveSession={setActiveSession} 
          />
        );
      case 'planner':
        return (
          <Planner 
            activeSession={activeSession} 
            setActiveSession={setActiveSession} 
            setCurrentPage={setCurrentPage} 
          />
        );
      case 'comparison':
        return <Comparison activeSession={activeSession} />;
      case 'monitor':
        return (
          <LiveMonitor 
            activeSession={activeSession} 
            setActiveSession={setActiveSession} 
            setCurrentPage={setCurrentPage} 
          />
        );
      case 'analytics':
        return <Analytics />;
      case 'history':
        return <History />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <Dashboard 
            setCurrentPage={setCurrentPage} 
            activeSession={activeSession} 
            setActiveSession={setActiveSession} 
          />
        );
    }
  };

  // Landing Page render (independent viewport)
  if (currentPage === 'landing') {
    return <Landing setCurrentPage={setCurrentPage} />;
  }

  return (
    <div className="min-h-screen bg-darkBg text-slate-100 flex font-sans">
      
      {/* Navigation Sidebar */}
      <FloatingNav 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        activeSession={activeSession} 
      />

      {/* Main View Area */}
      <div className="flex-1 md:pl-80 px-4 md:px-8 pt-6 pb-24 md:pb-8 flex flex-col min-h-screen transition-all duration-300">
        
        {/* Top Header Bar */}
        <header className="flex items-center justify-between py-4 mb-8 border-b border-white/5">
          {/* Left space */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-white hidden md:block">Smart Shopper</h1>
            
            {activeSession && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                <AlertCircle className="w-3 h-3" /> Active: {activeSession.name}
              </div>
            )}
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAssistantOpen(true)}
              className="px-4 py-2 rounded-xl bg-cyan-950/20 hover:bg-cyan-900/30 border border-cyan-900/40 hover:border-cyan-500/30 text-cyan-400 font-bold text-xs flex items-center gap-1.5 transition-all shadow-glass"
            >
              <Bot className="w-4 h-4 text-cyan-400 animate-bounce" /> Open Aura AI
            </button>
          </div>
        </header>

        {/* Dynamic page component viewport */}
        <main className="flex-1 max-w-6xl w-full mx-auto">
          {renderPage()}
        </main>
      </div>

      {/* Persistent AI Trigger Button (bottom-right) */}
      <button
        onClick={() => setAssistantOpen(true)}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 shadow-glow-purple hover:shadow-glow-cyan text-white flex items-center justify-center cursor-pointer transition-all duration-300 scale-100 hover:scale-105 z-40"
        title="Ask Aura Assistant"
      >
        <Sparkles className="w-6 h-6 text-white animate-pulse" />
      </button>

      {/* Floating Aura AI Assistant Drawer */}
      <AIAssistant 
        currentPage={currentPage}
        activeSessionId={activeSession?.id}
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
      />

    </div>
  );
}
