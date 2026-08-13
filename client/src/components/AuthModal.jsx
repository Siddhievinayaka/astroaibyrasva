import React from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';

export default function AuthModal({
  showAuthModal,
  setShowAuthModal,
  authMode,
  setAuthMode,
  authName,
  setAuthName,
  authEmail,
  setAuthEmail,
  authMobile,
  setAuthMobile,
  authPassword,
  setAuthPassword,
  authOtp,
  setAuthOtp,
  authStep,
  setAuthStep,
  authError,
  setAuthError,
  handleAuthSubmit,
  handleVerifyOtp,
  handleResendOtp
}) {
  if (!showAuthModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl w-full max-w-md p-6 border border-indigo-500/35 relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={() => { setShowAuthModal(false); setAuthError(""); }}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          ✕
        </button>
        
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-indigo-500/20 pb-3 mb-4">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          {authStep === "otp" 
            ? "Verify Your Email" 
            : authMode === "login" 
              ? "Sign In to Cosmic Server" 
              : "Create Cosmic Account"
          }
        </h3>

        {authError && (
          <div className="p-3 mb-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {authError}
          </div>
        )}

        {authStep === "otp" ? (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4 mb-4">
            <p className="text-xs text-slate-300 font-light leading-relaxed">
              A 6-digit verification code has been sent to your email <strong className="text-indigo-300">{authEmail}</strong>. Please enter it below to verify your account.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Verification OTP Code</label>
              <input 
                type="text" 
                value={authOtp}
                onChange={(e) => setAuthOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                placeholder="123456"
                maxLength="6"
                className="w-full glass-input rounded-lg px-3.5 py-2.5 text-sm font-bold tracking-widest text-center focus:outline-none"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-600/25 mt-2"
            >
              Verify Account
            </button>
            <div className="flex justify-between items-center text-xs mt-2">
              <button 
                type="button"
                onClick={handleResendOtp}
                className="text-indigo-400 hover:text-indigo-300 font-semibold underline"
              >
                Resend OTP Code
              </button>
              <button 
                type="button"
                onClick={() => { setAuthStep("form"); setAuthError(""); }}
                className="text-slate-400 hover:text-slate-200"
              >
                Back to Signup
              </button>
            </div>
          </form>
        ) : (
          <>
            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4 mb-4">
              {authMode === "signup" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Your Name</label>
                    <input 
                      type="text" 
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full glass-input rounded-lg px-3.5 py-2.5 text-sm focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Mobile Number</label>
                    <input 
                      type="tel" 
                      value={authMobile}
                      onChange={(e) => setAuthMobile(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full glass-input rounded-lg px-3.5 py-2.5 text-sm focus:outline-none"
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full glass-input rounded-lg px-3.5 py-2.5 text-sm focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
                <input 
                  type="password" 
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full glass-input rounded-lg px-3.5 py-2.5 text-sm focus:outline-none"
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-600/25 mt-2"
              >
                {authMode === "login" ? "Sign In" : "Sign Up"}
              </button>
            </form>

            <div className="text-center text-xs text-slate-400">
              {authMode === "login" ? (
                <p>
                  Don't have an account?{" "}
                  <button 
                    onClick={() => { setAuthMode("signup"); setAuthError(""); }}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold underline"
                  >
                    Sign Up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button 
                    onClick={() => { setAuthMode("login"); setAuthError(""); }}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold underline"
                  >
                    Sign In
                  </button>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
