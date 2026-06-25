"use client";

import { createClient } from '@/utils/supabase/client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, CheckCircle, ListTodo } from 'lucide-react';

export default function Page() {
  const [todos, setTodos] = useState<any[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTodos() {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase.from('todos').select();
        if (error) {
          setErrorMsg(error.message);
        } else {
          setTodos(data);
        }
      } catch (e: any) {
        setErrorMsg(e.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    }
    loadTodos();
  }, []);

  return (
    <div className="min-h-screen bg-background text-white flex flex-col justify-between selection:bg-primary selection:text-white">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary blur-[120px] rounded-full"></div>
      </div>

      <header className="h-20 border-b border-border/65 bg-background/60 backdrop-blur-lg z-50 flex items-center px-6 md:px-12 justify-between">
        <Link href="/" className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tighter text-gradient-primary">NEXTHIRE</span>
        </Link>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-6 py-20 flex-1 w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-xs text-secondary">
            <ListTodo className="w-3.5 h-3.5" />
            <span>Supabase Connection Verified</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Supabase Integration Live</h1>
          <p className="text-sm text-gray-400">
            Real-time client-side database response synchronized through Supabase client.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-[rgba(239,68,68,0.05)] border border-[#EF4444]/20 rounded-xl text-xs text-[#EF4444]">
            <strong>Error connecting to Supabase:</strong> {errorMsg}
          </div>
        )}

        <div className="glass p-6 rounded-2xl border border-border/65">
          <h3 className="font-semibold text-sm mb-4 text-gray-300">Todos Checklist</h3>
          {isLoading ? (
            <div className="text-center py-8 text-xs text-gray-400 italic">
              Loading todos...
            </div>
          ) : todos && todos.length > 0 ? (
            <ul className="space-y-3">
              {todos.map((todo) => (
                <li 
                  key={todo.id} 
                  className="flex items-center space-x-3 p-3 rounded-lg bg-white/2 border border-border/65"
                >
                  <CheckCircle className="w-4 h-4 text-[#22C55E]" />
                  <span className="text-sm text-gray-200">{todo.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-xs text-gray-400 italic">
              No todos found in supabase database table or table does not exist.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
