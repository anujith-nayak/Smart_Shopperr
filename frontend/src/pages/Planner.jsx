import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowRight, Play, ShoppingCart, Loader2, Sparkles } from 'lucide-react';

export default function Planner({ activeSession, setActiveSession, setCurrentPage }) {
  // Session Form states
  const [sessionName, setSessionName] = useState('');
  const [sessionBudget, setSessionBudget] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Items Form states
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('Groceries');
  const [itemQty, setItemQty] = useState('1');
  const [itemUnit, setItemUnit] = useState('unit');
  const [itemPrice, setItemPrice] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);

  // List of items
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    if (activeSession) {
      fetchSessionItems();
    }
  }, [activeSession]);

  const fetchSessionItems = async () => {
    setLoadingItems(true);
    try {
      const response = await fetch(`http://localhost:8000/api/sessions/${activeSession.id}`);
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error("Error fetching session items:", error);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!sessionName.trim() || !sessionBudget) return;
    
    setIsCreatingSession(true);
    try {
      const response = await fetch('http://localhost:8000/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sessionName,
          budget: parseFloat(sessionBudget)
        })
      });
      const data = await response.json();
      setActiveSession(data);
      setItems([]);
    } catch (error) {
      console.error("Error creating session:", error);
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!itemName.trim() || !activeSession) return;

    setIsAddingItem(true);
    try {
      const response = await fetch(`http://localhost:8000/api/sessions/${activeSession.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: itemName,
          category: itemCategory,
          planned_quantity: parseFloat(itemQty),
          planned_unit: itemUnit,
          planned_price: itemPrice ? parseFloat(itemPrice) : null,
          is_unplanned: false
        })
      });
      const newItem = await response.json();
      setItems(prev => [...prev, newItem]);
      setItemName('');
      setItemQty('1');
      setItemPrice('');
    } catch (error) {
      console.error("Error adding item:", error);
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await fetch(`http://localhost:8000/api/items/${itemId}`, { method: 'DELETE' });
      setItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleStartShopping = async () => {
    if (!activeSession) return;
    try {
      const response = await fetch(`http://localhost:8000/api/sessions/${activeSession.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' })
      });
      const updatedSession = await response.json();
      setActiveSession(updatedSession);
      setCurrentPage('monitor');
    } catch (error) {
      console.error("Error updating session status:", error);
    }
  };

  const categories = ["Groceries", "Snacks", "Personal Care", "Dairy", "Beverages", "Household", "Other"];
  const units = ["unit", "g", "kg", "ml", "L", "pack", "pcs"];

  return (
    <div className="space-y-8 pb-12 select-none">
      
      {/* Page Title */}
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Smart Shopping Planner</h2>
        <p className="text-slate-400 text-sm mt-0.5">Pre-plan items and allocate budgets before stepping into the supermarket.</p>
      </div>

      {!activeSession ? (
        /* Setup Session State */
        <div className="max-w-xl mx-auto glass-panel rounded-3xl p-8 shadow-glass glow-purple mt-8">
          <h3 className="text-xl font-bold text-white mb-6">Create Shopping Session</h3>
          
          <form onSubmit={handleCreateSession} className="space-y-6">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-2">Session Name</label>
              <input 
                type="text" 
                placeholder="e.g., Weekly Groceries - D-Mart"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                required
                className="w-full glass-input px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-2">Target Budget Limit (₹)</label>
              <input 
                type="number" 
                placeholder="e.g., 2000"
                value={sessionBudget}
                onChange={(e) => setSessionBudget(e.target.value)}
                required
                className="w-full glass-input px-4 py-3 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isCreatingSession}
              className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold flex items-center justify-center gap-2 transition-all"
            >
              {isCreatingSession ? <Loader2 className="w-5 h-5 animate-spin" /> : "Initialize Plan"} <ArrowRight className="w-4 h-4 text-black" />
            </button>
          </form>
        </div>
      ) : (
        /* Planner list state */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Add Item form column */}
          <div className="space-y-6">
            <div className="glass-panel rounded-3xl p-6 shadow-glass relative overflow-hidden">
              <h3 className="text-lg font-bold text-white mb-4">Add Planned Item</h3>
              
              <form onSubmit={handleAddItem} className="space-y-4">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1.5">Item Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Atta, Chips, Milk"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    required
                    className="w-full glass-input px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1.5">Quantity</label>
                    <input
                      type="number"
                      step="any"
                      value={itemQty}
                      onChange={(e) => setItemQty(e.target.value)}
                      required
                      className="w-full glass-input px-3.5 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1.5">Unit</label>
                    <select
                      value={itemUnit}
                      onChange={(e) => setItemUnit(e.target.value)}
                      className="w-full bg-slateBg border border-white/8 rounded-xl px-3.5 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-cyan-500"
                    >
                      {units.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1.5">Category</label>
                    <select
                      value={itemCategory}
                      onChange={(e) => setItemCategory(e.target.value)}
                      className="w-full bg-slateBg border border-white/8 rounded-xl px-3.5 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-cyan-500"
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1.5">Est. Price (₹ - Optional)</label>
                    <input
                      type="number"
                      placeholder="e.g. 250"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      className="w-full glass-input px-3.5 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAddingItem}
                  className="w-full py-3 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-1.5 transition-all text-xs"
                >
                  {isAddingItem ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Plus className="w-4 h-4 text-black" />} Add to plan
                </button>
              </form>
            </div>

            {/* Session Card Info */}
            <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-slate-500">Plan details</span>
              <h4 className="text-md font-bold text-white mt-1">{activeSession.name}</h4>
              <div className="mt-4 flex justify-between text-xs border-b border-white/5 pb-3">
                <span className="text-slate-400">Total Budget:</span>
                <span className="text-white font-bold">₹{activeSession.budget}</span>
              </div>
              <div className="mt-3 flex justify-between text-xs pb-3">
                <span className="text-slate-400">Items Planned:</span>
                <span className="text-white font-bold">{items.length} items</span>
              </div>
              
              {items.length > 0 && (
                <button
                  onClick={handleStartShopping}
                  className="w-full mt-4 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-glow-cyan transition-all"
                >
                  <ShoppingCart className="w-4 h-4 text-black" /> Start Shopping Now
                </button>
              )}
            </div>
          </div>

          {/* List items column */}
          <div className="lg:col-span-2 glass-panel rounded-3xl p-6 shadow-glass flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Planned Items list 
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-[11px] text-slate-400 font-normal">
                  {items.length} total
                </span>
              </h3>
              
              {activeSession.status === 'active' && (
                <button
                  onClick={() => setCurrentPage('monitor')}
                  className="text-xs text-cyan-400 flex items-center gap-1 hover:underline"
                >
                  View Active Monitor <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {loadingItems ? (
              <div className="flex-1 flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-20 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-white/2 border border-white/5 flex items-center justify-center text-slate-500">
                  <Play className="w-5 h-5 text-slate-500" />
                </div>
                <h4 className="text-sm font-semibold text-white">Your shopping list is empty</h4>
                <p className="text-xs text-slate-500 max-w-xs">
                  Fill out the form on the left to add items you want to buy. Aura will monitor these live.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[500px]">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-4 rounded-xl bg-white/2 hover:bg-white/4 border border-white/5 flex items-center justify-between transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{item.name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-cyan-950/20 text-[9px] text-cyan-400 font-semibold uppercase border border-cyan-900/30">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Quantity: <strong className="text-slate-300">{item.planned_quantity} {item.planned_unit}</strong>
                        {item.planned_price && (
                          <span className="ml-3">
                            Estimated: <strong className="text-slate-300">₹{item.planned_price}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-white/5 hover:border-red-500/20 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* AI suggestion sidebar notice */}
            {items.length > 0 && (
              <div className="mt-6 p-4 rounded-2xl bg-indigo-950/15 border border-indigo-900/30 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0 animate-pulse" />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Aura Suggestion: You have {items.filter(i => i.category === 'Snacks').length} snack items on this list. Snack items typically average 28% of total shopping session costs. Consider comparing brands in the next step to optimize.
                </p>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
