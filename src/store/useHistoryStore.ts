import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// Types
// ============================================

export interface ReadingHistoryItem {
  suttaId: string;
  title: string;
  lastReadAt: number;
  progress: number; // 0-100 percentage
  scrollPosition?: number;
}

export interface SearchHistoryItem {
  query: string;
  searchedAt: number;
  resultCount: number;
}

export interface ChatHistoryItem {
  id: string;
  question: string;
  answer: string;
  timestamp: number;
  sources?: Array<{
    suttaId: string;
    title: string;
  }>;
}

// ============================================
// Store Interface
// ============================================

interface HistoryState {
  // Reading History
  readingHistory: ReadingHistoryItem[];
  maxReadingHistory: number;
  
  // Search History
  searchHistory: SearchHistoryItem[];
  maxSearchHistory: number;
  
  // Chat History
  chatHistory: ChatHistoryItem[];
  maxChatHistory: number;
  
  // Actions - Reading
  addReadingHistory: (item: Omit<ReadingHistoryItem, 'lastReadAt'>) => void;
  updateReadingProgress: (suttaId: string, progress: number, scrollPosition?: number) => void;
  clearReadingHistory: () => void;
  
  // Actions - Search
  addSearchHistory: (query: string, resultCount: number) => void;
  clearSearchHistory: () => void;
  
  // Actions - Chat
  addChatHistory: (item: Omit<ChatHistoryItem, 'id' | 'timestamp'>) => void;
  clearChatHistory: () => void;
  
  // Actions - All
  clearAllHistory: () => void;
}

// ============================================
// History Store
// ============================================

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      readingHistory: [],
      maxReadingHistory: 50,
      searchHistory: [],
      maxSearchHistory: 30,
      chatHistory: [],
      maxChatHistory: 100,

      // Reading History Actions
      addReadingHistory: (item) =>
        set((state) => {
          const existing = state.readingHistory.findIndex(
            (h) => h.suttaId === item.suttaId
          );
          let newHistory = [...state.readingHistory];
          
          if (existing >= 0) {
            // Update existing
            newHistory[existing] = {
              ...newHistory[existing],
              ...item,
              lastReadAt: Date.now(),
            };
          } else {
            // Add new
            newHistory.unshift({
              ...item,
              lastReadAt: Date.now(),
            });
          }
          
          // Limit size
          if (newHistory.length > state.maxReadingHistory) {
            newHistory = newHistory.slice(0, state.maxReadingHistory);
          }
          
          return { readingHistory: newHistory };
        }),

      updateReadingProgress: (suttaId, progress, scrollPosition) =>
        set((state) => {
          const index = state.readingHistory.findIndex(
            (h) => h.suttaId === suttaId
          );
          if (index >= 0) {
            const newHistory = [...state.readingHistory];
            newHistory[index] = {
              ...newHistory[index],
              progress,
              scrollPosition,
              lastReadAt: Date.now(),
            };
            return { readingHistory: newHistory };
          }
          return state;
        }),

      clearReadingHistory: () => set({ readingHistory: [] }),

      // Search History Actions
      addSearchHistory: (query, resultCount) =>
        set((state) => {
          // Remove existing same query
          const filtered = state.searchHistory.filter(
            (h) => h.query !== query
          );
          
          // Add new at beginning
          const newHistory = [
            { query, searchedAt: Date.now(), resultCount },
            ...filtered,
          ].slice(0, state.maxSearchHistory);
          
          return { searchHistory: newHistory };
        }),

      clearSearchHistory: () => set({ searchHistory: [] }),

      // Chat History Actions
      addChatHistory: (item) =>
        set((state) => {
          const newItem: ChatHistoryItem = {
            ...item,
            id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            timestamp: Date.now(),
          };
          
          const newHistory = [newItem, ...state.chatHistory].slice(
            0,
            state.maxChatHistory
          );
          
          return { chatHistory: newHistory };
        }),

      clearChatHistory: () => set({ chatHistory: [] }),

      // Clear All
      clearAllHistory: () =>
        set({
          readingHistory: [],
          searchHistory: [],
          chatHistory: [],
        }),
    }),
    {
      name: 'tripitaka-history',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ============================================
// Selectors
// ============================================

export const useRecentReading = (limit = 10) =>
  useHistoryStore((state) => state.readingHistory.slice(0, limit));

export const useRecentSearches = (limit = 10) =>
  useHistoryStore((state) => state.searchHistory.slice(0, limit));

export const useRecentChats = (limit = 20) =>
  useHistoryStore((state) => state.chatHistory.slice(0, limit));

export const useReadingProgress = (suttaId: string) =>
  useHistoryStore((state) => {
    const item = state.readingHistory.find((h) => h.suttaId === suttaId);
    return item?.progress ?? 0;
  });
