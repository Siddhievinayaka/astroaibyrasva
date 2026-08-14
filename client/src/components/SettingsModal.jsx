import React, { useState, useEffect } from 'react';
import { Settings, AlertCircle } from 'lucide-react';

export default function SettingsModal({
  showSettings,
  setShowSettings,
  apiKey,
  model,
  apiBase,
  handleSaveSettings
}) {
  const [localKey, setLocalKey] = useState(apiKey);
  const [localModel, setLocalModel] = useState(model);
  const [localBase, setLocalBase] = useState(apiBase);

  // Synchronize local state with props when they are asynchronously loaded
  useEffect(() => {
    setLocalKey(apiKey);
  }, [apiKey]);

  useEffect(() => {
    setLocalModel(model);
  }, [model]);

  useEffect(() => {
    setLocalBase(apiBase);
  }, [apiBase]);

  if (!showSettings) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl w-full max-w-md p-6 border border-indigo-500/35 relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={() => setShowSettings(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          ✕
        </button>
        
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-indigo-500/20 pb-3 mb-4">
          <Settings className="w-5 h-5 text-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
          Cosmic API Configurations
        </h3>

        <div className="p-3 mb-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 text-xs flex items-start gap-2 font-light leading-relaxed">
          <AlertCircle className="w-4.5 h-4.5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div>
            Provide your personal Google Gemini API Key. If left empty, calculations continue to compile, but AI interpretations run in local offline rules sandbox mock mode.
          </div>
        </div>

        <div className="flex flex-col gap-4 mb-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Gemini API Key</label>
            <input 
              id="apikey-input"
              type="password" 
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full glass-input rounded-lg px-3.5 py-2.5 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Google API Base URL</label>
            <input 
              id="apibase-input"
              type="text" 
              value={localBase}
              onChange={(e) => setLocalBase(e.target.value)}
              placeholder="https://generativelanguage.googleapis.com"
              className="w-full glass-input rounded-lg px-3.5 py-2.5 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Astro Model Designation</label>
            <select 
              id="model-input"
              value={localModel}
              onChange={(e) => setLocalModel(e.target.value)}
              className="w-full glass-input rounded-lg px-3.5 py-2.5 text-sm focus:outline-none bg-white cursor-pointer"
            >
              <option value="gemini-3.5-flash">Gemini 3.5 Flash (Recommended - Instant)</option>
              <option value="gemini-3.5-pro">Gemini 3.5 Pro (Deep Analysis)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-indigo-500/20 pt-4">
          <button 
            onClick={() => setShowSettings(false)}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              handleSaveSettings(localKey, localModel, localBase);
              setShowSettings(false);
            }}
            className="px-5 py-2 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
