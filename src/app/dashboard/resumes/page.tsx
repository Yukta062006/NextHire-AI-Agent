"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { API_BASE_URL, getAuthHeaders } from "@/utils/api";
import { 
  UploadCloud, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Briefcase, 
  GraduationCap, 
  Code,
  Loader2,
  FileText
} from "lucide-react";

interface SkillVerified {
  skill: string;
  claimed: boolean;
  verified: boolean | "partial";
  confidence: number;
  evidence: string;
}

interface ResumeData {
  name: string;
  target_role: string;
  experience_years: string;
  education_degree: string;
  trust_score: number;
  summary: string;
  skills: SkillVerified[];
}

const DEFAULT_RESUME: ResumeData = {
  name: "Alex Developer",
  target_role: "Senior Frontend Engineer",
  experience_years: "5+ Years Experience",
  education_degree: "B.S. Computer Science",
  trust_score: 84,
  summary: "Highly motivated Full Stack Engineer with 5+ years of experience building high-performance web applications. Skilled in modern React frontends and Node/Python backends.",
  skills: [
    { skill: "React", claimed: true, verified: true, confidence: 92, evidence: "Strong Evidence (3 Projects, 4 Years)" },
    { skill: "TypeScript", claimed: true, verified: true, confidence: 88, evidence: "Strong Evidence (2 Projects)" },
    { skill: "AWS", claimed: true, verified: "partial", confidence: 68, evidence: "Limited Evidence (Mentioned once)" },
    { skill: "Docker", claimed: true, verified: true, confidence: 89, evidence: "Strong Evidence (Current Role)" },
    { skill: "GraphQL", claimed: true, verified: false, confidence: 21, evidence: "No Evidence Found" },
  ]
};

export default function ResumeIntelligence() {
  const [data, setData] = useState<ResumeData>(DEFAULT_RESUME);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch the latest uploaded resume on page load
  useEffect(() => {
    async function loadLatestResume() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/resumes/latest`, {
          headers: getAuthHeaders(null)
        });
        if (!response.ok) return; // Silent return if none found yet
        
        const resData = await response.json();
        if (resData.parsed_content) {
          let parsed = resData.parsed_content;
          if (typeof parsed === "string") {
            try {
              parsed = JSON.parse(parsed);
            } catch (e) {
              console.error("Failed to parse parsed_content", e);
            }
          }
          
          // Map backend structure to frontend structure
          const skillsList: SkillVerified[] = (parsed.skills || []).map((sk: string) => {
            const confidence = parsed.skill_confidence?.[sk] || 75;
            let verified: boolean | "partial" = false;
            let evidence = "Mentioned in resume";
            
            if (confidence > 80) {
              verified = true;
              evidence = `Strong Evidence (${confidence}% Confidence)`;
            } else if (confidence > 50) {
              verified = "partial";
              evidence = `Partial Evidence (${confidence}% Confidence)`;
            } else {
              evidence = "Limited context in resume";
            }
            
            return {
              skill: sk,
              claimed: true,
              verified,
              confidence,
              evidence
            };
          });

          setData({
            name: parsed.name || "Candidate",
            target_role: parsed.target_role || "Software Engineer",
            experience_years: parsed.experience?.[0]?.duration ? `${parsed.experience[0].duration} Experience` : "2+ Years Experience",
            education_degree: parsed.education?.[0]?.degree || "Degree in Computer Science",
            trust_score: parsed.resume_score || 80,
            summary: parsed.summary || "No professional summary provided.",
            skills: skillsList.length > 0 ? skillsList : DEFAULT_RESUME.skills
          });
        }
      } catch (err) {
        console.error("Failed to load latest resume", err);
      }
    }

    loadLatestResume();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/resumes/upload`, {
        method: "POST",
        headers: getAuthHeaders(null),
        body: formData,
      });

      if (!response.ok) {
        const errDetail = await response.json();
        throw new Error(errDetail.detail || "Failed to upload and parse resume.");
      }

      const resData = await response.json();
      let parsed = resData.parsed_content;
      if (typeof parsed === "string") {
        try {
          parsed = JSON.parse(parsed);
        } catch (e) {
          console.error("Failed to parse parsed_content", e);
        }
      }

      // Map backend structure to frontend structure
      const skillsList: SkillVerified[] = (parsed.skills || []).map((sk: string) => {
        const confidence = parsed.skill_confidence?.[sk] || 75;
        let verified: boolean | "partial" = false;
        let evidence = "Mentioned in resume";
        
        if (confidence > 80) {
          verified = true;
          evidence = `Strong Evidence (${confidence}% Confidence)`;
        } else if (confidence > 50) {
          verified = "partial";
          evidence = `Partial Evidence (${confidence}% Confidence)`;
        } else {
          evidence = "Limited context in resume";
        }
        
        return {
          skill: sk,
          claimed: true,
          verified,
          confidence,
          evidence
        };
      });

      setData({
        name: parsed.name || "Candidate",
        target_role: parsed.target_role || "Software Engineer",
        experience_years: parsed.experience?.[0]?.duration ? `${parsed.experience[0].duration} Experience` : "Experience from resume",
        education_degree: parsed.education?.[0]?.degree || "Degree from resume",
        trust_score: parsed.resume_score || 70,
        summary: parsed.summary || "Resume analysis completed. See skill verification below.",
        skills: skillsList.length > 0 ? skillsList : DEFAULT_RESUME.skills
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Resume Intelligence</h1>
          <p className="text-gray-400">AI-driven analysis and skill verification of the uploaded resume.</p>
        </div>
        
        <div>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.docx,.txt"
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="px-4 py-2 bg-primary hover:bg-primary-hover rounded-lg text-sm text-white transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4" />
            )}
            <span>{isLoading ? "Analyzing..." : "Upload New Resume"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[rgba(239,68,68,0.1)] border border-[#EF4444]/30 rounded-xl flex items-center space-x-3 text-[#EF4444] text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="glass p-12 rounded-xl border border-border/65 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-secondary animate-spin"></div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white">AI Extracting Resume Intelligence</h3>
            <p className="text-sm text-gray-400 mt-1">Cross-referencing technical skills, timeline validation, and project complexity...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 grid-flow-row lg:grid-cols-3 gap-6">
          {/* Candidate Profile Summary */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-1 space-y-6"
          >
            <div className="glass p-6 rounded-xl border border-border/65">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-xl font-bold text-white shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)]">
                  {data.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{data.name}</h2>
                  <p className="text-sm text-secondary">{data.target_role}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-sm">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{data.experience_years}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{data.education_degree}</span>
                </div>
                <div className="flex items-start space-x-3 text-sm">
                  <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-400 italic line-clamp-4">{data.summary}</span>
                </div>
              </div>
            </div>

            <div className="glass p-6 rounded-xl border border-border/65 bg-primary/5 border-secondary/30">
              <h3 className="font-semibold text-white mb-2 flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-secondary" />
                <span>Overall Trust Score</span>
              </h3>
              <div className="flex items-end space-x-2">
                <span className="text-4xl font-bold text-white">{data.trust_score}%</span>
                <span className="text-sm text-gray-400 mb-1">
                  {data.trust_score > 80 ? "High Confidence" : data.trust_score > 60 ? "Moderate Confidence" : "Probing Needed"}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Based on cross-referencing experience timeline and project complexity.
              </p>
            </div>
          </motion.div>

          {/* Skill Verification Table */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 glass rounded-xl border border-border/65 overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-border/65 bg-card">
              <h3 className="font-semibold text-white text-lg">Skill Verification Matrix</h3>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-400 uppercase bg-background">
                  <tr>
                    <th className="px-6 py-4 font-medium">Skill</th>
                    <th className="px-6 py-4 font-medium">Claimed</th>
                    <th className="px-6 py-4 font-medium">Verified</th>
                    <th className="px-6 py-4 font-medium">Confidence</th>
                    <th className="px-6 py-4 font-medium">Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                  {data.skills.map((item, i) => (
                    <tr key={i} className="hover:bg-white/2 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{item.skill}</td>
                      <td className="px-6 py-4">
                        {item.claimed ? <CheckCircle2 className="w-4 h-4 text-gray-400" /> : "-"}
                      </td>
                      <td className="px-6 py-4">
                        {item.verified === true && (
                          <div className="flex items-center space-x-1.5 text-[#22C55E]">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Yes</span>
                          </div>
                        )}
                        {item.verified === 'partial' && (
                          <div className="flex items-center space-x-1.5 text-[#F59E0B]">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Partial</span>
                          </div>
                        )}
                        {item.verified === false && (
                          <div className="flex items-center space-x-1.5 text-[#EF4444]">
                            <AlertCircle className="w-4 h-4" />
                            <span>No</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-full max-w-[60px] h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                item.confidence > 80 ? 'bg-[#22C55E]' : item.confidence > 50 ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'
                              }`}
                              style={{ width: `${item.confidence}%` }}
                            ></div>
                          </div>
                          <span className="text-gray-300">{item.confidence}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{item.evidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
