import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, ShieldAlert, Award, Plus, ArrowRight, Play, ShoppingBag, Loader2 } from 'lucide-react';

export default function Dashboard({ setCurrentPage, activeSession, setActiveSession }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    checkActiveSession();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/analytics/dashboard');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      // Mock stats fallback
      setStats({
        total_sessions: 2,
        total_spent: 2290.0,
        total_savings: 330.0,
        budget_accuracy: 82.0,
        impulse_buy_count: 3,
        impulse_buy_spent: 190.0,
        insights: [
          "You spend the most on **Groceries**, which accounts for 58.0% of total purchases.",
          "Impulse purchases represent **8.3%** of your total budget. Keep tracking snack habits.",
          "Opting for recommended brand alternatives saved you a total of **₹330.00** this month.",
          "Excellent shopping discipline! You stay within your target budget **82%** of the time."
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const checkActiveSession = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/sessions');
      const data = await response.json();
      const active = data.find(s => s.status === 'active' || s.status === 'planned');
      if (active) {
        // If there's an active/planned session, set it
        setActiveSession(active);
      }
    } catch (error) {
      console.error("Error checking sessions:", error);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading console details...</p>
        </div>
      </div>
    );
  }

  // Budget Accuracy SVG ring math
  const strokeWidth = 8;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.budget_accuracy / 100) * circumference;

  return (
    <div className="space-y-8 pb-12 select-none">
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">AI Shopping Dashboard</h2>
          <p className="text-slate-400 text-sm mt-0.5">Welcome back, Anujith. Aura has analyzed your shopping patterns.</p>
        </div>
        
        {/* Quick action button */}
        {!activeSession ? (
          <button
            onClick={() => setCurrentPage('planner')}
            className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold flex items-center gap-2 shadow-glow-cyan transition-all scale-100 hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 text-black stroke-[3px]" /> Create Session
          </button>
        ) : (
          <button
            onClick={() => setCurrentPage('monitor')}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold flex items-center gap-2 shadow-glow-purple transition-all scale-100 hover:scale-[1.02]"
          >
            <Play className="w-4 h-4 text-white fill-white" /> Live Monitor
          </button>
        )}
      </div>

      {/* Main Grid: Active Session + Scorecard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Shopping Session Panel */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          {activeSession ? (
            <>
              {/* Floating gradient mesh background */}
              <div className="absolute top-[-50%] right-[-20%] w-[300px] h-[300px] rounded-full bg-violet-950/20 blur-[60px]" />
              
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-cyan-400/20 text-cyan-400 rounded-full uppercase tracking-wider animate-pulse border border-cyan-400/10">
                    Active Session
                  </span>
                  <span className="text-xs text-slate-400">Created {new Date(activeSession.created_at).toLocaleDateString()}</span>
                </div>
                <h3 className="text-xl font-bold text-white mt-4">{activeSession.name}</h3>
                <p className="text-xs text-slate-400 mt-1">Budget limit: <strong>₹{activeSession.budget}</strong></p>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Spent so far</span>
                  <span className="text-2xl font-black text-cyan-400">₹{activeSession.actual_spent}</span>
                </div>
                <button
                  onClick={() => setCurrentPage(activeSession.status === 'active' ? 'monitor' : 'planner')}
                  className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  {activeSession.status === 'active' ? 'Monitor Shopping' : 'Edit Planner List'} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center py-8 flex flex-col items-center justify-center flex-1 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-white/3 border border-white/5 text-slate-500 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-md font-bold text-white">No active shopping session</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Build a structured shopping list, compare brand alternatives, and monitor budgets live.
                  </p>
                </div>
                <button
                  onClick={() => setCurrentPage('planner')}
                  className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-all"
                >
                  Start planning
                </button>
              </div>
            </>
          )}
        </div>

        {/* Budget Accuracy Score ring */}
        <div className="glass-panel rounded-3xl p-6 flex items-center justify-between gap-4 glow-purple">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Shopping Accuracy</span>
            <h3 className="text-3xl font-extrabold text-white">{stats.budget_accuracy}%</h3>
            <p className="text-[11px] text-slate-400 leading-snug">
              Ratio of shopping sessions completed within target budgets.
            </p>
          </div>

          {/* SVG Circular Dial */}
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              {/* Outer Ring */}
              <circle
                cx="56"
                cy="56"
                r={radius}
                className="stroke-slate-900"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Inner Glowing Progress Ring */}
              <circle
                cx="56"
                cy="56"
                r={radius}
                className="stroke-cyan-500 shadow-glow-cyan"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <Award className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
        </div>

      </div>

      {/* Numerical Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Sessions Completed */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <span className="text-xs font-semibold text-slate-400 block">Total Runs</span>
          <div className="text-3xl font-black text-white mt-1.5">{stats.total_sessions}</div>
          <span className="text-[10px] text-cyan-400 font-medium block mt-1">Completed trips</span>
        </div>

        {/* Total Spent */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <span className="text-xs font-semibold text-slate-400 block">Total Spent</span>
          <div className="text-3xl font-black text-white mt-1.5">₹{stats.total_spent}</div>
          <span className="text-[10px] text-slate-500 block mt-1">Historic aggregate</span>
        </div>

        {/* Total Savings */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <span className="text-xs font-semibold text-slate-400 block">Total Savings</span>
          <div className="text-3xl font-black text-emerald-400 mt-1.5">₹{stats.total_savings}</div>
          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5 mt-1">
            <TrendingUp className="w-3.5 h-3.5" /> Brand optimizations
          </span>
        </div>

        {/* Impulse purchases */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <span className="text-xs font-semibold text-slate-400 block">Impulse Spent</span>
          <div className="text-3xl font-black text-violet-400 mt-1.5">₹{stats.impulse_buy_spent}</div>
          <span className="text-[10px] text-violet-400 font-semibold flex items-center gap-0.5 mt-1">
            <ShieldAlert className="w-3.5 h-3.5" /> {stats.impulse_buy_count} unplanned items
          </span>
        </div>

      </div>

      {/* AI Assistant recommendations section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" /> Aura Copilot Real-Time Insights
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.insights.map((insight, index) => (
            <div 
              key={index} 
              className="p-5 rounded-2xl bg-white/2 border border-white/5 hover:border-cyan-500/10 flex items-start gap-4 transition-all duration-300 shadow-glass"
            >
              <div className="w-8 h-8 rounded-lg bg-cyan-950/20 text-cyan-400 border border-cyan-900/30 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-sm text-slate-300 leading-relaxed font-sans" dangerouslySetInnerHTML={{ __html: insight }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
