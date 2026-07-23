export type DocumentScope = 'doc1' | 'doc2' | 'both';

export interface DocumentItem {
  id: string;
  scopeId: 'doc1' | 'doc2';
  title: string;
  shortTitle: string;
  type: string;
  institution: string;
  batch: string;
  policyName: string;
  rawText: string;
  summary: string;
  fieldsRequired: string[];
  keyDifferences: string[];
  revocationClause: string;
  disclaimerClause: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  scopeUsed: DocumentScope;
  modelUsed?: string;
  groundedScore?: number; // 0-100%
  extractedQuotes?: string[];
  isError?: boolean;
}

export type NvidiaModelId =
  | 'google/gemma-2-27b-it'
  | 'google/gemma-2-9b-it'
  | 'meta/llama-3.3-70b-instruct'
  | 'meta/llama-3.1-8b-instruct'
  | 'mistralai/mistral-7b-instruct-v0.3';

export interface NvidiaModelInfo {
  id: NvidiaModelId;
  name: string;
  provider: string;
  contextWindow: string;
  recommended: boolean;
  description: string;
}

export interface ApiSettings {
  nvidiaApiKey: string;
  selectedModel: NvidiaModelId;
  temperature: number; // 0.0 for zero hallucination
  useGeminiFallback: boolean;
}

export interface ComparisonPoint {
  feature: string;
  doc1Value: string;
  doc2Value: string;
  isDifferent: boolean;
  notes?: string;
}
