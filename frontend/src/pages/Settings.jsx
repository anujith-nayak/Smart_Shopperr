import React, { useState } from 'react';
import { Sparkles, Shield, User, Wallet, Bell, RotateCcw, AlertTriangle } from 'lucide-react';

export default function Settings() {
  const [userName, setUserName] = useState('Anujith S.');
  const [monthlyLimit, setMonthlyLimit] = useState('6000');
  const [impulseThreshold, setImpulseThreshold] = useState('10'); // 10% of budget
  const [notifications, setNotifications] = useState(true);

  const handleResetDb = async () => {
    if (confirm("Are you sure you want to reset all sessions and history database?")) {
      try {
        await fetch('http://localhost:8000/api/dev/seed', { method: 'POST' });
        alert("Database successfully reset and re-seeded with demo records.");
        window.location.reload();
      } catch (error) {
        console.error("Database reset error:", error);
      }
    }
  };

  return (
    <div className="space-y-8 pb-12 select-none">
      
      {/* Title */}
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Settings & Profile</h2>
        <p className="text-slate-400 text-sm mt-0.5">Manage budget limits, custom warnings triggers, and user preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* User profile card */}
          <div className="glass-panel rounded-3xl p-6 shadow-glass relative overflow-hidden">
            <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" /> Shopping Profile
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1.5">Profile Nickname</label>
                <input 
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full glass-input px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1.5">Currency Locale</label>
                <input 
                  type="text" 
                  value="INR (₹)" 
                  disabled 
                  className="w-full bg-white/2 border border-white/5 opacity-55 text-slate-500 rounded-xl px-3.5 py-2 text-sm cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Budget Limits card */}
          <div className="glass-panel rounded-3xl p-6 shadow-glass">
            <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-cyan-400" /> Default Targets
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1.5">Monthly Ceiling Target (₹)</label>
                <input 
                  type="number"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  className="w-full glass-input px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1.5">Impulse Alert Ceiling (% of session budget)</label>
                <input 
                  type="number"
                  value={impulseThreshold}
                  onChange={(e) => setImpulseThreshold(e.target.value)}
                  className="w-full glass-input px-3.5 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Alarm Notifications configurations */}
          <div className="glass-panel rounded-3xl p-6 shadow-glass">
            <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-cyan-400" /> Alert Alarms
            </h3>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/2 border border-white/5">
              <div>
                <h4 className="text-xs font-bold text-white">Live Monitor budget warning sound</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Toggle alert panels when spending crosses 90% target limit.</p>
              </div>
              
              <button
                onClick={() => setNotifications(!notifications)}
                className={`w-12 h-6 rounded-full p-1 transition-all ${
                  notifications ? 'bg-cyan-500' : 'bg-slate-900 border border-white/10'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-black transition-all ${
                  notifications ? 'translate-x-6 bg-black' : 'translate-x-0 bg-slate-500'
                }`} />
              </button>
            </div>
          </div>

        </div>

        {/* Administration & Developer console */}
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 shadow-glass border-red-500/10">
            <h3 className="text-md font-bold text-red-400 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Danger Zone
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Use these options to wipe transaction tables, reset demo items, or delete SQLite records.
            </p>

            <button
              onClick={handleResetDb}
              className="w-full py-3 bg-red-950/20 hover:bg-red-900/30 border border-red-900/40 hover:border-red-500/30 text-red-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-glass"
            >
              <RotateCcw className="w-4 h-4" /> Reset database
            </button>
          </div>

          <div className="p-5 rounded-3xl bg-indigo-950/10 border border-indigo-900/30 flex items-start gap-3 shadow-glass">
            <Shield className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-400 leading-relaxed font-sans">
              <strong>Security Protocol:</strong> Smart Shopper saves records locally in `shopping.db` using SQLite. All price logs remain completely private to your host environment.
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
