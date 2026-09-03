import React, { useState, Suspense } from 'react';
import { Shield, Lock, User, Mail, ArrowRight, Eye, EyeOff, ShieldCheck, Compass, AlertCircle, UserPlus, LogIn } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import InteractiveEarth from './InteractiveEarth';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

export default function LoginPortal({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState('investigator');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const roleNameMap = {
    investigator: 'Senior IO Rajesh Varma',
    analyst: 'Intelligence Analyst Priya Sen',
    admin: 'Chief Administrator',
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please provide both email and password.');
      return;
    }

    setLoading(true);

    try {
      let userCredential;

      if (isSignUp) {
        // Firebase Sign Up
        userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;

        const displayName = fullName.trim() || roleNameMap[role] || email.split('@')[0];
        try {
          await updateProfile(user, { displayName });
        } catch (profileErr) {
          console.warn('Profile update error:', profileErr);
        }

        const authData = {
          access_token: await user.getIdToken(),
          role: role,
          username: email.split('@')[0],
          full_name: displayName,
          email: user.email,
        };

        localStorage.setItem('crime_auth_token', authData.access_token);
        localStorage.setItem('crime_user_role', authData.role);
        localStorage.setItem('crime_user_name', authData.full_name);

        onLoginSuccess(authData);
      } else {
        // Firebase Sign In
        userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;

        const authData = {
          access_token: await user.getIdToken(),
          role: role,
          username: email.split('@')[0],
          full_name: user.displayName || roleNameMap[role] || email.split('@')[0],
          email: user.email,
        };

        localStorage.setItem('crime_auth_token', authData.access_token);
        localStorage.setItem('crime_user_role', authData.role);
        localStorage.setItem('crime_user_name', authData.full_name);

        onLoginSuccess(authData);
      }
    } catch (err) {
      console.error('Firebase Auth Error:', err);
      let message = err.message;
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        message = 'Invalid email or password. If you are a new user, please Sign Up.';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please switch to Sign In.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password must be at least 6 characters long.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (err.code === 'auth/network-request-failed') {
        message = 'Network connection failed. Please check your internet connection.';
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050000] text-slate-100 flex relative overflow-hidden font-sans">
      
      {/* 3D Earth Background Layer */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-auto">
        <Canvas camera={{ position: [-60, 0, 240], fov: 45 }}>
          <Suspense fallback={null}>
            <InteractiveEarth />
          </Suspense>
        </Canvas>
      </div>

      {/* Main UI Overlay */}
      <div className="relative z-10 w-full h-full flex flex-col pointer-events-none p-8">
        
        {/* Top Left Branding & Form */}
        <div className="flex-1 flex flex-col space-y-6 max-w-[440px] pointer-events-auto">
          
          {/* Logo & Header */}
          <div className="flex items-center space-x-4">
            <div className="w-14 h-16 bg-red-950/20 border border-red-600/50 rounded-b-xl rounded-t-sm flex items-center justify-center relative shadow-[0_0_15px_rgba(255,0,0,0.3)]">
              <div className="absolute inset-0 border-[1px] border-red-500/30 transform scale-90"></div>
              <ShieldCheck className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h1 className="font-bold text-2xl tracking-widest text-red-500">
                CRIMENEXUS <span className="text-white">AI</span>
              </h1>
              <p className="text-[10px] tracking-widest text-slate-400 uppercase mt-0.5">
                Law Enforcement Secure Portal
              </p>
              <div className="h-[1px] w-20 bg-gradient-to-r from-red-500 to-transparent mt-2"></div>
            </div>
          </div>

          {/* Login / Signup Card */}
          <div className="bg-black/50 backdrop-blur-md border border-red-900/40 rounded-2xl p-6 shadow-[0_0_40px_rgba(255,0,0,0.08)]">
            
            {/* Tab Switcher: Sign In vs Sign Up */}
            <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-red-900/30 mb-5">
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setErrorMsg(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition flex items-center justify-center space-x-1.5 ${
                  !isSignUp
                    ? 'bg-red-950/70 text-red-400 border border-red-600/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setErrorMsg(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition flex items-center justify-center space-x-1.5 ${
                  isSignUp
                    ? 'bg-red-950/70 text-red-400 border border-red-600/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Sign Up</span>
              </button>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 flex items-start space-x-2 text-xs text-red-200 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-tight">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              
              {/* Role Select */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Assign Operational Role
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-red-600/70">
                    <User className="w-4 h-4" />
                  </div>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-black/70 text-xs text-slate-200 pl-10 pr-8 py-2.5 rounded-lg border border-red-900/40 focus:outline-none focus:border-red-600 appearance-none font-mono cursor-pointer"
                  >
                    <option value="investigator">Investigator (Senior IO)</option>
                    <option value="analyst">Intelligence Analyst</option>
                    <option value="admin">Chief Administrator</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {/* Full Name (Sign Up only) */}
              {isSignUp && (
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Officer Full Name / Badge
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Inspector R. Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-black/60 text-xs text-slate-200 pl-10 pr-3 py-2.5 rounded-lg border border-red-900/40 focus:outline-none focus:border-red-600 placeholder-slate-600 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Officer Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="officer@police.gov.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/60 text-xs text-slate-200 pl-10 pr-3 py-2.5 rounded-lg border border-red-900/40 focus:outline-none focus:border-red-600 placeholder-slate-600 font-mono"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Secure Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/60 text-xs text-slate-200 pl-10 pr-10 py-2.5 rounded-lg border border-red-900/40 focus:outline-none focus:border-red-600 placeholder-slate-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-bold text-xs tracking-wider uppercase transition flex items-center justify-center space-x-2 border border-red-500/30 shadow-[0_0_15px_rgba(255,0,0,0.2)] mt-3 disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>{isSignUp ? 'Create Officer Account' : 'Authenticate & Enter'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-center space-x-2 text-[10px] text-slate-500 font-mono">
              <Lock className="w-3 h-3 text-red-600" />
              <span>FIREBASE SECURE AUTH • <span className="text-red-600">SIH 2026</span></span>
            </div>
          </div>
        </div>

        {/* Top Right Compass */}
        <div className="absolute top-10 right-10 text-red-700/50 flex flex-col items-center">
          <span className="text-[10px] mb-1 font-mono">N</span>
          <Compass className="w-8 h-8 text-red-500/80" />
          <span className="text-[10px] mt-1 font-mono">V</span>
        </div>

      </div>
    </div>
  );
}
