"use client";

import { API_BASE_URL, getAuthHeaders } from "@/utils/api";


import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Briefcase, 
  Code, 
  Database, 
  TerminalSquare,
  GraduationCap,
  UploadCloud,
  Target,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText
} from "lucide-react";

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [goal, setGoal] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const ROLES = [
    { id: "Frontend Engineer", name: "Frontend Engineer", icon: Code },
    { id: "Backend Engineer", name: "Backend Engineer", icon: TerminalSquare },
    { id: "Full Stack Developer", name: "Full Stack Developer", icon: Briefcase },
    { id: "Data Scientist", name: "Data Scientist", icon: Database },
  ];

  const EXPERIENCE_LEVELS = [
    { id: "Student", name: "Student", desc: "Currently in university" },
    { id: "Fresher", name: "Fresher", desc: "0-1 years" },
    { id: "Junior", name: "Junior (1-3 Years)", desc: "Early career" },
    { id: "Mid", name: "Mid (3-5 Years)", desc: "Mid level" },
    { id: "Senior", name: "Senior (5+ Years)", desc: "Senior level" },
  ];

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setUploadedFileName(file.name);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/resumes/upload`, {
        method: "POST",
        headers: getAuthHeaders(null),
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("nexthire_token");
          localStorage.removeItem("nexthire_user");
          router.push("/login");
          return;
        }
        const errDetail = await response.json();
        throw new Error(errDetail.detail || "Failed to upload and parse resume.");
      }

      const resData = await response.json();
      
      // Update local storage user model with newly extracted name from resume
      let parsed = resData.parsed_content;
      if (parsed) {
        if (typeof parsed === "string") {
          try {
            parsed = JSON.parse(parsed);
          } catch (e) {}
        }
        if (parsed.name && parsed.name !== "Candidate's Full Name") {
          const parsedName = parsed.name;
          const stored = localStorage.getItem("nexthire_user");
          if (stored) {
            const parsedUser = JSON.parse(stored);
            parsedUser.name = parsedName;
            localStorage.setItem("nexthire_user", JSON.stringify(parsedUser));
          } else {
            localStorage.setItem("nexthire_user", JSON.stringify({ name: parsedName }));
          }
        }
      }

      // Automatically move to the next step after successful upload
      setTimeout(() => {
        setIsUploading(false);
        nextStep();
      }, 1000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred during resume parsing.";
      setError(errorMsg);
      setUploadedFileName(null);
      setIsUploading(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith(".pdf") || lowerName.endsWith(".docx") || lowerName.endsWith(".txt")) {
        await processFile(file);
      } else {
        setError("Unsupported file format. Please upload PDF, DOCX or TXT.");
      }
    }
  };

  const handleCompleteSetup = async () => {
    try {
      // Save onboarding profiles to backend user model
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: "PUT",
        headers: getAuthHeaders("application/json"),
        body: JSON.stringify({
          target_role: role,
          experience_level: experience,
          career_goals: goal,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("nexthire_token");
          localStorage.removeItem("nexthire_user");
          router.push("/login");
          return;
        }
        throw new Error("Failed to save user target profiles.");
      }

      const updatedUser = await response.json();
      localStorage.setItem("nexthire_user", JSON.stringify(updatedUser));

      router.push("/dashboard");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred while saving setup.";
      setError(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-white">
      {/* Progress Bar */}
      <div className="w-full max-w-2xl mb-12">
        <div className="flex justify-between mb-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`text-sm font-medium ${step >= i ? "text-secondary" : "text-gray-500"}`}>
              {i === 1 ? "Role" : i === 2 ? "Experience" : i === 3 ? "Resume" : "Goals"}
            </div>
          ))}
        </div>
        <div className="h-2 w-full bg-card rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-primary to-secondary"
            initial={{ width: 0 }}
            animate={{ width: `${(step / 4) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {error && (
        <div className="w-full max-w-2xl mb-4 p-4 bg-[rgba(239,68,68,0.1)] border border-[#EF4444]/30 rounded-xl flex items-center space-x-3 text-[#EF4444] text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="w-full max-w-2xl glass rounded-2xl p-8 relative overflow-hidden min-h-[440px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">Select Target Role</h2>
                <p className="text-gray-400">What position are you preparing for?</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  const isSelected = role === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      className={`p-4 rounded-xl border flex items-center space-x-4 transition-all ${
                        isSelected 
                          ? "bg-primary/10 border-secondary shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]" 
                          : "border-border/65 hover:border-[rgba(255,255,255,0.2)] hover:bg-card"
                      }`}
                    >
                      <div className={`p-3 rounded-lg ${isSelected ? "bg-primary text-white" : "bg-[#1F2937] text-gray-400"}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="font-medium text-base text-left">{r.name}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">Experience Level</h2>
                <p className="text-gray-400">Help us tailor the interview difficulty.</p>
              </div>

              <div className="space-y-3 mt-6">
                {EXPERIENCE_LEVELS.map((level) => {
                  const isSelected = experience === level.id;
                  return (
                    <button
                      key={level.id}
                      onClick={() => setExperience(level.id)}
                      className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
                        isSelected 
                          ? "bg-primary/10 border-secondary" 
                          : "border-border/65 hover:border-[rgba(255,255,255,0.2)] hover:bg-card"
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <GraduationCap className={`w-6 h-6 ${isSelected ? "text-secondary" : "text-gray-500"}`} />
                        <div className="text-left">
                          <p className="font-medium">{level.name}</p>
                          <p className="text-xs text-gray-400">{level.desc}</p>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-secondary" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 flex-1 flex flex-col justify-center"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">Upload Resume</h2>
                <p className="text-gray-400">We&apos;ll analyze it to verify your skills.</p>
              </div>

              <div className="mt-4 flex-1">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.docx,.txt"
                  className="hidden" 
                />
                
                <div 
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center justify-center bg-[rgba(17,24,39,0.5)] hover:bg-[rgba(17,24,39,0.8)] transition-all cursor-pointer group relative overflow-hidden min-h-[220px]"
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-secondary animate-spin"></div>
                      <div className="text-center">
                        <p className="text-secondary font-medium animate-pulse">Extracting Resume Intelligence...</p>
                        {uploadedFileName && <p className="text-xs text-gray-400 mt-1">{uploadedFileName}</p>}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-8 h-8 text-secondary" />
                      </div>
                      <p className="text-base font-semibold">Drag & Drop Resume here</p>
                      <p className="text-xs text-gray-500 mt-1">or click to browse PDF, DOCX or TXT files (Max 5MB)</p>
                      {uploadedFileName && (
                        <div className="mt-3 flex items-center space-x-1.5 text-xs text-secondary bg-primary/10 px-2.5 py-1 rounded-full">
                          <FileText className="w-3.5 h-3.5" />
                          <span>{uploadedFileName}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">Set Career Goal</h2>
                <p className="text-gray-400">What are you aiming for next?</p>
              </div>

              <div className="mt-6 space-y-6">
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-[0_0_30px_rgba(var(--primary-rgb),0.4)]">
                    <Target className="w-10 h-10 text-white" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-400 ml-1">My ultimate goal is to...</label>
                  <textarea
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g. Land a Senior Frontend Engineer role at a top-tier tech company within 3 months..."
                    className="w-full bg-card border border-border rounded-xl p-4 text-white focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all min-h-[120px] resize-none"
                  ></textarea>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between items-center border-t border-border pt-5">
          {step > 1 ? (
            <button 
              onClick={prevStep}
              className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : <div></div>}

          {step < 3 && (
            <button 
              onClick={nextStep}
              disabled={step === 1 ? !role : !experience}
              className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-all text-sm ${
                (step === 1 && role) || (step === 2 && experience)
                  ? "bg-gradient-to-r from-primary to-secondary text-white hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)]"
                  : "bg-gray-800 text-gray-500 cursor-not-allowed"
              }`}
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 3 && (
            <button 
              onClick={nextStep}
              className="flex items-center space-x-1 px-4 py-2 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <span>Skip Upload</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {step === 4 && (
            <button 
              onClick={handleCompleteSetup}
              disabled={!goal}
              className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-all text-sm ${
                goal
                  ? "bg-[#22C55E] hover:bg-[#16A34A] text-white hover:shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                  : "bg-gray-800 text-gray-500 cursor-not-allowed"
              }`}
            >
              <span>Complete Setup</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
