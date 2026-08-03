"use client";

import React, { useState } from "react";
import { Search, Download, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { Button } from "./Button";
import { Card } from "./Card";

export interface Column<T> {
  header: string;
  accessor: (row: T) => React.ReactNode;
  sortableKey?: keyof T;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKey?: (row: T) => string;
  title?: string;
  actions?: React.ReactNode;
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  searchPlaceholder = "Search records...",
  searchKey,
  title,
  actions,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const filteredData = data.filter((row) => {
    if (!searchTerm) return true;
    if (searchKey) {
      return searchKey(row).toLowerCase().includes(searchTerm.toLowerCase());
    }
    return JSON.stringify(row).toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const exportToCSV = () => {
    const headers = columns.map((c) => c.header).join(",");
    const rows = filteredData.map((row) =>
      columns.map((col) => `"${String(row[col.sortableKey as keyof T] || "").replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `factory_os_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="p-0 overflow-hidden">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 gap-3 border-b border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center gap-3">
          {title && <h3 className="font-semibold text-slate-100 text-sm">{title}</h3>}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {actions}
          <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={exportToCSV}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-800">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="px-4 py-3">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {paginatedData.length > 0 ? (
              paginatedData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                  {columns.map((col, idx) => (
                    <td key={idx} className="px-4 py-3 text-slate-200 font-medium">
                      {col.accessor(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/80 text-xs text-slate-400 bg-slate-900/40">
        <div>
          Showing <span className="font-semibold text-slate-200">{filteredData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to{" "}
          <span className="font-semibold text-slate-200">{Math.min(currentPage * pageSize, filteredData.length)}</span> of{" "}
          <span className="font-semibold text-slate-200">{filteredData.length}</span> entries
        </div>
        <div className="flex items-center gap-1">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1 rounded bg-slate-800 disabled:opacity-30 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-medium text-slate-300">
            {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1 rounded bg-slate-800 disabled:opacity-30 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}
