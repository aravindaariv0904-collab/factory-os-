"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, ShieldCheck, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AuthService } from "@/services";
import { useAppStore } from "@/store/useAppStore";

export default function LoginPage() {
  const router = useRouter();
  const init = useAppStore((s) => s.init);
  const [email, setEmail] = useState("alexander.vance@factoryos.ai");
  const [password, setPassword] = useState("••••••••••••");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await AuthService.login(email.trim(), password);
      await init();
      router.push("/overview");
    } catch {
      setError("Authentication failed. Check your credentials and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#090d16] p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 backdrop-blur-xl shadow-2xl z-10">
        {/* Logo Branding */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 mb-3">
            <Sparkles className="w-7 h-7 text-slate-950" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Factory<span className="text-cyan-400">OS</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Enterprise AI Decision Intelligence Platform</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs text-cyan-400 hover:underline">
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="cyan"
            size="lg"
            className="w-full mt-2 font-semibold"
            disabled={isLoading}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            {isLoading ? "Authenticating..." : "Sign In to Platform"}
          </Button>
          {error && (
            <p className="text-xs text-red-400 text-center mt-2">{error}</p>
          )}
        </form>

        {/* SSO Footer */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-xs text-slate-400 mb-3">Or authenticate with Enterprise SSO</p>
          <Button variant="outline" size="md" className="w-full gap-2 text-xs">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            Okta / SAML Single Sign-On
          </Button>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          Need an organization workspace?{" "}
          <Link href="/register" className="text-cyan-400 hover:underline font-medium">
            Register Plant
          </Link>
        </div>
      </div>
    </div>
  );
}
