import React, { useState } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, TrendingDown, Scale, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Landing({ setCurrentPage }) {
  // Demo calculator states
  const [opt1Price, setOpt1Price] = useState(150);
  const [opt1Qty, setOpt1Qty] = useState(300);
  const [opt2Price, setOpt2Price] = useState(250);
  const [opt2Qty, setOpt2Qty] = useState(500);
  const [bogo, setBogo] = useState(true);

  // Calculations
  const unitPrice1 = opt1Price / opt1Qty;
  const unitPrice2 = bogo ? (opt2Price / (opt2Qty * 2)) : (opt2Price / opt2Qty);
  const savings = Math.max(0, (unitPrice1 - unitPrice2) * opt2Qty * (bogo ? 2 : 1));
  const is2Better = unitPrice2 < unitPrice1;

  return (
    <div className="min-h-screen bg-darkBg text-slate-100 flex flex-col relative overflow-hidden select-none">
      {/* Background glow meshes */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/10 blur-[120px] pointer-events-none" />

      {/* Landing Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 shadow-glow-purple flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-wide text-white">Smart Shopper</span>
        </div>
        <button
          onClick={() => setCurrentPage('dashboard')}
          className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-medium transition-all duration-300 shadow-glass"
        >
          Launch Console
        </button>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto w-full px-6 flex-1 flex flex-col lg:flex-row items-center gap-12 py-16 z-10">
        
        {/* Left Column: Hero Text */}
        <div className="flex-1 space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen AI Shopping Assistant
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-none text-white">
            Shop Smarter.<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-500">
              Spend Better.
            </span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-xl leading-relaxed mx-auto lg:mx-0">
            An AI-powered shopping companion that helps you plan purchases, detect the best deals, split-test combo packs, and control impulse spending with high-fidelity live tracking.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-bold shadow-glow-purple hover:shadow-glow-cyan flex items-center justify-center gap-2 transition-all duration-300 scale-100 hover:scale-[1.02]"
            >
              Get Started Free <ArrowRight className="w-5 h-5 text-black" />
            </button>
            <a
              href="#interactive-demo"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/3 border border-white/8 hover:bg-white/8 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-300"
            >
              Try Interactive Calculator
            </a>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/5 max-w-md mx-auto lg:mx-0">
            <div>
              <div className="text-2xl font-bold text-white">18.4%</div>
              <div className="text-xs text-slate-500">Average Savings</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">82%</div>
              <div className="text-xs text-slate-500">Budget Accuracy</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">4.8★</div>
              <div className="text-xs text-slate-500">User Rating</div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Demo Widget */}
        <div id="interactive-demo" className="flex-1 w-full max-w-xl">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-glass relative glow-purple">
            {/* Glossy top dot */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-400/20 text-cyan-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">
              Live Price Audit
            </div>

            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Scale className="w-5 h-5 text-cyan-400" /> BOGO Pricing Split-Tester
            </h3>

            <div className="space-y-6">
              {/* Product Option A */}
              <div className="p-4 rounded-2xl bg-white/2 border border-white/5">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Brand Option 1 (Standard Pack)</span>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="text-[11px] text-slate-400">Price (₹)</label>
                    <input 
                      type="number" 
                      value={opt1Price} 
                      onChange={(e) => setOpt1Price(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400">Quantity (ml or g)</label>
                    <input 
                      type="number" 
                      value={opt1Qty} 
                      onChange={(e) => setOpt1Qty(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white mt-1"
                    />
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  Effective price per unit: <strong className="text-slate-300">₹{unitPrice1.toFixed(3)}/unit</strong>
                </div>
              </div>

              {/* Product Option B */}
              <div className="p-4 rounded-2xl bg-white/2 border border-white/5 relative">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Brand Option 2 (BOGO Deal Pack)</span>
                
                {/* BOGO toggle switch */}
                <button
                  onClick={() => setBogo(!bogo)}
                  className={`absolute right-4 top-4 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                    bogo ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-white/5 text-slate-400 border-white/10'
                  }`}
                >
                  {bogo ? "BOGO ACTIVE" : "NORMAL PRICE"}
                </button>

                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="text-[11px] text-slate-400">Price (₹)</label>
                    <input 
                      type="number" 
                      value={opt2Price} 
                      onChange={(e) => setOpt2Price(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400">Quantity (ml or g)</label>
                    <input 
                      type="number" 
                      value={opt2Qty} 
                      onChange={(e) => setOpt2Qty(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white mt-1"
                    />
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  Effective price per unit: <strong className="text-slate-300">₹{unitPrice2.toFixed(3)}/unit</strong>
                </div>
              </div>

              {/* Recommendation Screen */}
              <div className={`p-5 rounded-2xl border transition-all ${
                is2Better 
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 shadow-glow-green' 
                  : 'bg-indigo-500/5 border-indigo-500/20 text-indigo-400 shadow-glow-purple'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/5">
                    {is2Better ? <TrendingDown className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      AI Price Verdict: {is2Better ? "Brand Option 2 is a STEAL!" : "Brand Option 1 is better value"}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {is2Better 
                        ? `Option 2 saves you ₹${savings.toFixed(2)} on this volume. The BOGO makes it cheaper per unit.`
                        : `Option 2 BOGO is a trick! It is still more expensive than Option 1 per unit.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Start Session CTA */}
              <button 
                onClick={() => setCurrentPage('dashboard')}
                className="w-full py-3.5 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4 text-black" /> Run Session price tests
              </button>

            </div>
          </div>
        </div>

      </main>

      {/* Feature grid */}
      <section className="bg-slateBg/50 border-t border-white/5 py-20 z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-white/2 border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-white">Advanced Price Auditing</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Scan, input, and normalize product specs instantly. Handles grams, kilograms, fluid ounces, packs, and liters with ease.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/2 border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-white">Combo Optimizations</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Is the prepacked bundle really a deal? We compare bundled packages against selecting separate items individually.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/2 border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-white">Impulse Spent Alarm</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Track unplanned grocery items inside the Live Monitor. Automatically detects overspending and rings alerts dynamically.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-500 z-10">
        © 2026 Smart Shopper Technologies. All rights reserved. Created for premium shopping tracking.
      </footer>
    </div>
  );
}
