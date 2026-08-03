"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#090d16] p-4 relative overflow-hidden">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 backdrop-blur-xl shadow-2xl z-10">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-2">
            <Sparkles className="w-6 h-6 text-slate-950" />
          </div>
          <h1 className="text-xl font-bold text-slate-100">Reset Access Credentials</h1>
          <p className="text-xs text-slate-400">Enter your work email for security verification link</p>
        </div>

        {submitted ? (
          <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 text-center space-y-2">
            <p className="text-sm font-semibold text-cyan-300">Verification Email Dispatched</p>
            <p className="text-xs text-slate-400">Please check your inbox for instructions to reset password.</p>
            <Link href="/login" className="inline-block mt-3">
              <Button variant="outline" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Back to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                Registered Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="alexander@factoryos.ai"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            <Button type="submit" variant="cyan" size="lg" className="w-full font-semibold">
              Send Password Reset Link
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200">
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
