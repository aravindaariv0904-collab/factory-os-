"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MOCK_KNOWLEDGE_DOCS } from "@/mock";
import { KnowledgeBaseService } from "@/services";
import { BookOpen, Search, Download, FileText, Upload, Tag, Sparkles } from "lucide-react";
import { KnowledgeDocument } from "@/types";

export default function KnowledgeBasePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<KnowledgeDocument[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const filtered = MOCK_KNOWLEDGE_DOCS.filter(
    (d) =>
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const docs = searchResults ?? filtered;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    try {
      const res = await KnowledgeBaseService.searchKnowledgeBase(searchTerm.trim());
      const hits = res?.documents ?? [];
      if (hits.length > 0) {
        setSearchResults(
          hits.map((doc, idx) => ({
            id: `kb_${idx}_${Date.now()}`,
            title: doc.title ?? doc.filename ?? "Document",
            category: "SOP" as KnowledgeDocument["category"],
            fileType: "PDF" as KnowledgeDocument["fileType"],
            sizeMB: Math.round((doc.size ?? 0.4) * 10) / 10,
            updatedAt: doc.updated_at ?? "—",
            author: doc.author ?? "AI Ingestion Pipeline",
            tags: doc.tags ?? [],
            downloadUrl: doc.download_url,
          }))
        );
      } else {
        setSearchResults(null);
      }
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            Manufacturing Knowledge Base & SOP Library
          </h1>
          <p className="text-xs text-slate-400">
            Equipment operating manuals, standard operating procedures (SOPs), and quality specifications
          </p>
        </div>
        <Button variant="cyan" size="sm" icon={<Upload className="w-3.5 h-3.5" />}>
          Upload SOP Document
        </Button>
      </div>

      <form onSubmit={handleSearch} className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search SOPs, manuals, equipment tags..."
          className="w-full pl-9 pr-20 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
        />
        <button
          type="submit"
          disabled={isSearching}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[11px] font-semibold disabled:opacity-50"
        >
          <Sparkles className="w-3 h-3 inline mr-1" />{isSearching ? "Searching..." : "AI Search"}
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {docs.map((doc) => (
          <Card key={doc.id} className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="cyan">{doc.category}</Badge>
                <span className="text-[10px] font-mono text-slate-400">{doc.sizeMB} MB</span>
              </div>
              <h3 className="text-sm font-semibold text-slate-100 line-clamp-2">{doc.title}</h3>
              <p className="text-xs text-slate-400 mt-2">Author: {doc.author}</p>
              <div className="flex flex-wrap gap-1 mt-3">
                {doc.tags.map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
              <span>Updated: {doc.updatedAt}</span>
              <Button
                variant="outline"
                size="sm"
                icon={<Download className="w-3 h-3" />}
                onClick={() => alert(`Downloading ${doc.title}`)}
              >
                Download
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
