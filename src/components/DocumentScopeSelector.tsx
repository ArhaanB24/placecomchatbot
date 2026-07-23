import React from 'react';
import { FileCheck, Files, CheckCircle2, ShieldAlert } from 'lucide-react';
import { DocumentScope } from '../types';
import { DOCUMENT_1, DOCUMENT_2 } from '../data/documents';

interface DocumentScopeSelectorProps {
  activeScope: DocumentScope;
  onScopeChange: (scope: DocumentScope) => void;
}

export const DocumentScopeSelector: React.FC<DocumentScopeSelectorProps> = ({
  activeScope,
  onScopeChange,
}) => {
  return (
    <section id="document-scope-selector" className="bg-zinc-100 border-b border-zinc-200 py-3.5 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-700">
              Active Context Target:
            </span>
            <span className="text-xs bg-red-100 text-red-700 border border-red-300 font-bold px-2 py-0.5 rounded-full">
              Zero-Hallucination Grounding
            </span>
          </div>
          <span className="text-xs text-zinc-600 font-medium">
            Toggle document(s) to query:
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {/* Document 1 Option */}
          <button
            id="btn-scope-doc1"
            onClick={() => onScopeChange('doc1')}
            className={`flex items-start gap-3 p-3 rounded-xl border transition-all text-left group shadow-sm ${
              activeScope === 'doc1'
                ? 'bg-white border-red-600 ring-2 ring-red-600/30 text-zinc-900'
                : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
            }`}
          >
            <div
              className={`p-2 rounded-lg mt-0.5 transition-colors ${
                activeScope === 'doc1' ? 'bg-red-600 text-white' : 'bg-zinc-100 text-zinc-600 group-hover:text-zinc-900'
              }`}
            >
              <FileCheck className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-xs font-bold text-zinc-900 truncate">
                  Placement Policy
                </span>
                {activeScope === 'doc1' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-red-600 shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-zinc-500 line-clamp-1 font-medium">
                {DOCUMENT_1.policyName} • Batch 2027
              </p>
            </div>
          </button>

          {/* Document 2 Option */}
          <button
            id="btn-scope-doc2"
            onClick={() => onScopeChange('doc2')}
            className={`flex items-start gap-3 p-3 rounded-xl border transition-all text-left group shadow-sm ${
              activeScope === 'doc2'
                ? 'bg-white border-red-600 ring-2 ring-red-600/30 text-zinc-900'
                : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
            }`}
          >
            <div
              className={`p-2 rounded-lg mt-0.5 transition-colors ${
                activeScope === 'doc2' ? 'bg-red-600 text-white' : 'bg-zinc-100 text-zinc-600 group-hover:text-zinc-900'
              }`}
            >
              <FileCheck className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-xs font-bold text-zinc-900 truncate">
                  TIP (Internship Policy)
                </span>
                {activeScope === 'doc2' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-red-600 shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-zinc-500 line-clamp-1 font-medium">
                {DOCUMENT_2.policyName} • Technical Internship
              </p>
            </div>
          </button>

          {/* Both Documents Option */}
          <button
            id="btn-scope-both"
            onClick={() => onScopeChange('both')}
            className={`flex items-start gap-3 p-3 rounded-xl border transition-all text-left group shadow-sm ${
              activeScope === 'both'
                ? 'bg-white border-red-600 ring-2 ring-red-600/30 text-zinc-900'
                : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
            }`}
          >
            <div
              className={`p-2 rounded-lg mt-0.5 transition-colors ${
                activeScope === 'both' ? 'bg-red-600 text-white' : 'bg-zinc-100 text-zinc-600 group-hover:text-zinc-900'
              }`}
            >
              <Files className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-xs font-bold text-zinc-900 truncate">
                  Both Policies (Comparative QA)
                </span>
                {activeScope === 'both' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-red-600 shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-zinc-500 line-clamp-1 font-medium">
                Compare terms, policy differences & overlap
              </p>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};
