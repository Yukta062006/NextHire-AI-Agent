"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  BrainCircuit,
  Wrench,
  Shield,
  Database,
  ArrowRight,
} from "lucide-react";
import { API_BASE_URL, getAuthHeaders } from "@/utils/api";

interface ApprovalRequest {
  id: string;
  action_type: string;
  candidate_id: string | null;
  context: Record<string, unknown>;
  ai_reasoning: string;
  created_at: string;
}

interface AgentStatus {
  agent: string;
  version: string;
  track: string;
  hackathon: string;
  ai_provider: string;
  model: string;
  ai_connected: boolean;
  capabilities: string[];
  tools_available: number;
  approval_actions: string[];
}

interface Memory {
  key: string;
  value: Record<string, unknown>;
  type: string;
  updated_at: string;
}

export default function AutopilotPage() {
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [workflowResult, setWorkflowResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");

  useEffect(() => {
    fetchAgentStatus();
    fetchApprovals();
    fetchMemories();
  }, []);

  const fetchAgentStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/autopilot/status`, { headers: getAuthHeaders() });
      if (res.ok) setAgentStatus(await res.json());
    } catch (e) {
      console.warn("Failed to fetch agent status", e);
    }
  };

  const fetchApprovals = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/autopilot/approvals`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setApprovals(data.pending_approvals || []);
      }
    } catch (e) {
      console.warn("Failed to fetch approvals", e);
    }
  };

  const fetchMemories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/autopilot/memory`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories || []);
      }
    } catch (e) {
      console.warn("Failed to fetch memories", e);
    }
  };

  const runWorkflow = async () => {
    if (!resumeText.trim()) return;
    setLoading(true);
    setWorkflowResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/autopilot/workflow`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          resume_text: resumeText,
          job_description: jdText || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setWorkflowResult(data);
        fetchApprovals();
        fetchMemories();
      }
    } catch (e) {
      console.warn("Workflow execution failed", e);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (requestId: string, approved: boolean) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/autopilot/approvals/resolve`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ request_id: requestId, approved }),
      });
      if (res.ok) {
        fetchApprovals();
      }
    } catch (e) {
      console.warn("Failed to resolve approval", e);
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Bot className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Autopilot AI Agent</h1>
          <p className="text-gray-400 text-sm">
            Autonomous recruiter powered by Qwen Cloud — Track 4: Autopilot Agent
          </p>
        </div>
        {agentStatus && (
          <div className={`ml-auto px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${agentStatus.ai_connected ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/15 text-amber-400 border border-amber-500/30"}`}>
            <span className={`w-2 h-2 rounded-full ${agentStatus.ai_connected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
            {agentStatus.ai_connected ? "Qwen Connected" : "Mock Mode"}
          </div>
        )}
      </motion.div>

      {/* Agent Status Cards */}
      {agentStatus && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="glass rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <BrainCircuit className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wide">AI Model</span>
            </div>
            <p className="text-white font-semibold">{agentStatus.model}</p>
            <p className="text-xs text-gray-500 mt-1">{agentStatus.ai_provider}</p>
          </div>
          <div className="glass rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wide">Tools</span>
            </div>
            <p className="text-white font-semibold">{agentStatus.tools_available} Available</p>
            <p className="text-xs text-gray-500 mt-1">Autonomous invocation</p>
          </div>
          <div className="glass rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wide">Approvals</span>
            </div>
            <p className="text-white font-semibold">{approvals.length} Pending</p>
            <p className="text-xs text-gray-500 mt-1">Human-in-the-Loop</p>
          </div>
          <div className="glass rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wide">Memory</span>
            </div>
            <p className="text-white font-semibold">{memories.length} Entries</p>
            <p className="text-xs text-gray-500 mt-1">Persistent context</p>
          </div>
        </motion.div>
      )}

      {/* Workflow Execution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-xl p-6 border border-border"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-cyan-400" />
          Run Autopilot Workflow
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Paste a resume below and optionally a job description. The AI agent will autonomously process the candidate through the full hiring pipeline.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">
              Resume Text *
            </label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste candidate resume text here..."
              className="w-full h-40 bg-white/5 border border-border rounded-lg p-3 text-white text-sm placeholder:text-gray-600 resize-none focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">
              Job Description (optional)
            </label>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste job description for matching..."
              className="w-full h-40 bg-white/5 border border-border rounded-lg p-3 text-white text-sm placeholder:text-gray-600 resize-none focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>
        <button
          onClick={runWorkflow}
          disabled={loading || !resumeText.trim()}
          className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-cyan-500/20 transition-all cursor-pointer"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Agent Processing...
            </>
          ) : (
            <>
              <Bot className="w-4 h-4" />
              Execute Autopilot Workflow
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </motion.div>

      {/* Workflow Result */}
      {workflowResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6 border border-emerald-500/30"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Workflow Result
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-xs text-gray-400">Status</p>
              <p className="text-white font-medium capitalize">{String(workflowResult.status)}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-xs text-gray-400">Tools Invoked</p>
              <p className="text-white font-medium">{String(workflowResult.tools_invoked)}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-xs text-gray-400">Execution Time</p>
              <p className="text-white font-medium">{String(workflowResult.execution_time_ms)}ms</p>
            </div>
          </div>
          {/* Workflow Log */}
          <div className="mt-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Agent Workflow Log</p>
            <div className="space-y-2">
              {(workflowResult.workflow_log as Array<{step: string; status: string; tool?: string}>)?.map((entry, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className={`w-2 h-2 rounded-full ${entry.status === "complete" ? "bg-emerald-400" : entry.status === "waiting" ? "bg-amber-400 animate-pulse" : "bg-gray-500"}`} />
                  <span className="text-gray-300 capitalize">{entry.step.replace(/_/g, " ")}</span>
                  {entry.tool && <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">{entry.tool}</span>}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Pending Approvals — Human-in-the-Loop */}
      {approvals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-6 border border-amber-500/30"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Pending Approvals (Human-in-the-Loop)
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            The AI agent is waiting for your decision on these critical actions.
          </p>
          <div className="space-y-3">
            {approvals.map((approval) => (
              <div key={approval.id} className="bg-white/5 rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium capitalize">
                    {approval.action_type.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-gray-500">{new Date(approval.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-300 mb-3">{approval.ai_reasoning}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproval(approval.id, true)}
                    className="px-4 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => handleApproval(approval.id, false)}
                    className="px-4 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Agent Capabilities */}
      {agentStatus && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-xl p-6 border border-border"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Agent Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {agentStatus.capabilities.map((cap, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                {cap}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Persistent Memory */}
      {memories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-xl p-6 border border-border"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-400" />
            Persistent Memory ({memories.length} entries)
          </h2>
          <div className="space-y-2">
            {memories.slice(0, 10).map((memory, i) => (
              <div key={i} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">{memory.key}</p>
                  <p className="text-xs text-gray-500 capitalize">{memory.type}</p>
                </div>
                <span className="text-xs text-gray-400">{new Date(memory.updated_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
