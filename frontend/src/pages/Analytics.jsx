import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, BarChart3, PieChart, ShieldAlert, Award, Calendar, Loader2 } from 'lucide-react';

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/analytics/dashboard');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      // Fallback data
      setStats({
        total_sessions: 2,
        total_spent: 2290.0,
        total_savings: 330.0,
        budget_accuracy: 82.0,
        impulse_buy_count: 3,
        impulse_buy_spent: 190.0,
        category_breakdown: [
          { category: "Groceries", amount: 1340.0, percentage: 58.5 },
          { category: "Dairy", amount: 450.0, percentage: 19.6 },
          { category: "Personal Care", amount: 300.0, percentage: 13.1 },
          { category: "Snacks", amount: 140.0, percentage: 6.1 },
          { category: "Beverages", amount: 60.0, percentage: 2.6 }
        ],
        savings_trends: [
          { date: "May 10", budget: 1200, actual: 1050, savings: 150 },
          { date: "May 15", budget: 1500, actual: 1340, savings: 180 },
          { date: "May 25", budget: 1000, actual: 950, savings: 150 }
        ],
        insights: [
          "Snacks and Beverages account for 74% of your total unplanned impulse spend.",
          "You stay within budget 82% of the time, saving an average of ₹165 per trip."
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] select-none">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading analysis charts...</p>
        </div>
      </div>
    );
  }

  // Graph math for SVG Savings Area Graph
  const width = 500;
  const height = 180;
  const padding = 30;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  const points = stats.savings_trends;
  const maxSavings = Math.max(...points.map(p => p.savings), 100);
  
  // Calculate SVG line path points
  const pointsCoords = points.map((p, idx) => {
    const x = padding + (idx / (points.length - 1 || 1)) * chartWidth;
    const y = height - padding - (p.savings / maxSavings) * chartHeight;
    return { x, y, label: p.date, val: p.savings };
  });

  const linePath = pointsCoords.reduce((pathStr, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${pathStr} L ${p.x} ${p.y}`;
  }, "");

  const areaPath = pointsCoords.length > 0 
    ? `${linePath} L ${pointsCoords[pointsCoords.length-1].x} ${height - padding} L ${pointsCoords[0].x} ${height - padding} Z` 
    : "";

  return (
    <div className="space-y-8 pb-12 select-none">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">AI Insights & Analytics</h2>
        <p className="text-slate-400 text-sm mt-0.5">Explore historic spending breakdowns, impulse behaviors, and savings efficiency charts.</p>
      </div>

      {/* Analytics Scoreboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Budget Accuracy */}
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs text-slate-400">Budget Accuracy Score</span>
            <h3 className="text-4xl font-black text-cyan-400 mt-2">{stats.budget_accuracy}%</h3>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Percentage of sessions completed without exceeding set limits. Average baseline is 80%.
          </p>
        </div>

        {/* Impulse Ratio */}
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs text-slate-400">Impulse Buy Ratio</span>
            <h3 className="text-4xl font-black text-violet-400 mt-2">
              {stats.total_spent > 0 ? ((stats.impulse_buy_spent / stats.total_spent) * 100).toFixed(1) : 0}%
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Proportion of budget spent on unplanned items. Lower is better. Target is &lt; 10%.
          </p>
        </div>

        {/* Savings Multiplier */}
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs text-slate-400">Total Savings Captured</span>
            <h3 className="text-4xl font-black text-emerald-400 mt-2">₹{stats.total_savings}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Amount saved by opting for BOGOs, bulk packaging, or combo optimizations.
          </p>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Custom SVG Savings Area Graph */}
        <div className="glass-panel rounded-3xl p-6 shadow-glass flex flex-col justify-between">
          <div>
            <h4 className="text-md font-bold text-white flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-cyan-400" /> Savings Trend Graph
            </h4>
            <p className="text-xs text-slate-400 mb-6">Net money saved across your completed shopping trips.</p>
          </div>

          {pointsCoords.length < 2 ? (
            <div className="h-40 flex items-center justify-center text-xs text-slate-500">
              Complete at least 2 sessions to construct a trend graph.
            </div>
          ) : (
            <div className="relative w-full h-[200px] flex items-center justify-center">
              <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`}>
                {/* Horizontal grid lines */}
                {[0, 0.5, 1].map((ratio, i) => {
                  const y = padding + ratio * chartHeight;
                  return (
                    <line 
                      key={i} 
                      x1={padding} 
                      y1={y} 
                      x2={width - padding} 
                      y2={y} 
                      className="stroke-white/5" 
                      strokeDasharray="4"
                    />
                  );
                })}

                {/* Gradient fill */}
                <defs>
                  <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Area under the line */}
                <path d={areaPath} fill="url(#savingsGrad)" />

                {/* The main line path */}
                <path d={linePath} fill="none" className="stroke-cyan-400" strokeWidth="2.5" />

                {/* Coordinate Dots */}
                {pointsCoords.map((pt, idx) => (
                  <g key={idx}>
                    <circle 
                      cx={pt.x} 
                      cy={pt.y} 
                      r="4.5" 
                      className="fill-cyan-400 stroke-darkBg" 
                      strokeWidth="2" 
                    />
                    <text 
                      x={pt.x} 
                      y={pt.y - 10} 
                      className="fill-cyan-400 font-bold text-[9px]" 
                      textAnchor="middle"
                    >
                      ₹{pt.val}
                    </text>
                    <text 
                      x={pt.x} 
                      y={height - padding + 15} 
                      className="fill-slate-500 text-[8px]" 
                      textAnchor="middle"
                    >
                      {pt.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          )}
        </div>

        {/* Category breakdown bar graph */}
        <div className="glass-panel rounded-3xl p-6 shadow-glass flex flex-col justify-between">
          <div>
            <h4 className="text-md font-bold text-white flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-cyan-400" /> Category Expenditure
            </h4>
            <p className="text-xs text-slate-400 mb-6">Distribution of actual spend across different item classes.</p>
          </div>

          <div className="space-y-4 flex-1 justify-center flex flex-col">
            {stats.category_breakdown.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-8">No category details found.</div>
            ) : (
              stats.category_breakdown.map((cat, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold">{cat.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">₹{cat.amount}</span>
                      <span className="text-slate-500 text-[10px] font-normal">({cat.percentage}%)</span>
                    </div>
                  </div>
                  {/* Progress bar scale */}
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Impulse details panel */}
      <div className="glass-panel rounded-3xl p-6 shadow-glass flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] rounded-full bg-violet-900/10 blur-[60px]" />
        
        <div className="w-14 h-14 rounded-2xl bg-violet-950/20 text-violet-400 border border-violet-900/30 flex items-center justify-center flex-shrink-0 shadow-glass">
          <ShieldAlert className="w-7 h-7" />
        </div>
        
        <div className="space-y-1 flex-1">
          <h4 className="text-md font-bold text-white">Impulse Spends Autopsy</h4>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
            Unplanned purchases accounted for <strong>₹{stats.impulse_buy_spent}</strong> of your budget across completed sessions. Snacks & Beverages represent the largest impulse leak. Consider logging snack budgets 10% higher in your next session to stay inside target rings.
          </p>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Impulse Count</span>
            <span className="text-2xl font-black text-violet-400">{stats.impulse_buy_count} items</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Average Leak</span>
            <span className="text-2xl font-black text-white">
              ₹{stats.total_sessions > 0 ? (stats.impulse_buy_spent / stats.total_sessions).toFixed(2) : 0}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
