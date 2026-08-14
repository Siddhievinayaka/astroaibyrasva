import React, { useState, useEffect, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import { getPlanetaryPositions, getPanchang } from 'vedic-astro';
import { RefreshCw, Send, Sparkles, Info, Heart, Compass, Clock } from 'lucide-react';

// Components
import Header from './components/Header';
import AstroForm from './components/AstroForm';
import SavedProfiles from './components/SavedProfiles';
import { NorthIndianChart, SouthIndianChart } from './components/Charts';
import AuthModal from './components/AuthModal';
import AdminPanel from './components/AdminPanel';
import SettingsModal from './components/SettingsModal';

// Utilities
import {
  SIGN_INDEX,
  SIGN_DETAILS,
  HOUSE_SIGNIFICATIONS_LOCAL,
  calculateVimshottari,
  getDignity,
  parseSecondPerson,
  analyzeChartData,
  getKundali
} from './utils/astrologyEngine';

const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || !window.location.hostname)
  ? 'http://localhost:5000'
  : window.location.origin;

export default function App() {
  // Migrate old/restricted model names in localStorage to prevent errors
  const currentStoredModel = localStorage.getItem("gemini_astro_model");
  if (
    !currentStoredModel || 
    currentStoredModel === "gemini-1.5-pro" || 
    currentStoredModel === "gemini-1.5-flash" ||
    currentStoredModel === "gemini-2.5-flash" ||
    currentStoredModel === "gemini-2.5-pro"
  ) {
    localStorage.setItem("gemini_astro_model", "gemini-3.5-flash");
  }

  // Local state for profile inputs
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem("current_astro_profile");
    return saved ? JSON.parse(saved) : {
      name: "Vedic Explorer",
      date: "1995-10-18",
      time: "12:30",
      latitude: 28.6139,
      longitude: 77.2090,
      timezone: 5.5,
      locationName: "New Delhi, India"
    };
  });

  const [savedProfiles, setSavedProfiles] = useState([]);

  // Database Auth & Sync States
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("gemini_astro_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("gemini_astro_token") || null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" | "signup"
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authMobile, setAuthMobile] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authOtp, setAuthOtp] = useState("");
  const [authStep, setAuthStep] = useState("form"); // "form" | "otp"
  const [authError, setAuthError] = useState("");

  // Socket & Session States
  const [sessionId, setSessionId] = useState(() => {
    let id = localStorage.getItem("gemini_astro_session_id");
    if (!id) {
      id = 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("gemini_astro_session_id", id);
    }
    return id;
  });
  const socketRef = useRef(null);

  // Admin Dashboard States
  const [adminSessions, setAdminSessions] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminSelectedSession, setAdminSelectedSession] = useState(null);
  const [adminChatMessages, setAdminChatMessages] = useState([]);
  const [adminChatInput, setAdminChatInput] = useState("");
  const [adminTab, setAdminTab] = useState("sessions"); // "sessions" | "users"
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const [secondPerson, setSecondPerson] = useState(() => {
    const saved = localStorage.getItem("gemini_astro_second_person");
    return saved ? JSON.parse(saved) : null;
  });

  const [userSessions, setUserSessions] = useState([]);

  const [selectedPresetIndex, setSelectedPresetIndex] = useState(-1);
  const [chartType, setChartType] = useState("north"); // "north" | "south"
  const [activeTab, setActiveTab] = useState("chart"); // "chart" | "dasha" | "panchang"
  const [rightTab, setRightTab] = useState("chat"); // "chat" | "analysis"
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const analysis = useMemo(() => {
    if (!chartData || !chartData.planetaryData?.positions || !chartData.kundali?.ascendant) {
      return { activeYogas: [], lalKitabPlacements: [], lalKitabRemedies: [] };
    }
    return analyzeChartData(chartData.planetaryData.positions, chartData.kundali.ascendant);
  }, [chartData]);

  // Selected house detail on click
  const [selectedHouse, setSelectedHouse] = useState(1);

  // AI Chatbot States
  const [chatMessages, setChatMessages] = useState(() => {
    const saved = localStorage.getItem("astro_chat_history");
    return saved ? JSON.parse(saved) : [
      { role: 'model', text: "Namaste! I am your personal Cosmic Guru. Enter your birth details, load your Vedic Kundali, and let me decode your placements, active Dashas, and career or relationship potentials. Ask me anything!" }
    ];
  });
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  // Settings Modal State
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("gemini_astro_apikey") || "");
  const [apiBase, setApiBase] = useState(() => localStorage.getItem("gemini_astro_api_base") || "https://generativelanguage.googleapis.com");
  const [model, setModel] = useState(() => localStorage.getItem("gemini_astro_model") || "gemini-3.5-flash");
  const [suggestedKeyWarning, setSuggestedKeyWarning] = useState(!localStorage.getItem("gemini_astro_apikey"));

  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);

  // Geocoder Auto Suggestions
  const [searchQuery, setSearchQuery] = useState(profile.locationName);
  const [suggestions, setSuggestions] = useState([]);
  const searchTimeoutRef = useRef(null);

  const handleLocationSearch = (query) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`);
        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        console.error("Nominatim suggestion error:", err);
      }
    }, 400);
  };

  // Fetch profiles from backend if logged in
  const fetchProfiles = async (userToken) => {
    const activeToken = userToken || token;
    if (!activeToken) {
      const saved = localStorage.getItem("saved_astro_profiles_offline") || localStorage.getItem("saved_astro_profiles");
      setSavedProfiles(saved ? JSON.parse(saved) : []);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/profiles`, {
        headers: { "Authorization": `Bearer ${activeToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSavedProfiles(data);
      }
    } catch (err) {
      console.error("Error fetching profiles:", err);
    }
  };

  const fetchUserSessions = async (userToken) => {
    const activeToken = userToken || token;
    if (!activeToken) {
      setUserSessions([]);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/chats/sessions`, {
        headers: { "Authorization": `Bearer ${activeToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserSessions(data);
      }
    } catch (err) {
      console.error("Error fetching user chat sessions:", err);
    }
  };

  const loadUserSession = async (session) => {
    if (!token) return;
    try {
      setIsSending(true);
      const res = await fetch(`${API_URL}/api/chats/history/${session.sessionId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        
        // Map DB messages to chatMessages state structure
        const formattedMessages = data.map(m => ({
          role: m.role,
          text: m.text,
          secondPerson: m.compatibilityCheck || null
        }));
        
        setChatMessages(formattedMessages);
        localStorage.setItem("astro_chat_history", JSON.stringify(formattedMessages));
        
        // Set active sessionId to the loaded session
        setSessionId(session.sessionId);
        localStorage.setItem("gemini_astro_session_id", session.sessionId);
        
        // Re-join socket room for this session
        socketRef.current?.emit('join_session', { sessionId: session.sessionId, isAdmin: user?.role === 'admin' });
        
        // Extract and set second person details if found in the session history
        const lastCompatibility = data.slice().reverse().find(m => m.compatibilityCheck)?.compatibilityCheck;
        if (lastCompatibility) {
          setSecondPerson(lastCompatibility);
          localStorage.setItem("gemini_astro_second_person", JSON.stringify(lastCompatibility));
        } else {
          setSecondPerson(null);
          localStorage.removeItem("gemini_astro_second_person");
        }
      }
    } catch (err) {
      console.error("Error loading chat session history:", err);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
    fetchUserSessions();
    if (token) {
      fetch(`${API_URL}/api/chats/gemini-key`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.apiKey) {
          setApiKey(data.apiKey);
          setSuggestedKeyWarning(false);
        }
      })
      .catch(err => console.error("Error loading default API key:", err));
    }
  }, [token]);

  // Socket setup
  useEffect(() => {
    const socket = io(API_URL);
    socketRef.current = socket;

    socket.emit('join_session', { sessionId, isAdmin: user?.role === 'admin' });

    socket.on('connect', () => {
      // Re-enable user_visited event to trigger admin visit email notification
      socket.emit('user_visited', {
        sessionId,
        name: user?.name || null,
        email: user?.email || null,
        mobile: user?.mobile || null
      });
    });

    socket.on('message_received', (msg) => {
      if (msg.role === 'admin') {
        setChatMessages(prev => {
          const exists = prev.some(m => m.timestamp === msg.timestamp && m.text === msg.text);
          if (exists) return prev;
          return [...prev, { role: 'model', text: msg.text }];
        });
      }
    });

    if (user?.role === 'admin') {
      socket.on('session_active', () => fetchAdminActiveSessions());
      socket.on('admin_session_update', (data) => {
        const { sessionId: msgSessionId, message } = data;
        if (adminSelectedSession && adminSelectedSession.sessionId === msgSessionId) {
          setAdminChatMessages(prev => {
            const exists = prev.some(m => m._id === message._id);
            if (exists) return prev;
            return [...prev, message];
          });
        }
        fetchAdminActiveSessions();
      });
    }

    return () => {
      socket.disconnect();
    };
  }, [sessionId, user, adminSelectedSession]);

  // Admin triggers
  const fetchAdminActiveSessions = async () => {
    if (user?.role !== 'admin' || !token) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/active-sessions`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminSessions(data);
      }
    } catch (err) {
      console.error("Error fetching active sessions:", err);
    }
  };

  const fetchAdminUsers = async () => {
    if (user?.role !== 'admin' || !token) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminUsers(data);
      }
    } catch (err) {
      console.error("Error fetching admin users:", err);
    }
  };

  const selectAdminSession = async (session) => {
    setAdminSelectedSession(session);
    setAdminChatMessages([]);
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/chats/${session.sessionId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminChatMessages(data);
      }
    } catch (err) {
      console.error("Error loading admin chats:", err);
    }
  };

  const sendAdminMessage = () => {
    if (!adminSelectedSession || !adminChatInput.trim() || !socketRef.current) return;
    socketRef.current.emit('admin_message', {
      sessionId: adminSelectedSession.sessionId,
      text: adminChatInput
    });
    setAdminChatInput("");
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminActiveSessions();
      fetchAdminUsers();
      const interval = setInterval(fetchAdminActiveSessions, 10000);
      return () => clearInterval(interval);
    }
  }, [user, token]);

  const handleLogout = () => {
    localStorage.removeItem("gemini_astro_token");
    localStorage.removeItem("gemini_astro_user");
    setToken(null);
    setUser(null);
    fetchProfiles(null);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    const payload = authMode === "login" 
      ? { email: authEmail, password: authPassword }
      : { name: authName, email: authEmail, mobile: authMobile, password: authPassword };
    
    try {
      const endpoint = authMode === "login" ? "login" : "signup";
      const res = await fetch(`${API_URL}/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok) {
        if (authMode === "signup") {
          localStorage.setItem("gemini_astro_token", data.token);
          localStorage.setItem("gemini_astro_user", JSON.stringify(data.user));
          setToken(data.token);
          setUser(data.user);
          alert("Account created and verified successfully!");
          setShowAuthModal(false);
          setAuthName("");
          setAuthEmail("");
          setAuthMobile("");
          setAuthPassword("");
          setAuthOtp("");
          fetchProfiles(data.token);
        } else {
          localStorage.setItem("gemini_astro_token", data.token);
          localStorage.setItem("gemini_astro_user", JSON.stringify(data.user));
          setToken(data.token);
          setUser(data.user);
          setShowAuthModal(false);
          setAuthName("");
          setAuthEmail("");
          setAuthMobile("");
          setAuthPassword("");
          setAuthOtp("");
          fetchProfiles(data.token);
        }
      } else {
        if (data.unverified) {
          setAuthEmail(data.email);
          setAuthStep("otp");
          setAuthError(data.error);
        } else {
          setAuthError(data.error || "Authentication failed.");
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      setAuthError("Failed to connect to authentication server.");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setAuthError("");
    if (!authOtp.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, otp: authOtp })
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("gemini_astro_token", data.token);
        localStorage.setItem("gemini_astro_user", JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        setShowAuthModal(false);
        setAuthName("");
        setAuthEmail("");
        setAuthMobile("");
        setAuthPassword("");
        setAuthOtp("");
        setAuthStep("form");
        fetchProfiles(data.token);
        alert("Account verified and signed in successfully!");
      } else {
        setAuthError(data.error || "OTP verification failed.");
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      setAuthError("Failed to connect to verification server.");
    }
  };

  const handleResendOtp = async () => {
    setAuthError("");
    try {
      const res = await fetch(`${API_URL}/api/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail })
      });
      const data = await res.json();
      if (res.ok) {
        alert("A new OTP code has been sent to your email.");
      } else {
        setAuthError(data.error || "Failed to resend OTP.");
      }
    } catch (err) {
      console.error("OTP resend error:", err);
      setAuthError("Failed to connect to server.");
    }
  };

  const handleNewChat = () => {
    const newSessId = 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("gemini_astro_session_id", newSessId);
    setSessionId(newSessId);
    
    // Clear chat history in state & localStorage
    const initialMsg = [
      { role: 'model', text: "Namaste! I am your personal Cosmic Guru. Enter your birth details, load your Vedic Kundali, and let me decode your placements, active Dashas, and career or relationship potentials. Ask me anything!" }
    ];
    setChatMessages(initialMsg);
    localStorage.setItem("astro_chat_history", JSON.stringify(initialMsg));
    
    // Emit join session for the new session
    if (socketRef.current) {
      socketRef.current.emit('join_session', { sessionId: newSessId, isAdmin: user?.role === 'admin' });
      // Disabling user_visited websocket emit to prevent spamming admin's phone with WhatsApp alerts
      /*
      socket.emit('user_visited', {
        sessionId: newSessId,
        name: user?.name || null,
        email: user?.email || null,
        mobile: user?.mobile || null
      });
      */
    }
    
    // Clear second person memory
    setSecondPerson(null);
    localStorage.removeItem("gemini_astro_second_person");
  };

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem("current_astro_profile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    if (!token) {
      localStorage.setItem("saved_astro_profiles_offline", JSON.stringify(savedProfiles));
    }
  }, [savedProfiles, token]);

  useEffect(() => {
    localStorage.setItem("astro_chat_history", JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isSending]);

  // Fetch coordinates and geocode for profile
  const getAstroDataForDetails = async (date, time, locationQuery) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationQuery)}&format=json&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const first = data[0];
        const lat = parseFloat(first.lat);
        const lon = parseFloat(first.lon);
        
        let estimatedTz = Math.round((lon / 15) * 2) / 2;
        const displayName = first.display_name.toLowerCase();
        if (displayName.includes("india")) estimatedTz = 5.5;
        else if (displayName.includes("nepal")) estimatedTz = 5.75;
        else if (displayName.includes("sri lanka")) estimatedTz = 5.5;
        else if (displayName.includes("pakistan")) estimatedTz = 5.0;
        else if (displayName.includes("bangladesh")) estimatedTz = 6.0;

        const absTz = Math.abs(estimatedTz);
        const offsetHours = Math.floor(absTz);
        const offsetMins = Math.round((absTz % 1) * 60);
        const sign = estimatedTz >= 0 ? "+" : "-";
        const offsetStr = `${sign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;
        const formattedIso = `${date}T${time}:00${offsetStr}`;

        const loc = { latitude: lat, longitude: lon };
        const dateParam = { iso: formattedIso };

        const planetaryPositionsRaw = await getPlanetaryPositions(dateParam, loc);
        const customKundali = getKundali(planetaryPositionsRaw, { system: 'whole-sign' });
        
        const secondMoon = planetaryPositionsRaw.positions.find(p => p.name === 'Moon');
        let secondNakName = "N/A";
        let secondRashi = "N/A";
        if (secondMoon) {
          const nakIdx = Math.floor(secondMoon.longitude / 13.33333) % 27;
          secondNakName = [
            "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
            "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
            "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
          ][nakIdx];
          
          const rashiIdx = Math.floor(secondMoon.longitude / 30) % 12;
          secondRashi = SIGN_INDEX[rashiIdx];
        }

        return {
          locationName: first.display_name.split(',')[0] + ', ' + (first.display_name.split(',').slice(-1)[0] || '').trim(),
          latitude: lat,
          longitude: lon,
          timezone: estimatedTz,
          planetaryData: planetaryPositionsRaw,
          kundali: customKundali,
          lagna: customKundali.ascendant,
          rashi: secondRashi,
          nakshatra: secondNakName
        };
      }
    } catch (err) {
      console.error("Error geocoding location:", err);
    }
    return null;
  };

  const calculateChart = async (currentProfile) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const estimatedTz = currentProfile.timezone;
      const absTz = Math.abs(estimatedTz);
      const offsetHours = Math.floor(absTz);
      const offsetMins = Math.round((absTz % 1) * 60);
      const sign = estimatedTz >= 0 ? "+" : "-";
      const offsetStr = `${sign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;
      const formattedIso = `${currentProfile.date}T${currentProfile.time}:00${offsetStr}`;

      const loc = { latitude: currentProfile.latitude, longitude: currentProfile.longitude };
      const dateParam = { iso: formattedIso };

      const planetaryPositionsRaw = await getPlanetaryPositions(dateParam, loc);
      const customKundali = getKundali(planetaryPositionsRaw, { system: 'whole-sign' });
      const customPanchang = await getPanchang(planetaryPositionsRaw, loc);
      
      // Calculate Dashas
      const moon = planetaryPositionsRaw.positions.find(p => p.name === 'Moon');
      const calculatedDashas = moon ? calculateVimshottari(moon.longitude, currentProfile.date) : [];

      // Calculate Nakshatra & Vedic Birth Details
      let birthDetails = null;
      if (moon) {
        const moonLong = moon.longitude;
        const nakIdx = Math.floor(moonLong / 13.33333) % 27;
        const NAKSHATRAS = [
          "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
          "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
          "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
        ];
        const nakName = NAKSHATRAS[nakIdx];
        
        const moonRashiIdx = Math.floor(moonLong / 30) % 12;
        const moonRashi = SIGN_INDEX[moonRashiIdx];
        
        const lagnaSignIdx = SIGN_INDEX.indexOf(customKundali.ascendant);
        const moonHouseNum = ((moonRashiIdx - lagnaSignIdx + 12) % 12) + 1;

        const NAKSHATRA_GANAS = [
          "Deva", "Manushya", "Rakshasa", "Manushya", "Deva", "Manushya", "Deva", "Deva", "Rakshasa",
          "Rakshasa", "Manushya", "Manushya", "Deva", "Rakshasa", "Deva", "Rakshasa", "Deva", "Rakshasa",
          "Rakshasa", "Manushya", "Manushya", "Deva", "Rakshasa", "Rakshasa", "Manushya", "Manushya", "Deva"
        ];

        const NAKSHATRA_YONIS = [
          "Horse (Ashwa)", "Elephant (Gaja)", "Sheep (Mesha)", "Serpent (Sarpa)", "Serpent (Sarpa)", "Dog (Shvan)", "Cat (Marjara)", "Sheep (Mesha)", "Cat (Marjara)",
          "Rat (Mushaka)", "Rat (Mushaka)", "Cow (Gau)", "Buffalo (Mahisha)", "Tiger (Vyaghra)", "Buffalo (Mahisha)", "Tiger (Vyaghra)", "Deer (Mriga)", "Deer (Mriga)",
          "Dog (Shvan)", "Monkey (Vanara)", "Mongoose (Nakula)", "Monkey (Vanara)", "Lion (Simha)", "Horse (Ashwa)", "Lion (Simha)", "Cow (Gau)", "Elephant (Gaja)"
        ];

        const NAKSHATRA_NADIS = [
          "Adi", "Madhya", "Antya", "Antya", "Madhya", "Adi", "Adi", "Madhya", "Antya",
          "Antya", "Madhya", "Adi", "Adi", "Madhya", "Antya", "Antya", "Madhya", "Adi",
          "Adi", "Madhya", "Antya", "Antya", "Madhya", "Adi", "Adi", "Madhya", "Antya"
        ];

        const getVarna = (rashi) => {
          const b = ["Karka", "Vrishchika", "Meena"];
          const k = ["Mesha", "Simha", "Dhanu"];
          const v = ["Vrishabha", "Kanya", "Makara"];
          const s = ["Mithuna", "Tula", "Kumbha"];
          if (b.includes(rashi)) return "Brahmin (Intellectual)";
          if (k.includes(rashi)) return "Kshatriya (Leader)";
          if (v.includes(rashi)) return "Vaishya (Merchant)";
          if (s.includes(rashi)) return "Shudra (Service)";
          return "N/A";
        };

        const getPaya = (houseNum) => {
          const gold = [1, 6, 11];
          const silver = [2, 5, 9];
          const copper = [3, 7, 10];
          const iron = [4, 8, 12];
          if (gold.includes(houseNum)) return "Swarna (Gold) - Challenging";
          if (silver.includes(houseNum)) return "Rajat (Silver) - Very Auspicious";
          if (copper.includes(houseNum)) return "Tamra (Copper) - Auspicious";
          if (iron.includes(houseNum)) return "Loha (Iron) - Laborious";
          return "N/A";
        };

        const NAKSHATRA_LORDS = [
          "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
          "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
          "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"
        ];

        birthDetails = {
          nakshatra: nakName,
          nakshatraLord: NAKSHATRA_LORDS[nakIdx],
          gana: NAKSHATRA_GANAS[nakIdx],
          yoni: NAKSHATRA_YONIS[nakIdx],
          nadi: NAKSHATRA_NADIS[nakIdx],
          varna: getVarna(moonRashi),
          paya: getPaya(moonHouseNum),
          moonSign: moonRashi
        };
      }

      setChartData({
        locationName: currentProfile.locationName,
        latitude: currentProfile.latitude,
        longitude: currentProfile.longitude,
        timezone: currentProfile.timezone,
        planetaryData: planetaryPositionsRaw,
        kundali: customKundali,
        panchang: customPanchang,
        dashas: calculatedDashas,
        birthDetails: birthDetails
      });

      // Join chat room or send visited metadata once loaded
      // Disabling user_visited websocket emit to prevent spamming admin's phone with WhatsApp alerts
      /*
      socketRef.current?.emit('user_visited', {
        sessionId,
        name: user?.name || null,
        email: user?.email || null,
        mobile: user?.mobile || null
      });
      */

    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to compute planetary positions or draw chart. Please try again.");
      setChartData(null); // Clear stale chart data on calculation failures
    } finally {
      setLoading(false);
    }
  };

  // Run initial calculation on mount
  useEffect(() => {
    calculateChart(profile);
  }, []);

  const loadProfile = (prof) => {
    setProfile(prof);
    setSelectedPresetIndex(-1);
    setSearchQuery(prof.locationName);
    calculateChart(prof);
  };

  const saveProfile = async () => {
    const payload = {
      name: profile.name,
      date: profile.date,
      time: profile.time,
      latitude: profile.latitude,
      longitude: profile.longitude,
      timezone: profile.timezone,
      locationName: profile.locationName
    };

    if (!token) {
      // Local Save
      const exists = savedProfiles.some(p => p.name === profile.name);
      if (exists) {
        alert("A profile with this name already exists offline.");
        return;
      }
      setSavedProfiles(prev => [...prev, payload]);
      alert("Profile saved successfully to Local Storage!");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/profiles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setSavedProfiles(prev => [data, ...prev]);
        alert("Profile saved successfully to Database!");
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error}`);
      }
    } catch (err) {
      console.error("Save profile error:", err);
    }
  };

  const deleteProfile = async (profileToDelete) => {
    const profileId = profileToDelete._id;
    const nameToDelete = profileToDelete.name;

    if (!token || !profileId) {
      const updated = savedProfiles.filter(p => p.name !== nameToDelete);
      setSavedProfiles(updated);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/profiles/${profileId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setSavedProfiles(prev => prev.filter(p => p._id !== profileId));
      }
    } catch (err) {
      console.error("Error deleting profile:", err);
    }
  };

  // Local sandbox rules mock responses
  const generateLocalPrediction = (text) => {
    const lower = text.toLowerCase();
    let reply = `🔮 As your Cosmic Guru, I am analyzing your placements...\n\n`;

    if (lower.includes("career") || lower.includes("job") || lower.includes("success")) {
      reply += `House 10 represents your profession. Current active Dasha rules suggest focus on disciplined efforts. `;
      if (analysis.lalKitabPlacements.length > 0) {
        const firstLk = analysis.lalKitabPlacements[0];
        reply += `With ${firstLk.planet} in House ${firstLk.house}, Lal Kitab recommends: "${analysis.lalKitabRemedies.find(r => r.planet === firstLk.planet)?.remedy || 'Be honest'}".`;
      }
    } else if (lower.includes("love") || lower.includes("marriage") || lower.includes("spouse") || lower.includes("relationship")) {
      reply += `House 7 governs partnerships. Venus indicates attachment dynamics. Verify your Moon sign elements to balance compatibility.`;
    } else {
      reply += `Your sidereal Ascendant is **${chartData?.kundali?.ascendant || 'Lagna'}**. Focus on standard remedies for your chart: \n`;
      if (analysis.lalKitabRemedies.length > 0) {
        reply += analysis.lalKitabRemedies.slice(0, 2).map(r => `- ${r.remedy}`).join("\n");
      } else {
        reply += `- Offer water to the rising Sun daily\n- Avoid wearing black or dark blue clothes on critical days`;
      }
    }
  };

  const handleSendMessage = async (textToSend, isRetry = false, overrideKey = null) => {
    const queryText = textToSend || chatInput;
    const trimmed = queryText.trim();
    if (!trimmed || /^[.!?,\s]+$/.test(trimmed)) return;

    const activeApiKey = overrideKey || apiKey;

    setChatInput("");
    if (chatInputRef.current) chatInputRef.current.style.height = 'auto';
    setIsSending(true);

    const parsedSecond = parseSecondPerson(queryText);
    let activeSecond = secondPerson;
    let newSecondPersonInfo = null;

    try {
      // 1. Pre-fetch partner details if matched in current query
      if (parsedSecond) {
        const secondData = await getAstroDataForDetails(
          parsedSecond.formattedDate,
          parsedSecond.formattedTime,
          parsedSecond.location
        );
        if (secondData) {
          newSecondPersonInfo = {
            name: parsedSecond.name,
            birthDate: parsedSecond.formattedDate,
            birthTime: parsedSecond.formattedTime,
            locationName: secondData.locationName,
            latitude: secondData.latitude,
            longitude: secondData.longitude,
            timezone: secondData.timezone,
            lagna: secondData.lagna,
            rashi: secondData.rashi,
            nakshatra: secondData.nakshatra,
            planetaryData: secondData.planetaryData
          };
          activeSecond = newSecondPersonInfo;
          setSecondPerson(newSecondPersonInfo);
          localStorage.setItem("gemini_astro_second_person", JSON.stringify(newSecondPersonInfo));
        }
      }

      // 2. Append user message to history
      if (isRetry) {
        setChatMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0 && updated[updated.length - 1].isError) {
            updated.pop();
          }
          return updated;
        });
      } else {
        setChatMessages(prev => [...prev, { 
          role: 'user', 
          text: queryText,
          secondPerson: newSecondPersonInfo // attach if just loaded in this message
        }]);
      }

      // 3. Emit user message to Socket
      socketRef.current?.emit('user_message', {
        sessionId,
        userId: user?.id || null,
        text: queryText,
        compatibilityCheck: newSecondPersonInfo
      });

      if (!activeApiKey) {
        setTimeout(() => {
          const fallbackText = generateLocalPrediction(queryText);
          setChatMessages(prev => [...prev, { role: 'model', text: fallbackText }]);
          setIsSending(false);
          socketRef.current?.emit('model_message', {
            sessionId,
            userId: user?.id || null,
            text: fallbackText
          });
          fetchUserSessions();
        }, 1000);
        return;
      }

      // 4. Construct AI System Context (incorporating persistent partner details)
      let secondPersonContext = "";
      if (activeSecond && activeSecond.planetaryData?.positions) {
        const secondLagna = activeSecond.lagna;
        const secondLagnaSignIdx = SIGN_INDEX.indexOf(secondLagna);
        
        const planetPlacements = activeSecond.planetaryData.positions.map(p => {
          const rashiIdx = Math.floor(p.longitude / 30);
          const rashi = SIGN_INDEX[rashiIdx];
          const degree = (p.longitude % 30).toFixed(2);
          const houseIdxCalc = secondLagnaSignIdx !== -1 ? ((rashiIdx - secondLagnaSignIdx + 12) % 12) + 1 : 1;
          return `- ${p.name}: in ${rashi} (${SIGN_DETAILS[rashi]?.english}) at ${degree}°, located in House ${houseIdxCalc}.`;
        }).join("\n");

        secondPersonContext = `
Birth Details of Second Person (${activeSecond.name}):
- Name: ${activeSecond.name}
- Born: ${activeSecond.birthDate} at ${activeSecond.birthTime}
- Place: ${activeSecond.locationName} (Lat: ${activeSecond.latitude}, Lng: ${activeSecond.longitude})
- Sidereal Ascendant (Lagna): ${secondLagna} (${SIGN_DETAILS[secondLagna]?.english})
- Moon Sign (Rashi): ${activeSecond.rashi}
- Nakshatra: ${activeSecond.nakshatra}

Planetary Placements of Second Person (${activeSecond.name}):
${planetPlacements}
`;
      }

      let chartContext = "";
      if (chartData) {
        const lagna = chartData.kundali.ascendant;
        const activeDasha = chartData.dashas.find(d => d.isActive);
        const planetPlacementText = chartData.planetaryData.positions.map(p => {
          const rashiIdx = Math.floor(p.longitude / 30);
          const rashi = SIGN_INDEX[rashiIdx];
          const degree = (p.longitude % 30).toFixed(2);
          const houseIdx = chartData.kundali.houses.findIndex(h => h.sign === rashi) + 1;
          return `- ${p.name}: in ${rashi} (${SIGN_DETAILS[rashi]?.english}) at ${degree}°, located in House ${houseIdx}. Retrograde: ${p.isRetrograde ? "Yes" : "No"}`;
        }).join("\n");

        const yogaListText = analysis.activeYogas.map(y => `- ${y.name}: ${y.description}`).join("\n");
        const lkPlacementsText = analysis.lalKitabPlacements.map(p => `- ${p.planet} in House ${p.house}: ${p.prediction}`).join("\n");
        const lkRemediesText = analysis.lalKitabRemedies.map(r => `- For ${r.planet} in House ${r.house}: ${r.remedy}`).join("\n");

        chartContext = `
Your Birth Profile (${profile.name}):
- Born: ${profile.date} at ${profile.time}
- Coordinates: Lat: ${chartData.latitude}, Lng: ${chartData.longitude}
- Timezone Offset: GMT ${chartData.timezone >= 0 ? `+${chartData.timezone}` : chartData.timezone}
- Sidereal Ascendant (Lagna): ${lagna} (${SIGN_DETAILS[lagna]?.english})
- Active Mahadasha Period: ${activeDasha ? `${activeDasha.ruler} Dasha (ends ${new Date(activeDasha.end).toLocaleDateString()})` : "None"}

Your Sidereal Planetary Placements:
${planetPlacementText}

Vedic Yogas computed in your chart:
${yogaListText || "None detected"}

Lal Kitab Placements & Predictions:
${lkPlacementsText}

Lal Kitab Actionable Remedies (Upayas) & Guidelines:
${lkRemediesText}
`;
      }

      // Find the first index where role is 'user' to begin history
      const firstUserIndex = chatMessages.findIndex(msg => msg.role === 'user');
      const historyContents = [];
      let lastRole = null;

      // Filter and build alternating history contents starting from the first user message
      for (let i = firstUserIndex !== -1 ? firstUserIndex : 0; i < chatMessages.length; i++) {
        const msg = chatMessages[i];
        if (msg.isError) continue;
        if (msg.role === 'admin' || msg.role === 'model') {
          if (lastRole === 'model') {
            const lastMsg = historyContents[historyContents.length - 1];
            if (lastMsg && lastMsg.parts && lastMsg.parts[0]) {
              lastMsg.parts[0].text += "\n\n" + msg.text;
            }
          } else {
            historyContents.push({ role: 'model', parts: [{ text: msg.text }] });
            lastRole = 'model';
          }
        } else if (msg.role === 'user') {
          if (lastRole === 'user') {
            const lastMsg = historyContents[historyContents.length - 1];
            if (lastMsg && lastMsg.parts && lastMsg.parts[0]) {
              lastMsg.parts[0].text += "\n\n" + msg.text;
            }
          } else {
            historyContents.push({ role: 'user', parts: [{ text: msg.text }] });
            lastRole = 'user';
          }
        }
      }

      // Append/merge current user queryText
      if (lastRole === 'user') {
        const lastMsg = historyContents[historyContents.length - 1];
        if (lastMsg && lastMsg.parts && lastMsg.parts[0]) {
          lastMsg.parts[0].text += "\n\n" + queryText;
        }
      } else {
        historyContents.push({ role: 'user', parts: [{ text: queryText }] });
      }

      const currentDateText = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const systemInstructionText = `You are a highly premium, intuitive, and accurate ENTP 7w6 Vedic AI Astrologer named "Cosmic Guru".
You advise a user interested in Jyotish.
You strictly ground your predictions in the Sidereal planetary coordinates, Vedic Yogas, and Lal Kitab placements provided below.

Today's Date: ${currentDateText}

Here is the birth chart data of the user:
${chartContext}
${secondPersonContext ? `The user has loaded compatibility details for a second person:\n${secondPersonContext}` : ""}

Directives:
1. Provide highly specific advice using the active Yogas and Lal Kitab remedies. Keep replies premium, deep, and astrological.
2. If compatibility details of a second person are loaded, ALWAYS keep this second person's details in mind throughout the entire conversation, referencing them when relevant, comparing their placements to the user's, and providing insights about their dynamics (e.g. element matches, Lagna compatibility, Nakshatra compatibility).
3. Keep formatting clean with bullet points and bold highlights. Avoid long blocks of generic warnings.`;

      const response = await fetch(`${apiBase}/v1beta/models/${model}:streamGenerateContent?alt=sse`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-goog-api-key': activeApiKey
        },
        body: JSON.stringify({
          contents: historyContents,
          systemInstruction: {
            parts: [{ text: systemInstructionText }]
          },
          generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
          ]
        })
      });

      if (!response.ok) {
        if ((response.status === 429 || response.status === 503 || response.status === 500) && token) {
          console.warn(`Gemini API returned status ${response.status}. Attempting automatic key rotation...`);
          try {
            const rotateRes = await fetch(`${API_URL}/api/chats/rotate-key`, {
              method: 'POST',
              headers: { "Authorization": `Bearer ${token}` }
            });
            if (rotateRes.ok) {
              const rotateData = await rotateRes.json();
              if (rotateData.apiKey) {
                setApiKey(rotateData.apiKey);
                localStorage.setItem("gemini_astro_apikey", rotateData.apiKey);
                return handleSendMessage(queryText, true, rotateData.apiKey);
              }
            }
          } catch (rotateErr) {
            console.error("Failed to rotate API key:", rotateErr);
          }
        }
        throw new Error(`API returned error ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = '';
      let accumulatedText = "";

      setChatMessages(prev => [...prev, { role: 'model', text: "" }]);

      const parseAndAppendChunk = (line) => {
        const cleaned = line.trim();
        if (cleaned.startsWith('data: ')) {
          const dataStr = cleaned.substring(6).trim();
          if (dataStr === '[DONE]') return;
          try {
            const json = JSON.parse(dataStr);
            const textChunk = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (textChunk) {
              accumulatedText += textChunk;
              setChatMessages(prev => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (lastIdx >= 0 && updated[lastIdx].role === 'model') {
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    text: updated[lastIdx].text + textChunk
                  };
                }
                return updated;
              });
            }
          } catch (err) {}
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (buffer.trim()) parseAndAppendChunk(buffer);
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          parseAndAppendChunk(line);
        }
      }

      socketRef.current?.emit('model_message', {
        sessionId,
        userId: user?.id || null,
        text: accumulatedText
      });

    } catch (e) {
      console.error(e);
      let errorText = "⚠️ Error contacting Gemini API. Please check your API key settings.";
      setChatMessages(prev => [...prev, { role: 'model', text: errorText, isError: true, retryText: queryText }]);
    } finally {
      setIsSending(false);
      fetchUserSessions();
    }
  };

  const handleSaveSettings = (keyVal, modelVal, apiBaseVal) => {
    localStorage.setItem("gemini_astro_apikey", keyVal);
    localStorage.setItem("gemini_astro_model", modelVal);
    localStorage.setItem("gemini_astro_api_base", apiBaseVal);
    setApiKey(keyVal);
    setModel(modelVal);
    setApiBase(apiBaseVal);
    setShowSettings(false);
    setSuggestedKeyWarning(!keyVal);
  };

  const activeHouseData = useMemo(() => {
    if (!chartData || !chartData.kundali) return null;
    const signName = chartData.kundali.houses[selectedHouse - 1]?.sign;
    const planetsInHouse = chartData.kundali.houses[selectedHouse - 1]?.planets || [];
    const houseSig = HOUSE_SIGNIFICATIONS_LOCAL.find(h => h.house === selectedHouse);
    
    // Calculate custom Lal Kitab placements and remedies for this selected house
    const lkPlacements = analysis.lalKitabPlacements.filter(p => p.house === selectedHouse);
    const lkRemedies = analysis.lalKitabRemedies.filter(r => r.house === selectedHouse);

    return {
      house: selectedHouse,
      sign: signName,
      signDetails: SIGN_DETAILS[signName],
      planets: planetsInHouse,
      signification: houseSig,
      lalKitab: lkPlacements,
      remedies: lkRemedies
    };
  }, [chartData, selectedHouse, analysis]);

  return (
    <div className="min-h-screen flex flex-col font-sans overflow-x-hidden selection:bg-indigo-500/35 selection:text-white pb-6">
      <Header 
        suggestedKeyWarning={suggestedKeyWarning}
        user={user}
        handleLogout={handleLogout}
        setAuthMode={setAuthMode}
        setShowAuthModal={setShowAuthModal}
        showAdminPanel={showAdminPanel}
        setShowAdminPanel={setShowAdminPanel}
        fetchAdminActiveSessions={fetchAdminActiveSessions}
        fetchAdminUsers={fetchAdminUsers}
        setShowSettings={setShowSettings}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto p-3 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Birth Profile & Saved Lists (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <AstroForm 
            profile={profile}
            setProfile={setProfile}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            suggestions={suggestions}
            setSuggestions={setSuggestions}
            selectedPresetIndex={selectedPresetIndex}
            setSelectedPresetIndex={setSelectedPresetIndex}
            handleLocationSearch={handleLocationSearch}
            loading={loading}
            handleSubmit={(e) => { e.preventDefault(); calculateChart(profile); }}
            onSaveProfile={saveProfile}
          />

          <SavedProfiles 
            savedProfiles={savedProfiles}
            loadProfile={loadProfile}
            deleteProfile={deleteProfile}
            user={user}
            token={token}
          />

          {/* Past Consultations List */}
          {token && user && userSessions.length > 0 && (
            <div className="glass-card rounded-2xl p-5 flex flex-col gap-3 border border-indigo-500/15">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                Past Consultations
              </h3>
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                {userSessions.map((s, idx) => (
                  <div 
                    key={idx} 
                    className={`flex items-center justify-between p-2.5 rounded-xl border hover:border-indigo-500/30 group transition-colors cursor-pointer ${
                      sessionId === s.sessionId 
                        ? 'bg-indigo-600/10 border-indigo-500/40' 
                        : 'bg-slate-900/40 border-indigo-500/5'
                    }`}
                    onClick={() => loadUserSession(s)}
                  >
                    <div className="flex-1 text-left text-xs font-medium text-slate-300">
                      <p className="font-semibold text-slate-200">Consultation {s.sessionId.substring(5, 11)}...</p>
                      <p className="text-[9.5px] text-indigo-400 truncate mt-0.5 max-w-[190px]">
                        Last: "{s.lastMessage}"
                      </p>
                      <p className="text-[8px] text-slate-500 font-mono mt-0.5">
                        {new Date(s.lastTimestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Middle Column: Chart Draw & Placements (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-card rounded-2xl p-5 border border-indigo-500/15 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-indigo-400" />
                Vedic Birth Chart (D-1)
              </h2>
              <div className="flex bg-slate-50 p-0.5 rounded-lg border border-indigo-500/5">
                <button 
                  onClick={() => setChartType("north")}
                  className={`px-2 py-1 text-[9px] font-bold uppercase rounded-md transition-colors ${
                    chartType === "north" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  North
                </button>
                <button 
                  onClick={() => setChartType("south")}
                  className={`px-2 py-1 text-[9px] font-bold uppercase rounded-md transition-colors ${
                    chartType === "south" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  South
                </button>
              </div>
            </div>

            {errorMsg ? (
              <div className="text-xs text-rose-500 font-medium py-16">{errorMsg}</div>
            ) : chartData ? (
              <div className="w-full max-w-[320px] aspect-square rounded-2xl bg-white/70 p-3 border border-indigo-500/5 shadow-inner">
                {chartType === "north" ? (
                  <NorthIndianChart 
                    houses={chartData.kundali.houses} 
                    ascendant={chartData.kundali.ascendant} 
                    selectedHouse={selectedHouse}
                    onSelectHouse={setSelectedHouse}
                  />
                ) : (
                  <SouthIndianChart 
                    houses={chartData.kundali.houses} 
                    ascendant={chartData.kundali.ascendant} 
                    selectedHouse={selectedHouse}
                    onSelectHouse={setSelectedHouse}
                  />
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-16">No chart computed. Please click calculate.</div>
            )}
            
            <p className="text-[10px] text-slate-400 font-light mt-3 text-center">
              💡 <strong>Click inside any house</strong> to display details, planetary dignities, Lal Kitab predictions and specific remedies below.
            </p>
          </div>

          {/* Vedic Birth Details Card */}
          {chartData?.birthDetails && (
            <div className="glass-card rounded-2xl p-5 border border-indigo-500/15 flex flex-col gap-3.5">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest border-b border-indigo-500/10 pb-2 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Vedic Birth Attributes (Panchanga)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50/60 p-2.5 rounded-xl border border-indigo-500/5">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Janma Nakshatra</span>
                  <span className="text-xs text-slate-700 font-semibold">{chartData.birthDetails.nakshatra} ({chartData.birthDetails.nakshatraLord})</span>
                </div>
                <div className="bg-slate-50/60 p-2.5 rounded-xl border border-indigo-500/5">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Janma Rashi (Moon)</span>
                  <span className="text-xs text-slate-700 font-semibold">{chartData.birthDetails.moonSign}</span>
                </div>
                <div className="bg-slate-50/60 p-2.5 rounded-xl border border-indigo-500/5">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Varna (Cast/Type)</span>
                  <span className="text-xs text-slate-700 font-semibold">{chartData.birthDetails.varna}</span>
                </div>
                <div className="bg-slate-50/60 p-2.5 rounded-xl border border-indigo-500/5">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Gana (Temperament)</span>
                  <span className="text-xs text-slate-700 font-semibold">{chartData.birthDetails.gana}</span>
                </div>
                <div className="bg-slate-50/60 p-2.5 rounded-xl border border-indigo-500/5">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Yoni (Animal Symbology)</span>
                  <span className="text-xs text-slate-700 font-semibold">{chartData.birthDetails.yoni}</span>
                </div>
                <div className="bg-slate-50/60 p-2.5 rounded-xl border border-indigo-500/5">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nadi (Internal Health)</span>
                  <span className="text-xs text-slate-700 font-semibold">{chartData.birthDetails.nadi}</span>
                </div>
              </div>
              <div className="bg-amber-500/5 p-3 rounded-xl border border-amber-500/10 text-xs text-amber-300 flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400/80">Janma Moon Paya (Footing):</span>
                <span className="font-semibold text-xs">{chartData.birthDetails.paya}</span>
              </div>
            </div>
          )}

          {/* House Details Panel */}
          {activeHouseData && (
            <div className="glass-card rounded-2xl p-5 border border-indigo-500/15 flex-1">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest border-b border-indigo-500/10 pb-2 mb-3 flex items-center justify-between">
                <span>🏠 House {activeHouseData.house} Placements</span>
                <span className="text-[10px] text-indigo-400 font-medium lowercase italic">
                  in {activeHouseData.sign} ({activeHouseData.signDetails?.english})
                </span>
              </h3>
              
              <div className="flex flex-col gap-3">
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Bhava Signification</span>
                  <p className="text-[11px] text-slate-600 font-light mt-0.5 leading-relaxed">
                    <strong>{activeHouseData.signification?.name}</strong>: {activeHouseData.signification?.details}
                  </p>
                </div>

                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Planets Here</span>
                  {activeHouseData.planets.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic font-light mt-0.5">Empty house (aspect check recommended).</p>
                  ) : (
                    <div className="flex flex-col gap-1.5 mt-1.5">
                      {activeHouseData.planets.map((planet, pIdx) => {
                        const planetPos = chartData?.planetaryData?.positions.find(p => p.name === planet);
                        const degreeVal = planetPos ? (planetPos.longitude % 30).toFixed(2) : "0.00";
                        const isRetro = planetPos?.isRetrograde;
                        return (
                          <div key={pIdx} className="px-3 py-2 rounded-xl bg-slate-50 border border-indigo-500/5 text-xs text-slate-700 flex items-center justify-between font-semibold">
                            <span className="flex items-center gap-1.5">
                              {planet} {isRetro && <span className="text-[9px] px-1 bg-amber-500/15 text-amber-500 rounded font-bold uppercase tracking-wider">Rx</span>}
                            </span>
                            <span className="text-[10px] text-slate-400 font-light">
                              {degreeVal}° {getDignity(planet, activeHouseData.sign)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {activeHouseData.lalKitab.length > 0 && (
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Lal Kitab Placements</span>
                    {activeHouseData.lalKitab.map((lk, lkIdx) => (
                      <div key={lkIdx} className="mt-1 p-2 rounded-xl bg-purple-500/5 border border-purple-500/10 text-[10px] text-purple-400 font-light leading-relaxed">
                        <strong>{lk.planet} Prediction:</strong> {lk.prediction}
                      </div>
                    ))}
                  </div>
                )}

                {activeHouseData.remedies.length > 0 && (
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Lal Kitab Upayas (Remedies)</span>
                    <div className="flex flex-col gap-1 mt-1">
                      {activeHouseData.remedies.map((rem, remIdx) => (
                        <div key={remIdx} className="p-2 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[10px] text-amber-300 font-medium leading-relaxed">
                          📌 {rem.remedy}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Guru Chat Console & Vedic Yogas Details (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex bg-slate-50 p-0.5 rounded-xl border border-indigo-500/5">
            <button 
              onClick={() => setRightTab("chat")}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${
                rightTab === "chat" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-700"
              }`}
            >
              Cosmic Guru AI
            </button>
            <button 
              onClick={() => setRightTab("analysis")}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${
                rightTab === "analysis" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-700"
              }`}
            >
              Yogas & Lal Kitab
            </button>
          </div>

          {rightTab === "chat" ? (
            <div className="glass-card rounded-2xl border border-indigo-500/15 flex flex-col h-[520px] overflow-hidden">
              {/* Chat Subheader */}
              <div className="px-4 py-2.5 bg-slate-950/20 border-b border-indigo-500/10 flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Active Consultation</span>
                <button
                  onClick={handleNewChat}
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-[9px] font-bold uppercase text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer active:scale-95 flex items-center gap-1 shadow-sm"
                >
                  <span>+</span> New Chat
                </button>
              </div>

              {/* Chat Log history */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {chatMessages.map((msg, idx) => (
                  <React.Fragment key={idx}>
                    <div 
                      className={`flex flex-col max-w-[85%] ${
                        msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 mb-1 font-semibold">
                        {msg.role === 'user' ? 'You' : 'Guru'}
                      </span>
                      <div 
                        className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-none border border-indigo-400/20'
                            : 'bg-slate-950/60 text-slate-200 border border-indigo-500/10 rounded-tl-none font-light'
                        }`}
                        style={{ whiteSpace: 'pre-wrap' }}
                      >
                        {msg.text || (
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </span>
                        )}
                        {msg.isError && msg.retryText && (
                          <div className="mt-2.5">
                            <button
                              onClick={() => handleSendMessage(msg.retryText, true)}
                              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[10px] shadow active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Retry Question
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Standalone premium card for loaded partner details */}
                    {msg.secondPerson && (
                      <div className="self-center my-3 w-full max-w-[320px] animate-[fadeIn_0.4s_ease-out]">
                        <div className="relative overflow-hidden rounded-2xl p-4 shadow-xl backdrop-blur-md synastry-card">
                          
                          {/* Glow effect in background */}
                          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-pink-500/10 blur-2xl"></div>
                          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl"></div>
                          
                          {/* Header */}
                          <div className="relative flex items-center justify-between pb-2 border-b border-indigo-500/10">
                            <div className="flex items-center gap-1.5">
                              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-pink-500/10 border border-pink-500/20 animate-pulse">
                                <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400/20" />
                              </div>
                              <span className="text-[10px] font-extrabold uppercase tracking-wider synastry-card-highlight">
                                Comparative Chart Loaded
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[9px] text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded-full border border-indigo-500/5">
                              <Sparkles className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
                              <span>Synastry Sync</span>
                            </div>
                          </div>

                          {/* Content Body */}
                          <div className="relative mt-3 flex flex-col gap-2">
                            {/* Partner Name */}
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold synastry-card-label">Partner:</span>
                              <span className="text-xs font-black synastry-card-highlight">
                                {msg.secondPerson.name}
                              </span>
                            </div>

                            {/* Details list */}
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              <div className="flex flex-col p-1.5 rounded-lg synastry-card-pill">
                                <span className="text-[8px] uppercase tracking-wider synastry-card-label">Birth Date</span>
                                <span className="text-[10px] font-semibold synastry-card-value">{msg.secondPerson.birthDate}</span>
                              </div>
                              <div className="flex flex-col p-1.5 rounded-lg synastry-card-pill">
                                <span className="text-[8px] uppercase tracking-wider synastry-card-label">Birth Time</span>
                                <span className="text-[10px] font-semibold synastry-card-value">{msg.secondPerson.birthTime}</span>
                              </div>
                            </div>

                            {/* Place */}
                            <div className="flex flex-col p-1.5 rounded-lg w-full synastry-card-pill">
                              <span className="text-[8px] uppercase tracking-wider synastry-card-label">Birth Place</span>
                              <span className="text-[10px] font-semibold truncate synastry-card-value" title={msg.secondPerson.locationName}>
                                {msg.secondPerson.locationName}
                              </span>
                            </div>

                            {/* Vedic Placements Grid */}
                            <div className="mt-2 pt-2 border-t border-indigo-500/10 grid grid-cols-3 gap-1.5 text-center">
                              
                              {/* Lagna (Ascendant) */}
                              <div className="relative overflow-hidden p-2 rounded-xl border border-amber-500/30 synastry-card-pill">
                                <span className="block text-[7px] text-amber-500 font-bold uppercase tracking-wider mb-0.5">Lagna</span>
                                <span className="text-[10px] font-bold synastry-card-amber flex items-center justify-center gap-0.5">
                                  {msg.secondPerson.lagna} 
                                  <span className="font-medium text-[9px]" title={SIGN_DETAILS[msg.secondPerson.lagna]?.english}>
                                    {SIGN_DETAILS[msg.secondPerson.lagna]?.symbol}
                                  </span>
                                </span>
                              </div>

                              {/* Rashi (Moon Sign) */}
                              <div className="relative overflow-hidden p-2 rounded-xl border border-indigo-500/30 synastry-card-pill">
                                <span className="block text-[7px] text-indigo-400 font-bold uppercase tracking-wider mb-0.5">Rashi</span>
                                <span className="text-[10px] font-bold synastry-card-indigo flex items-center justify-center gap-0.5">
                                  {msg.secondPerson.rashi}
                                  <span className="font-medium text-[9px]" title={SIGN_DETAILS[msg.secondPerson.rashi]?.english}>
                                    {SIGN_DETAILS[msg.secondPerson.rashi]?.symbol}
                                  </span>
                                </span>
                              </div>

                              {/* Nakshatra */}
                              <div className="relative overflow-hidden p-2 rounded-xl border border-purple-500/30 synastry-card-pill">
                                <span className="block text-[7px] text-purple-400 font-bold uppercase tracking-wider mb-0.5">Nakshatra</span>
                                <span className="text-[9px] font-bold truncate block w-full synastry-card-purple" title={msg.secondPerson.nakshatra}>
                                  {msg.secondPerson.nakshatra}
                                </span>
                              </div>

                            </div>

                          </div>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Suggest chips */}
              {chartData && token && (
                <div className="px-4 py-2 border-t border-indigo-500/10 bg-slate-950/30 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
                  <button 
                    onClick={() => handleSendMessage("What does my chart say about my career and success?")}
                    className="px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 rounded-full text-[10px] font-medium text-indigo-300 transition-colors"
                  >
                    💼 Career Prospects
                  </button>
                  <button 
                    onClick={() => handleSendMessage("Explain my Lagna (Ascendant) and Moon sign placements.")}
                    className="px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 rounded-full text-[10px] font-medium text-indigo-300 transition-colors"
                  >
                    ♈ Lagna Placements
                  </button>
                </div>
              )}

              {/* Input console lock block */}
              {!token ? (
                <div className="p-4 border-t border-indigo-500/20 bg-slate-950/80 flex flex-col items-center justify-center text-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4.5 h-4.5 text-indigo-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Cosmic Guru is Locked</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Please register and log in to consult the AI Guru.</p>
                  </div>
                  <button
                    onClick={() => { setAuthMode("signup"); setShowAuthModal(true); }}
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider active:scale-95 transition-all shadow cursor-pointer font-sans"
                  >
                    Register / Login
                  </button>
                </div>
              ) : (
                <div className="p-3 border-t border-indigo-500/20 bg-slate-950/60 flex items-center gap-2">
                  <textarea 
                    ref={chatInputRef}
                    value={chatInput}
                    onChange={(e) => {
                      setChatInput(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (!isSending && chatInput.trim()) handleSendMessage();
                      }
                    }}
                    rows="1"
                    className="flex-1 glass-input rounded-xl px-4 py-2.5 text-xs focus:outline-none resize-none scrollbar-none min-h-[36px] max-h-[120px]"
                    placeholder="Ask about your birth chart, yogas, dasha..."
                    disabled={isSending}
                  />
                  <button 
                    onClick={() => handleSendMessage()}
                    disabled={isSending || !chatInput.trim()}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors shadow-lg active:scale-95 flex items-center justify-center cursor-pointer"
                  >
                    <Send className="w-4.5 h-4.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-5 border border-indigo-500/15 flex flex-col gap-5 overflow-hidden h-[520px] overflow-y-auto">
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest border-b border-indigo-500/10 pb-2 mb-3">
                  🌟 Active Vedic Yogas
                </h3>
                {analysis.activeYogas.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic font-light">No major classic Vedic Yogas detected in Sidereal coordinates.</p>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {analysis.activeYogas.map((yoga, yIdx) => (
                      <div key={yIdx} className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                        <h4 className="text-xs font-bold text-indigo-400">{yoga.name}</h4>
                        <p className="text-[10px] text-slate-500 font-light mt-0.5 leading-relaxed">{yoga.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest border-b border-indigo-500/10 pb-2 mb-3">
                  🔮 Lal Kitab General Predictions
                </h3>
                {analysis.lalKitabPlacements.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic font-light">Loading planetary placements...</p>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {analysis.lalKitabPlacements.map((lk, lkIdx) => (
                      <div key={lkIdx} className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                        <h4 className="text-xs font-bold text-purple-400">{lk.planet} in House {lk.house}</h4>
                        <p className="text-[10px] text-slate-500 font-light mt-0.5 leading-relaxed">{lk.prediction}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Auth Modal popup */}
      <AuthModal 
        showAuthModal={showAuthModal}
        setShowAuthModal={setShowAuthModal}
        authMode={authMode}
        setAuthMode={setAuthMode}
        authName={authName}
        setAuthName={setAuthName}
        authEmail={authEmail}
        setAuthEmail={setAuthEmail}
        authMobile={authMobile}
        setAuthMobile={setAuthMobile}
        authPassword={authPassword}
        setAuthPassword={setAuthPassword}
        authOtp={authOtp}
        setAuthOtp={setAuthOtp}
        authStep={authStep}
        setAuthStep={setAuthStep}
        authError={authError}
        setAuthError={setAuthError}
        handleAuthSubmit={handleAuthSubmit}
        handleVerifyOtp={handleVerifyOtp}
        handleResendOtp={handleResendOtp}
      />

      {/* Admin Panel takeover dashboard */}
      <AdminPanel 
        showAdminPanel={showAdminPanel}
        setShowAdminPanel={setShowAdminPanel}
        user={user}
        adminTab={adminTab}
        setAdminTab={setAdminTab}
        adminSessions={adminSessions}
        adminUsers={adminUsers}
        adminSelectedSession={adminSelectedSession}
        selectAdminSession={selectAdminSession}
        adminChatMessages={adminChatMessages}
        adminChatInput={adminChatInput}
        setAdminChatInput={setAdminChatInput}
        sendAdminMessage={sendAdminMessage}
      />

      {/* Settings Modal config */}
      <SettingsModal 
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        apiKey={apiKey}
        model={model}
        apiBase={apiBase}
        handleSaveSettings={handleSaveSettings}
      />
    </div>
  );
}
