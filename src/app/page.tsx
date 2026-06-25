"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { 
  ArrowRight, 
  Upload, 
  FileSearch, 
  ShieldCheck, 
  BrainCircuit, 
  Activity, 
  Target,
  PlayCircle,
  Sparkles,
  LogOut
} from "lucide-react";
import AuthDrawer from "@/components/layout/AuthDrawer";

const PIPELINE_STEPS = [
  { id: 1, title: "Resume Upload", icon: Upload },
  { id: 2, title: "JD Analysis", icon: FileSearch },
  { id: 3, title: "Skill Verification", icon: ShieldCheck },
  { id: 4, title: "Adaptive Interview", icon: BrainCircuit },
  { id: 5, title: "Pressure Analysis", icon: Activity },
  { id: 6, title: "Hiring Readiness Score", icon: Target },
];

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [isAuthDrawerOpen, setIsAuthDrawerOpen] = useState(false);
  const [authDrawerTab, setAuthDrawerTab] = useState<"signin" | "signup">("signin");

  const checkAuthStatus = () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("nexthire_token");
      const userStr = localStorage.getItem("nexthire_user");
      if (token && token !== "guest-token-12345") {
        setIsLoggedIn(true);
        if (userStr) {
          try {
            setUser(JSON.parse(userStr));
          } catch {
            setUser(null);
          }
        }
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("nexthire_token");
    localStorage.removeItem("nexthire_user");
    // Re-initialize guest credentials so pages don't break
    localStorage.setItem("nexthire_token", "guest-token-12345");
    localStorage.setItem("nexthire_user", JSON.stringify({
      id: "guest-id",
      name: "Alex D.",
      email: "guest@nexthire.ai",
      role: "candidate",
      target_role: "Frontend Engineer",
      experience_level: "Fresher",
      career_goals: "Master frontend frameworks and build premium user interfaces."
    }));
    checkAuthStatus();
    router.refresh();
  };

  const openAuthDrawer = (tab: "signin" | "signup") => {
    setAuthDrawerTab(tab);
    setIsAuthDrawerOpen(true);
  };

  return (
<div className="min-h-screen bg-background bg-grid text-white overflow-hidden selection:bg-primary selection:text-white flex flex-col justify-between relative">      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary blur-[120px] rounded-full"></div>
      </div>

      {/* Premium Sticky Navigation Header */}
      <header className="fixed top-0 left-0 w-full h-20 border-b border-border/65 bg-background/60 backdrop-blur-lg z-50 flex items-center px-6 md:px-12 justify-between">
        <Link href="/" className="flex items-center space-x-2.5">
          <img src="/logo.png" alt="NextHire Logo" className="w-9 h-9 object-contain" />
          <span className="text-2xl font-bold tracking-tighter text-gradient-primary">NextHire</span>
        </Link>

        <nav className="flex items-center space-x-4">
          {isLoggedIn ? (
            <>
              <div className="hidden md:flex items-center space-x-2 bg-white/5 border border-border px-3.5 py-1.5 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs text-gray-300 font-medium">Logged in as {user?.name || "User"}</span>
              </div>
              <Link 
                href="/dashboard"
                className="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover rounded-lg text-sm text-white font-medium transition-all shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)] hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
              >
                Go to Dashboard
              </Link>
              <button 
                onClick={handleLogout}
                className="p-2.5 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-400 hover:text-red-300 rounded-lg text-sm transition-all cursor-pointer flex items-center justify-center"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => openAuthDrawer("signin")}
                className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthDrawer("signup")}
                className="px-4 py-2.5 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover rounded-lg text-sm text-white font-semibold transition-all shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)] hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] cursor-pointer"
              >
                Sign Up
              </button>
            </>
          )}
        </nav>
      </header>

      {/* Main Landing View */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-36 pb-24 flex-1">
         {/* Background Effects */}

  {/* Giant Planet Ring */}
  <div className="absolute top-[-350px] left-1/2 -translate-x-1/2 w-[1600px] h-[1600px] rounded-full border border-cyan-400/30 shadow-[0_0_150px_rgba(34,211,238,0.5)] pointer-events-none" />

  {/* Outer Cyan Aura */}
  <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[1800px] h-[1800px] rounded-full bg-cyan-500/10 blur-[300px] pointer-events-none" />

  {/* Blue Core Glow */}
  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-blue-500/30 blur-[220px] rounded-full pointer-events-none" />

  {/* Bright Cyan Center Glow */}
  <div className="absolute top-[100px] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-cyan-400/20 blur-[220px] rounded-full pointer-events-none" />
        
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center space-x-2 glass px-4 py-2 rounded-full mb-6 border-primary/30">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span className="text-sm text-cyan-100 font-medium drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
  NextHire AI Agent v2.0 — Powered by Qwen Cloud
</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.45)]">
              Ace Every Interview with <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-200 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(34,211,238,0.9)]">
  NEXTHIRE
</span>
            </h1>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-cyan-100 max-w-2xl mx-auto"
          >
            AI-powered autonomous recruiter agent that analyzes resumes, matches job descriptions, conducts adaptive interviews, makes hiring decisions, and requests human approval — all powered by Qwen Cloud.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-col items-center justify-center space-y-4 pt-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <button 
                onClick={() => router.push("/dashboard")}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 group cursor-pointer shadow-[0_0_30px_rgba(34,211,238,0.5)] hover:shadow-[0_0_50px_rgba(34,211,238,0.9)] hover:scale-105"
                >
                <span>{isLoggedIn ? "Go to Dashboard" : "Explore as Guest"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <a 
                href="https://vimeo.com/1200711181?share=copy&fl=sv&fe=ci"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 glass hover:bg-white/5 rounded-xl font-medium transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <PlayCircle className="w-5 h-5 text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.7)] group-hover:text-white transition-all duration-300" />

<span className="text-cyan-100 font-medium group-hover:text-white transition-all duration-300">
  Video Demo
</span>
              </a>
            </div>

            {!isLoggedIn && (
              <p className="text-sm text-cyan-100 font-medium drop-shadow-[0_0_8px_rgba(34,211,238,0.35)]">
                Running in Guest Mode.{" "}
                <button onClick={() => openAuthDrawer("signin")} className="text-secondary hover:text-secondary-hover hover:underline font-semibold cursor-pointer">Sign In</button>
                {" "}or{" "}
                <button onClick={() => openAuthDrawer("signup")} className="text-secondary hover:text-secondary-hover hover:underline font-semibold cursor-pointer">Sign Up</button>
                {" "}to save progress permanently.
              </p>
            )}
          </motion.div>
        </div>

        {/* Hero Visualization Pipeline */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-24 mb-32 relative"
        >
          <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 -translate-y-1/2 rounded-full hidden md:block"></div>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6 relative">
            {PIPELINE_STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="relative flex flex-col items-center">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{
                    scale: 1.15,
                    y: -10,
                    boxShadow: "0px 0px 35px rgba(59,130,246,0.8)"
                    }}
                    transition={{ delay: 1 + index * 0.15, type: "spring" }}
                    className="w-16 h-16 rounded-2xl bg-card border border-primary/40 flex items-center justify-center relative z-10 mb-4 shadow-[0_0_20px_rgba(59,130,246,0.35)]"                  >
                    <Icon className={`w-7 h-7 ${index === 5 ? 'text-[#22C55E]' : 'text-secondary'}`} />
                  </motion.div>
                  <p className="text-center text-sm font-medium text-gray-300 max-w-[100px]">
                    {step.title}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>
         {/* Left Glowing Waves */}
<div className="absolute -left-45 bottom-30 w-[500px] opacity-90 pointer-events-none">
  <svg viewBox="0 0 1000 500" fill="none">

    {/* Cyan Glow */}
    <path
      d="M0 180 C300 0,650 450,1000 240"
      stroke="#22D3EE"
      strokeWidth="4"
      filter="url(#cyanGlow)"
    />

    {/* White Wave */}
    <path
      d="M0 250 C250 100,600 420,1000 180"
      stroke="white"
      strokeWidth="2.5"
      opacity="0.9"
    />

    <defs>
      <filter id="cyanGlow">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

  </svg>
</div>

{/* Right Glowing Waves */}
<div className="absolute -right-45 bottom-30 w-[500px] opacity-90 pointer-events-none">
  <svg viewBox="0 0 1000 500" fill="none">

    {/* Cyan Glow */}
    <path
      d="M0 180 C300 0,650 450,1000 240"
      stroke="#22D3EE"
      strokeWidth="4"
      filter="url(#cyanGlow2)"
    />

    {/* White Wave */}
    <path
      d="M0 250 C250 100,600 420,1000 180"
      stroke="white"
      strokeWidth="2.5"
      opacity="0.9"
    />

    <defs>
      <filter id="cyanGlow2">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

  </svg>
</div>
        {/* Social Proof */}
<motion.div
  initial={{ opacity: 0, y: 40 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 1 }}
  className="relative mt-28 flex flex-col md:flex-row justify-center items-center gap-16 md:gap-24"
>

  {/* 10,000+ */}
  <motion.div
    whileHover={{ scale: 1.08, y: -10 }}
    animate={{ y: [0, -8, 0] }}
    transition={{
      y: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      },
    }}
    className="text-center space-y-2 p-4 rounded-xl"
  >
    <motion.h3
      animate={{
        textShadow: [
          "0 0 5px rgba(59,130,246,0.2)",
          "0 0 20px rgba(59,130,246,0.8)",
          "0 0 5px rgba(59,130,246,0.2)",
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
      }}
      className="text-4xl md:text-5xl font-bold text-white"
    >
      <CountUp end={10000} duration={3} separator="," />+
    </motion.h3>

    <p className="text-gray-400 font-medium">
      Interviews Completed
    </p>
  </motion.div>

  {/* 50,000+ */}
  <motion.div
    whileHover={{ scale: 1.08, y: -10 }}
    animate={{ y: [0, -8, 0] }}
    transition={{
      y: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 0.5,
      },
    }}
    className="text-center space-y-2 border-y md:border-y-0 md:border-x border-border/65 px-10 py-8 md:py-0"
  >
    <motion.h3
      animate={{
        textShadow: [
          "0 0 5px rgba(59,130,246,0.2)",
          "0 0 20px rgba(59,130,246,0.8)",
          "0 0 5px rgba(59,130,246,0.2)",
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
      }}
      className="text-4xl md:text-5xl font-bold text-white"
    >
      <CountUp end={50000} duration={3} separator="," />+
    </motion.h3>

    <p className="text-gray-400 font-medium">
      Questions Evaluated
    </p>
  </motion.div>

  {/* 95% */}
  <motion.div
    whileHover={{ scale: 1.08, y: -10 }}
    animate={{ y: [0, -8, 0] }}
    transition={{
      y: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 1,
      },
    }}
    className="text-center space-y-2 p-4 rounded-xl"
  >
    <motion.h3
      animate={{
        textShadow: [
          "0 0 5px rgba(34,197,94,0.2)",
          "0 0 20px rgba(34,197,94,0.8)",
          "0 0 5px rgba(34,197,94,0.2)",
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
      }}
      className="text-4xl md:text-5xl font-bold text-[#22C55E]"
    >
      <CountUp end={95} duration={3} />%
    </motion.h3>

    <p className="text-gray-400 font-medium">
      Candidate Satisfaction
    </p>
  </motion.div>

</motion.div>
</main>
      {/* Auth side drawer */}
      <AuthDrawer 
        isOpen={isAuthDrawerOpen} 
        onClose={() => setIsAuthDrawerOpen(false)} 
        initialTab={authDrawerTab}
        onAuthSuccess={checkAuthStatus}
      />
    </div>
  );
}
