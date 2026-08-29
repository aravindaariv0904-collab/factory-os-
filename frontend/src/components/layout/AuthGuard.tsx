"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/services";
import { Sparkles } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
    } else {
      setIsChecking(false);
    }
  }, [router]);

  if (isChecking) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#090d16]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 animate-pulse">
            <Sparkles className="w-8 h-8 text-slate-950" />
          </div>
          <p className="text-slate-400 text-sm font-medium tracking-wide">Factory OS — Loading Platform...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
