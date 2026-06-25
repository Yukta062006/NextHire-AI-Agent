"use client";

import { API_BASE_URL, getAuthHeaders } from "@/utils/api";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, 
  MicOff,
  Video, 
  VideoOff,
  Monitor, 
  Brain, 
  MessageSquare, 
  Activity, 
  Play, 
  Loader2, 
  ChevronRight,
  ArrowRight,
  AlertOctagon,
  Sparkles,
  PieChart,
  UserCheck,
  Zap,
  Building
} from "lucide-react";

interface QuestionData {
  id: string;
  question_text: string;
  difficulty: string;
  category: string;
  topic: string;
  knowledge_node: string;
  order_index: number;
}

const COMPANY_THEMES: Record<string, { primary: string; hover: string; text: string; glow: string; bg: string }> = {
  Standard: { primary: "from-primary to-secondary", hover: "hover:from-primary-hover hover:to-secondary-hover", text: "text-secondary", glow: "rgba(var(--primary-rgb),0.3)", bg: "bg-primary" },
  Google: { primary: "from-[#4285F4] to-[#34A853]", hover: "hover:from-[#357AE8] hover:to-[#2B8E47]", text: "text-[#4285F4]", glow: "rgba(66,133,244,0.3)", bg: "bg-[#4285F4]" },
  Amazon: { primary: "from-[#FF9900] to-[#146EB4]", hover: "hover:from-[#E08800] hover:to-[#115E9B]", text: "text-[#FF9900]", glow: "rgba(255,153,0,0.3)", bg: "bg-[#FF9900]" },
  Meta: { primary: "from-[#0668E1] to-[#00F2FE]", hover: "hover:from-[#055CC7] hover:to-[#00D7E2]", text: "text-[#0668E1]", glow: "rgba(6,104,225,0.3)", bg: "bg-[#0668E1]" },
  Stripe: { primary: "from-[#635BFF] to-[#00D4FF]", hover: "hover:from-[#534BE6] hover:to-[#00BCED]", text: "text-[#635BFF]", glow: "rgba(99,91,255,0.3)", bg: "bg-[#635BFF]" },
  Netflix: { primary: "from-[#E50914] to-[#221F1F]", hover: "hover:from-[#C40812] hover:to-[#171515]", text: "text-[#E50914]", glow: "rgba(229,9,20,0.3)", bg: "bg-[#E50914]" },
  Microsoft: { primary: "from-[#00A4EF] to-[#7FBA00]", hover: "hover:from-[#008ED0] hover:to-[#6CA000]", text: "text-[#00A4EF]", glow: "rgba(0,164,239,0.3)", bg: "bg-[#00A4EF]" },
  Uber: { primary: "from-[#000000] to-[#555555]", hover: "hover:from-[#111111] hover:to-[#444444]", text: "text-white", glow: "rgba(255,255,255,0.15)", bg: "bg-white text-black" },
  Atlassian: { primary: "from-[#0052CC] to-[#00B4D8]", hover: "hover:from-[#0047B3] hover:to-[#009EBE]", text: "text-[#0052CC]", glow: "rgba(0,82,204,0.3)", bg: "bg-[#0052CC]" }
};

export default function LiveInterview() {
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [interviewStatus, setInterviewStatus] = useState<"idle" | "starting" | "active" | "submitting" | "completed" | "terminated">("idle");
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [answer, setAnswer] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [averageScore, setAverageScore] = useState<number>(0);
  const [questionsAnswered, setQuestionsAnswered] = useState<number>(0);
  const [showTermination, setShowTermination] = useState(false);
  const [terminationReason, setTerminationReason] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("Standard");
  const [evaluationReport, setEvaluationReport] = useState<any>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [reportTab, setReportTab] = useState<"verdict" | "predictions">("verdict");

  // Media states and refs
  const [micEnabled, setMicEnabled] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [screenShareEnabled, setScreenShareEnabled] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  
  // Real-time evaluation metrics
  const [metrics, setMetrics] = useState({
    technical_score: 70,
    communication_score: 70,
    confidence_score: 70,
    pressure_score: 70,
    time_efficiency_score: 70,
    skill_verification_score: 70,
    nexthire_score: 70,
    hire_probability: 70,
    recommendation: "Borderline"
  });

  const [waves, setWaves] = useState([1, 1, 1, 1, 1]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Active theme based on target company
  const currentTheme = COMPANY_THEMES[selectedCompany] || COMPANY_THEMES["Standard"];

  // Simulated AI voice waves animation
  useEffect(() => {
    const waveInterval = setInterval(() => {
      if (interviewStatus === "active") {
        setWaves(Array.from({ length: 5 }, () => Math.random() * 0.8 + 0.2));
      } else {
        setWaves([0.2, 0.2, 0.2, 0.2, 0.2]);
      }
    }, 150);
    return () => clearInterval(waveInterval);
  }, [interviewStatus]);

  // Duration Timer
  useEffect(() => {
    if (interviewStatus === "active") {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [interviewStatus]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  // Toggle microphone stream
  const toggleMic = async () => {
    if (micEnabled) {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
        micStreamRef.current = null;
      }
      setMicEnabled(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        micStreamRef.current = stream;
        setMicEnabled(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("Could not access microphone. Please check your browser permissions.");
      }
    }
  };

  // Toggle camera stream
  const toggleCamera = async () => {
    if (cameraEnabled) {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
        cameraStreamRef.current = null;
      }
      setCameraEnabled(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        cameraStreamRef.current = stream;
        setCameraEnabled(true);
      } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Could not access camera. Please check your browser permissions.");
      }
    }
  };

  // Stop screen sharing helper
  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    setScreenShareEnabled(false);
  };

  // Toggle screen sharing
  const toggleScreenShare = async () => {
    if (screenShareEnabled) {
      stopScreenShare();
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        setScreenShareEnabled(true);
        
        // Handle stop sharing clicked from the browser's native bar
        stream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };
      } catch (err) {
        console.error("Error starting screen share:", err);
      }
    }
  };

  // Stop all media streams helper
  const stopAllStreams = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    setCameraEnabled(false);

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    setMicEnabled(false);

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    setScreenShareEnabled(false);
  };

  // Attach camera stream to video element when enabled
  useEffect(() => {
    if (cameraEnabled && cameraStreamRef.current && videoRef.current) {
      videoRef.current.srcObject = cameraStreamRef.current;
    }
  }, [cameraEnabled]);

  // Attach screen stream to video element when enabled
  useEffect(() => {
    if (screenShareEnabled && screenStreamRef.current && screenVideoRef.current) {
      screenVideoRef.current.srcObject = screenStreamRef.current;
    }
  }, [screenShareEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleStartInterview = async () => {
    setInterviewStatus("starting");
    try {
      let resumeId = null;
      try {
        const resumeRes = await fetch(`${API_BASE_URL}/api/resumes/latest`, {
          headers: getAuthHeaders(null)
        });
        if (resumeRes.ok) {
          const resumeData = await resumeRes.json();
          resumeId = resumeData.id;
        }
      } catch (e) {
        console.warn("No resume found, starting general interview", e);
      }

      const response = await fetch(`${API_BASE_URL}/api/interviews/start`, {
        method: "POST",
        headers: getAuthHeaders("application/json"),
        body: JSON.stringify({
          resume_id: resumeId,
          interview_type: "technical",
          difficulty: "Medium",
          company: selectedCompany
        })
      });

      if (!response.ok) {
        throw new Error("Failed to start AI interview.");
      }

      const data = await response.json();
      setInterviewId(data.interview_id);
      setQuestion(data.first_question);
      setDifficulty(data.first_question.difficulty);
      setInterviewStatus("active");
    } catch (e) {
      console.error(e);
      setInterviewStatus("idle");
    }
  };

  const fetchEvaluationReport = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scoring/${id}`, {
        headers: getAuthHeaders(null)
      });
      if (response.ok) {
        const evalData = await response.json();
        setEvaluationReport(evalData);
      }
    } catch (e) {
      console.error("Failed to fetch detailed evaluation report", e);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !interviewId) return;

    setInterviewStatus("submitting");
    try {
      const response = await fetch(`${API_BASE_URL}/api/interviews/${interviewId}/answer`, {
        method: "POST",
        headers: getAuthHeaders("application/json"),
        body: JSON.stringify({
          answer_text: answer,
          response_time_seconds: 30.0 // average benchmark
        })
      });

      if (!response.ok) {
        throw new Error("Failed to process answer.");
      }

      const data = await response.json();
      
      if (data.updated_metrics) {
        setMetrics(data.updated_metrics);
        setAverageScore(data.updated_metrics.nexthire_score);
      }

      setQuestionsAnswered(prev => prev + 1);

      if (data.interview_terminated) {
        setInterviewStatus("terminated");
        setTerminationReason(data.termination_reason || "Fundamental skill gap identified.");
        setShowTermination(true);
        stopAllStreams();
        return;
      }

      if (data.interview_completed) {
        setInterviewStatus("completed");
        await fetchEvaluationReport(interviewId);
        setShowCompleted(true);
        stopAllStreams();
        return;
      }

      if (data.next_question) {
        setQuestion(data.next_question);
        setDifficulty(data.next_question.difficulty);
        setAnswer("");
        setInterviewStatus("active");
      }
    } catch (e) {
      console.error(e);
      setInterviewStatus("active");
    }
  };

  const handleEndInterview = async () => {
    if (!interviewId) return;
    try {
      await fetch(`${API_BASE_URL}/api/interviews/${interviewId}/end`, {
        method: "POST",
        headers: getAuthHeaders("application/json")
      });
      setInterviewStatus("completed");
      await fetchEvaluationReport(interviewId);
      setShowCompleted(true);
      stopAllStreams();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] lg:h-[calc(100vh-120px)] flex flex-col space-y-4 relative">
      {/* Top Control Bar */}
      <div className="flex items-center justify-between bg-card border border-border/65 p-4 rounded-xl">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3.5 h-3.5 rounded-full ${interviewStatus === "active" ? 'bg-[#EF4444] animate-pulse' : 'bg-gray-500'}`}></div>
            <span className="text-white font-medium flex items-center space-x-1.5">
              <span>AI Adaptive Technical Interview</span>
              {selectedCompany !== "Standard" && (
                <span className={`text-xs px-2 py-0.5 rounded border border-border bg-white/5 font-semibold ${currentTheme.text}`}>
                  {selectedCompany} Mock
                </span>
              )}
            </span>
          </div>
          {interviewStatus === "active" && (
            <>
              <div className="h-4 w-px bg-[rgba(255,255,255,0.1)]"></div>
              <span className={`text-sm font-medium ${currentTheme.text}`}>{formatTime(timeElapsed)}</span>
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {interviewStatus === "active" && (
            <>
              <button 
                onClick={handleEndInterview}
                className="px-3 py-1.5 bg-[rgba(239,68,68,0.1)] text-[#EF4444] border border-[rgba(239,68,68,0.3)] rounded-lg text-sm hover:bg-[rgba(239,68,68,0.2)] transition-colors flex items-center space-x-1 cursor-pointer font-semibold"
              >
                <span>End Session</span>
              </button>
              
              <button 
                onClick={toggleMic}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  micEnabled 
                    ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30" 
                    : "bg-white/5 text-gray-400 hover:text-white border border-transparent"
                }`}
                title={micEnabled ? "Mute Microphone" : "Unmute Microphone"}
              >
                {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-red-500" />}
              </button>
              
              <button 
                onClick={toggleCamera}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  cameraEnabled 
                    ? "bg-primary/10 text-primary border border-primary/30 shadow-[0_0_10px_rgba(var(--primary-rgb),0.2)]" 
                    : "bg-white/5 text-gray-400 hover:text-white border border-transparent"
                }`}
                title={cameraEnabled ? "Turn Off Camera" : "Turn On Camera"}
              >
                {cameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5 text-red-500" />}
              </button>
              
              <button 
                onClick={toggleScreenShare}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  screenShareEnabled 
                    ? "bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]" 
                    : "bg-white/5 text-gray-400 hover:text-white border border-transparent"
                }`}
                title={screenShareEnabled ? "Stop Sharing Screen" : "Share Screen"}
              >
                <Monitor className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {interviewStatus === "idle" || interviewStatus === "starting" ? (
        <div className="flex-1 glass rounded-xl border border-border/65 flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <div className={`w-24 h-24 rounded-full bg-gradient-to-tr ${currentTheme.primary} flex items-center justify-center`} style={{ boxShadow: `0 0 30px ${currentTheme.glow}` }}>
              <Brain className="w-12 h-12 text-white animate-pulse" />
            </div>
          </div>
          <div className="text-center max-w-md space-y-2">
            <h2 className="text-2xl font-bold text-white">Interactive Adaptive Interview</h2>
            <p className="text-sm text-gray-400">
              Benchmark your capabilities using our AI Adaptive Interview Engine. We&apos;ll customize questions in real time based on your target role and resume profile.
            </p>
          </div>

          <div className="w-full max-w-xl px-4 space-y-3">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Select Target Company Simulation</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { name: "Standard", color: "hover:border-gray-500", border: "border-border/65", text: "text-gray-400" },
                { name: "Google", color: "hover:border-[#4285F4]", border: "border-[#4285F4]/30", text: "text-[#4285F4]" },
                { name: "Amazon", color: "hover:border-[#FF9900]", border: "border-[#FF9900]/30", text: "text-[#FF9900]" },
                { name: "Meta", color: "hover:border-[#0668E1]", border: "border-[#0668E1]/30", text: "text-[#0668E1]" },
                { name: "Stripe", color: "hover:border-[#635BFF]", border: "border-[#635BFF]/30", text: "text-[#635BFF]" },
                { name: "Netflix", color: "hover:border-[#E50914]", border: "border-[#E50914]/30", text: "text-[#E50914]" },
                { name: "Microsoft", color: "hover:border-[#00A4EF]", border: "border-[#00A4EF]/30", text: "text-[#00A4EF]" },
                { name: "Uber", color: "hover:border-white", border: "border-white/30", text: "text-white" },
                { name: "Atlassian", color: "hover:border-[#0052CC]", border: "border-[#0052CC]/30", text: "text-[#0052CC]" }
              ].map((c) => {
                const isSelected = selectedCompany === c.name;
                return (
                  <button
                    key={c.name}
                    onClick={() => setSelectedCompany(c.name)}
                    disabled={interviewStatus === "starting"}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-white/5 border-white text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                        : `${c.border} ${c.text} ${c.color} bg-transparent cursor-pointer`
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleStartInterview}
            disabled={interviewStatus === "starting"}
            className={`px-8 py-4 bg-gradient-to-r ${currentTheme.primary} ${currentTheme.hover} disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center space-x-2 cursor-pointer`}
            style={{ boxShadow: `0 0 15px ${currentTheme.glow}` }}
          >
            {interviewStatus === "starting" ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating Blueprint...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Start Live Session</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden relative">
          {/* Main Interview Area */}
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            
            {/* AI Interviewer Component */}
            <div className="min-h-[250px] lg:flex-1 glass rounded-xl border border-border/65 relative overflow-hidden flex flex-col items-center justify-center bg-[rgba(17,24,39,0.8)] p-6">
              <div className="absolute top-4 left-4 bg-[rgba(0,0,0,0.5)] px-3 py-1 rounded-full border border-border flex items-center space-x-2">
                <Brain className={`w-4 h-4 ${currentTheme.text}`} />
                <span className="text-xs text-white">NextHire Adaptive Engine</span>
              </div>

              {/* Simulated Avatar / Waveform OR Screen Share */}
              {screenShareEnabled ? (
                <div className="w-full max-w-xl h-48 sm:h-64 flex items-center justify-center relative bg-black/40 rounded-lg overflow-hidden border border-border/50 z-10 shadow-inner">
                  <video 
                    ref={screenVideoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-[10px] sm:text-xs text-white flex items-center space-x-1.5 border border-border/50 backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse"></span>
                    <span>Screen Share Active</span>
                  </div>
                </div>
              ) : (
                <div className="relative flex items-center justify-center h-32 w-full">
                  <div className={`absolute w-24 h-24 ${currentTheme.bg} rounded-full blur-[60px] opacity-30`}></div>
                  <div className="flex items-center space-x-2 z-10">
                    {waves.map((scale, i) => (
                      <motion.div
                        key={i}
                        className={`w-3 bg-gradient-to-t ${currentTheme.primary} rounded-full`}
                        animate={{ height: scale * 60 + 20 }}
                        transition={{ type: "spring", bounce: 0, duration: 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              )}
 
              <div className="mt-6 text-center max-w-lg z-10">
                {interviewStatus === "submitting" ? (
                  <div className="flex flex-col items-center space-y-3">
                    <Loader2 className={`w-8 h-8 ${currentTheme.text} animate-spin`} />
                    <p className="text-gray-400 text-sm italic">AI technical evaluator checking correctness...</p>
                  </div>
                ) : (
                  <p className="text-base text-white font-medium leading-relaxed">
                    {question?.question_text || "Preparing next technical query..."}
                  </p>
                )}
              </div>

              {/* Floating Camera Preview */}
              {cameraEnabled && (
                <div className="absolute right-4 bottom-4 w-32 h-24 sm:w-40 sm:h-28 rounded-lg overflow-hidden border border-border bg-background z-20 shadow-xl">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1.5 left-1.5 bg-black/60 px-1.5 py-0.5 rounded text-[8px] sm:text-[10px] text-white flex items-center space-x-1 border border-border/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse"></span>
                    <span>You</span>
                  </div>
                </div>
              )}
            </div>

            {/* Candidate View / Code Editor */}
            <div className="min-h-[250px] lg:h-[45%] glass rounded-xl border border-border/65 p-4 flex flex-col bg-background">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Solution Editor / Technical Answer</span>
                <span className="text-xs text-[#22C55E] flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-ping"></span>
                  <span>Interactive Node</span>
                </span>
              </div>
              <textarea 
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={interviewStatus === "submitting"}
                className="flex-1 bg-transparent text-gray-300 font-mono text-sm focus:outline-none resize-none disabled:opacity-50"
                placeholder="// Write your answer here. Provide real-world examples and sample snippets where applicable..."
                spellCheck="false"
              />
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleSubmitAnswer}
                  disabled={interviewStatus === "submitting" || !answer.trim()}
                  className={`px-5 py-2.5 bg-gradient-to-r ${currentTheme.primary} ${currentTheme.hover} disabled:bg-gray-800 text-white font-semibold rounded-lg text-sm transition-all flex items-center space-x-2 cursor-pointer`}
                >
                  <span>Submit Answer</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Real-Time Metrics & Knowledge Graph */}
          <div className="w-full lg:w-80 flex flex-col gap-4 overflow-y-auto lg:pr-2 flex-shrink-0">
            
            {/* Adaptive Tracker */}
            <div className="glass rounded-xl p-4 border border-border/65">
              <h3 className="text-sm font-semibold text-white mb-3">Adaptive Difficulty</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">Current Level</span>
                <span className="text-xs font-bold text-[#F59E0B]">{difficulty}</span>
              </div>
              <div className="flex space-x-1 h-2">
                <div className={`flex-1 rounded-l-full ${difficulty === "Easy" || difficulty === "Medium" || difficulty === "Hard" || difficulty === "Expert" ? 'bg-[#22C55E]' : 'bg-[rgba(255,255,255,0.1)]'}`}></div>
                <div className={`flex-1 ${difficulty === "Medium" || difficulty === "Hard" || difficulty === "Expert" ? 'bg-[#F59E0B] animate-pulse' : 'bg-[rgba(255,255,255,0.1)]'}`}></div>
                <div className={`flex-1 ${difficulty === "Hard" || difficulty === "Expert" ? 'bg-[#EF4444]' : 'bg-[rgba(255,255,255,0.1)]'}`}></div>
                <div className={`flex-1 rounded-r-full ${difficulty === "Expert" ? 'bg-[#EF4444] animate-ping' : 'bg-[rgba(255,255,255,0.1)]'}`}></div>
              </div>
            </div>

            {/* Real-Time Metrics Guages */}
            <div className="glass rounded-xl p-4 border border-border/65">
              <h3 className="text-sm font-semibold text-white mb-4">Live Performance</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400 flex items-center space-x-1"><Brain className="w-3 h-3"/> <span>Technical Score</span></span>
                    <span className="text-white font-bold">{Math.round(metrics.technical_score)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                    <div className="h-full bg-secondary transition-all duration-500" style={{ width: `${metrics.technical_score}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400 flex items-center space-x-1"><MessageSquare className="w-3 h-3"/> <span>Clarity</span></span>
                    <span className="text-white font-bold">{Math.round(metrics.communication_score)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                    <div className="h-full bg-[#22C55E] transition-all duration-500" style={{ width: `${metrics.communication_score}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400 flex items-center space-x-1"><Activity className="w-3 h-3"/> <span>Time Efficiency</span></span>
                    <span className="text-white font-bold">{Math.round(metrics.time_efficiency_score)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                    <div className="h-full bg-[#F59E0B] transition-all duration-500" style={{ width: `${metrics.time_efficiency_score}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Knowledge Graph Snapshot */}
            <div className="glass rounded-xl p-4 border border-border/65 flex-1">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center space-x-2">
                <Brain className={`w-4 h-4 ${currentTheme.text}`} />
                <span>Topic Mastery Graph</span>
              </h3>
              
              <div className="space-y-2 mt-4 relative pl-4 border-l border-border">
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#22C55E]"></div>
                  <p className="text-sm text-gray-300">Topic: {question?.topic || "Technical core"}</p>
                  <p className="text-xs text-[#22C55E] mt-0.5">Confidence: {Math.round(metrics.skill_verification_score)}%</p>
                </div>
                <div className="relative pt-3">
                  <div className="absolute -left-[21px] top-4 w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]"></div>
                  <p className="text-sm text-white font-medium">Path: {question?.knowledge_node || "Core Engine"}</p>
                  <p className="text-xs text-[#F59E0B] mt-0.5">Current Focus</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Early Termination Overlay */}
      <AnimatePresence>
        {showTermination && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 bg-[rgba(9,9,11,0.95)] backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-md w-full bg-card border border-[#EF4444] rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.2)] p-8 text-center"
            >
              <div className="w-16 h-16 bg-[rgba(239,68,68,0.1)] rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertOctagon className="w-8 h-8 text-[#EF4444]" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">Session Terminated</h2>
              
              <div className="bg-white/2 border border-border/65 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-gray-300 font-medium mb-1">Reason:</p>
                <p className="text-sm text-[#EF4444] mb-3">{terminationReason}</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  The NextHire early termination guard triggered automatically due to consecutive answer scores falling below threshold metrics. Let&apos;s build a customized learning plan to strengthen these areas.
                </p>
              </div>

              <button 
                onClick={() => window.location.href = '/dashboard/career-coach'}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <span>View Career Coach Roadmap</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completed Success Overlay - Now with high fidelity AI Committee verdict report! */}
      <AnimatePresence>
        {showCompleted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 bg-[rgba(9,9,11,0.95)] backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-4xl bg-background border border-[#22C55E]/30 rounded-2xl shadow-[0_0_80px_rgba(34,197,94,0.15)] p-6 sm:p-8 flex flex-col max-h-[90vh] overflow-y-auto"
            >
              <div className="flex flex-col sm:flex-row items-center sm:justify-between border-b border-border/65 pb-6 mb-6 gap-4">
                <div className="flex items-center space-x-3 text-center sm:text-left">
                  <div className="w-12 h-12 bg-[rgba(34,197,94,0.1)] rounded-full flex items-center justify-center">
                    <Brain className="w-6 h-6 text-[#22C55E]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Technical Evaluation Report</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Mock simulation completed successfully</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="bg-card px-4 py-2 rounded-xl border border-border/65 text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Final NextHire Score</p>
                    <p className="text-xl font-bold text-white mt-0.5">{Math.round(metrics.nexthire_score)}</p>
                  </div>
                  <div className="bg-card px-4 py-2 rounded-xl border border-border/65 text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">AI Verdict</p>
                    <p className="text-xs font-semibold text-[#22C55E] mt-2">{metrics.recommendation}</p>
                  </div>
                </div>
              </div>

              {/* Report Tabs */}
              <div className="flex border-b border-border/65 mb-6 bg-card/50 rounded-lg overflow-hidden">
                <button 
                  onClick={() => setReportTab("verdict")}
                  className={`flex-1 py-3 text-xs sm:text-sm font-semibold transition-all ${
                    reportTab === "verdict" ? "bg-[rgba(34,197,94,0.05)] text-white border-b-2 border-[#22C55E]" : "text-gray-400 hover:text-white"
                  }`}
                >
                  AI Committee Verdict
                </button>
                <button 
                  onClick={() => setReportTab("predictions")}
                  className={`flex-1 py-3 text-xs sm:text-sm font-semibold transition-all ${
                    reportTab === "predictions" ? "bg-[rgba(34,197,94,0.05)] text-white border-b-2 border-[#22C55E]" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Advanced predictions & Twin
                </button>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 min-h-0 overflow-y-auto mb-6">
                {reportTab === "verdict" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {evaluationReport?.war_room ? (
                      Object.entries(evaluationReport.war_room).map(([key, value]: [string, any]) => {
                        const nameMap: any = {
                          technical_lead: { name: "Technical Lead", color: "text-[#3B82F6]", border: "border-[#3B82F6]/20", bg: "bg-[#3B82F6]/5" },
                          engineering_manager: { name: "Engineering Manager", color: "text-secondary", border: "border-secondary/20", bg: "bg-secondary/5" },
                          recruiter: { name: "Lead Recruiter", color: "text-[#22C55E]", border: "border-[#22C55E]/20", bg: "bg-[#22C55E]/5" },
                          vp_engineering: { name: "VP of Engineering", color: "text-[#F59E0B]", border: "border-[#F59E0B]/20", bg: "bg-[#F59E0B]/5" }
                        };
                        const info = nameMap[key] || { name: key, color: "text-white", border: "border-border/65", bg: "bg-white/2" };
                        return (
                          <div key={key} className={`p-4 rounded-xl border ${info.border} ${info.bg} space-y-3`}>
                            <div className="flex items-center justify-between">
                              <h4 className={`font-semibold text-sm ${info.color}`}>{info.name}</h4>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-white">{value.score}/100</span>
                                <span className="text-[10px] font-semibold text-[#22C55E] bg-[rgba(34,197,94,0.05)] px-2 py-0.5 rounded border border-[#22C55E]/20">
                                  {value.recommendation}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-1.5 text-xs text-gray-300">
                              <p><strong>Strengths:</strong> {value.strengths?.join(", ") || "Strong technical logic."}</p>
                              <p><strong>Concerns:</strong> <span className="text-gray-400">{value.concerns?.join(", ") || "No major architectural concerns."}</span></p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-2 p-8 text-center text-xs text-gray-400">Loading AI Evaluator panels...</div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Success Predictions */}
                    <div className="glass rounded-xl p-5 border border-border/65 space-y-4">
                      <h4 className="font-semibold text-white text-xs flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-[#3B82F6]" />
                        <span>Dynamic Career Success Metrics</span>
                      </h4>
                      <div className="space-y-3">
                        {[
                          { title: "Offer Probability", value: evaluationReport?.predictions?.offer_probability || Math.round(metrics.hire_probability), color: "bg-[#22C55E]" },
                          { title: "90-Day Success", value: evaluationReport?.predictions?.success_90_day || Math.round(metrics.nexthire_score * 0.95), color: "bg-[#3B82F6]" },
                          { title: "Retention probability", value: evaluationReport?.predictions?.retention_probability || 84, color: "bg-secondary" }
                        ].map((pred) => (
                          <div key={pred.title} className="space-y-1">
                            <div className="flex justify-between text-xs text-gray-400">
                              <span>{pred.title}</span>
                              <span className="font-bold text-white">{pred.value}%</span>
                            </div>
                            <div className="w-full bg-card h-2 rounded-full overflow-hidden border border-border/65">
                              <div className={`${pred.color} h-full rounded-full`} style={{ width: `${pred.value}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Talent Benchmarks */}
                    <div className="glass p-5 rounded-xl border border-border/65 space-y-3">
                      <h4 className="font-semibold text-white text-xs flex items-center space-x-2">
                        <Brain className="w-4 h-4 text-[#22C55E]" />
                        <span>Global Market Benchmarks</span>
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Your performance ranked relative to global peers screened for identical roles:
                      </p>
                      <div className="space-y-3 text-xs">
                        <div className="p-3 bg-card rounded-lg border border-[rgba(255,255,255,0.03)] flex justify-between items-center">
                          <span className="text-gray-400">Technical Depth Rank</span>
                          <span className="font-bold text-white">Top {evaluationReport?.benchmarks?.technical_rank || 15}%</span>
                        </div>
                        <div className="p-3 bg-card rounded-lg border border-[rgba(255,255,255,0.03)] flex justify-between items-center">
                          <span className="text-gray-400">System Design Mastery</span>
                          <span className="font-bold text-white">Top {evaluationReport?.benchmarks?.system_design_rank || 18}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button 
                  onClick={() => window.location.href = '/dashboard'}
                  className="flex-1 py-3.5 bg-gradient-to-r from-[#22C55E] to-[#10B981] hover:from-[#1E9E4A] hover:to-[#0D9468] text-white rounded-xl font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                >
                  <span>Sync Dashboard Intelligence</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
