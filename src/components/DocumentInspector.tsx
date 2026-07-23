import React, { useState } from 'react';
import { Search, Copy, Check, FileText, ChevronRight, BookOpen, AlertTriangle } from 'lucide-react';
import { DOCUMENT_1, DOCUMENT_2 } from '../data/documents';
import { DocumentScope } from '../types';

interface DocumentInspectorProps {
  activeScope: DocumentScope;
  onClose?: () => void;
}

export const DocumentInspector: React.FC<DocumentInspectorProps> = ({
  activeScope,
}) => {
  const [activeTab, setActiveTab] = useState<'doc1' | 'doc2'>(
    activeScope === 'doc2' ? 'doc2' : 'doc1'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  const doc = activeTab === 'doc1' ? DOCUMENT_1 : DOCUMENT_2;

  const handleCopyText = () => {
    navigator.clipboard.writeText(doc.rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightSearch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-red-600 text-white font-bold px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div id="document-inspector-panel" className="bg-white border border-zinc-200 rounded-2xl p-4 lg:p-5 text-zinc-900 flex flex-col h-full shadow-lg">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-red-600" />
          <h2 className="text-base font-extrabold text-zinc-900">Document Text Viewer</h2>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200">
          <button
            id="tab-view-doc1"
            onClick={() => setActiveTab('doc1')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'doc1'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Placement Policy
          </button>
          <button
            id="tab-view-doc2"
            onClick={() => setActiveTab('doc2')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'doc2'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            TIP (Internship Policy)
          </button>
        </div>
      </div>

      {/* Metadata Banner */}
      <div className="my-3 p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col gap-2 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-red-600 uppercase tracking-wider">
            {doc.type}
          </span>
          <button
            onClick={handleCopyText}
            className="flex items-center gap-1 text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy Policy Text'}
          </button>
        </div>
        <p className="text-xs text-zinc-800 font-medium">{doc.summary}</p>
        <div className="flex flex-wrap gap-2 text-[11px] text-zinc-600 pt-1">
          <span className="bg-white px-2 py-0.5 rounded border border-zinc-200 font-medium">
            Policy: {doc.policyName}
          </span>
          <span className="bg-white px-2 py-0.5 rounded border border-zinc-200 font-medium">
            {doc.batch}
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={`Search words in ${doc.shortTitle}...`}
          className="w-full bg-zinc-50 border border-zinc-300 focus:border-red-600 focus:ring-1 focus:ring-red-600 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition-colors font-medium shadow-sm"
        />
      </div>

      {/* Raw Document Body Container */}
      <div className="flex-1 overflow-y-auto bg-zinc-50 border border-zinc-200 rounded-xl p-4 font-mono text-xs text-zinc-800 leading-relaxed space-y-3 min-h-[220px]">
        <div className="text-center pb-2 border-b border-zinc-300 font-bold text-zinc-900 tracking-widest uppercase">
          SVKM'S NMIMS MUKESH PATEL SCHOOL OF TECHNOLOGY MANAGEMENT & ENGINEERING
        </div>
        <div className="whitespace-pre-wrap selection:bg-red-600 selection:text-white">
          {highlightSearch(doc.rawText, searchTerm)}
        </div>
      </div>

      {/* Highlighted Critical Clauses */}
      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs space-y-1.5 shadow-sm">
        <div className="flex items-center gap-1.5 font-extrabold text-red-700">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Non-Compliance Penalty Clause:</span>
        </div>
        <p className="text-zinc-800 italic pl-5 border-l-2 border-red-600 font-medium">
          "{doc.revocationClause}"
        </p>
      </div>
    </div>
  );
};
