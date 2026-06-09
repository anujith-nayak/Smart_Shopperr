import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowLeftRight, Plus, Trash2, Award, Info, Scale, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

export default function Comparison({ activeSession }) {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [sessionItems, setSessionItems] = useState([]);
  const [options, setOptions] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Add Option Form states
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('g');
  const [offerType, setOfferType] = useState('normal');
  const [discountPct, setDiscountPct] = useState('0');
  const [addingOption, setAddingOption] = useState(false);

  // Active Tab: compare or combo
  const [activeSubTab, setActiveSubTab] = useState('compare');

  // Combo Optimizer States
  const [comboName, setComboName] = useState('Hygiene Combo');
  const [comboPrice, setComboPrice] = useState('650');
  
  // Combo items input lists
  const [comboItems, setComboItems] = useState([
    { name: 'Shampoo', quantity: 200, unit: 'ml' },
    { name: 'Bodywash', quantity: 150, unit: 'ml' },
    { name: 'Facewash', quantity: 100, unit: 'ml' }
  ]);
  const [newComboItemName, setNewComboItemName] = useState('');
  const [newComboItemQty, setNewComboItemQty] = useState('100');
  const [newComboItemUnit, setNewComboItemUnit] = useState('ml');

  const [comboResult, setComboResult] = useState(null);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    if (activeSession) {
      fetchSessionItems();
    }
  }, [activeSession]);

  useEffect(() => {
    if (selectedItemId) {
      fetchProductOptions();
    } else {
      setOptions([]);
    }
  }, [selectedItemId]);

  const fetchSessionItems = async () => {
    setLoadingItems(true);
    try {
      const response = await fetch(`http://localhost:8000/api/sessions/${activeSession.id}`);
      const data = await response.json();
      setSessionItems(data.items || []);
      if (data.items && data.items.length > 0) {
        setSelectedItemId(data.items[0].id.toString());
      }
    } catch (error) {
      console.error("Error fetching session items:", error);
    } finally {
      setLoadingItems(false);
    }
  };

  const fetchProductOptions = async () => {
    setLoadingOptions(true);
    try {
      const response = await fetch(`http://localhost:8000/api/sessions/${activeSession.id}`);
      const data = await response.json();
      const currentItem = data.items.find(i => i.id.toString() === selectedItemId);
      if (currentItem) {
        // Sort options by ranking
        setOptions(currentItem.options.sort((a,b) => a.ranking - b.ranking) || []);
      }
    } catch (error) {
      console.error("Error fetching options:", error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleAddOption = async (e) => {
    e.preventDefault();
    if (!selectedItemId || !brand.trim() || !price || !quantity) return;

    setAddingOption(true);
    try {
      const response = await fetch(`http://localhost:8000/api/items/${selectedItemId}/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: brand,
          name: name || `${brand} Pack`,
          price: parseFloat(price),
          quantity: parseFloat(quantity),
          unit: unit,
          offer_type: offerType,
          discount_pct: offerType === 'discount' ? parseFloat(discountPct) : 0.0
        })
      });
      
      // Clear inputs
      setBrand('');
      setName('');
      setPrice('');
      setQuantity('');
      setDiscountPct('0');
      
      // Refresh options
      await fetchProductOptions();
    } catch (error) {
      console.error("Error adding option:", error);
    } finally {
      setAddingOption(false);
    }
  };

  const handleDeleteOption = async (optionId) => {
    try {
      await fetch(`http://localhost:8000/api/options/${optionId}`, { method: 'DELETE' });
      await fetchProductOptions();
    } catch (error) {
      console.error("Error deleting option:", error);
    }
  };

  // Run Combo optimization comparison
  const handleOptimizeCombo = async () => {
    setOptimizing(true);
    
    // Build separate mock options for items to evaluate unit values
    const payload = {
      combo_price: parseFloat(comboPrice),
      combo_items: comboItems,
      separate_options: {
        "Shampoo": [
          { brand: "Dove", price: 180, quantity: 200, unit: "ml", offer_type: "normal" },
          { brand: "Pantene", price: 200, quantity: 200, unit: "ml", offer_type: "bogo" }
        ],
        "Bodywash": [
          { brand: "Nivea", price: 220, quantity: 250, unit: "ml", offer_type: "normal" },
          { brand: "Fiama", price: 190, quantity: 200, unit: "ml", offer_type: "normal" }
        ],
        "Facewash": [
          { brand: "Himalaya", price: 150, quantity: 100, unit: "ml", offer_type: "normal" },
          { brand: "CleanClear", price: 140, quantity: 100, unit: "ml", offer_type: "normal" }
        ]
      }
    };

    try {
      const response = await fetch('http://localhost:8000/api/combos/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      setComboResult(data);
    } catch (error) {
      console.error("Error optimizing combo:", error);
    } finally {
      setOptimizing(false);
    }
  };

  const addComboItem = () => {
    if (!newComboItemName.trim()) return;
    setComboItems(prev => [...prev, {
      name: newComboItemName,
      quantity: parseFloat(newComboItemQty),
      unit: newComboItemUnit
    }]);
    setNewComboItemName('');
  };

  const removeComboItem = (index) => {
    setComboItems(prev => prev.filter((_, i) => i !== index));
  };

  if (!activeSession) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-center p-8 space-y-4 select-none">
        <div className="w-12 h-12 rounded-2xl bg-white/2 border border-white/5 flex items-center justify-center">
          <ArrowLeftRight className="w-6 h-6 text-slate-500" />
        </div>
        <h4 className="text-md font-semibold text-white">No active shopping session found</h4>
        <p className="text-xs text-slate-400 max-w-sm">
          You must create a session and add planned items first before running price comparisons.
        </p>
      </div>
    );
  }

  const units = ["g", "kg", "ml", "L", "unit", "pack"];
  const offerTypes = [
    { value: 'normal', label: 'Normal Price' },
    { value: 'bogo', label: 'Buy 1 Get 1 (BOGO)' },
    { value: 'discount', label: 'Discount Percentage' }
  ];

  return (
    <div className="space-y-8 pb-12 select-none">
      
      {/* Tab Switcher Headers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Product Comparison Engine</h2>
          <p className="text-slate-400 text-sm mt-0.5">Determine the true cost per gram/milliliter and filter out deceptive packaging.</p>
        </div>
        
        {/* Toggle subtabs */}
        <div className="p-1 rounded-xl bg-white/2 border border-white/5 flex items-center gap-1.5 self-start">
          <button
            onClick={() => setActiveSubTab('compare')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'compare' ? 'bg-cyan-500 text-black shadow-glow-cyan' : 'text-slate-400 hover:text-white'
            }`}
          >
            Brand Comparator
          </button>
          <button
            onClick={() => {
              setActiveSubTab('combo');
              handleOptimizeCombo();
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'combo' ? 'bg-cyan-500 text-black shadow-glow-cyan' : 'text-slate-400 hover:text-white'
            }`}
          >
            Combo Optimizer
          </button>
        </div>
      </div>

      {activeSubTab === 'compare' ? (
        /* Brand Comparator Tab */
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Add Option Form Column */}
          <div className="space-y-6">
            <div className="glass-panel rounded-3xl p-6 shadow-glass relative">
              <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" /> Add Brand Option
              </h3>

              {sessionItems.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-6">
                  Please add items in the planner first.
                </div>
              ) : (
                <form onSubmit={handleAddOption} className="space-y-4">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1.5">Select Planned Item</label>
                    <select
                      value={selectedItemId}
                      onChange={(e) => setSelectedItemId(e.target.value)}
                      className="w-full bg-slateBg border border-white/8 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      {sessionItems.map(item => (
                        <option key={item.id} value={item.id}>{item.name} ({item.category})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1.5">Brand Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Dove, Britannia"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        required
                        className="w-full glass-input px-3.5 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1.5">Description (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Tube, Twin Pack"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full glass-input px-3.5 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="text-[11px] text-slate-400 block mb-1.5">Quantity / Vol</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="250"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        required
                        className="w-full glass-input px-3.5 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1.5">Unit</label>
                      <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-full bg-slateBg border border-white/8 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500"
                      >
                        {units.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1.5">Offer / Deal Class</label>
                    <select
                      value={offerType}
                      onChange={(e) => setOfferType(e.target.value)}
                      className="w-full bg-slateBg border border-white/8 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
                    >
                      {offerTypes.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                  {offerType === 'discount' && (
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1.5">Discount Percentage (%)</label>
                      <input
                        type="number"
                        placeholder="10"
                        value={discountPct}
                        onChange={(e) => setDiscountPct(e.target.value)}
                        className="w-full glass-input px-3.5 py-2 text-sm"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1.5">Sticker Price (₹)</label>
                    <input
                      type="number"
                      placeholder="180"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                      className="w-full glass-input px-3.5 py-2 text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={addingOption}
                    className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
                  >
                    {addingOption ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Plus className="w-4 h-4 text-black" />} Compare Option
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Comparison Matrix Column */}
          <div className="xl:col-span-2 glass-panel rounded-3xl p-6 shadow-glass flex flex-col min-h-[400px]">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Scale className="w-5 h-5 text-cyan-400" /> True Cost Comparison Matrix
            </h3>

            {loadingOptions ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              </div>
            ) : options.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-20 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-white/2 border border-white/5 flex items-center justify-center text-slate-500">
                  <Info className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white font-sans">No options added yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Fill out the form on the left to add different packaging sizes or brand offerings for this item.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] uppercase text-slate-400 tracking-wider">
                      <th className="pb-3 pl-4 font-semibold">Rank</th>
                      <th className="pb-3 font-semibold">Brand / Package</th>
                      <th className="pb-3 font-semibold">Price</th>
                      <th className="pb-3 font-semibold">Size</th>
                      <th className="pb-3 font-semibold">Unit Price</th>
                      <th className="pb-3 font-semibold">AI Recommendation</th>
                      <th className="pb-3 text-right pr-4 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/2 text-xs">
                    {options.map((opt) => {
                      const isBest = opt.label === "Best Deal";
                      const isSmart = opt.label === "Smart Buy";
                      const isOverpriced = opt.label === "Overpriced";
                      
                      return (
                        <tr key={opt.id} className="hover:bg-white/2 transition-colors">
                          <td className="py-4 pl-4 font-bold">
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                              isBest 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-white/3 border border-white/5 text-slate-400'
                            }`}>
                              {opt.ranking}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className="font-bold text-white block">{opt.brand}</span>
                            <span className="text-[10px] text-slate-400">{opt.name}</span>
                          </td>
                          <td className="py-4 font-semibold text-white">₹{opt.price}</td>
                          <td className="py-4 text-slate-300">
                            {opt.quantity} {opt.unit}
                            {opt.offer_type !== 'normal' && (
                              <span className="px-1.5 py-0.5 text-[8px] bg-slate-900 text-indigo-400 font-bold uppercase rounded border border-indigo-900/30 ml-2">
                                {opt.offer_type}
                              </span>
                            )}
                          </td>
                          <td className="py-4 font-bold text-cyan-400">
                            ₹{opt.effective_price_per_unit.toFixed(4)}
                            <span className="text-[8px] text-slate-500 font-normal">/{opt.unit}</span>
                          </td>
                          <td className="py-4 max-w-[200px]">
                            {/* Label Badge */}
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border mb-1.5 ${
                              isBest 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-glow-green' 
                                : isSmart 
                                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-glow-purple'
                                  : isOverpriced
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-glow-purple'
                                    : 'bg-white/5 text-slate-300 border-white/10'
                            }`}>
                              {opt.label}
                            </span>
                            <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">{opt.reason}</p>
                          </td>
                          <td className="py-4 text-right pr-4">
                            <button
                              onClick={() => handleDeleteOption(opt.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Combo Optimizer Tab */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Combo Specs Form */}
          <div className="space-y-6">
            <div className="glass-panel rounded-3xl p-6 shadow-glass">
              <h3 className="text-md font-bold text-white mb-4">Combo Description</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1.5">Combo Name</label>
                  <input
                    type="text"
                    value={comboName}
                    onChange={(e) => setComboName(e.target.value)}
                    className="w-full glass-input px-3.5 py-2 text-sm text-white font-sans"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1.5">Sticker Price (₹)</label>
                  <input
                    type="number"
                    value={comboPrice}
                    onChange={(e) => setComboPrice(e.target.value)}
                    className="w-full glass-input px-3.5 py-2 text-sm text-white font-sans"
                  />
                </div>

                {/* List of combo elements */}
                <div className="border-t border-white/5 pt-4">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2">Package Contents</label>
                  
                  {comboItems.length === 0 ? (
                    <div className="text-xs text-slate-600 py-3 text-center">Empty bundle content.</div>
                  ) : (
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {comboItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/2 border border-white/5 text-xs">
                          <span className="text-white font-bold">{item.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400">{item.quantity} {item.unit}</span>
                            <button 
                              onClick={() => removeComboItem(idx)}
                              className="text-slate-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add new combo item helper */}
                <div className="border-t border-white/5 pt-4 grid grid-cols-3 gap-2">
                  <div className="col-span-3">
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">Add Product Part</label>
                    <input
                      type="text"
                      placeholder="e.g. Facewash"
                      value={newComboItemName}
                      onChange={(e) => setNewComboItemName(e.target.value)}
                      className="w-full bg-white/3 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="100"
                      value={newComboItemQty}
                      onChange={(e) => setNewComboItemQty(e.target.value)}
                      className="w-full bg-white/3 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <select
                      value={newComboItemUnit}
                      onChange={(e) => setNewComboItemUnit(e.target.value)}
                      className="w-full bg-slateBg border border-white/5 rounded-lg px-2 py-1.5 text-xs text-slate-300"
                    >
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                      <option value="unit">unit</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={addComboItem}
                    className="col-span-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[10px] font-bold transition-all border border-white/5"
                  >
                    + Add Content Part
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleOptimizeCombo}
                  disabled={optimizing || comboItems.length === 0}
                  className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-glow-cyan"
                >
                  {optimizing ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Sparkles className="w-4 h-4 text-black" />} Compare Bundle Value
                </button>
              </div>
            </div>
          </div>

          {/* Optimization Verdict Column */}
          <div className="lg:col-span-2 space-y-6">
            {comboResult ? (
              <>
                {/* Visual Recommendation Banner */}
                <div className={`p-6 rounded-3xl border ${
                  comboResult.recommend_combo 
                    ? 'bg-emerald-500/5 border-emerald-500/20 shadow-glow-green text-emerald-400' 
                    : 'bg-amber-500/5 border-amber-500/20 shadow-glow-purple text-amber-400'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-white/5">
                      {comboResult.recommend_combo ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">AI Combo Recommendation</h4>
                      <p className="text-sm mt-1 text-slate-300">{comboResult.recommendation}</p>
                      <div className="mt-4 flex flex-wrap gap-6 text-xs text-slate-400">
                        <div>Combo Price: <strong className="text-white">₹{comboResult.combo_price}</strong></div>
                        <div>Separate Buy Cost: <strong className="text-white">₹{comboResult.total_individual_cost}</strong></div>
                        <div>Net Savings: <strong className="text-emerald-400">₹{comboResult.savings}</strong></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Comparison breakdown table */}
                <div className="glass-panel rounded-3xl p-6 shadow-glass">
                  <h4 className="text-md font-bold text-white mb-4">Content Price Splitting</h4>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-[9px] uppercase text-slate-500 tracking-wider">
                          <th className="pb-3 pl-2 font-bold">Item Name</th>
                          <th className="pb-3 font-bold">Volume inside Combo</th>
                          <th className="pb-3 font-bold">Best Separate Brand</th>
                          <th className="pb-3 text-right pr-2 font-bold">Equivalent Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/2 text-xs">
                        {comboResult.breakdown.map((item, idx) => (
                          <tr key={idx} className="hover:bg-white/2">
                            <td className="py-3 pl-2 text-white font-bold">{item.name}</td>
                            <td className="py-3 text-slate-300">{item.combo_qty}</td>
                            <td className="py-3 text-cyan-400 font-medium">{item.best_separate_brand}</td>
                            <td className="py-3 text-right pr-2 text-white font-bold">₹{item.equivalent_separate_cost}</td>
                          </tr>
                        ))}
                        <tr className="font-bold border-t border-white/10">
                          <td className="py-4 pl-2 text-slate-400" colSpan="3">Total Separate Buying Price</td>
                          <td className="py-4 text-right pr-2 text-white">₹{comboResult.total_individual_cost}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="glass-panel rounded-3xl p-12 shadow-glass text-center flex flex-col items-center justify-center min-h-[300px] space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-white/2 border border-white/5 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-slate-600 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Split-Test Combo Packs</h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                    Add components of a gift box or value bundle and set its price. We will look up alternative single items to check if buying individually is cheaper.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
