"use client";

import { API_BASE_URL, getAuthHeaders } from "@/utils/api";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  Brain, 
  Target, 
  Activity, 
  MessageSquare,
  Clock,
  ChevronRight,
  Loader2,
  FileText,
  Zap,
  Globe,
  PieChart,
  UserCheck,
  Cpu
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

interface SkillMetric {
  subject: string;
  A: number;
  fullMark: number;
}

interface TrendPoint {
  name: string;
  score: number;
}

interface MetricSummary {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
}

export default function Dashboard() {
  const [userName, setUserName] = useState<string>("Alex");
  const [candidateRole, setCandidateRole] = useState<string>("Senior Frontend Engineer");
  const [topSkillsList, setTopSkillsList] = useState<string[]>(["React", "TypeScript", "Docker"]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTelemetryTab, setActiveTelemetryTab] = useState<"twin" | "predictions" | "benchmarks">("twin");
  
  // Dashboard Analytics states
  const [dashboardData, setDashboardData] = useState<any>(null);

  
  const [skillsRadar, setSkillsRadar] = useState<SkillMetric[]>([
    { subject: 'Technical Accuracy', A: 90, fullMark: 100 },
    { subject: 'Communication Clarity', A: 88, fullMark: 100 },
    { subject: 'Problem Solving', A: 85, fullMark: 100 },
    { subject: 'System Design', A: 75, fullMark: 100 },
    { subject: 'Pressure Handling', A: 84, fullMark: 100 },
    { subject: 'Leadership', A: 70, fullMark: 100 },
  ]);

  const [scoreTrend, setScoreTrend] = useState<TrendPoint[]>([
    { name: 'Initial', score: 65 },
    { name: 'Analysis', score: 72 },
    { name: 'Practice', score: 83 },
    { name: 'Google Mock', score: 87 },
  ]);

  const [metrics, setMetrics] = useState<MetricSummary[]>([
    { title: "Hire Probability", value: "91%", icon: TrendingUp, color: "text-[#22C55E]" },
    { title: "Technical Competency", value: "90%", icon: Brain, color: "text-secondary" },
    { title: "Communication Mastery", value: "88%", icon: MessageSquare, color: "text-[#3B82F6]" },
    { title: "Pressure Stability", value: "84%", icon: Activity, color: "text-[#F59E0B]" },
  ]);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      
      // Determine user name and target role
      const storedUser = localStorage.getItem("nexthire_user");
      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser);
          if (userObj.name) {
            setUserName(userObj.name.split(" ")[0]);
          }
          if (userObj.target_role) {
            setCandidateRole(userObj.target_role);
          }
        } catch {}
      }

      try {
        // Fetch detailed analytics dashboard response
        const response = await fetch(`${API_BASE_URL}/api/analytics/dashboard`, {
          headers: getAuthHeaders(null)
        });
        if (!response.ok) throw new Error("No previous evaluations found, showing default mock workspace data.");

        const data = await response.json();
        setDashboardData(data);
        
        if (data.skill_data && data.skill_data.length > 0) {
          const skills = data.skill_data.map((item: any) => item.subject);
          setTopSkillsList(skills);
        }
        
        if (data.nexthire_score !== undefined && data.nexthire_score !== null) {
          const score = data.nexthire_score;
          const prob = data.hire_probability;
          
          setMetrics([
            { title: "Hire Probability", value: `${Math.round(prob)}%`, icon: TrendingUp, color: "text-[#22C55E]" },
            { title: "Technical Competency", value: `${Math.round(data.technical_score || score)}%`, icon: Brain, color: "text-secondary" },
            { title: "Communication Mastery", value: `${Math.round(data.communication_score || score * 0.95)}%`, icon: MessageSquare, color: "text-[#3B82F6]" },
            { title: "Pressure Stability", value: `${Math.round(data.pressure_score || score * 0.9)}%`, icon: Activity, color: "text-[#F59E0B]" },
          ]);

          // Populating actual topic masteries in radar points
          let radarPoints: SkillMetric[] = [];
          if (data.skill_data && data.skill_data.length >= 3) {
            radarPoints = data.skill_data.slice(0, 6).map((item: any) => ({
              subject: item.subject,
              A: Math.round(item.A),
              fullMark: 100
            }));
          } else {
            radarPoints = [
              { subject: 'Technical Accuracy', A: Math.round(data.technical_score || score), fullMark: 100 },
              { subject: 'Communication Clarity', A: Math.round(data.communication_score || score * 0.95), fullMark: 100 },
              { subject: 'System Design', A: Math.round(data.benchmarks?.system_design_rank ? 100 - data.benchmarks.system_design_rank : 75), fullMark: 100 },
              { subject: 'Problem Solving', A: Math.round(data.benchmarks?.problem_solving_rank ? 100 - data.benchmarks.problem_solving_rank : 85), fullMark: 100 },
              { subject: 'Pressure Handling', A: Math.round(data.pressure_score || score * 0.9), fullMark: 100 },
              { subject: 'Learning Velocity', A: data.learning_velocity?.growth_rate ? Math.round(data.learning_velocity.growth_rate * 4) : 85, fullMark: 100 }
            ];
          }
          setSkillsRadar(radarPoints);

          if (data.trend_data && data.trend_data.length > 0) {
            setScoreTrend(data.trend_data);
          }
        }
      } catch (e) {
        console.warn("Using high-fidelity recruiter backup benchmarks", e);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-secondary animate-spin" />
        <p className="text-gray-400 text-sm">Gathering Candidate Intelligence Profile...</p>
      </div>
    );
  }

  // Set default fallbacks if predictions or benchmarks do not exist in database yet
  const predictions = dashboardData?.predictions || {
    offer_probability: 91,
    success_90_day: 88,
    retention_probability: 94,
    leadership_potential: "High",
    promotion_potential: "High",
    learning_velocity: "Exponential Developer"
  };

  const benchmarks = dashboardData?.benchmarks || {
    technical_rank: 12,
    communication_rank: 15,
    system_design_rank: 20,
    problem_solving_rank: 8
  };

  const learningVelocity = dashboardData?.learning_velocity || {
    level: "High",
    growth_rate: 18.5,
    profile: "Exponential Growth / High Adaptability",
    trend: [
      { month: "Month 1", score: 70 },
      { month: "Month 2", score: 81 },
      { month: "Month 3", score: 91 }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <span>Welcome back, {userName}</span>
            <span className="text-xs px-2 py-0.5 rounded border border-[#22C55E]/30 bg-[rgba(34,197,94,0.15)] text-[#22C55E] font-medium">
              Readiness: {dashboardData?.readiness || "Strong Hire"}
            </span>
          </h1>
          <p className="text-gray-400">Here&apos;s your hiring readiness overview for today.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => window.location.href = "/dashboard/resumes"}
            className="px-4 py-2 glass hover:bg-white/5 rounded-lg text-sm text-white transition-colors flex items-center space-x-2"
          >
            <FileText className="w-4 h-4 text-gray-400" />
            <span>View Resume</span>
          </button>
          <button 
            onClick={() => window.location.href = "/dashboard/live-interview"}
            className="px-4 py-2 bg-primary hover:bg-primary-hover rounded-lg text-sm text-white transition-colors flex items-center space-x-2 cursor-pointer font-semibold shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]"
          >
            <Target className="w-4 h-4 animate-pulse" />
            <span>New Interview Mock</span>
          </button>

        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <motion.div 
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass p-5 rounded-xl border border-border/65 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">{metric.title}</p>
                  <h3 className="text-2xl font-bold text-white">{metric.value}</h3>
                </div>
                <div className={`p-2 rounded-lg bg-white/5 ${metric.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Advanced Telemetry Tabbed Container */}
      <div className="glass rounded-xl border border-border/65 overflow-hidden">
        <div className="flex border-b border-border/65 bg-card">
          <button 
            onClick={() => setActiveTelemetryTab("twin")}
            className={`flex-1 py-4 text-xs sm:text-sm font-semibold transition-all flex items-center justify-center space-x-2 ${
              activeTelemetryTab === "twin" ? "bg-primary/5 text-white border-b-2 border-secondary" : "text-gray-400 hover:text-white"
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Digital Candidate Twin</span>
          </button>
          <button 
            onClick={() => setActiveTelemetryTab("predictions")}
            className={`flex-1 py-4 text-xs sm:text-sm font-semibold transition-all flex items-center justify-center space-x-2 ${
              activeTelemetryTab === "predictions" ? "bg-primary/5 text-white border-b-2 border-secondary" : "text-gray-400 hover:text-white"
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Success Predictions</span>
          </button>
          <button 
            onClick={() => setActiveTelemetryTab("benchmarks")}
            className={`flex-1 py-4 text-xs sm:text-sm font-semibold transition-all flex items-center justify-center space-x-2 ${
              activeTelemetryTab === "benchmarks" ? "bg-primary/5 text-white border-b-2 border-secondary" : "text-gray-400 hover:text-white"
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Global Benchmark Engine</span>
          </button>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTelemetryTab === "twin" && (
              <motion.div 
                key="twin"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Radar Chart */}
                <div className="lg:col-span-1 flex flex-col items-center">
                  <h4 className="font-semibold text-white text-xs mb-4 self-start">Topic Mastery Vector</h4>
                  <div className="h-[250px] w-full max-w-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillsRadar}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                        <Radar
                          name={userName}
                          dataKey="A"
                          stroke="#A855F7"
                          fill="#7C3AED"
                          fillOpacity={0.4}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Telemetry Breakdown Details */}
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="font-semibold text-white text-xs">AI Candidate Twin Insights</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/2 border border-border/65 rounded-xl space-y-2">
                      <h5 className="text-xs font-bold text-secondary uppercase tracking-wider">Problem-Solving Profile</h5>
                      <p className="text-sm text-white font-medium">{learningVelocity.profile || `Adaptive ${candidateRole}`}</p>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Demonstrated strong technical logic and capability using {topSkillsList.slice(0, 4).join(", ") || "core frameworks"}. Highly flexible at shifting algorithm design architectures.
                      </p>
                    </div>

                    <div className="p-4 bg-white/2 border border-border/65 rounded-xl space-y-2">
                      <h5 className="text-xs font-bold text-[#22C55E] uppercase tracking-wider">Communication Vector</h5>
                      <p className="text-sm text-white font-medium">Structured & Clear Architectural Flow</p>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Answers maintain a high ratio of clear structural explanation alongside code snippets, reflecting strong architectural coordination and active communication as a {candidateRole}.
                      </p>
                    </div>

                    <div className="p-4 bg-white/2 border border-border/65 rounded-xl space-y-2">
                      <h5 className="text-xs font-bold text-[#3B82F6] uppercase tracking-wider">Learning Velocity Coefficient</h5>
                      <p className="text-sm text-white font-medium">High Growth Rate verified (+{learningVelocity.growth_rate || 18.5}%)</p>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Your adaptive score slope displays a steady exponential projection, indicating minimal support overhead during high-pace scaling tasks in {topSkillsList[0] || "relevant technical scopes"}.
                      </p>
                    </div>

                    <div className="p-4 bg-white/2 border border-border/65 rounded-xl space-y-2">
                      <h5 className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider">Historical Performance Vector</h5>
                      <p className="text-sm text-white font-medium">Steady Progression</p>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Mastery levels increased uniformly across consecutive mocks. Core engineering errors reduced significantly in {topSkillsList[1] || "system design"} between first and last iterations.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTelemetryTab === "predictions" && (
              <motion.div 
                key="predictions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-6"
              >
                {[
                  { title: "Offer Probability", value: predictions.offer_probability, color: "text-[#22C55E]", desc: "Likelihood of receiving an offer from a top-tier tech screening pipeline." },
                  { title: "90-Day Success Rate", value: predictions.success_90_day, color: "text-[#3B82F6]", desc: "Projected team delivery performance and operational success in the first quarter." },
                  { title: "Retention probability", value: predictions.retention_probability, color: "text-secondary", desc: "Likelihood of long-term cultural alignment and contribution vector." }
                ].map((pred) => (
                  <div key={pred.title} className="glass p-6 rounded-xl border border-border/65 text-center flex flex-col justify-between space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{pred.title}</h4>
                      <p className={`text-5xl font-extrabold mt-4 ${pred.color}`}>{pred.value}%</p>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{pred.desc}</p>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTelemetryTab === "benchmarks" && (
              <motion.div 
                key="benchmarks"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-5 h-5 text-[#22C55E]" />
                  <h4 className="font-semibold text-white text-xs">Global Talent Percentile Breakdown</h4>
                </div>
                <p className="text-xs text-gray-400 max-w-xl leading-relaxed">
                  Your mock scores compared relative to the top 20% global engineering benchmarks compiled across nexthire screens:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Technical Competency", val: `Top ${benchmarks.technical_rank || 12}%`, color: "border-secondary/30 bg-secondary/5 text-secondary" },
                    { label: "Communication Flow", val: `Top ${benchmarks.communication_rank || 15}%`, color: "border-[#3B82F6]/30 bg-[#3B82F6]/5 text-[#3B82F6]" },
                    { label: "System Architecture", val: `Top ${benchmarks.system_design_rank || 20}%`, color: "border-[#F59E0B]/30 bg-[#F59E0B]/5 text-[#F59E0B]" },
                    { label: "Problem Solving Speed", val: `Top ${benchmarks.problem_solving_rank || 8}%`, color: "border-[#22C55E]/30 bg-[#22C55E]/5 text-[#22C55E]" }
                  ].map((b) => (
                    <div key={b.label} className={`p-4 rounded-xl border ${b.color} text-center space-y-2`}>
                      <p className="text-[10px] uppercase font-bold text-gray-400">{b.label}</p>
                      <p className="text-xl font-bold">{b.val}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Trend */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-3 glass rounded-xl p-6 border border-border/65"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-white flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-[#22C55E]" />
              <span>NextHire Score Trend</span>
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scoreTrend} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                <XAxis dataKey="name" stroke="#4B5563" tick={{ fill: '#9CA3AF' }} />
                <YAxis stroke="#4B5563" tick={{ fill: '#9CA3AF' }} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(var(--primary-rgb),0.3)', borderRadius: '8px' }}
                  itemStyle={{ color: '#F8FAFC' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#A855F7" 
                  strokeWidth={3}
                  dot={{ fill: '#7C3AED', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#fff' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity Timeline */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass rounded-xl p-6 border border-border/65"
      >
        <h3 className="font-semibold text-white mb-6">Recent Interviews</h3>
        <div className="space-y-4">
          {dashboardData?.recent_interviews && dashboardData.recent_interviews.length > 0 ? (
            dashboardData.recent_interviews.map((interview: any, i: number) => (
              <div key={interview.id || i} className="flex items-center justify-between p-4 rounded-lg bg-white/2 border border-border/65 hover:bg-[rgba(255,255,255,0.04)] transition-colors">
                <div className="flex items-start space-x-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-secondary">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white flex items-center space-x-2">
                      <span>Practice Screen</span>
                      <span className="text-xs px-2 py-0.5 rounded border border-border bg-white/5 font-semibold text-secondary">
                        {interview.type}
                      </span>
                    </h4>
                    <p className="text-sm text-gray-400 mt-0.5">Status: {interview.status} • {interview.date ? new Date(interview.date).toLocaleDateString() : "Just now"}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right hidden sm:block">
                    <p className="font-bold text-white">{interview.score}/100</p>
                    <p className={`text-xs ${interview.score > 85 ? 'text-[#22C55E]' : interview.score > 75 ? 'text-secondary' : 'text-[#F59E0B]'}`}>
                      {interview.recommendation}
                    </p>
                  </div>
                  <button className="text-gray-400 hover:text-white transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            [
              { role: "Senior Frontend Engineer", type: "Technical", date: "2 days ago", score: 89, status: "Strong Hire" },
              { role: "Frontend Developer", type: "Behavioral", date: "5 days ago", score: 84, status: "Hire" },
              { role: "Full Stack Engineer", type: "System Design", date: "1 week ago", score: 72, status: "Borderline" },
            ].map((interview, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-white/2 border border-border/65 hover:bg-[rgba(255,255,255,0.04)] transition-colors">
                <div className="flex items-start space-x-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-secondary">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{interview.role}</h4>
                    <p className="text-sm text-gray-400">{interview.type} • {interview.date}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right hidden sm:block">
                    <p className="font-bold text-white">{interview.score}/100</p>
                    <p className={`text-xs ${interview.score > 85 ? 'text-[#22C55E]' : interview.score > 75 ? 'text-secondary' : 'text-[#F59E0B]'}`}>
                      {interview.status}
                    </p>
                  </div>
                  <button className="text-gray-400 hover:text-white transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
