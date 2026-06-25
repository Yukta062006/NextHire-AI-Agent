"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  Loader2, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle 
} from "lucide-react";
import { API_BASE_URL } from "@/utils/api";

interface AuthDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "signin" | "signup";
  onAuthSuccess?: () => void;
}

export default function AuthDrawer({ 
  isOpen, 
  onClose, 
  initialTab = "signin",
  onAuthSuccess
}: AuthDrawerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">(initialTab);
  
  // Sign In States
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  
  // Sign Up States
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  
  // UI & Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const drawerRef = useRef<HTMLDivElement>(null);

  // Sync active tab with prop if it changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Reset errors when switching tabs
  useEffect(() => {
    setError(null);
    setSuccessMessage(null);
  }, [activeTab]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, onClose]);



  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail.trim() || !signInPassword.trim()) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: signInEmail,
          password: signInPassword,
        }),
      });

      if (!response.ok) {
        const errDetail = await response.json();
        throw new Error(errDetail.detail || "Invalid email or password.");
      }

      const data = await response.json();
      
      // Store token
      localStorage.setItem("nexthire_token", data.access_token);
      localStorage.setItem("nexthire_user", JSON.stringify(data.user));

      setSuccessMessage("Logged in successfully! Redirecting...");
      
      // Trigger update in host component
      if (onAuthSuccess) {
        onAuthSuccess();
      }

      setTimeout(() => {
        setIsLoading(false);
        onClose();
        router.push("/dashboard");
      }, 1500);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Login failed. Please check your credentials.";
      setError(errorMsg);
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName.trim() || !signUpEmail.trim() || !signUpPassword.trim()) return;

    if (signUpPassword !== signUpConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (signUpPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: signUpName,
          email: signUpEmail,
          password: signUpPassword,
          role: "candidate",
        }),
      });

      if (!response.ok) {
        const errDetail = await response.json();
        throw new Error(errDetail.detail || "Registration failed. Try a different email.");
      }

      // Automatically log in on signup success
      const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: signUpEmail,
          password: signUpPassword,
        }),
      });

      if (!loginResponse.ok) {
        throw new Error("Registration complete, but automatic login failed.");
      }

      const data = await loginResponse.json();
      
      // Store token
      localStorage.setItem("nexthire_token", data.access_token);
      localStorage.setItem("nexthire_user", JSON.stringify(data.user));

      setSuccessMessage("Account created successfully! Let's get set up.");

      if (onAuthSuccess) {
        onAuthSuccess();
      }

      setTimeout(() => {
        setIsLoading(false);
        onClose();
        router.push("/onboarding");
      }, 1500);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Signup failed. Please try again.";
      setError(errorMsg);
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[998] transition-opacity"
          />

          {/* Drawer Container */}
          <motion.div
            ref={drawerRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[440px] bg-background border-l border-border z-[999] shadow-2xl flex flex-col justify-between overflow-y-auto selection:bg-primary selection:text-white"
          >
            {/* Upper Section */}
            <div className="p-6 md:p-8 flex-1 flex flex-col justify-start">
              
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-[0_0_12px_rgba(var(--primary-rgb),0.4)]">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xl font-bold tracking-tight text-gradient-primary">NEXTHIRE AUTH</span>
                </div>
                
                <button 
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-white/5 border border-border flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  aria-label="Close auth panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Toggle Tabs */}
              <div className="grid grid-cols-2 bg-card p-1 rounded-xl border border-border/50 mb-8 relative">
                <button
                  type="button"
                  onClick={() => setActiveTab("signin")}
                  className={`relative py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer z-10 text-center ${
                    activeTab === "signin" ? "text-white" : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("signup")}
                  className={`relative py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer z-10 text-center ${
                    activeTab === "signup" ? "text-white" : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Sign Up
                </button>
                
                {/* Slid-over Background Indicator */}
                <motion.div
                  className="absolute bottom-1 top-1 left-1 bg-gradient-to-r from-primary to-secondary rounded-lg shadow-sm"
                  style={{ width: "calc(50% - 4px)" }}
                  animate={{ x: activeTab === "signin" ? 0 : "100%" }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              </div>

              {/* Form Status Messages */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400 flex items-center space-x-2.5 mb-6"
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{error}</span>
                  </motion.div>
                )}
                
                {successMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm text-emerald-400 flex items-center space-x-2.5 mb-6"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{successMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Forms Section */}
              <div className="flex-1">
                {activeTab === "signin" ? (
                  /* SIGN IN FORM */
                  <form onSubmit={handleSignIn} className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 font-semibold ml-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
                        <input 
                          type="email" 
                          value={signInEmail}
                          onChange={(e) => setSignInEmail(e.target.value)}
                          placeholder="name@example.com"
                          required
                          disabled={isLoading}
                          className="w-full bg-card border border-border rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-xs text-gray-400 font-semibold">Password</label>
                        <a href="#" className="text-xs text-secondary hover:underline transition-colors">Forgot password?</a>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
                        <input 
                          type="password" 
                          value={signInPassword}
                          onChange={(e) => setSignInPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          disabled={isLoading}
                          className="w-full bg-card border border-border rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-4 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover disabled:opacity-60 text-white font-medium rounded-xl transition-all shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)] flex items-center justify-center space-x-2 cursor-pointer mt-6"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <span>Log In to Account</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>


                  </form>
                ) : (
                  /* SIGN UP FORM */
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 font-semibold ml-1">Full Name</label>
                      <div className="relative">
                        <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
                        <input 
                          type="text" 
                          value={signUpName}
                          onChange={(e) => setSignUpName(e.target.value)}
                          placeholder="Alex Mercer"
                          required
                          disabled={isLoading}
                          className="w-full bg-card border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 font-semibold ml-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
                        <input 
                          type="email" 
                          value={signUpEmail}
                          onChange={(e) => setSignUpEmail(e.target.value)}
                          placeholder="alex@example.com"
                          required
                          disabled={isLoading}
                          className="w-full bg-card border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 font-semibold ml-1">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
                        <input 
                          type="password" 
                          value={signUpPassword}
                          onChange={(e) => setSignUpPassword(e.target.value)}
                          placeholder="Minimum 6 characters"
                          required
                          disabled={isLoading}
                          className="w-full bg-card border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 font-semibold ml-1">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
                        <input 
                          type="password" 
                          value={signUpConfirmPassword}
                          onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                          placeholder="Re-type your password"
                          required
                          disabled={isLoading}
                          className="w-full bg-card border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-4 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover disabled:opacity-60 text-white font-medium rounded-xl transition-all shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)] flex items-center justify-center space-x-2 cursor-pointer mt-4"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <span>Create Free Account</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>


                  </form>
                )}
              </div>
            </div>

            {/* Footer / Guest disclaimer */}
            <div className="p-6 md:p-8 bg-card/40 border-t border-border/50 text-center text-xs text-gray-500 space-y-1">
              <p>By proceeding, you agree to NextHire&apos;s Terms & Privacy Policy.</p>
              <p className="text-gray-600 font-mono">Secure TLS 1.3 / API Auth Handshake</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
