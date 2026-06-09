import React from 'react';
import { 
  LayoutDashboard, 
  ListTodo, 
  ArrowLeftRight, 
  ShoppingCart, 
  BarChart3, 
  History, 
  Settings,
  Sparkles
} from 'lucide-react';

export default function FloatingNav({ currentPage, setCurrentPage, activeSession }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'planner', label: 'Planner', icon: ListTodo },
    { id: 'comparison', label: 'Compare Engine', icon: ArrowLeftRight },
    { id: 'monitor', label: 'Live Monitor', icon: ShoppingCart, badge: activeSession ? "Active" : null },
    { id: 'analytics', label: 'AI Analytics', icon: BarChart3 },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Profile', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Navigation Sidebar */}
      <aside className="hidden md:flex flex-col fixed top-6 left-6 bottom-6 w-64 glass-panel-heavy rounded-2xl z-40 p-6 transition-all duration-300">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 mb-8 cursor-pointer" onClick={() => setCurrentPage('landing')}>
          <div className="p-2 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 shadow-glow-purple flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 font-sans tracking-wide">
              Smart Shopper
            </h1>
            <span className="text-[10px] text-cyan-400 font-medium uppercase tracking-widest">
              AI Shopping Companion
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group relative ${
                  isActive 
                    ? 'bg-white/5 border-l-2 border-cyan-400 text-white font-medium shadow-glass' 
                    : 'text-slate-400 hover:text-white hover:bg-white/2'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-105 ${
                    isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`} />
                  <span className="text-sm">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-bold text-black bg-cyan-400 rounded-full shadow-glow-cyan animate-pulse">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-glow-cyan"></span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Workspace Info / Pro Badge */}
        <div className="mt-auto p-4 rounded-xl bg-white/2 border border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-glass">
            AS
          </div>
          <div>
            <div className="text-xs font-medium text-white">Anujith S.</div>
            <div className="text-[10px] text-slate-400">Beta Tester (Pro)</div>
          </div>
        </div>
      </aside>

      {/* Mobile Navigation Bottom Bar */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 glass-panel-heavy rounded-2xl h-16 flex items-center justify-around px-2 z-40 shadow-glass">
        {navItems.filter(item => item.id !== 'settings').map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 relative ${
                isActive ? 'text-cyan-400 bg-white/5 shadow-glass' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[8px] mt-1 font-medium scale-90">{item.label.split(' ')[0]}</span>
              {item.badge && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-slate-950 animate-pulse"></span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}
