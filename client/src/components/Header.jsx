import React from 'react';
import { Compass, Sparkles, ShieldAlert, Settings } from 'lucide-react';

export default function Header({
  suggestedKeyWarning,
  user,
  handleLogout,
  setAuthMode,
  setShowAuthModal,
  showAdminPanel,
  setShowAdminPanel,
  fetchAdminActiveSessions,
  fetchAdminUsers,
  setShowSettings
}) {
  return (
    <header className="glass-card sticky top-0 z-40 px-4 py-3 flex items-center justify-between border-b border-indigo-500/25 bg-slate-950/80 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 relative animate-pulse">
          <Compass className="w-6 h-6 text-amber-300" />
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-900"></div>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-wider bg-gradient-to-r from-amber-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">RaSva AI Astrology</h1>
          <p className="text-xs text-slate-400 font-light flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Personal Advisor for Jotish Enthusiast
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-indigo-300 font-medium hidden sm:inline">Namaste, {user.name}</span>
            <button 
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg border border-indigo-500/30 hover:bg-indigo-500/10 text-indigo-300 text-xs font-medium transition-colors"
              title="Log Out"
            >
              Log Out
            </button>
          </div>
        ) : (
          <button 
            onClick={() => { setAuthMode("login"); setShowAuthModal(true); }}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
          >
            Sign In
          </button>
        )}
        {user?.role === 'admin' && (
          <button 
            onClick={() => {
              setShowAdminPanel(!showAdminPanel);
              fetchAdminActiveSessions();
              fetchAdminUsers();
            }}
            className={`p-2 rounded-full border transition-all relative ${
              showAdminPanel 
                ? "bg-purple-600/30 border-purple-500 text-purple-300" 
                : "hover:bg-slate-800 border-indigo-500/20 text-slate-300 hover:text-purple-400"
            }`}
            title="Admin Dashboard"
          >
            <ShieldAlert className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
          </button>
        )}
        <button 
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-full hover:bg-slate-800 border border-indigo-500/20 text-slate-300 hover:text-amber-400 transition-colors"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}

function AlertIcon({ className, ...props }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}
