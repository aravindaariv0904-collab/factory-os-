"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Building2, Mail, User, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/overview");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#090d16] p-4 relative overflow-hidden">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 backdrop-blur-xl shadow-2xl z-10">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-2">
            <Sparkles className="w-6 h-6 text-slate-950" />
          </div>
          <h1 className="text-xl font-bold text-slate-100">Register Enterprise Plant</h1>
          <p className="text-xs text-slate-400">Initialize your Factory OS Decision Intelligence Node</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Elena Rostova"
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Organization Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Apex Industrial Dynamics"
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Work Email</label>
            <input
              type="email"
              required
              placeholder="elena@apexindustrial.com"
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <Button type="submit" variant="cyan" size="lg" className="w-full font-semibold mt-2">
            Create Enterprise Workspace
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-cyan-400 hover:underline font-medium">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
