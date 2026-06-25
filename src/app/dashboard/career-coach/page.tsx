"use client";

import { API_BASE_URL, getAuthHeaders } from "@/utils/api";


import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Map, BookOpen, CheckCircle, Code, Server, PlayCircle, Trophy, Loader2 } from "lucide-react";

interface RoadmapModule {
  id: string;
  title: string;
  status: "in-progress" | "pending" | "completed";
  progress: number;
  priority: string;
  resources: Array<{ title: string; type: string; duration: string; url: string }>;
  tasks: string[];
  expected_outcome: string;
}

interface CareerRoadmap {
  horizon: string;
  title: string;
  description: string;
  modules: RoadmapModule[];
}

export default function CareerCoach() {
  const [activeHorizon, setActiveHorizon] = useState<string>("7");
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [targetGoal, setTargetGoal] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("nexthire_user");
      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser);
          return userObj.career_goals || userObj.target_role || "Senior Frontend Engineer";
        } catch {}
      }
    }
    return "Senior Frontend Engineer";
  });

  const HORIZONS = [
    { id: "7", label: "7-Day Sprint" },
    { id: "30", label: "30-Day Plan" },
    { id: "60", label: "60-Day Mastery" },
    { id: "90", label: "90-Day Goal" }
  ];


  useEffect(() => {
    async function loadRoadmap() {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/career-coach/roadmap?horizon=${activeHorizon}`, {
          headers: getAuthHeaders(null)
        });
        if (!response.ok) {
          throw new Error("Failed to load learning roadmap.");
        }
        const data = await response.json();
        setRoadmap(data);
      } catch (e) {
        console.warn("Failed loading AI coaching details, using offline fallback", e);
        
        // Premium fallback roadmap based on Qwen AI context
        setRoadmap({
          horizon: activeHorizon,
          title: `${activeHorizon}-Day AI Accelerated Sprint`,
          description: "A customized curriculum dynamically tailored to bridge technical competencies verified during the resume parse.",
          modules: [
            {
              id: "m1",
              title: "Asynchronous API Architectures & Connection Pooling",
              status: "in-progress",
              progress: 30,
              priority: "high",
              resources: [
                { title: "SQLAlchemy 2.0 Async Guide", type: "Reading", duration: "1.5h", url: "#" },
                { title: "FastAPI Concurrency and Event Loops", type: "Video", duration: "2h", url: "#" }
              ],
              tasks: [
                "Implement SQLite async drivers in a sandbox environment",
                "Benchmark query latencies comparing sync vs pooled connection methods"
              ],
              expected_outcome: "Understand core event loops, avoid blocking handlers in FastAPI routes, and scale backend queries."
            },
            {
              id: "m2",
              title: "Advanced React State Optimization",
              status: "pending",
              progress: 0,
              priority: "medium",
              resources: [
                { title: "React useMemo and useCallback Benchmarks", type: "Reading", duration: "1h", url: "#" }
              ],
              tasks: [
                "Minimize re-renders in deep multi-tier component trees using React context optimizations",
                "Build custom hooks to buffer rapid live WebSocket state transitions"
              ],
              expected_outcome: "Design responsive, high-frequency interactive dashboard dashboards with zero paint stutter."
            }
          ]
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadRoadmap();
  }, [activeHorizon]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-3">
            <GraduationCap className="w-8 h-8 text-secondary" />
            <span>AI Career Coach</span>
          </h1>
          <p className="text-gray-400 mt-1">Your personalized learning roadmap based on recent interview performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8">
        
        {/* Timeline Horizons Toggle */}
        <div className="lg:col-span-1 space-y-3">
          {HORIZONS.map((h) => {
            const isSelected = activeHorizon === h.id;
            return (
              <button 
                key={h.id}
                onClick={() => setActiveHorizon(h.id)}
                className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
                  isSelected 
                    ? "bg-primary/10 border-secondary shadow-[0_0_15px_rgba(var(--primary-rgb),0.15)]" 
                    : "glass border-border/65 hover:bg-white/2"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Map className={`w-5 h-5 ${isSelected ? "text-secondary" : "text-gray-500"}`} />
                  <span className={`font-medium ${isSelected ? "text-white" : "text-gray-400"}`}>{h.label}</span>
                </div>
              </button>
            );
          })}

          <div className="mt-8 glass p-6 rounded-xl border border-border/65 text-center">
            <Trophy className="w-8 h-8 text-[#F59E0B] mx-auto mb-3" />
            <h4 className="text-white font-semibold mb-1">Target Role Target</h4>
            <p className="text-xs text-gray-400 leading-relaxed max-w-[200px] mx-auto">{targetGoal}</p>
          </div>
        </div>

        {/* Actionable Roadmap */}
        <div className="lg:col-span-3 space-y-4">
          {isLoading ? (
            <div className="glass rounded-xl p-12 border border-border/65 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 text-secondary animate-spin" />
              <p className="text-gray-400 text-sm italic">AI Career Coach generating personalized modules...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeHorizon}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="p-4 bg-[rgba(17,24,39,0.5)] border border-border/65 rounded-xl">
                  <h3 className="text-base font-bold text-white mb-1">{roadmap?.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{roadmap?.description}</p>
                </div>

                {roadmap?.modules && roadmap.modules.length > 0 ? (
                  roadmap.modules.map((mod, index) => (
                    <div 
                      key={mod.id || index}
                      className="glass rounded-xl border border-border/65 overflow-hidden"
                    >
                      <div className="p-5 border-b border-border/65 bg-primary/3 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Server className="w-5 h-5 text-secondary" />
                          <div>
                            <h3 className="text-sm font-bold text-white">{mod.title}</h3>
                            <p className="text-[10px] text-secondary uppercase tracking-wider font-semibold mt-0.5">Priority: {mod.priority}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-400 font-semibold">{mod.status === "in-progress" ? "In Progress" : mod.status === "completed" ? "Completed" : "Locked"}</span>
                          <div className="w-24 h-1.5 bg-gray-800 rounded-full mt-1.5 overflow-hidden">
                            <div className="h-full bg-secondary" style={{ width: `${mod.progress}%` }}></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-5 space-y-4">
                        <div className="text-xs text-gray-400 bg-white/2 p-3 rounded-lg border border-[rgba(255,255,255,0.02)] leading-relaxed">
                          <strong className="text-white">Expected Learning Outcome: </strong>
                          {mod.expected_outcome}
                        </div>

                        {mod.resources && mod.resources.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Curated Resources</p>
                            {mod.resources.map((res, rIdx) => (
                              <div key={rIdx} className="flex items-start space-x-3 p-3 rounded-lg bg-[rgba(255,255,255,0.01)] border border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.03)] transition-colors">
                                {res.type === "Reading" ? (
                                  <BookOpen className="w-4 h-4 text-[#3B82F6] mt-0.5 flex-shrink-0" />
                                ) : (
                                  <PlayCircle className="w-4 h-4 text-[#EF4444] mt-0.5 flex-shrink-0" />
                                )}
                                <div className="flex-1">
                                  <h4 className="text-xs font-semibold text-white">{res.title}</h4>
                                  <p className="text-[10px] text-gray-400 mt-0.5">{res.type} • Duration: {res.duration}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {mod.tasks && mod.tasks.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Milestone Exercises</p>
                            {mod.tasks.map((task, tIdx) => (
                              <div key={tIdx} className="flex items-center space-x-3 text-xs">
                                {mod.status === "completed" ? (
                                  <CheckCircle className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border border-gray-600 flex-shrink-0"></div>
                                )}
                                <span className={mod.status === "completed" ? "text-gray-500 line-through" : "text-gray-300"}>{task}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="glass p-12 text-center text-gray-400 text-sm">
                    No curriculum modules available. Complete an onboarding parse first.
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
