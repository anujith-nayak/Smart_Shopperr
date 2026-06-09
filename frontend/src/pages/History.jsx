import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, Search, ArrowRight, X, AlertCircle, ShoppingBag, Loader2, Info } from 'lucide-react';

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected session for detail modal
  const [selectedSession, setSelectedSession] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [sessionDetails, setSessionDetails] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/sessions');
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = async (session) => {
    setSelectedSession(session);
    setLoadingDetails(true);
    try {
      const response = await fetch(`http://localhost:8000/api/sessions/${session.id}`);
      const data = await response.json();
      setSessionDetails(data);
    } catch (error) {
      console.error("Error fetching session details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedSession(null);
    setSessionDetails(null);
  };

  // Filters logic
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 pb-12 select-none relative">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Shopping History</h2>
          <p className="text-slate-400 text-sm mt-0.5">Browse past budgets, spending records, and savings reviews.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white/2 border border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between shadow-glass">
        
        {/* Search */}
        <div className="relative w-full md:w-80 flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search session by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/3 border border-white/5 hover:border-white/10 focus:border-cyan-500/50 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 self-stretch md:self-auto overflow-x-auto pb-1 md:pb-0">
          {['all', 'completed', 'active', 'planned'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                statusFilter === status 
                  ? 'bg-cyan-500 border-cyan-400 text-black shadow-glow-cyan' 
                  : 'bg-white/3 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Session Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[300px] space-y-4">
          <Calendar className="w-8 h-8 text-slate-500" />
          <div>
            <h4 className="text-sm font-semibold text-white">No history records found</h4>
            <p className="text-xs text-slate-500 mt-1">Try tweaking filters or run your first shopping trip.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => {
            const isCompleted = session.status === 'completed';
            const isActive = session.status === 'active';
            const isPlanned = session.status === 'planned';
            
            return (
              <div 
                key={session.id}
                onClick={() => handleOpenDetails(session)}
                className="glass-card rounded-2xl p-5 cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[160px] border border-white/5 hover:border-cyan-500/20"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                      isCompleted 
                        ? 'bg-slate-900 text-slate-400 border-white/10' 
                        : isActive 
                          ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/20 animate-pulse'
                          : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/20'
                    }`}>
                      {session.status}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {new Date(session.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white leading-snug line-clamp-1">{session.name}</h4>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/5 text-[10px]">
                  <div>
                    <span className="text-slate-500 font-medium uppercase block">Budget</span>
                    <strong className="text-white">₹{session.budget}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium uppercase block">Spent</span>
                    <strong className={isCompleted && session.actual_spent > session.budget ? 'text-red-400' : 'text-slate-300'}>
                      ₹{session.actual_spent}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium uppercase block">Savings</span>
                    <strong className="text-emerald-400">₹{session.savings}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slateBg border border-white/10 rounded-3xl p-6 shadow-glass max-h-[90vh] overflow-y-auto flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-white/5 border border-white/8 text-slate-400 uppercase tracking-wider">
                  {selectedSession.status}
                </span>
                <h3 className="text-xl font-bold text-white mt-2">{selectedSession.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Logged on {new Date(selectedSession.created_at).toLocaleDateString()} at {new Date(selectedSession.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button 
                onClick={handleCloseDetails}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingDetails || !sessionDetails ? (
              <div className="flex-1 flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              </div>
            ) : (
              <div className="space-y-6 flex-1">
                {/* Summary Metrics */}
                <div className="grid grid-cols-4 gap-4 p-4 rounded-2xl bg-white/2 border border-white/5 text-xs">
                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[9px] mb-0.5">Budget</span>
                    <strong className="text-sm text-white">₹{sessionDetails.budget}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[9px] mb-0.5">Spent</span>
                    <strong className="text-sm text-white">₹{sessionDetails.actual_spent}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[9px] mb-0.5">Savings</span>
                    <strong className="text-sm text-emerald-400">₹{sessionDetails.savings}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[9px] mb-0.5">Budget Limit</span>
                    <strong className={`text-sm ${sessionDetails.actual_spent <= sessionDetails.budget ? 'text-cyan-400' : 'text-red-400'}`}>
                      {sessionDetails.actual_spent <= sessionDetails.budget ? "Under" : "Exceeded"}
                    </strong>
                  </div>
                </div>

                {/* Items Purchased List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">Item Log details</h4>
                  
                  {sessionDetails.items.length === 0 ? (
                    <div className="text-xs text-slate-500 py-4 text-center">No items logged in this session.</div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {sessionDetails.items.map((item) => (
                        <div 
                          key={item.id} 
                          className="p-3.5 rounded-xl bg-white/2 border border-white/3 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{item.name}</span>
                              {item.is_unplanned && (
                                <span className="px-1.5 py-0.2 bg-violet-950 text-[7px] text-violet-400 font-extrabold uppercase rounded border border-violet-900/30">
                                  Impulse
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Quantity: {item.planned_quantity} {item.planned_unit}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-white block">
                              {item.is_purchased ? `₹${item.actual_price}` : "Not bought"}
                            </span>
                            {item.planned_price && (
                              <span className="text-[9px] text-slate-500">Planned ₹{item.planned_price}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-6 border-t border-white/5 mt-6">
              <button
                onClick={handleCloseDetails}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
