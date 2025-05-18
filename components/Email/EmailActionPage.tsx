import { useState, useEffect } from 'react';
import Head from 'next/head';
import { IconSend, IconHome, IconPlus, IconTrash, IconSettings, IconLanguage } from '@tabler/icons-react';
import Sidebar from '../Sidebar/Sidebar';
import { ChatMessage } from '../Chat/ChatMessage';
import { useRouter } from 'next/router';
import ToneSelector, { EmailTone } from './ToneSelector';
import LanguageSelector, { languages } from './LanguageSelector';

interface Chat {
  id: string;
  title: string;
  messages: {
    role: 'user' | 'assistant';
    content: string;
  }[];
  createdAt: string;
  tone: EmailTone;
  language: string;
}

interface EmailActionPageProps {
  title: string;
  action: 'write' | 'summarize' | 'enhance' | 'reply';
  placeholder: string;
}

const EmailActionPage = ({ title, action, placeholder }: EmailActionPageProps) => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showToneSelector, setShowToneSelector] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const router = useRouter();

  // Get current chat's tone and language or default values
  const currentTone = currentChatId 
    ? chats.find(c => c.id === currentChatId)?.tone || 'professional'
    : 'professional';
  const currentLanguage = currentChatId
    ? chats.find(c => c.id === currentChatId)?.language || 'en'
    : 'en';

  // Load chats from localStorage on component mount
  useEffect(() => {
    const savedChats = localStorage.getItem(`email-${action}-chats`);
    if (savedChats) {
      setChats(JSON.parse(savedChats));
    }
  }, [action]);

  // Save chats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`email-${action}-chats`, JSON.stringify(chats));
  }, [chats, action]);

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: `New ${title} ${new Date().toLocaleString()}`,
      messages: [],
      createdAt: new Date().toISOString(),
      tone: 'professional',
      language: 'en'
    };
    setChats([newChat, ...chats]);
    setCurrentChatId(newChat.id);
    setInput('');
    setResult('');
  };

  const handleToneChange = (newTone: EmailTone) => {
    if (currentChatId) {
      const updatedChats = chats.map(chat => {
        if (chat.id === currentChatId) {
          return { ...chat, tone: newTone };
        }
        return chat;
      });
      setChats(updatedChats);
    }
    setShowToneSelector(false);
  };

  const handleLanguageChange = (newLanguage: string) => {
    if (currentChatId) {
      const updatedChats = chats.map(chat => {
        if (chat.id === currentChatId) {
          return { ...chat, language: newLanguage };
        }
        return chat;
      });
      setChats(updatedChats);
    }
    setShowLanguageSelector(false);
  };

  const deleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedChats = chats.filter(chat => chat.id !== chatId);
    setChats(updatedChats);
    if (currentChatId === chatId) {
      setCurrentChatId(updatedChats[0]?.id || null);
      setInput('');
      setResult('');
    }
  };

  const handleSubmit = async () => {
    if (!currentChatId) {
      createNewChat();
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          text: input,
          tone: currentTone,
          language: currentLanguage
        }),
      });

      const data = await response.json();
      setResult(data.result);

      // Update chat history
      const updatedChats = chats.map(chat => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: [
              ...chat.messages,
              { role: 'user' as const, content: input },
              { role: 'assistant' as const, content: data.result }
            ]
          };
        }
        return chat;
      });
      setChats(updatedChats);
    } catch (error) {
      console.error('Error:', error);
      setResult('An error occurred while processing your request.');
    } finally {
      setLoading(false);
    }
  };

  const selectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    const chat = chats.find(c => c.id === chatId);
    if (chat && chat.messages.length > 0) {
      const lastUserMessage = chat.messages.filter(m => m.role === 'user').pop();
      const lastAssistantMessage = chat.messages.filter(m => m.role === 'assistant').pop();
      setInput(lastUserMessage?.content || '');
      setResult(lastAssistantMessage?.content || '');
    } else {
      setInput('');
      setResult('');
    }
  };

  // Find the current language name
  const currentLanguageName = languages.find(l => l.code === currentLanguage)?.name || 'English';

  return (
    <>
      <Head>
        <title>{title} - AI Email Assistant</title>
      </Head>
      <div className="flex h-screen">
        <div className="fixed top-0 left-0 z-40 flex h-full w-[260px] flex-none flex-col bg-[#202123] p-2 text-[14px]">
          {/* New Chat Button */}
          <button
            onClick={createNewChat}
            className="flex items-center gap-3 rounded-lg p-3 text-sm transition-colors duration-200 hover:bg-gray-500/10 text-white border border-white/20 mb-4"
          >
            <IconPlus size={16} />
            <span>New Chat</span>
          </button>

          {/* Chat History */}
          <div className="flex-1 overflow-auto">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`group flex items-center gap-3 rounded-lg p-3 text-sm transition-colors duration-200 hover:bg-gray-500/10 text-white w-full mb-2 ${
                  currentChatId === chat.id ? 'bg-gray-500/10' : ''
                }`}
              >
                <button
                  onClick={() => selectChat(chat.id)}
                  className="flex-1 text-left truncate"
                >
                  <span className="truncate">{chat.title}</span>
                </button>
                <button
                  onClick={(e) => deleteChat(chat.id, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-gray-500/20 rounded"
                  title="Delete chat"
                >
                  <IconTrash size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Return Home Button */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center justify-center gap-3 rounded-lg p-3 text-sm transition-colors duration-200 hover:bg-blue-600 text-white bg-blue-500 mt-4 w-full"
          >
            <IconHome size={16} />
            <span>Return to Home</span>
          </button>
        </div>
        
        <main className="flex-1 overflow-hidden bg-[#343541] ml-[260px]">
          <div className="flex h-full flex-col">
            {/* Header with Tone and Language Selectors */}
            <div className="border-b border-white/20 p-4 flex justify-between items-center">
              <h2 className="text-lg font-medium text-white">{title}</h2>
              <div className="flex items-center gap-3">
                {action !== 'summarize' && (
                  <button
                    onClick={() => setShowToneSelector(!showToneSelector)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2A2B32] text-white hover:bg-[#40414F] transition-colors"
                  >
                    <IconSettings size={16} />
                    <span>Tone: {currentTone.charAt(0).toUpperCase() + currentTone.slice(1)}</span>
                  </button>
                )}
                <button
                  onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2A2B32] text-white hover:bg-[#40414F] transition-colors"
                >
                  <IconLanguage size={16} />
                  <span>{currentLanguageName}</span>
                </button>
              </div>
            </div>

            {/* Tone Selector */}
            {action !== 'summarize' && showToneSelector && (
              <div className="p-4 border-b border-white/20">
                <ToneSelector
                  selectedTone={currentTone}
                  onToneChange={handleToneChange}
                />
              </div>
            )}

            {/* Language Selector */}
            {showLanguageSelector && (
              <div className="p-4 border-b border-white/20">
                <LanguageSelector
                  selectedLanguage={currentLanguage}
                  onLanguageChange={handleLanguageChange}
                />
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-auto p-4">
              {currentChatId && chats.find(c => c.id === currentChatId)?.messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  message={message}
                  messageIndex={index}
                />
              ))}
            </div>

            {/* Input Area */}
            <div className="border-t border-white/20 p-4">
              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={placeholder}
                  className="w-full resize-none rounded-lg bg-[#40414F] px-4 py-3 text-white pr-12"
                  rows={4}
                  disabled={loading}
                />
                <button
                  onClick={handleSubmit}
                  disabled={loading || !input.trim()}
                  className="absolute right-2 bottom-2.5 rounded-lg p-2 text-white hover:bg-[#202123] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <IconSend size={20} />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default EmailActionPage; 