import React from 'react';
import { Compass, Trash2, Sparkles, Database } from 'lucide-react';

export default function SavedProfiles({
  savedProfiles,
  loadProfile,
  deleteProfile,
  user,
  token
}) {
  return (
    <div className="glass-card rounded-2xl p-5 border border-indigo-500/15 flex-1 flex flex-col min-h-[300px]">
      <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Compass className="w-4.5 h-4.5 text-indigo-400" />
          Saved Cosmic Profiles
        </span>
        {token ? (
          <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded font-bold uppercase tracking-wider flex items-center gap-1">
            <Database className="w-2.5 h-2.5" />
            Synced
          </span>
        ) : (
          <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded font-bold uppercase tracking-wider">
            Offline
          </span>
        )}
      </h2>

      <div className="flex-1 overflow-y-auto max-h-72 pr-1 flex flex-col gap-2">
        {savedProfiles.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 text-xs italic py-12 font-light">
            <Sparkles className="w-8 h-8 text-slate-300 mb-2 animate-pulse" />
            No saved profiles. Compute a Vedic Kundali and save it here.
          </div>
        ) : (
          savedProfiles.map((prof, idx) => (
            <div 
              key={idx} 
              className="p-3 rounded-xl bg-slate-50/60 hover:bg-slate-100/80 border border-indigo-500/5 transition-all flex items-center justify-between group"
            >
              <div 
                onClick={() => loadProfile(prof)}
                className="flex-1 cursor-pointer"
              >
                <h4 className="text-xs font-semibold text-slate-700">{prof.name}</h4>
                <p className="text-[10px] text-slate-400 font-light mt-0.5">
                  Born: {prof.date} at {prof.time} <br />
                  Place: {prof.locationName}
                </p>
              </div>
              <button 
                onClick={() => deleteProfile(prof)}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors md:opacity-0 group-hover:opacity-100"
                title="Delete Profile"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {!token && (
        <p className="text-[10px] text-slate-400 font-light mt-4 text-center border-t border-indigo-500/10 pt-3">
          💡 <strong>Sign in</strong> to sync profiles with the server database and access them anywhere.
        </p>
      )}
    </div>
  );
}
