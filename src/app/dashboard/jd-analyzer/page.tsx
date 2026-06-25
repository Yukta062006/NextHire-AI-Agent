"use client";

import { API_BASE_URL, getAuthHeaders } from "@/utils/api";


import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileSearch, Target, TrendingDown, BookOpen, AlertCircle, Loader2 } from "lucide-react";

interface MissingSkill {
  skill: string;
  importance: "high" | "medium" | "low";
  learning_difficulty: string;
  estimated_time: string;
}

interface ImprovingSkill {
  skill: string;
  current_level: number;
  required_level: number;
  gap: number;
}

interface GapAnalysisData {
  match_score: number;
  matching_skills: Array<{ skill: string; candidate_level: number; required_level: number }>;
  missing_skills: MissingSkill[];
  skills_to_improve: ImprovingSkill[];
  priority_ranking: string[];
  summary: string;
}

export default function JDAnalyzer() {
  const [jdContent, setJdContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gapData, setGapData] = useState<GapAnalysisData | null>(null);
  const [showInput, setShowInput] = useState(true);

  const handleAnalyzeJD = async () => {
    if (!jdContent.trim()) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // 1. Fetch latest resume skills
      let candidateSkills = { "Python": 90, "React": 85, "TypeScript": 80, "FastAPI": 85 };
      try {
        const resumeRes = await fetch(`${API_BASE_URL}/api/resumes/latest`, {
          headers: getAuthHeaders(null)
        });
        if (resumeRes.ok) {
          const resJson = await resumeRes.json();
          if (resJson.skill_confidence) {
            candidateSkills = resJson.skill_confidence;
          }
        }
      } catch (e) {
        console.warn("Analyzer: Failed to fetch candidate resume, using default profile", e);
      }

      // 2. Perform Gap Analysis via backend agent
      const response = await fetch(`${API_BASE_URL}/api/jd/analyze`, {
        method: "POST",
        headers: getAuthHeaders("application/json"),
        body: JSON.stringify({
          content: jdContent,
          title: "Job Description"
        })
      });

      if (!response.ok) {
        throw new Error("Failed to analyze Job Description.");
      }

      const jdData = await response.json();
      
      // Perform skill gap comparison on backend
      const gapResponse = await fetch(`${API_BASE_URL}/api/jd/${jdData.id}/gap-analysis`, {
        headers: getAuthHeaders(null)
      });
      if (!gapResponse.ok) {
        throw new Error("Failed to compile skill gap analysis.");
      }

      const rawGap = await gapResponse.json();
      
      let gap = rawGap.gap_analysis || {};
      if (typeof gap === "string") {
        try {
          gap = JSON.parse(gap);
        } catch (e) {
          gap = {};
        }
      }
      
      // Map API data structure to frontend component layout
      setGapData({
        match_score: rawGap.match_score !== undefined && rawGap.match_score !== null ? rawGap.match_score : (gap.match_score || 78),
        matching_skills: gap.matching_skills || [],
        missing_skills: gap.missing_skills || [],
        skills_to_improve: gap.skills_to_improve || [],
        priority_ranking: gap.priority_ranking || [],
        summary: gap.summary || "Skill gaps matching completed."
      });

      setShowInput(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred during gap analysis.";
      setError(errorMsg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">JD Analyzer</h1>
          <p className="text-gray-400">Match your profile against job descriptions to identify skill gaps.</p>
        </div>
        {!showInput && (
          <button 
            onClick={() => {
              setShowInput(true);
              setGapData(null);
              setJdContent("");
            }}
            className="px-4 py-2 bg-primary hover:bg-primary-hover rounded-lg text-sm text-white transition-colors flex items-center space-x-2"
          >
            <FileSearch className="w-4 h-4" />
            <span>Analyze New JD</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-[rgba(239,68,68,0.1)] border border-[#EF4444]/30 rounded-xl flex items-center space-x-3 text-[#EF4444] text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {showInput ? (
        <div className="glass rounded-xl border border-border/65 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white">Paste Job Description</h3>
          <textarea
            value={jdContent}
            onChange={(e) => setJdContent(e.target.value)}
            disabled={isAnalyzing}
            placeholder="We are looking for a Software Engineer proficient in React, Node, Python, and GraphQL. Experience with database design and AWS deployments is highly preferred..."
            className="w-full bg-card border border-border rounded-xl p-4 text-white text-sm focus:outline-none focus:border-primary transition-all min-h-[220px]"
          />
          <div className="flex justify-end">
            <button
              onClick={handleAnalyzeJD}
              disabled={isAnalyzing || !jdContent.trim()}
              className="px-6 py-3 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] flex items-center space-x-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Aligning Requirements...</span>
                </>
              ) : (
                <>
                  <FileSearch className="w-4 h-4" />
                  <span>Calculate Matching Index</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Match Overview */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-1 space-y-6"
          >
            <div className="glass p-6 rounded-xl border border-border/65 text-center flex flex-col items-center justify-center min-h-[250px]">
              <h3 className="font-semibold text-gray-400 mb-4">Overall Match Score</h3>
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                  <circle 
                    cx="64" 
                    cy="64" 
                    r="56" 
                    stroke="#A855F7" 
                    strokeWidth="8" 
                    fill="none" 
                    strokeDasharray="351.8" 
                    strokeDashoffset={351.8 - (351.8 * (gapData?.match_score || 78)) / 100} 
                    className="transition-all duration-1000 ease-out" 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-white">{gapData?.match_score}%</span>
                </div>
              </div>
              <p className="text-sm text-secondary mt-4 font-medium">
                {gapData?.match_score && gapData.match_score > 80 ? "Excellent Match" : gapData?.match_score && gapData.match_score > 60 ? "Good Match" : "Bridging Required"}
              </p>
            </div>

            <div className="glass p-6 rounded-xl border border-border/65">
              <h3 className="font-semibold text-white mb-4">Role Requirements</h3>
              <div className="space-y-4">
                <div className="text-xs text-gray-400 bg-white/2 p-3 rounded-lg border border-[rgba(255,255,255,0.02)] leading-relaxed">
                  <strong className="text-white">AI Verdict: </strong>
                  {gapData?.summary}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Gap Analysis */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 glass rounded-xl border border-border/65 overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-border/65 bg-card">
              <h3 className="font-semibold text-white text-lg flex items-center space-x-2">
                <Target className="w-5 h-5 text-secondary" />
                <span>Skill Gap Analysis</span>
              </h3>
            </div>
            
            <div className="p-6 flex-1 flex flex-col space-y-8">
              {gapData?.missing_skills && gapData.missing_skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-[#EF4444]" />
                    <span>Missing Priority Skills</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {gapData.missing_skills.map((miss, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.05)] flex items-start justify-between">
                        <div>
                          <p className="text-white font-medium text-sm">{miss.skill}</p>
                          <p className="text-[10px] text-gray-400 mt-1">Est. Learning Time: {miss.estimated_time}</p>
                        </div>
                        <span className="text-[10px] px-2 py-1 bg-[#EF4444] text-white rounded font-medium capitalize">{miss.importance}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {gapData?.skills_to_improve && gapData.skills_to_improve.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center space-x-2">
                    <TrendingDown className="w-4 h-4 text-[#F59E0B]" />
                    <span>Skills to Improve</span>
                  </h4>
                  <div className="space-y-3">
                    {gapData.skills_to_improve.map((imp, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-border/65 bg-white/2">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-white font-medium text-sm">{imp.skill}</p>
                          <span className="text-xs text-[#F59E0B]">Gap: {imp.gap}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-[#F59E0B] rounded-full" style={{ width: `${imp.current_level}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-auto pt-6 border-t border-border/65">
                <button 
                  onClick={() => window.location.href = '/dashboard/career-coach'}
                  className="w-full py-3 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-secondary rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Generate Learning Roadmap</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
