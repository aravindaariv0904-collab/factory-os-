"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { MOCK_KNOWLEDGE_DOCS } from "@/mock";
import { KnowledgeBaseService } from "@/services";
import { BookOpen, Search, Download, Upload, Sparkles, CheckCircle2 } from "lucide-react";
import { KnowledgeDocument } from "@/types";

export default function KnowledgeBasePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<KnowledgeDocument[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [newDoc, setNewDoc] = useState({
    title: "",
    category: "SOP",
    tags: "CNC, Maintenance, Optics",
  });

  const filtered = MOCK_KNOWLEDGE_DOCS.filter(
    (d) =>
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const docs = searchResults ?? filtered;

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleDownload = (doc: KnowledgeDocument) => {
    const text = `STANDARD OPERATING PROCEDURE / TECHNICAL DOCUMENTATION\n======================================================\nTitle: ${doc.title}\nCategory: ${doc.category}\nFile Size: ${doc.sizeMB} MB\nAuthor: ${doc.author}\nUpdated: ${doc.updatedAt}\nTags: ${doc.tags.join(", ")}\n\n1. PURPOSE & SCOPE\nThis standard operating procedure defines operating tolerances, safety protocols, and calibration parameters for Factory OS enterprise machinery.\n\n2. AUTHORIZED PERSONNEL\nCertified Level 2 & Level 3 Maintenance Technicians only.\n\nCertified via Factory OS Enterprise Knowledge Graph.`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${doc.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotice(`Downloaded "${doc.title}"`);
  };

  const handleUploadSOP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.title) return;
    const added: KnowledgeDocument = {
      id: `doc_${Date.now()}`,
      title: newDoc.title,
      category: newDoc.category as KnowledgeDocument["category"],
      fileType: "PDF",
      sizeMB: 3.2,
      updatedAt: new Date().toISOString().slice(0, 10),
      author: "Enterprise Ingestion Node",
      tags: newDoc.tags.split(",").map((t) => t.trim()),
    };
    MOCK_KNOWLEDGE_DOCS.unshift(added);
    setIsUploadModalOpen(false);
    showNotice(`Uploaded SOP "${newDoc.title}" to Enterprise Vector Store!`);
    setNewDoc({ title: "", category: "SOP", tags: "CNC, Maintenance, Optics" });
  };

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
      {notice && (
        <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

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
        <Button
          variant="cyan"
          size="sm"
          icon={<Upload className="w-3.5 h-3.5" />}
          onClick={() => setIsUploadModalOpen(true)}
        >
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
                onClick={() => handleDownload(doc)}
              >
                Download
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Upload SOP Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload SOP Document to Vector Knowledge Base"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="cyan" size="sm" onClick={handleUploadSOP}>
              Ingest Document
            </Button>
          </>
        }
      >
        <form onSubmit={handleUploadSOP} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Document Title & SOP Code</label>
            <input
              type="text"
              required
              value={newDoc.title}
              onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
              placeholder="e.g. SOP-WLD-99: Laser Optic Purge & Alignment Standard"
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Category</label>
            <select
              value={newDoc.category}
              onChange={(e) => setNewDoc({ ...newDoc, category: e.target.value })}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
            >
              <option>SOP</option>
              <option>Manual</option>
              <option>Spec</option>
              <option>Safety</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Tags (Comma-separated)</label>
            <input
              type="text"
              value={newDoc.tags}
              onChange={(e) => setNewDoc({ ...newDoc, tags: e.target.value })}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
