import React from 'react';
import { Scale, FileText } from 'lucide-react';
import { ApiSettings, DocumentScope } from '../types';

interface HeaderProps {
  apiSettings: ApiSettings;
  onOpenComparisonModal: () => void;
  onToggleDocumentDrawer: () => void;
  activeScope: DocumentScope;
  onScopeChange: (scope: DocumentScope) => void;
  onClearChat: () => void;
  isDrawerOpen: boolean;
  hasNvidiaKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  apiSettings,
  onOpenComparisonModal,
  onToggleDocumentDrawer,
  activeScope,
  onScopeChange,
  onClearChat,
  isDrawerOpen,
  hasNvidiaKey,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 lg:px-8 py-3.5 shadow-xs">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Title & Subtitle */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            MPSTME Policy Assistant
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
            Batch 2027 · Grounded strictly in the source documents
          </p>
        </div>

        {/* Action Controls & Scope Selector Pills */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Both Documents Pill */}
          <button
            onClick={() => onScopeChange('both')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeScope === 'both'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60'
            }`}
          >
            Both Policies
          </button>

          {/* Placement Policy Pill */}
          <button
            onClick={() => onScopeChange(activeScope === 'doc1' ? 'both' : 'doc1')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeScope === 'doc1'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60'
            }`}
          >
            Placement Policy
          </button>

          {/* Internship Policy Pill */}
          <button
            onClick={() => onScopeChange(activeScope === 'doc2' ? 'both' : 'doc2')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeScope === 'doc2'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60'
            }`}
          >
            Internship Policy
          </button>

          {/* Clear Chat Pill Button */}
          <button
            onClick={onClearChat}
            className="border border-slate-300 hover:bg-slate-100 text-slate-700 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1"
            title="Clear Chat History"
          >
            <span>Clear chat</span>
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block"></div>

          {/* Compare Matrix Button */}
          <button
            onClick={onOpenComparisonModal}
            className="p-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors text-xs flex items-center gap-1 font-medium"
            title="Compare Policies Matrix"
          >
            <Scale className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden lg:inline">Compare</span>
          </button>

          {/* View Raw Docs Drawer Toggle */}
          <button
            onClick={onToggleDocumentDrawer}
            className={`p-2 rounded-full border text-xs flex items-center gap-1 font-medium transition-colors ${
              isDrawerOpen
                ? 'bg-slate-900 text-white border-slate-900'
                : 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title="Toggle Raw Policy Document Viewer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{isDrawerOpen ? 'Hide Docs' : 'Raw Docs'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
