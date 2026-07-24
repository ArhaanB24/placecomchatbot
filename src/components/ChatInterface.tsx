import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { Send, Bot, User, Copy, Check, Sparkles, Key, AlertCircle } from 'lucide-react';
import { ChatMessage, DocumentScope, ApiSettings } from '../types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (userText: string) => void;
  onClearChat: () => void;
  onRegenerate: () => void;
  isLoading: boolean;
  activeScope: DocumentScope;
  apiSettings: ApiSettings;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  onClearChat,
  onRegenerate,
  isLoading,
  activeScope,
  apiSettings,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Example questions for the welcome card
  const exampleQuestions = [
    'How many companies can I skip before losing placement support?',
    'When does Phase 1 start and end?',
    'What is the dream offer rule?',
    'What happens if I reject a college-facilitated internship?',
  ];

  const getScopeTitle = () => {
    if (activeScope === 'doc1') return 'Placement Policy';
    if (activeScope === 'doc2') return 'Internship Policy';
    return 'Both documents';
  };

  return (
    <div className="flex flex-col h-full bg-white max-w-4xl mx-auto w-full">
      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="pt-4 pb-8 flex flex-col items-center justify-center">
            {/* Welcome Card */}
            <div className="w-full max-w-2xl border border-slate-200/90 rounded-2xl p-6 sm:p-8 bg-white shadow-2xs space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Ask about {getScopeTitle()}.
              </h2>
              
              <div className="space-y-2.5">
                <p className="text-sm text-slate-500 font-medium">
                  Example questions:
                </p>

                <ul className="space-y-2 text-sm text-slate-700 font-normal leading-relaxed">
                  {exampleQuestions.map((q, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-slate-400 font-bold select-none">•</span>
                      <button
                        onClick={() => onSendMessage(q)}
                        className="text-left hover:text-slate-900 hover:underline transition-colors text-slate-700"
                      >
                        {q}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 text-sm ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 space-y-2 transition-all ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white rounded-tr-xs shadow-2xs'
                    : msg.isError
                    ? 'bg-red-50 text-red-900 border border-red-200 rounded-tl-xs shadow-2xs'
                    : 'bg-slate-50 text-slate-900 border border-slate-200/80 rounded-tl-xs shadow-2xs'
                }`}
              >
                {/* Assistant Meta Header */}
                {msg.sender === 'assistant' && !msg.isError && (
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/80 text-[11px]">
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        Cited & Grounded Response
                      </span>
                      {msg.scopeUsed && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          [{msg.scopeUsed === 'both' ? 'Placement & TIP Policies' : msg.scopeUsed === 'doc1' ? 'Placement Policy' : 'TIP Policy'}]
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="text-slate-400 hover:text-slate-700 transition-colors p-1"
                      title="Copy Answer"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}

                {/* Error Header */}
                {msg.isError && (
                  <div className="flex items-center gap-2 text-red-700 font-semibold text-xs pb-1 border-b border-red-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Error response</span>
                  </div>
                )}

                {/* Content */}
                <div className={`prose max-w-none text-sm leading-relaxed ${msg.sender === 'user' ? 'text-white' : 'text-slate-800'}`}>
                  <Markdown>{msg.content}</Markdown>
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3 justify-start text-sm">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 mt-1">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-50 text-slate-800 border border-slate-200 rounded-2xl rounded-tl-xs p-4 flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span className="text-xs text-slate-500 font-medium">Searching source documents...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Area */}
      <div className="pt-2 pb-6 px-4">
        <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
          <div className="flex items-center gap-2 bg-white border border-slate-300 focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-400 rounded-2xl p-1.5 shadow-2xs transition-all">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Ask about ${getScopeTitle()}...`}
              disabled={isLoading}
              className="flex-1 bg-transparent px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none disabled:opacity-50 font-normal"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="bg-slate-500 hover:bg-slate-600 disabled:opacity-40 text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors flex items-center gap-1.5 shrink-0"
            >
              <span>Send</span>
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-slate-500 font-normal mt-2.5">
          Answers strictly cite the selected document(s). If it's not in the docs, the assistant will say so.
        </p>
      </div>
    </div>
  );
};
