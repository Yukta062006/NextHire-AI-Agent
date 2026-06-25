"use client";

import { API_BASE_URL } from "@/utils/api";


import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, User as UserIcon, ArrowRight, Loader2, Sparkles } from "lucide-react";

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (localStorage.getItem("nexthire_token")) {
      router.push("/dashboard");
    }
  }, [router]);




  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          email: email,
          password: password,
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
          email: email,
          password: password,
        }),
      });

      if (!loginResponse.ok) {
        throw new Error("Registration complete, but login failed.");
      }

      const data = await loginResponse.json();
      
      // Store token
      localStorage.setItem("nexthire_token", data.access_token);
      localStorage.setItem("nexthire_user", JSON.stringify(data.user));

      router.push("/onboarding");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Signup failed. Please ensure the backend server is running.";
      setError(errorMsg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-primary selection:text-white">
      {/* Background Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] opacity-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary blur-[150px] rounded-full"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass rounded-2xl p-8 border border-border/65 relative z-10 space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]">
              <Sparkles className="w-6 h-6 text-white animate-pulse" />
            </div>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Create Account</h2>
          <p className="text-sm text-gray-400">Sign up to benchmark your skills using AI</p>
        </div>

        {error && (
          <div className="p-3 bg-[rgba(239,68,68,0.1)] border border-[#EF4444]/30 rounded-lg text-sm text-[#EF4444] text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-semibold ml-1">Full Name</label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Developer"
                required
                className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-semibold ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@developer.com"
                required
                className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-semibold ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover disabled:opacity-50 text-white font-medium rounded-xl transition-all shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)] flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Sign Up</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>



        <div className="text-center text-sm text-gray-400 pt-2 border-t border-border/65">
          Already have an account?{" "}
          <Link href="/login" className="text-secondary hover:underline font-semibold">
            Log in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
