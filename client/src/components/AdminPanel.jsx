import React from 'react';
import { ShieldAlert, Compass, Sparkles, Send, Key, Trash2 } from 'lucide-react';

export default function AdminPanel({
  showAdminPanel,
  setShowAdminPanel,
  user,
  adminTab,
  setAdminTab,
  adminSessions,
  adminUsers,
  adminSelectedSession,
  selectAdminSession,
  adminChatMessages,
  adminChatInput,
  setAdminChatInput,
  sendAdminMessage,
  token,
  API_URL
}) {
  const [dbKeys, setDbKeys] = React.useState([]);
  const [newKeyVal, setNewKeyVal] = React.useState("");
  const [newKeyLabel, setNewKeyLabel] = React.useState("");
  const [isAddingKey, setIsAddingKey] = React.useState(false);
  const [addKeyError, setAddKeyError] = React.useState("");

  const fetchDbKeys = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/apikeys`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDbKeys(data);
      }
    } catch (err) {
      console.error("Error fetching db keys:", err);
    }
  };

  React.useEffect(() => {
    if (showAdminPanel && token) {
      fetchDbKeys();
    }
  }, [showAdminPanel, token]);

  const handleAddKey = async (e) => {
    e.preventDefault();
    setAddKeyError("");
    if (!newKeyVal.trim()) return;
    
    setIsAddingKey(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/apikeys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ key: newKeyVal, label: newKeyLabel })
      });
      const data = await res.json();
      if (res.ok) {
        setDbKeys(prev => [data, ...prev]);
        setNewKeyVal("");
        setNewKeyLabel("");
        alert("API Key successfully added to database!");
      } else {
        setAddKeyError(data.error || "Failed to add API key.");
      }
    } catch (err) {
      console.error("Add key error:", err);
      setAddKeyError("Network error.");
    } finally {
      setIsAddingKey(false);
    }
  };

  const handleDeleteKey = async (id) => {
    if (!window.confirm("Are you sure you want to delete this API Key? Chat sessions using it will lose connection until rotated in Settings.")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/apikeys/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setDbKeys(prev => prev.filter(k => k._id !== id));
      }
    } catch (err) {
      console.error("Delete key error:", err);
    }
  };

  if (!showAdminPanel || user?.role !== 'admin') return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 lg:p-6 overflow-hidden">
      <div className="glass-card rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col border border-purple-500/35 relative animate-in fade-in zoom-in duration-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-purple-500/30 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-purple-400 animate-pulse" />
            <div>
              <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">Green AI Astrology - Admin Control Panel</h2>
              <p className="text-[10px] text-slate-400 font-light">Monitor live chat sessions, manage registered users, and rotate Gemini API Keys.</p>
            </div>
          </div>
          <button 
            onClick={() => { setShowAdminPanel(false); }}
            className="px-4 py-1.5 rounded-lg bg-slate-900 border border-purple-500/30 text-purple-300 hover:bg-purple-950/40 hover:text-white transition-all text-xs font-semibold"
          >
            ??? Close Panel
          </button>
        </div>

        {/* Grid Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left Column: Users / Sessions List (4 Cols) */}
          <div className="lg:col-span-4 border-r border-indigo-500/10 flex flex-col h-full overflow-hidden bg-slate-950/30">
            {/* Tabs */}
            <div className="flex border-b border-indigo-500/10 bg-slate-950/50">
              <button 
                onClick={() => setAdminTab("sessions")}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 border-b-2 transition-all ${
                  adminTab === "sessions" 
                    ? "border-purple-500 text-purple-300 bg-purple-500/5" 
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                Sessions ({adminSessions.length})
              </button>
              <button 
                onClick={() => setAdminTab("users")}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 border-b-2 transition-all ${
                  adminTab === "users" 
                    ? "border-purple-500 text-purple-300 bg-purple-500/5" 
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Users ({adminUsers.length})
              </button>
              <button 
                onClick={() => setAdminTab("apikeys")}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 border-b-2 transition-all ${
                  adminTab === "apikeys" 
                    ? "border-purple-500 text-purple-300 bg-purple-500/5" 
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                Keys ({dbKeys.length})
              </button>
            </div>

            {/* Lists Box */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
              {adminTab === "sessions" ? (
                adminSessions.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8 italic font-light">No active chat sessions detected.</p>
                ) : (
                  adminSessions.map((sess, idx) => {
                    const isSelected = adminSelectedSession && adminSelectedSession.sessionId === sess.sessionId;
                    return (
                      <div 
                        key={idx}
                        onClick={() => selectAdminSession(sess)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                          isSelected 
                            ? "bg-purple-950/30 border-purple-500/40" 
                            : "bg-slate-900/40 border-indigo-500/10 hover:border-indigo-500/30"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-semibold text-slate-200">
                            {sess.user?.name || "Anonymous Guest"}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">
                            {new Date(sess.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {sess.user?.email && (
                          <p className="text-[10px] text-indigo-300/80 font-light flex flex-col gap-0.5">
                            <span>???? {sess.user.email}</span>
                            <span>???? {sess.user.mobile || 'N/A'}</span>
                          </p>
                        )}
                        <p className="text-[11px] text-slate-400 truncate italic font-light">
                          {sess.lastRole === 'user' ? 'You: ' : 'Guru: '}{sess.lastMessage}
                        </p>
                        {sess.compatibilityCheck && (
                          <div className="mt-1 p-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-[9px] text-amber-300 font-light leading-tight">
                            ?????? Checked compatibility with: <strong>{sess.compatibilityCheck.name}</strong> ({sess.compatibilityCheck.formattedDate})
                          </div>
                        )}
                      </div>
                    );
                  })
                )
              ) : adminTab === "users" ? (
                adminUsers.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8 italic font-light">No users registered.</p>
                ) : (
                  adminUsers.map((u, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-900/40 border border-indigo-500/10 flex flex-col gap-1">
                      <div className="flex justify-between">
                        <span className="text-xs font-semibold text-slate-200">{u.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                          u.isVerified 
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}>
                          {u.isVerified ? "Verified" : "Pending OTP"}
                        </span>
                      </div>
                      <p className="text-[10px] text-indigo-300 font-light">
                        ???? {u.email} <br />
                        ???? {u.mobile}
                      </p>
                      <div className="flex justify-between items-center text-[9px] text-slate-500 font-light mt-1">
                        <span>Role: <strong className="text-slate-400 capitalize">{u.role}</strong></span>
                        <span>Joined: {new Date(u.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Add Key Form */}
                  <form onSubmit={handleAddKey} className="p-3.5 rounded-xl bg-slate-900/40 border border-purple-500/20 flex flex-col gap-3">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-purple-400" />
                      Add Gemini API Key
                    </h4>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">API Key Value</label>
                      <input 
                        type="password"
                        value={newKeyVal}
                        onChange={(e) => setNewKeyVal(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full glass-input rounded-lg px-3 py-2 text-xs focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Key Label (Optional)</label>
                      <input 
                        type="text"
                        value={newKeyLabel}
                        onChange={(e) => setNewKeyLabel(e.target.value)}
                        placeholder="e.g. Primary Key - Flash v3.5"
                        className="w-full glass-input rounded-lg px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>
                    {addKeyError && <p className="text-[10px] text-rose-400">{addKeyError}</p>}
                    <button 
                      type="submit"
                      disabled={isAddingKey}
                      className="py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isAddingKey ? "Adding..." : "Add Key to DB"}
                    </button>
                  </form>

                  {/* Keys list */}
                  <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                    {dbKeys.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6 italic font-light">No stored API keys found.</p>
                    ) : (
                      dbKeys.map((k, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-900/40 border border-indigo-500/10 flex items-center justify-between gap-3 hover:border-purple-500/35 transition-colors">
                          <div className="flex-1 overflow-hidden">
                            <span className="text-xs font-semibold text-slate-200 block truncate" title={k.label || 'No Label'}>
                              ???? {k.label || `Key ${idx + 1}`}
                            </span>
                            <span className="text-[9.5px] text-slate-500 font-mono block mt-0.5 truncate">
                              {k.key.substring(0, 10)}...{k.key.substring(k.key.length - 4)}
                            </span>
                            <span className="text-[8px] text-slate-600 block font-mono mt-0.5">
                              Added: {new Date(k.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteKey(k._id)}
                            className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
                            title="Delete Key"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Chat Interception (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col h-full overflow-hidden bg-slate-950/20">
            {!adminSelectedSession ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-500 text-xs italic">
                <Sparkles className="w-10 h-10 text-slate-600 mb-3 animate-bounce" />
                Select an active user session from the list to start live monitoring and intercepting.
              </div>
            ) : (
              <>
                {/* Selected Session Header info */}
                <div className="px-5 py-3 border-b border-indigo-500/10 bg-slate-950/50 flex flex-col gap-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">
                        Active Chat: {adminSelectedSession.user?.name || "Anonymous Guest"}
                      </h4>
                      <p className="text-[10px] text-indigo-400 font-mono font-light">
                        Session ID: {adminSelectedSession.sessionId}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-light">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Live Connection
                    </span>
                  </div>
                  {adminSelectedSession.user?.email && (
                    <p className="text-[10px] text-slate-400 font-light flex gap-3">
                      <span>???? {adminSelectedSession.user.email}</span>
                      <span>???? {adminSelectedSession.user.mobile}</span>
                    </p>
                  )}
                </div>

                {/* Mirrored Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                  {adminChatMessages.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6 italic font-light">Loading chat history...</p>
                  ) : (
                    adminChatMessages.map((msg, idx) => (
                      <div 
                        key={idx}
                        className={`flex flex-col max-w-[85%] ${
                          msg.role === 'user' ? 'self-start items-start' : 'self-end items-end'
                        }`}
                      >
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 mb-1 font-semibold">
                          {msg.role === 'user' ? 'User' : msg.role === 'admin' ? 'You (Takeover)' : 'AI (Guru)'}
                        </span>
                        <div 
                          className={`p-3 rounded-2xl text-xs leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-slate-900 border border-indigo-500/20 text-slate-200 rounded-tl-none font-light'
                              : msg.role === 'admin'
                                ? 'bg-purple-900 border border-purple-500/30 text-purple-200 rounded-tr-none'
                                : 'bg-indigo-950/20 border border-indigo-500/10 text-indigo-300 rounded-tr-none font-light'
                          }`}
                          style={{ whiteSpace: 'pre-wrap' }}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Compatibility check highlight inside takeover */}
                {adminSelectedSession.compatibilityCheck && (
                  <div className="px-4 py-2 bg-amber-500/10 border-t border-b border-amber-500/20 text-[10px] text-amber-300 font-light flex justify-between items-center">
                    <span>?????? Compatibility Search Details:</span>
                    <strong>
                      {adminSelectedSession.compatibilityCheck.name} ({adminSelectedSession.compatibilityCheck.formattedDate} at {adminSelectedSession.compatibilityCheck.formattedTime}, {adminSelectedSession.compatibilityCheck.location})
                    </strong>
                  </div>
                )}

                {/* Live Takeover input box */}
                <div className="p-3 border-t border-purple-500/25 bg-slate-950/80 flex flex-col gap-2">
                  <p className="text-[10px] text-purple-400 font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Takeover Interception Mode: Messages you send will appear on the user's screen as replies.
                  </p>
                  <div className="flex items-center gap-2">
                    <textarea 
                      value={adminChatInput}
                      onChange={(e) => setAdminChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendAdminMessage();
                        }
                      }}
                      rows="1"
                      className="flex-1 glass-input rounded-xl px-4 py-2.5 text-xs focus:outline-none resize-none scrollbar-none min-h-[38px] max-h-[80px]"
                      placeholder="Type interception message to send as Cosmic Guru AI..."
                    />
                    <button 
                      onClick={sendAdminMessage}
                      disabled={!adminChatInput.trim()}
                      className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 transition-colors shadow-lg active:scale-95 flex items-center justify-center cursor-pointer"
                    >
                      <Send className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

