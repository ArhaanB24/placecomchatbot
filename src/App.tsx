import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ChatInterface } from './components/ChatInterface';
import { DocumentInspector } from './components/DocumentInspector';
import { ComparisonMatrixModal } from './components/ComparisonMatrixModal';
import { ChatMessage, DocumentScope, ApiSettings } from './types';
import { DOCUMENT_1, DOCUMENT_2 } from './data/documents';
import { BookOpen, Scale, ShieldCheck, Sparkles } from 'lucide-react';

export default function App() {
  // Document Scope State ('doc1' | 'doc2' | 'both')
  const [activeScope, setActiveScope] = useState<DocumentScope>('both');

  // Drawer / Inspection Panel State
  const [isDocumentDrawerOpen, setIsDocumentDrawerOpen] = useState(false);

  // Modals State
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

  // API Key & Model Settings State
  const [apiSettings, setApiSettings] = useState<ApiSettings>(() => {
    const saved = localStorage.getItem('nmims_nvidia_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed;
      } catch (_) {}
    }
    return {
      nvidiaApiKey: '',
      selectedModel: 'google/gemma-2-27b-it',
      temperature: 0.0,
      useGeminiFallback: true,
    };
  });

  // Server health state
  const [serverHealth, setServerHealth] = useState<{
    nvidiaKeyPresent: boolean;
    geminiKeyPresent: boolean;
  }>({ nvidiaKeyPresent: false, geminiKeyPresent: false });

  // Chat Messages State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Check server health on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setServerHealth({
          nvidiaKeyPresent: data.nvidiaKeyPresent,
          geminiKeyPresent: data.geminiKeyPresent,
        });
      })
      .catch((err) => console.error('Health check failed:', err));
  }, []);

  // Save settings to localStorage
  const handleSaveSettings = (newSettings: ApiSettings) => {
    setApiSettings(newSettings);
    localStorage.setItem('nmims_nvidia_settings', JSON.stringify(newSettings));
  };

  // Build zero-hallucination system prompt
  const buildSystemPrompt = (scope: DocumentScope) => {
    let docContext = '';
    if (scope === 'doc1') {
      docContext = `--- PLACEMENT POLICY ---\n${DOCUMENT_1.rawText}`;
    } else if (scope === 'doc2') {
      docContext = `--- TIP (INTERNSHIP POLICY) ---\n${DOCUMENT_2.rawText}`;
    } else {
      docContext = `--- PLACEMENT POLICY ---\n${DOCUMENT_1.rawText}\n\n--- TIP (INTERNSHIP POLICY) ---\n${DOCUMENT_2.rawText}`;
    }

    return `You are a hyper-accurate, zero-hallucination compliance AI assistant specialized in analyzing NMIMS Mukesh Patel School of Technology Management & Engineering (MPSTME) Placement Policy and TIP (Internship Policy) guidelines for Batch 2027.

YOUR STRICT DIRECTIVES:
1. RELY ONLY ON THE PROVIDED DOCUMENT CONTEXT BELOW.
2. IF A USER ASKS FOR INFORMATION NOT DIRECTLY STATED IN THE CONTEXT, YOU MUST ANSWER EXACTLY: "This information is not mentioned in the selected document(s)." DO NOT extrapolate, assume, or guess under any circumstances.
3. USE EXACT QUOTES in quotation marks whenever referencing specific clauses, terms, or field names from the documents.
4. IDENTIFY SPECIFICALLY whether a quote comes from "Placement Policy" or "TIP (Internship Policy)".
5. WHEN COMPARING BOTH POLICIES, highlight key differences explicitly (e.g. "Placement Policy" vs "TIP (Internship Policy)", "Phase 1 & 2 timelines" vs "15-week internship starting 14 Dec 2026").
6. Maintain a crisp, structured format using Markdown headers, bold highlights, and exact quote callouts.

SELECTED DOCUMENT CONTEXT:
${docContext}`;
  };

  // Send message to Express backend (/api/chat)
  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: userText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      scopeUsed: activeScope,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    const systemPrompt = buildSystemPrompt(activeScope);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-nvidia-api-key': apiSettings.nvidiaApiKey,
        },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.content,
          })),
          systemPrompt,
          scope: activeScope,
          model: apiSettings.selectedModel,
          temperature: apiSettings.temperature,
          useGeminiFallback: apiSettings.useGeminiFallback,
        }),
      });

      const responseText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch {
        if (!response.ok) {
          throw new Error(`Server Error (${response.status})`);
        }
        throw new Error('Received invalid non-JSON response from server.');
      }

      if (!response.ok) {
        throw new Error(data.error || `Server Error (${response.status})`);
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        content: data.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        scopeUsed: activeScope,
        modelUsed: data.modelUsed,
        groundedScore: data.groundedScore || 100,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        content: error.message || 'An error occurred while connecting to the LLM backend.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        scopeUsed: activeScope,
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleRegenerate = () => {
    if (messages.length === 0) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.sender === 'user');
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content);
    }
  };

  const hasNvidiaKey = Boolean(
    apiSettings.nvidiaApiKey && apiSettings.nvidiaApiKey.startsWith('nvapi-')
  ) || serverHealth.nvidiaKeyPresent;

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col font-sans antialiased selection:bg-red-600 selection:text-white">
      {/* Header */}
      <Header
        apiSettings={apiSettings}
        onOpenComparisonModal={() => setIsComparisonModalOpen(true)}
        onToggleDocumentDrawer={() => setIsDocumentDrawerOpen(!isDocumentDrawerOpen)}
        activeScope={activeScope}
        onScopeChange={setActiveScope}
        onClearChat={handleClearChat}
        isDrawerOpen={isDocumentDrawerOpen}
        hasNvidiaKey={hasNvidiaKey}
        hasGeminiKey={serverHealth.geminiKeyPresent}
      />

      {/* Main Workspace Grid */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start bg-white">
        {/* Chat Section */}
        <div
          className={`transition-all duration-300 ${
            isDocumentDrawerOpen ? 'lg:col-span-6' : 'lg:col-span-12'
          } h-[calc(100vh-140px)] min-h-[550px] flex flex-col`}
        >
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            onRegenerate={handleRegenerate}
            isLoading={isLoading}
            activeScope={activeScope}
            apiSettings={apiSettings}
          />
        </div>

        {/* Side Document Inspector (Visible when toggled) */}
        {isDocumentDrawerOpen && (
          <div className="lg:col-span-6 h-[calc(100vh-140px)] min-h-[550px] flex flex-col">
            <DocumentInspector activeScope={activeScope} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-zinc-100 border-t border-zinc-200 py-3 px-4 text-center text-xs text-zinc-600 flex flex-col sm:flex-row items-center justify-between max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-red-600" />
          <span className="font-semibold">NMIMS MPSTME Document QA System • Batch 2027</span>
        </div>
        <div className="flex items-center gap-3 mt-1 sm:mt-0 font-mono text-[11px]">
          <span>Grounded Context Engine</span>
          <span>•</span>
          <span className="text-zinc-700 font-bold">NVIDIA Gemma LLM</span>
        </div>
      </footer>

      {/* Modals */}
      <ComparisonMatrixModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        onSelectPrompt={handleSendMessage}
      />
    </div>
  );
}
