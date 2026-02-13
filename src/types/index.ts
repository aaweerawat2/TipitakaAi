// ============================================
// Core Types
// ============================================

// Tipitaka Structure
export type PitakaType = 'sutta' | 'vinaya' | 'abhidhamma';

export interface SuttaMeta {
  id: string;
  sutta_id: string;
  title_thai: string;
  title_pali: string;
  pitaka: PitakaType;
  nikaya: string; // ทีฆนิกาย, มัชฌิมนิกาย, etc.
  vagga?: string;
  vagga_number?: number;
  sutta_number?: number;
  verses?: number;
}

export interface SuttaContent extends SuttaMeta {
  content_thai: string;
  content_pali?: string;
  chunk_index?: number;
  total_chunks?: number;
}

// ============================================
// Database Types
// ============================================

export interface DatabaseConfig {
  dbName: string;
  version: number;
  assetPath: string;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  score: number;
  highlight?: string;
  metadata: SuttaMeta;
}

export interface VectorSearchResult extends SearchResult {
  embedding?: number[];
  distance: number;
}

// ============================================
// AI Model Types
// ============================================

export interface ModelInfo {
  id: string;
  name: string;
  type: 'llm' | 'asr' | 'tts';
  sizeMB: number;
  ramRequiredMB: number;
  path: string;
  downloaded: boolean;
  loaded: boolean;
}

export interface LLMConfig {
  modelPath: string;
  tokenizerPath: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  delegate?: 'qnn' | 'xnnpack' | 'cpu';
}

export interface LLMResponse {
  text: string;
  tokens: number;
  time_ms: number;
  citations?: Citation[];
}

export interface Citation {
  suttaId: string;
  title: string;
  content: string;
  relevance: number;
}

// ============================================
// Voice Types
// ============================================

// ASR Types
export type ASRModelType = 'whisper-small-thai' | 'whisper-tiny-thai';

export interface ASRConfig {
  modelType: ASRModelType;
  language: 'th' | 'th+pi';
  enableVAD: boolean;
  silenceThreshold: number;
}

export interface ASRResult {
  text: string;
  confidence: number;
  language: string;
  duration: number;
}

// TTS Types
export type TTSModelType = 'vits' | 'piper' | 'rctp';

export interface TTSConfig {
  modelType: TTSModelType;
  voice: 'male' | 'female' | 'male-monk' | 'system';
  speed: number;
  pitch: number;
  volume: number;
}

export interface TTSResult {
  audioUri: string;
  duration: number;
  format: 'wav' | 'mp3';
}

// Voice Preset
export interface VoicePreset {
  id: string;
  name: string;
  description: string;
  asr: ASRModelType;
  tts: TTSModelType;
  ttsVoice: TTSConfig['voice'];
  speed: number;
  pitch: number;
}

// ============================================
// RAG Types
// ============================================

export interface RAGQuery {
  question: string;
  topK?: number;
  threshold?: number;
  filters?: QueryFilters;
}

export interface QueryFilters {
  pitaka?: PitakaType[];
  nikaya?: string[];
  userDocumentsOnly?: boolean;
}

export interface RAGResponse {
  answer: string;
  sources: Citation[];
  confidence: number;
  processingTime: number;
}

export interface DocumentChunk {
  id: string;
  content: string;
  embedding?: number[];
  metadata: ChunkMetadata;
}

export interface ChunkMetadata {
  source: 'tripitaka' | 'user-document';
  documentId?: string;
  documentName?: string;
  chunkIndex: number;
  totalChunks: number;
  createdAt: number;
}

// ============================================
// User Document Types
// ============================================

export interface UserDocument {
  id: string;
  name: string;
  type: 'pdf' | 'txt' | 'docx' | 'epub' | 'url';
  size: number;
  chunkCount: number;
  createdAt: number;
  processedAt?: number;
  status: 'pending' | 'processing' | 'ready' | 'error';
  error?: string;
}

export interface ImportProgress {
  documentId: string;
  stage: 'extracting' | 'chunking' | 'embedding' | 'storing';
  progress: number; // 0-100
  message: string;
}

// ============================================
// App State Types
// ============================================

export type ThemeMode = 'light' | 'dark' | 'sepia';

export interface ReaderSettings {
  fontSize: number;
  lineHeight: number;
  fontFamily: 'sans' | 'serif';
  theme: ThemeMode;
  textAlign: 'left' | 'justify';
  autoScroll: boolean;
  autoScrollSpeed: number;
}

export interface VoiceSettings {
  preset: string;
  asrModel: ASRModelType;
  ttsModel: TTSModelType;
  ttsVoice: TTSConfig['voice'];
  speed: number;
  pitch: number;
}

export interface AppSettings {
  reader: ReaderSettings;
  voice: VoiceSettings;
  firstLaunch: boolean;
  modelDownloadComplete: boolean;
  lastBackup?: number;
}

// ============================================
// Navigation Types
// ============================================

export type RootStackParamList = {
  Home: undefined;
  Reader: { suttaId: string };
  AISearch: undefined;
  VoiceChat: undefined;
  Settings: undefined;
  VoiceSettings: undefined;
  DocumentManager: undefined;
  SuttaList: { nikaya?: string; vagga?: string };
};

export type MainTabParamList = {
  HomeTab: undefined;
  ReaderTab: undefined;
  AISearchTab: undefined;
};

// ============================================
// Utility Types
// ============================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface AsyncResult<T, E = Error> {
  data?: T;
  error?: E;
  loading: boolean;
}
