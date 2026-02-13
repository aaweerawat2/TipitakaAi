import React, { Suspense, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { Send, Mic, Trash2, BookOpen } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { useVoiceStore } from '../store/useVoiceStore';
import { useHistoryStore, useRecentChats } from '../store/useHistoryStore';
import { RAGResponse, Citation } from '../types';

// Mock AI response (would come from RAG engine in production)
const mockResponse: RAGResponse = {
  answer: `ตามพระสูตรที่ว่าด้วยความไม่ประมาท พระพุทธเจ้าตรัสว่า "ความไม่ประมาทเป็นทางแห่งอมตะ" (ธรรมบท ๒๑) 

ความประมาท คือ ความเพลิดเพลินในกาม ความเกียจคร้าน ความไม่สำรวม และความประมาทในการรักษาศีล

ส่วนความไม่ประมาท คือ การมีสติสัมปชัญญะ ความเพียร ความสำรวม และการรักษาศีลอย่างเคร่งครัด

ดังนั้น ผู้ไม่ประมาทย่อมไม่ตาย กล่าวคือ ไม่ตกไปในอบายภูมิ`,
  sources: [
    { suttaId: 'dhp21', title: 'ธรรมบท ๒๑', content: 'อปฺปมาโท อมตปทํ...', relevance: 0.95 },
    { suttaId: 'mn10', title: 'สติปัฏฐานสูตร', content: 'ดูกรภิกษุทั้งหลาย...', relevance: 0.87 },
  ],
  confidence: 0.92,
  processingTime: 2500,
};

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sources?: Citation[];
  isStreaming?: boolean;
}

// Chat bubble component
function ChatBubble({ 
  message, 
  theme 
}: { 
  message: Message;
  theme: string;
}) {
  const isUser = message.role === 'user';
  const colors = theme === 'dark' 
    ? { bg: '#292524', text: '#FAFAF9', subtext: '#A8A29E' }
    : { bg: '#F5F5F4', text: '#1C1917', subtext: '#78716C' };

  if (isUser) {
    return (
      <View className="flex-row justify-end mb-3">
        <View 
          className="max-w-[80%] px-4 py-3 rounded-2xl"
          style={{ backgroundColor: '#F97316' }}
        >
          <Text className="text-white text-base">{message.content}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-row justify-start mb-3">
      <View 
        className="max-w-[90%] px-4 py-3 rounded-2xl"
        style={{ backgroundColor: colors.bg }}
      >
        <Text 
          className="text-base leading-relaxed"
          style={{ color: colors.text }}
        >
          {message.content}
        </Text>
        
        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <View className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
            <Text className="text-sm font-medium mb-2" style={{ color: colors.subtext }}>
              📖 อ้างอิงจาก:
            </Text>
            {message.sources.map((source, index) => (
              <TouchableOpacity
                key={index}
                className="flex-row items-center py-2"
              >
                <BookOpen size={14} color="#F97316" />
                <Text className="ml-2 text-sm" style={{ color: '#F97316' }}>
                  {source.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* Streaming indicator */}
        {message.isStreaming && (
          <View className="flex-row items-center mt-2">
            <Text className="text-sm" style={{ color: colors.subtext }}>
              กำลังคิด...
            </Text>
            <ActivityIndicator size="small" color="#F97316" className="ml-2" />
          </View>
        )}
      </View>
    </View>
  );
}

// Suggested questions
const SUGGESTED_QUESTIONS = [
  'ความไม่ประมาท คืออะไร?',
  'วิธีฝึกสติตามพระสูตร',
  'อริยสัจ ๔ คืออะไร',
  'สติปัฏฐาน ๔ มีอะไรบ้าง',
];

// Main AI Search Screen
function AISearchScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const theme = useAppStore((state) => state.settings.reader.theme);
  const isVoiceReady = useVoiceStore((state) => state.asrLoaded && state.ttsLoaded);
  const addChatHistory = useHistoryStore((state) => state.addChatHistory);
  const recentChats = useRecentChats(10);
  
  const colors = theme === 'dark'
    ? { bg: '#1C1917', text: '#FAFAF9', subtext: '#A8A29E', card: '#292524' }
    : { bg: '#FFFFFF', text: '#1C1917', subtext: '#78716C', card: '#F5F5F4' };

  // Auto scroll to bottom when new message arrives
  useEffect(() => {
    if (messages.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Send message
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Add streaming placeholder
    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };
    
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      // TODO: Call RAG engine
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Update with response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? {
                ...msg,
                content: mockResponse.answer,
                sources: mockResponse.sources,
                isStreaming: false,
              }
            : msg
        )
      );

      // Save to history
      addChatHistory({
        question: text,
        answer: mockResponse.answer,
        sources: mockResponse.sources,
      });
    } catch (error) {
      console.error('Error getting response:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? {
                ...msg,
                content: 'ขออภัย เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้ง',
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle suggested question tap
  const handleSuggestedQuestion = (question: string) => {
    setInputText(question);
  };

  // Clear chat
  const handleClearChat = () => {
    setMessages([]);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <View>
          <Text className="text-lg font-semibold" style={{ color: colors.text }}>
            🤖 ถาม-ตอบกับ AI
          </Text>
          <Text className="text-sm" style={{ color: colors.subtext }}>
            อ้างอิงจากพระไตรปิฎก
          </Text>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity onPress={handleClearChat} className="p-2">
            <Trash2 size={20} color={colors.subtext} />
          </TouchableOpacity>
        )}
      </View>

      {/* Chat area */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 16 }}
      >
        {messages.length === 0 ? (
          // Empty state with suggested questions
          <View className="flex-1 items-center justify-center py-8">
            <Text className="text-xl font-medium mb-2" style={{ color: colors.text }}>
              สวัสดีครับ 🙏
            </Text>
            <Text className="text-center mb-6" style={{ color: colors.subtext }}>
              ถามคำถามเกี่ยวกับพระธรรมได้เลยครับ
            </Text>
            
            <View className="w-full">
              <Text className="text-sm font-medium mb-3" style={{ color: colors.subtext }}>
                คำถามแนะนำ:
              </Text>
              {SUGGESTED_QUESTIONS.map((question, index) => (
                <TouchableOpacity
                  key={index}
                  className="p-3 rounded-xl mb-2"
                  style={{ backgroundColor: colors.card }}
                  onPress={() => handleSuggestedQuestion(question)}
                >
                  <Text style={{ color: colors.text }}>{question}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          // Chat messages
          messages.map((message) => (
            <ChatBubble key={message.id} message={message} theme={theme} />
          ))
        )}
      </ScrollView>

      {/* Input area */}
      <View 
        className="flex-row items-center px-4 py-3 border-t border-gray-200 dark:border-gray-700"
        style={{ backgroundColor: colors.bg }}
      >
        {/* Voice button */}
        <TouchableOpacity 
          className="w-10 h-10 rounded-full items-center justify-center mr-2"
          style={{ backgroundColor: colors.card }}
        >
          <Mic size={20} color={isVoiceReady ? '#F97316' : colors.subtext} />
        </TouchableOpacity>

        {/* Text input */}
        <View 
          className="flex-1 flex-row items-center rounded-full px-4 py-2"
          style={{ backgroundColor: colors.card }}
        >
          <TextInput
            className="flex-1 text-base"
            style={{ color: colors.text, maxHeight: 100 }}
            placeholder="ถามคำถาม..."
            placeholderTextColor={colors.subtext}
            value={inputText}
            onChangeText={setInputText}
            multiline
            editable={!isLoading}
          />
        </View>

        {/* Send button */}
        <TouchableOpacity
          className={`w-10 h-10 rounded-full items-center justify-center ml-2 ${
            inputText.trim() && !isLoading ? 'bg-orange-500' : 'bg-gray-300'
          }`}
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading}
        >
          <Send size={20} color={inputText.trim() && !isLoading ? 'white' : '#9CA3AF'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// Export with Suspense wrapper
export default function AISearchScreenWrapper() {
  return (
    <Suspense
      fallback={
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      }
    >
      <AISearchScreen />
    </Suspense>
  );
}
