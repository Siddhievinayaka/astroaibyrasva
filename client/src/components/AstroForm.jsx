import React from 'react';
import { User, Calendar, Clock, MapPin, Sparkles, BookOpen } from 'lucide-react';
import { CITY_PRESETS } from '../utils/astrologyEngine';

export default function AstroForm({
  profile,
  setProfile,
  searchQuery,
  setSearchQuery,
  suggestions,
  setSuggestions,
  selectedPresetIndex,
  setSelectedPresetIndex,
  handleLocationSearch,
  loading,
  handleSubmit,
  onSaveProfile
}) {
  return (
    <div className="glass-card rounded-2xl p-5 border border-indigo-500/15">
      <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Sparkles className="w-4.5 h-4.5 text-indigo-400" />
        Configure Birth Profile
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Explorer Name</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
              <User className="w-4 h-4" />
            </span>
            <input 
              type="text" 
              value={profile.name}
              onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
              className="w-full glass-input rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none"
              placeholder="e.g. Vedic Explorer"
              required
            />
          </div>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Birth Date</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Calendar className="w-4 h-4" />
              </span>
              <input 
                type="date" 
                value={profile.date}
                onChange={(e) => setProfile(prev => ({ ...prev, date: e.target.value }))}
                className="w-full glass-input rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Birth Time</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Clock className="w-4 h-4" />
              </span>
              <input 
                type="time" 
                value={profile.time}
                onChange={(e) => setProfile(prev => ({ ...prev, time: e.target.value }))}
                className="w-full glass-input rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Location Search */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Birth Town / City</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
              <MapPin className="w-4 h-4" />
            </span>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleLocationSearch(e.target.value);
              }}
              className="w-full glass-input rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none"
              placeholder="Search birth location (e.g. New Delhi)"
              required
            />
            {suggestions.length > 0 && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                {suggestions.map((s, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      const lat = parseFloat(s.lat);
                      const lon = parseFloat(s.lon);
                      let estimatedTz = Math.round((lon / 15) * 2) / 2;
                      const displayName = s.display_name.toLowerCase();
                      if (displayName.includes("india")) estimatedTz = 5.5;
                      else if (displayName.includes("nepal")) estimatedTz = 5.75;
                      else if (displayName.includes("sri lanka")) estimatedTz = 5.5;
                      else if (displayName.includes("pakistan")) estimatedTz = 5.0;
                      else if (displayName.includes("bangladesh")) estimatedTz = 6.0;

                      setProfile(prev => ({
                        ...prev,
                        locationName: s.display_name.split(',')[0] + ', ' + (s.display_name.split(',').slice(-1)[0] || '').trim(),
                        latitude: lat,
                        longitude: lon,
                        timezone: estimatedTz
                      }));
                      setSearchQuery(s.display_name.split(',')[0] + ', ' + (s.display_name.split(',').slice(-1)[0] || '').trim());
                      setSuggestions([]);
                    }}
                    className="px-4 py-2.5 text-xs text-slate-800 hover:bg-indigo-50 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors"
                  >
                    {s.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Latitude, Longitude, Timezone (Calculated/Manual) */}
        <div className="grid grid-cols-3 gap-2 bg-slate-50/60 p-3 rounded-xl border border-indigo-500/5">
          <div>
            <span className="block text-[9px] font-semibold text-slate-400 uppercase">Latitude</span>
            <span className="text-xs text-slate-700 font-semibold">{profile.latitude.toFixed(4)}°</span>
          </div>
          <div>
            <span className="block text-[9px] font-semibold text-slate-400 uppercase">Longitude</span>
            <span className="text-xs text-slate-700 font-semibold">{profile.longitude.toFixed(4)}°</span>
          </div>
          <div>
            <span className="block text-[9px] font-semibold text-slate-400 uppercase">Timezone (GMT)</span>
            <span className="text-xs text-slate-700 font-semibold">
              {profile.timezone >= 0 ? `+${profile.timezone}` : profile.timezone}
            </span>
          </div>
        </div>

        {/* Presets */}
        <div>
          <span className="block text-[9px] font-bold text-slate-400 uppercase mb-2 tracking-wider">Quick Presets</span>
          <div className="flex flex-wrap gap-1.5">
            {CITY_PRESETS.map((city, idx) => (
              <button 
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedPresetIndex(idx);
                  setProfile(prev => ({
                    ...prev,
                    locationName: city.name,
                    latitude: city.lat,
                    longitude: city.lng,
                    timezone: city.tz
                  }));
                  setSearchQuery(city.name);
                  setSuggestions([]);
                }}
                className={`px-2.5 py-1 rounded-lg border text-[10px] font-medium transition-all ${
                  selectedPresetIndex === idx 
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-sm" 
                    : "border-indigo-500/15 text-indigo-400 hover:bg-indigo-50"
                }`}
              >
                {city.name.split(',')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          <button 
            type="submit"
            disabled={loading}
            className="py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-500/10 active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Calculate Chart
              </>
            )}
          </button>
          <button 
            type="button"
            onClick={onSaveProfile}
            className="py-3 border border-indigo-500/35 hover:bg-indigo-500/10 text-indigo-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
}
