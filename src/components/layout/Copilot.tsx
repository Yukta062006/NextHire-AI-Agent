"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send, Sparkles, ChevronRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL, getAuthHeaders } from "@/utils/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function Copilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi Alex! I'm your NextHire Copilot. I have access to your resume and interview history. How can I help you prepare today?",
    },
  ]);
  const [suggestions, setSuggestions] = useState<string[]>([
    "Why was my score low?",
    "What companies am I ready for?",
    "How can I increase my NextHire Score?",
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSend = async (messageText: string) => {
    if (!messageText.trim()) return;

    // Add user message
    const newMessages = [...messages, { role: "user" as const, content: messageText }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/copilot/chat`, {
        method: "POST",
        headers: getAuthHeaders("application/json"),
        body: JSON.stringify({
          message: messageText,
        }),
      });

      if (!response.ok) throw new Error("API call failed");

      const data = await response.json();
      
      setMessages((prev) => [
        ...prev,
        { role: "assistant" as const, content: data.response },
      ]);
      
      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
      } else {
        setSuggestions([
          "Show me how to optimize database connections.",
          "What are the best resources for React state management?",
          "Can we practice a Hard difficulty interview?",
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant" as const,
          content: `Sorry, I ran into an error connecting to the NextHire Copilot Engine. Make sure the backend server is running at ${API_BASE_URL}!`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-r from-primary to-secondary text-white shadow-[0_8px_32px_rgba(var(--primary-rgb),0.4)] hover:shadow-[0_8px_32px_rgba(var(--primary-rgb),0.6)] transition-all z-40 ${
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        <Sparkles className="w-6 h-6 animate-pulse" />
      </button>

      {/* Copilot Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-screen w-80 md:w-96 bg-background border-l border-border shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="h-16 border-b border-border flex items-center justify-between px-4 bg-card">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-white">AI Copilot</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex items-start space-x-3 ${
                    msg.role === "user" ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                      msg.role === "assistant"
                        ? "bg-gradient-to-tr from-primary to-secondary"
                        : "bg-gray-700"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <Sparkles className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-xs font-semibold text-white">U</span>
                    )}
                  </div>
                  <div
                    className={`p-3 rounded-2xl text-sm max-w-[80%] ${
                      msg.role === "assistant"
                        ? "bg-card border border-border/65 text-gray-300 rounded-tl-none"
                        : "bg-primary text-white rounded-tr-none"
                    }`}
                  >
                    <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex-shrink-0 flex items-center justify-center animate-spin">
                    <Loader2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-card border border-border/65 p-3 rounded-2xl rounded-tl-none text-sm text-gray-400 italic">
                    Thinking...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />

              {/* Suggestions */}
              {!isLoading && suggestions.length > 0 && (
                <div className="pl-11 space-y-2 pt-2">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Suggested Questions</p>
                  {suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(sug)}
                      className="flex items-center justify-between w-full p-2 text-left text-xs bg-primary/8 hover:bg-primary/15 border border-[rgba(var(--primary-rgb),0.15)] rounded-lg text-secondary transition-all duration-200"
                    >
                      <span>{sug}</span>
                      <ChevronRight className="w-3 h-3 flex-shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-card">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(input);
                }}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  disabled={isLoading}
                  className="w-full bg-background border border-border rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-primary transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 p-1.5 bg-primary hover:bg-primary-hover disabled:bg-gray-800 text-white rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
