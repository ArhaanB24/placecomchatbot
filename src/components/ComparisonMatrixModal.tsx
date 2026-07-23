import React from 'react';
import { X, Scale, AlertCircle, CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import { COMPARISON_POINTS } from '../data/documents';

interface ComparisonMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt?: (promptText: string) => void;
}

export const ComparisonMatrixModal: React.FC<ComparisonMatrixModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-zinc-200 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-zinc-900 my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-200 bg-zinc-50">
          <div className="flex items-center gap-2.5">
            <div className="bg-red-600 text-white p-2 rounded-xl shadow-sm">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-zinc-900">
                Placement Policy vs. TIP (Internship Policy) Matrix
              </h2>
              <p className="text-xs text-zinc-600 font-medium">
                Detailed side-by-side comparison of NMIMS MPSTME Batch 2027 Guidelines & Policies
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Table */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 bg-white">
          <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-xs text-zinc-800 space-y-1 shadow-sm font-medium">
            <span className="font-extrabold text-red-700 uppercase tracking-wider block mb-1">
              Key Policy Scope Difference Summary:
            </span>
            <p>
              • <strong>Placement Policy:</strong> Applies to final campus recruitment drives for Batch 2027. Non-compliance results in loss of final placement assistance.
            </p>
            <p>
              • <strong>TIP (Internship Policy):</strong> Applies to 15-week Technical Internship Program drives for Batch 2027. Non-compliance results in loss of internship placement support.
            </p>
          </div>

          <div className="overflow-x-auto border border-zinc-200 rounded-xl shadow-sm">
            <table className="w-full text-left text-xs text-zinc-800 border-collapse">
              <thead>
                <tr className="bg-zinc-100 text-zinc-700 border-b border-zinc-200 uppercase font-extrabold text-[11px]">
                  <th className="p-3 w-1/4">Clause Parameter</th>
                  <th className="p-3 w-1/3 border-l border-zinc-200 text-zinc-900">
                    Placement Policy
                  </th>
                  <th className="p-3 w-1/3 border-l border-zinc-200 text-zinc-900">
                    TIP (Internship Policy)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {COMPARISON_POINTS.map((item, index) => (
                  <tr
                    key={index}
                    className={`hover:bg-zinc-50 transition-colors ${
                      item.isDifferent ? 'bg-red-50/50' : ''
                    }`}
                  >
                    <td className="p-3 font-bold text-zinc-900 flex flex-col gap-1">
                      <span>{item.feature}</span>
                      {item.isDifferent ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded border border-red-200 w-fit">
                          <AlertCircle className="w-3 h-3 text-red-600" /> Key Difference
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 w-fit font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Identical
                        </span>
                      )}
                    </td>
                    <td className="p-3 border-l border-zinc-200 text-zinc-800 font-medium">
                      {item.doc1Value}
                    </td>
                    <td className="p-3 border-l border-zinc-200 text-zinc-800 font-medium">
                      {item.doc2Value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Prompt Suggestion Actions */}
          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-2 shadow-sm">
            <span className="text-xs font-bold text-zinc-900 block">
              Ask Chatbot specific comparison questions:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  if (onSelectPrompt) onSelectPrompt("What are the exact differences between the Final Placement Policy and the TIP Policy?");
                  onClose();
                }}
                className="text-xs bg-white hover:bg-red-50 text-red-700 font-semibold border border-zinc-200 hover:border-red-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <span>Compare exact policy names & terms</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => {
                  if (onSelectPrompt) onSelectPrompt("What happens if I violate the Placement Policy versus TIP (Internship Policy)?");
                  onClose();
                }}
                className="text-xs bg-white hover:bg-red-50 text-red-700 font-semibold border border-zinc-200 hover:border-red-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <span>Compare penalties for non-compliance</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-sm"
          >
            Close Comparison Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
