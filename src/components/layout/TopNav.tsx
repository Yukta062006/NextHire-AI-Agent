"use client";

import { Bell, Search, User, Check, Trash2, FileText, Trophy, GraduationCap, ChevronDown, Menu, X, LayoutDashboard, Video, Users, LogOut, Settings, Share2, Info, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { API_BASE_URL, getAuthHeaders } from "@/utils/api";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "@/utils/firebase";
import { signOut } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Live Interview", href: "/dashboard/live-interview", icon: Video },
  { name: "Resume Intelligence", href: "/dashboard/resumes", icon: FileText },
  { name: "JD Analyzer", href: "/dashboard/jd-analyzer", icon: Search },
  { name: "Achievements", href: "/dashboard/achievements", icon: Trophy },
  { name: "Career Coach", href: "/dashboard/career-coach", icon: GraduationCap },
  { name: "Recruiter Mode", href: "/dashboard/recruiter", icon: Users },
];

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
}

export function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [candidateName, setCandidateName] = useState<string>("Alex D.");
  const [candidateEmail, setCandidateEmail] = useState<string>("guest@nexthire.ai");
  const [candidateRole, setCandidateRole] = useState<string>("Frontend Engineer");
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [iqScore, setIqScore] = useState<number>(87);

  // Modal and theme states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [candidateGoals, setCandidateGoals] = useState<string>("Not specified");

  // Load and apply theme
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem("nexthire_theme") as "dark" | "light" | null;
      if (storedTheme) {
        setTheme(storedTheme);
        document.documentElement.setAttribute("data-theme", storedTheme);
      } else {
        const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
        const initialTheme = prefersLight ? "light" : "dark";
        setTheme(initialTheme);
        document.documentElement.setAttribute("data-theme", initialTheme);
      }
    }
  }, []);

  const toggleTheme = (newTheme: "dark" | "light") => {
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("nexthire_theme", newTheme);
  };

  const copyProfileToClipboard = (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }).catch(() => {
        fallbackCopyText(text);
      });
    } else {
      fallbackCopyText(text);
    }
  };

  const fallbackCopyText = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
    document.body.removeChild(textArea);
  };

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("nexthire_notifications");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    return [
      {
        id: "1",
        title: "Resume Analyzed",
        desc: "Your resume was parsed successfully. NextHire Score set to 87/100.",
        time: "2 mins ago",
        read: false,
      },
      {
        id: "2",
        title: "Achievements Unlocked",
        desc: "You unlocked the 'Ready to Interview' badge!",
        time: "1 hour ago",
        read: false,
      },
      {
        id: "3",
        title: "Career Roadmap Ready",
        desc: "AI has generated your SQLAlchemy 2.0 Async Guide learning roadmap.",
        time: "2 hours ago",
        read: true,
      },
    ];
  });

  // Sync notifications to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("nexthire_notifications", JSON.stringify(notifications));
    }
  }, [notifications]);

  // Handle outside clicks to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#notification-btn") && !target.closest("#notification-dropdown")) {
        setShowNotifications(false);
      }
      if (!target.closest("#profile-btn") && !target.closest("#profile-dropdown")) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  useEffect(() => {
    // Load local storage profile data initially
    const stored = localStorage.getItem("nexthire_user");
    if (stored) {
      try {
        const parsedUser = JSON.parse(stored);
        if (parsedUser.name) setCandidateName(parsedUser.name);
        if (parsedUser.email) setCandidateEmail(parsedUser.email);
        if (parsedUser.target_role) setCandidateRole(parsedUser.target_role);
        if (parsedUser.career_goals) setCandidateGoals(parsedUser.career_goals);
      } catch {}
    }

    async function loadLatestResume() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/resumes/latest`, {
          headers: getAuthHeaders(null)
        });
        if (!response.ok) return;
        
        const data = await response.json();
        if (data.resume_score) {
          setIqScore(Math.round(data.resume_score));
        }
        let parsed = data.parsed_content;
        if (parsed) {
          if (typeof parsed === "string") {
            try {
              parsed = JSON.parse(parsed);
            } catch (e) {}
          }
          if (parsed.name && parsed.name !== "Candidate's Full Name") {
            const parsedName = parsed.name;
            setCandidateName(parsedName);
            
            // Sync local storage user model
            const storedUser = localStorage.getItem("nexthire_user");
            if (storedUser) {
              const parsedUser = JSON.parse(storedUser);
              parsedUser.name = parsedName;
              if (data.target_role) parsedUser.target_role = data.target_role;
              localStorage.setItem("nexthire_user", JSON.stringify(parsedUser));
            }
          }
        }
      } catch (e) {
        console.warn("TopNav: Failed sync user name", e);
      }
    }

    loadLatestResume();
  }, []);

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleClearAll = () => {
    setNotifications([]);
  };


  const handleMobileSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Sign out: Firebase sign out failed", e);
    }
    localStorage.removeItem("nexthire_token");
    localStorage.removeItem("nexthire_user");
    window.location.href = "/";
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
        <div className="flex-1 flex items-center">
          <button
            id="mobile-menu-btn"
            onClick={() => setShowMobileMenu(true)}
            className="p-2 -ml-2 mr-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 md:hidden cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="relative w-64 md:w-96 hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search candidates, skills, or jobs..." 
            className="w-full bg-card border border-border/65 rounded-full pl-10 pr-4 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4 relative">
        {/* Notifications Dropdown Toggle */}
        <div className="relative">
          <button 
            id="notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5 ${showNotifications ? "bg-white/5 text-white" : ""}`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#EF4444] rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div 
              id="notification-dropdown"
              className="absolute right-0 mt-2 w-80 sm:w-96 glass rounded-xl shadow-[0_10px_32px_rgba(0,0,0,0.5)] border border-border z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-border flex items-center justify-between bg-background">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-sm text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-primary/20 text-secondary text-xs px-2 py-0.5 rounded-full font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {notifications.length > 0 && (
                  <button 
                    onClick={handleClearAll}
                    className="text-xs text-gray-400 hover:text-[#EF4444] transition-colors flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear all</span>
                  </button>
                )}
              </div>

              <div className="max-h-[300px] overflow-y-auto divide-y divide-[rgba(255,255,255,0.05)] bg-background">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      onClick={() => handleMarkAsRead(n.id)}
                      className={`p-4 hover:bg-white/2 transition-colors cursor-pointer flex items-start justify-between space-x-3 ${!n.read ? "bg-primary/3" : ""}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs font-semibold ${!n.read ? "text-secondary" : "text-gray-300"}`}>
                            {n.title}
                          </span>
                          {!n.read && <span className="w-1.5 h-1.5 bg-secondary rounded-full"></span>}
                        </div>
                        <p className="text-xs text-gray-400 leading-normal">{n.desc}</p>
                        <span className="text-[10px] text-gray-500 block">{n.time}</span>
                      </div>
                      
                      {!n.read && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(n.id);
                          }}
                          className="p-1 rounded bg-white/5 hover:bg-primary/20 text-gray-400 hover:text-secondary transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500 space-y-2">
                    <Bell className="w-8 h-8 mx-auto opacity-30" />
                    <p className="text-sm">All caught up!</p>
                    <p className="text-xs text-gray-600">No new notifications to display.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="h-8 w-px bg-white/8 mx-2"></div>

        {/* Profile Dropdown Toggle */}
        <div className="relative">
          <button 
            id="profile-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`flex items-center space-x-2.5 p-1 pr-3 rounded-full border border-border/65 hover:bg-white/2 transition-colors ${showProfileMenu ? "bg-white/5 border-[rgba(255,255,255,0.15)]" : ""}`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-300 hidden md:inline">{candidateName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 hidden md:inline" />
          </button>

          {/* Profile Dropdown Panel */}
          {showProfileMenu && (
            <div 
              id="profile-dropdown"
              className="absolute right-0 mt-2 w-72 glass rounded-xl shadow-[0_10px_32px_rgba(0,0,0,0.5)] border border-border z-50 overflow-hidden"
            >
              {/* Profile Card Header */}
              <div className="p-4 bg-background border-b border-border space-y-2.5">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold text-white text-sm shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
                    {candidateName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">{candidateName}</h4>
                    <p className="text-xs text-gray-400">{candidateEmail}</p>
                  </div>
                </div>
                <div className="bg-primary/10 border border-primary/20 rounded-lg px-2.5 py-1 text-center">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Target Position</p>
                  <p className="text-xs font-semibold text-secondary">{candidateRole}</p>
                </div>
              </div>

              {/* Profile Dropdown Actions */}
              <div className="p-2 bg-background space-y-0.5">
                {/* 1. Profile Option */}
                <button 
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowProfileModal(true);
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs text-gray-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  <span>Profile</span>
                </button>

                {/* 2. Settings (Light / Dark mode toggle) */}
                <div className="flex items-center justify-between px-3 py-2 text-xs text-gray-300 rounded-lg bg-transparent">
                  <div className="flex items-center space-x-2.5">
                    <Settings className="w-4 h-4 text-gray-400" />
                    <span>Settings</span>
                  </div>
                  <div className="flex bg-card p-0.5 rounded-md border border-border/65">
                    <button
                      onClick={() => toggleTheme("light")}
                      className={`p-1 rounded cursor-pointer transition-all ${
                        theme === "light" 
                          ? "bg-primary text-white" 
                          : "text-gray-500 hover:text-gray-300"
                      }`}
                      title="Light Mode"
                    >
                      <Sun className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleTheme("dark")}
                      className={`p-1 rounded cursor-pointer transition-all ${
                        theme === "dark" 
                          ? "bg-primary text-white" 
                          : "text-gray-500 hover:text-gray-300"
                      }`}
                      title="Dark Mode"
                    >
                      <Moon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 3. Share Profile Option */}
                <button 
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowShareModal(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5">
                    <Share2 className="w-4 h-4 text-gray-400" />
                    <span>Share profile</span>
                  </div>
                  {shareCopied && (
                    <span className="text-[10px] text-[#22C55E] font-semibold animate-pulse">Copied!</span>
                  )}
                </button>

                {/* 4. About Option */}
                <button 
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowAboutModal(true);
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs text-gray-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <Info className="w-4 h-4 text-gray-400" />
                  <span>About</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>

    {/* Mobile Drawer Navigation */}
    <AnimatePresence>
      {showMobileMenu && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMobileMenu(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] md:hidden"
          />

          {/* Sidebar Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 w-64 h-screen bg-background border-r border-border flex flex-col z-[1000] md:hidden"
          >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-border">
              <Link href="/" className="flex items-center space-x-2.5 text-2xl font-bold text-gradient-primary tracking-tighter" onClick={() => setShowMobileMenu(false)}>
                <img src="/logo.png" alt="NextHire Logo" className="w-7 h-7 object-contain" />
                <span>NEXTHIRE</span>
              </Link>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="w-8 h-8 rounded-full bg-white/5 border border-border flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? "bg-primary/15 text-secondary border border-primary/30" 
                        : "text-gray-400 hover:text-white hover:bg-card"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border space-y-3">
              <div className="glass rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]">
                  <span className="font-bold text-white text-sm">IQ</span>
                </div>
                <p className="text-xs text-gray-400">NextHire Score</p>
                <p className="text-xl font-bold text-white">{iqScore}<span className="text-sm text-gray-500">/100</span></p>
              </div>
              
              <button 
                onClick={handleMobileSignOut}
                className="flex items-center justify-center space-x-2 w-full py-2 bg-[rgba(239,68,68,0.08)] hover:bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.2)] rounded-lg text-xs text-[#EF4444] transition-colors font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    {/* Profile Modal */}
    <AnimatePresence>
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden text-white"
          >
            <div className="p-4 border-b border-border flex justify-between items-center bg-background">
              <h3 className="font-bold text-sm">Edit Candidate Profile</h3>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const name = fd.get("name") as string;
                const email = fd.get("email") as string;
                const role = fd.get("role") as string;
                const goals = fd.get("goals") as string;
                
                // Save
                setCandidateName(name);
                setCandidateEmail(email);
                setCandidateRole(role);
                setCandidateGoals(goals);

                const storedUser = localStorage.getItem("nexthire_user") || "{}";
                try {
                  const parsedUser = JSON.parse(storedUser);
                  parsedUser.name = name;
                  parsedUser.email = email;
                  parsedUser.target_role = role;
                  parsedUser.career_goals = goals;
                  localStorage.setItem("nexthire_user", JSON.stringify(parsedUser));
                } catch (err) {
                  console.error(err);
                }
                setShowProfileModal(false);
              }}
              className="p-4 space-y-4"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  defaultValue={candidateName}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  defaultValue={candidateEmail}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Target Role</label>
                <input 
                  type="text" 
                  name="role" 
                  defaultValue={candidateRole}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Career Goals</label>
                <textarea 
                  name="goals" 
                  defaultValue={candidateGoals}
                  rows={3}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary resize-none"
                  placeholder="Describe your career goals..."
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-white bg-transparent border border-transparent hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* Share Profile Modal */}
    <AnimatePresence>
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden text-white"
          >
            <div className="p-4 border-b border-border flex justify-between items-center bg-background">
              <h3 className="font-bold text-sm">Share Candidate Profile</h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              {/* Visual Card Preview */}
              <div className="glass rounded-xl p-5 border border-primary/20 relative overflow-hidden bg-gradient-to-br from-card to-background shadow-[0_0_20px_rgba(var(--primary-rgb),0.05)]">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-secondary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">NextHire Verified</span>
                    <h4 className="font-bold text-base text-white mt-2 leading-tight">{candidateName}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{candidateRole}</p>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full border-2 border-[#22C55E] flex items-center justify-center bg-[#22C55E]/5 shadow-[0_0_15px_rgba(34,197,94,0.15)]">
                      <span className="font-bold text-sm text-white">{iqScore}</span>
                    </div>
                    <span className="text-[8px] text-gray-400 mt-1 uppercase font-semibold">NextHire Score</span>
                  </div>
                </div>

                <div className="border-t border-border/65 pt-3 flex justify-between items-center text-[10px] text-gray-500">
                  <span>Platform: nexthire.ai</span>
                  <span>Verification: Active</span>
                </div>
              </div>

              {/* Sharing URL / Message */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Shareable Summary</label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="text" 
                    readOnly
                    value={`Check out ${candidateName}'s NextHire Profile! Role: ${candidateRole} | Score: ${iqScore}/100`}
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs text-gray-400 focus:outline-none"
                  />
                  <button 
                    onClick={() => copyProfileToClipboard(`Check out ${candidateName}'s NextHire Profile!\nRole: ${candidateRole}\nNextHire Score: ${iqScore}/100\nPlatform: ${window.location.origin}`)}
                    className="px-3 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer flex-shrink-0"
                  >
                    {shareCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 opacity-0 absolute pointer-events-none" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Social Quick Share links */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Quick Share</span>
                <div className="grid grid-cols-3 gap-2">
                  <a 
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 bg-[#0077B5]/10 hover:bg-[#0077B5]/20 border border-[#0077B5]/20 rounded-lg text-center text-xs text-[#0077B5] font-semibold transition-all"
                  >
                    LinkedIn
                  </a>
                  <a 
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out my NextHire verified profile! Role: ${candidateRole} | Score: ${iqScore}/100. Join me at ` + window.location.origin)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 bg-white/5 hover:bg-white/10 border border-border rounded-lg text-center text-xs text-white font-semibold transition-all animate-none"
                  >
                    Twitter / X
                  </a>
                  <a 
                    href={`mailto:?subject=${encodeURIComponent("My NextHire Candidate Profile")}&body=${encodeURIComponent(`Check out my NextHire verified profile!\n\nCandidate: ${candidateName}\nRole: ${candidateRole}\nNextHire Score: ${iqScore}/100\n\nLink: ` + window.location.origin)}`}
                    className="py-2 px-3 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/20 rounded-lg text-center text-xs text-[#EF4444] font-semibold transition-all"
                  >
                    Email
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* About Modal */}
    <AnimatePresence>
      {showAboutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl overflow-hidden text-white"
          >
            <div className="p-4 border-b border-border flex justify-between items-center bg-background">
              <h3 className="font-bold text-sm">About NextHire</h3>
              <button 
                onClick={() => setShowAboutModal(false)}
                className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-lg text-white">NEXTHIRE Platform</h4>
                <p className="text-xs text-secondary font-semibold">Version 2.0.0 (Production)</p>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                NextHire is an AI-powered hiring intelligence system designed to evaluate candidate resumes, conduct dynamic technical mock interviews, track skill verifications, and recommend tailored learning roadmaps.
              </p>
              <div className="pt-2 text-[10px] text-gray-500">
                &copy; {new Date().getFullYear()} NextHire Systems. All rights reserved.
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </>
  );
}
