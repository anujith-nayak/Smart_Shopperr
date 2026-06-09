import React, { useState, useEffect } from 'react';
import { Sparkles, Check, Plus, AlertCircle, ShoppingCart, ShoppingBag, ShieldAlert, Award, X, Loader2 } from 'lucide-react';

export default function LiveMonitor({ activeSession, setActiveSession, setCurrentPage }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionDetails, setSessionDetails] = useState(null);

  // Price Logging Modal states
  const [logItemModal, setLogItemModal] = useState(null); // active item to log price
  const [actualPrice, setActualPrice] = useState('');
  
  // Unplanned Buy form states
  const [showUnplannedModal, setShowUnplannedModal] = useState(false);
  const [unplannedName, setUnplannedName] = useState('');
  const [unplannedPrice, setUnplannedPrice] = useState('');
  const [unplannedCategory, setUnplannedCategory] = useState('Snacks');
  const [unplannedQty, setUnplannedQty] = useState('1');
  const [unplannedUnit, setUnplannedUnit] = useState('unit');
  const [addingUnplanned, setAddingUnplanned] = useState(false);

  useEffect(() => {
    if (activeSession) {
      fetchSessionDetails();
    }
  }, [activeSession]);

  const fetchSessionDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/sessions/${activeSession.id}`);
      const data = await response.json();
      setSessionDetails(data);
      setItems(data.items || []);
    } catch (error) {
      console.error("Error fetching session details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCheck = (item) => {
    if (item.is_purchased) {
      // Toggle off purchase
      updateItemStatus(item.id, false, 0.0);
    } else {
      // Open modal to log actual price
      setLogItemModal(item);
      setActualPrice(item.planned_price ? item.planned_price.toString() : '');
    }
  };

  const updateItemStatus = async (itemId, isPurchased, priceVal) => {
    try {
      const response = await fetch(`http://localhost:8000/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_purchased: isPurchased,
          actual_price: priceVal
        })
      });
      const updatedItem = await response.json();
      setItems(prev => prev.map(it => it.id === itemId ? updatedItem : it));
      
      // Update session totals locally
      fetchSessionDetails();
    } catch (error) {
      console.error("Error updating item status:", error);
    } finally {
      setLogItemModal(null);
    }
  };

  const handleAddUnplannedItem = async (e) => {
    e.preventDefault();
    if (!unplannedName.trim() || !unplannedPrice || !activeSession) return;

    setAddingUnplanned(true);
    try {
      // 1. Create item as unplanned
      const itemRes = await fetch(`http://localhost:8000/api/sessions/${activeSession.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: unplannedName,
          category: unplannedCategory,
          planned_quantity: parseFloat(unplannedQty),
          planned_unit: unplannedUnit,
          planned_price: parseFloat(unplannedPrice),
          is_unplanned: true
        })
      });
      const newItem = await itemRes.json();

      // 2. Immediately mark as purchased with actual price
      const response = await fetch(`http://localhost:8000/api/items/${newItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_purchased: true,
          actual_price: parseFloat(unplannedPrice)
        })
      });
      const purchasedItem = await response.json();

      setItems(prev => [...prev, purchasedItem]);
      setUnplannedName('');
      setUnplannedPrice('');
      setShowUnplannedModal(false);

      // Refresh totals
      fetchSessionDetails();
    } catch (error) {
      console.error("Error logging unplanned item:", error);
    } finally {
      setAddingUnplanned(false);
    }
  };

  const handleCompleteSession = async () => {
    if (!activeSession) return;
    try {
      const response = await fetch(`http://localhost:8000/api/sessions/${activeSession.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      await response.json();
      setActiveSession(null);
      setCurrentPage('analytics');
    } catch (error) {
      console.error("Error completing session:", error);
    }
  };

  if (!activeSession || !sessionDetails) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-center p-8 space-y-4 select-none">
        <div className="w-12 h-12 rounded-2xl bg-white/2 border border-white/5 flex items-center justify-center">
          <ShoppingCart className="w-6 h-6 text-slate-500" />
        </div>
        <h4 className="text-md font-semibold text-white font-sans">No active shopping session found</h4>
        <p className="text-xs text-slate-400 max-w-sm">
          Please navigate to the Planner page to setup or activate a shopping session.
        </p>
      </div>
    );
  }

  // Calculate live session statistics
  const budget = sessionDetails.budget;
  const spent = sessionDetails.actual_spent;
  const remaining = budget - spent;
  const pctSpent = (spent / budget) * 100;
  const savings = sessionDetails.savings;

  const purchasedItems = items.filter(it => it.is_purchased);
  const unplannedItems = items.filter(it => it.is_unplanned && it.is_purchased);
  const impulseSpent = unplannedItems.reduce((acc, it) => acc + it.actual_price, 0);

  const categories = ["Snacks", "Groceries", "Beverages", "Dairy", "Personal Care", "Household", "Other"];
  const units = ["unit", "g", "kg", "ml", "L", "pack", "pcs"];

  return (
    <div className="space-y-8 pb-12 select-none relative">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[9px] font-bold bg-cyan-400 text-black rounded-full uppercase tracking-wider animate-pulse">
              Live Monitor Active
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">{sessionDetails.name}</h2>
          </div>
          <p className="text-slate-400 text-sm mt-0.5">Tally items as they enter your physical shopping cart to log savings.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUnplannedModal(true)}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/8 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4 text-white" /> Add Unplanned Item
          </button>
          
          <button
            onClick={handleCompleteSession}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-glow-purple transition-all"
          >
            <Check className="w-4 h-4 text-white" /> Complete Session
          </button>
        </div>
      </div>

      {/* Warning/Alert notifications */}
      {impulseSpent > 0 && (
        <div className="p-4 rounded-2xl bg-violet-950/15 border border-violet-900/30 flex items-start gap-3 shadow-glass">
          <ShieldAlert className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0 animate-bounce" />
          <div>
            <h5 className="text-xs font-bold text-white">AI Assistant Alert: Impulse spending detected</h5>
            <p className="text-[11px] text-slate-400 mt-0.5">
              You added {unplannedItems.length} unplanned items totaling <strong className="text-violet-400">₹{impulseSpent.toFixed(2)}</strong>. This represents {(impulseSpent/budget*100).toFixed(1)}% of your overall target limit.
            </p>
          </div>
        </div>
      )}

      {pctSpent >= 90 && (
        <div className="p-4 rounded-2xl bg-amber-950/15 border border-amber-900/30 flex items-start gap-3 shadow-glass">
          <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0 animate-pulse" />
          <div>
            <h5 className="text-xs font-bold text-white">Budget Warning: Exceeding ceiling threshold</h5>
            <p className="text-[11px] text-slate-400 mt-0.5">
              You have spent <strong className="text-amber-400">{pctSpent.toFixed(1)}%</strong> of your target budget. Remaining liquidity is only <strong>₹{remaining.toFixed(2)}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Budget Bar */}
        <div className="glass-card rounded-2xl p-5 md:col-span-2 relative overflow-hidden">
          <span className="text-xs text-slate-400">Target Budget Progress</span>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-3xl font-black text-white">₹{spent.toFixed(2)}</h3>
            <span className="text-xs text-slate-400">of ₹{budget}</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mt-4">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                pctSpent > 100 ? 'bg-red-500 shadow-glow-purple' : pctSpent >= 90 ? 'bg-amber-500 shadow-glow-purple' : 'bg-cyan-400 shadow-glow-cyan'
              }`}
              style={{ width: `${Math.min(100, pctSpent)}%` }}
            />
          </div>
        </div>

        {/* Remaining money */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <span className="text-xs text-slate-400">Remaining Balance</span>
          <h3 className={`text-3xl font-black mt-2 ${remaining < 0 ? 'text-red-400' : 'text-white'}`}>
            ₹{remaining.toFixed(2)}
          </h3>
          <span className="text-[10px] text-slate-500 block mt-2">Before target limit</span>
        </div>

        {/* Current savings */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <span className="text-xs text-slate-400">Achieved Savings</span>
          <h3 className="text-3xl font-black text-emerald-400 mt-2">
            ₹{savings.toFixed(2)}
          </h3>
          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5 mt-2">
            <Award className="w-3.5 h-3.5" /> Best-deal selections
          </span>
        </div>

      </div>

      {/* Shopping Checklist Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Planned checklist items column */}
        <div className="xl:col-span-2 glass-panel rounded-3xl p-6 shadow-glass flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-cyan-400" /> Active Checklist
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              Checked {purchasedItems.length} of {items.length} items
            </span>
          </div>

          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-20 space-y-4">
              <Info className="w-8 h-8 text-slate-600" />
              <h4 className="text-sm font-semibold text-white">No items found in active session</h4>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Split list into Pending vs Checked for cleaner user experience */}
              {items.sort((a,b) => a.is_purchased - b.is_purchased).map((item) => (
                <div 
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                    item.is_purchased 
                      ? 'bg-slate-950/20 border-white/2 opacity-60' 
                      : item.is_unplanned 
                        ? 'bg-violet-950/5 border-violet-900/20 hover:border-violet-500/20'
                        : 'bg-white/2 border-white/5 hover:border-white/12'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Checkbox button */}
                    <button
                      onClick={() => handleToggleCheck(item)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                        item.is_purchased 
                          ? 'bg-cyan-500 border-cyan-400 text-black shadow-glow-cyan' 
                          : item.is_unplanned
                            ? 'bg-white/3 border-violet-500/30 hover:bg-white/5'
                            : 'bg-white/3 border-white/8 hover:bg-white/5'
                      }`}
                    >
                      {item.is_purchased && <Check className="w-4 h-4 text-black stroke-[3px]" />}
                    </button>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${item.is_purchased ? 'line-through text-slate-500' : 'text-white'}`}>
                          {item.name}
                        </span>
                        {item.is_unplanned && (
                          <span className="px-1.5 py-0.2 bg-violet-950/50 text-[8px] text-violet-400 font-extrabold uppercase rounded border border-violet-900/30">
                            Impulse Buy
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Quantity: {item.planned_quantity} {item.planned_unit} 
                        {item.planned_price && (
                          <span className="ml-3">Planned: ₹{item.planned_price}</span>
                        )}
                        {item.is_purchased && (
                          <span className="ml-3 text-cyan-400 font-bold">Paid: ₹{item.actual_price}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs text-slate-500 italic">
                    {item.is_purchased ? "In Cart" : "In Aisle"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Interactive Stats Breakdown Column */}
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 shadow-glass">
            <h3 className="text-md font-bold text-white mb-4">Cart Breakdown</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between text-xs pb-3 border-b border-white/5">
                <span className="text-slate-400">Total Planned Items:</span>
                <span className="text-white font-semibold">{items.filter(i=>!i.is_unplanned).length}</span>
              </div>
              <div className="flex justify-between text-xs pb-3 border-b border-white/5">
                <span className="text-slate-400">Unplanned Impulse Items:</span>
                <span className="text-violet-400 font-semibold">{unplannedItems.length}</span>
              </div>
              <div className="flex justify-between text-xs pb-3 border-b border-white/5">
                <span className="text-slate-400">Items Remaining in Aisle:</span>
                <span className="text-white font-semibold">{items.filter(i=>!i.is_purchased).length}</span>
              </div>
              <div className="flex justify-between text-xs pb-3 border-b border-white/5">
                <span className="text-slate-400">Savings Rate:</span>
                <span className="text-emerald-400 font-semibold">
                  {spent > 0 ? ((savings / (spent + savings)) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-indigo-950/10 border border-indigo-900/30 flex items-start gap-3 shadow-glass">
            <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5 animate-pulse" />
            <div className="text-[11px] text-slate-400 leading-relaxed font-sans">
              <strong>Aura Real-Time Tip:</strong> You saved ₹{savings.toFixed(2)} so far by comparing product sizes. Check options for pending items to extract maximum discounts before concluding checkout.
            </div>
          </div>
        </div>

      </div>

      {/* Modal 1: Log Price Modal */}
      {logItemModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slateBg border border-white/10 rounded-2xl p-6 shadow-glass">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-bold text-white">Log Price paid</h4>
              <button 
                onClick={() => setLogItemModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Enter the exact amount paid for <strong className="text-white">{logItemModal.name}</strong>.
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (actualPrice) {
                updateItemStatus(logItemModal.id, true, parseFloat(actualPrice));
              }
            }} className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-1">Purchase Price (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={actualPrice}
                  onChange={(e) => setActualPrice(e.target.value)}
                  required
                  placeholder="e.g. 230"
                  className="w-full glass-input px-3 py-2 text-sm text-white font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLogItemModal(null)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold"
                >
                  Add to Cart
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Unplanned Item Modal */}
      {showUnplannedModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slateBg border border-white/10 rounded-2xl p-6 shadow-glass">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-bold text-white">Log Unplanned Purchase</h4>
              <button 
                onClick={() => setShowUnplannedModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Log impulse grocery items added on the go.
            </p>

            <form onSubmit={handleAddUnplannedItem} className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-1">Item Name</label>
                <input
                  type="text"
                  value={unplannedName}
                  onChange={(e) => setUnplannedName(e.target.value)}
                  required
                  placeholder="e.g. Candy Bar, Soda"
                  className="w-full glass-input px-3 py-2 text-sm text-white font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Price Paid (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={unplannedPrice}
                    onChange={(e) => setUnplannedPrice(e.target.value)}
                    required
                    placeholder="e.g. 50"
                    className="w-full glass-input px-3 py-2 text-sm text-white font-sans"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Category</label>
                  <select
                    value={unplannedCategory}
                    onChange={(e) => setUnplannedCategory(e.target.value)}
                    className="w-full bg-slateBg border border-white/8 rounded-xl px-3 py-2 text-xs text-slate-300"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Quantity</label>
                  <input
                    type="number"
                    value={unplannedQty}
                    onChange={(e) => setUnplannedQty(e.target.value)}
                    required
                    className="w-full glass-input px-3 py-2 text-sm text-white font-sans"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Unit</label>
                  <select
                    value={unplannedUnit}
                    onChange={(e) => setUnplannedUnit(e.target.value)}
                    className="w-full bg-slateBg border border-white/8 rounded-xl px-3 py-2 text-xs text-slate-300"
                  >
                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUnplannedModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingUnplanned}
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold"
                >
                  {addingUnplanned ? "Logging..." : "Log Impulse Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
