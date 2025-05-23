import { useState, useEffect } from 'react';
import Head from 'next/head';
import { IconSend, IconHome, IconPlus, IconTrash, IconSettings, IconLanguage, IconMessage } from '@tabler/icons-react';
import Sidebar from '../Sidebar/Sidebar';
import { ChatMessage } from '../Chat/ChatMessage';
import { useRouter } from 'next/router';
import ToneSelector, { EmailTone } from './ToneSelector';
import LanguageSelector, { languages } from './LanguageSelector';
import { useSession } from 'next-auth/react';
import VoiceInput from './VoiceInput';

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
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showToneSelector, setShowToneSelector] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
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
      try {
        const parsedChats = JSON.parse(savedChats);
        if (Array.isArray(parsedChats) && parsedChats.length > 0) {
          setChats(parsedChats);
          setCurrentChatId(parsedChats[0].id);
        } else {
          // If no valid chats exist, create a new one
          createNewChat();
        }
      } catch (error) {
        console.error('Error parsing saved chats:', error);
        createNewChat();
      }
    } else {
      // If no saved chats exist, create a new one
      createNewChat();
    }
  }, [action]);

  // Save chats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`email-${action}-chats`, JSON.stringify(chats));
  }, [chats, action]);

  // Add this useEffect to monitor chat changes
  useEffect(() => {
    console.log('Current Chat:', currentChatId);
    console.log('All Chats:', chats);
    if (currentChatId) {
      const currentChat = chats.find(c => c.id === currentChatId);
      console.log('Current Chat Messages:', currentChat?.messages);
    }
  }, [chats, currentChatId]);

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: `New ${title} ${new Date().toLocaleString()}`,
      messages: [],
      createdAt: new Date().toISOString(),
      tone: 'professional',
      language: 'en'
    };
    console.log('Creating new chat:', newChat);
    setChats(prevChats => [newChat, ...prevChats]);
    setCurrentChatId(newChat.id);
    return newChat.id;
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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // If there's no active chat, create one
      if (!currentChatId) {
        createNewChat();
      }

      // Get the current chat
      const currentChat = chats.find(c => c.id === currentChatId);
      if (!currentChat) {
        throw new Error('No active chat');
      }

      // Add user message immediately
      if (currentChatId) {
        setChats(prevChats => prevChats.map(chat => {
          if (chat.id === currentChatId) {
            return {
              ...chat,
              messages: [
                ...chat.messages,
                { role: 'user', content: input }
              ]
            };
          }
          return chat;
        }));
      }

      // Get the last assistant message for previous email
      const lastAssistantMessage = currentChat.messages
        .filter(m => m.role === 'assistant')
        .pop()?.content;

      // For reply, enhance, and summarize actions, we need the previous email
      if (['reply', 'enhance', 'summarize'].includes(action)) {
        // If there's no previous message, use the current input as the previous email
        const previousEmail = lastAssistantMessage || input;
        
        const response = await fetch('/api/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action,
            text: input,
            tone: currentTone,
            language: currentLanguage,
            previousEmail: previousEmail,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.result || 'Failed to get response');
        }

        const data = await response.json();
        
        // Add the assistant's response to the chat
        if (currentChatId) {
          setChats(prevChats => prevChats.map(chat => {
            if (chat.id === currentChatId) {
              return {
                ...chat,
                messages: [
                  ...chat.messages,
                  { role: 'assistant', content: data.result }
                ]
              };
            }
            return chat;
          }));
        }
      } else {
        // For write action, proceed normally
        const response = await fetch('/api/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action,
            text: input,
            tone: currentTone,
            language: currentLanguage,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.result || 'Failed to get response');
        }

        const data = await response.json();
        
        // Add the assistant's response to the chat
        if (currentChatId) {
          setChats(prevChats => prevChats.map(chat => {
            if (chat.id === currentChatId) {
              return {
                ...chat,
                messages: [
                  ...chat.messages,
                  { role: 'assistant', content: data.result }
                ]
              };
            }
            return chat;
          }));
        }
      }

      setInput(''); // Clear the input after successful submission
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const selectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    const chat = chats.find(c => c.id === chatId);
    if (chat && chat.messages.length > 0) {
      const lastUserMessage = chat.messages.filter(m => m.role === 'user').pop();
      setInput(lastUserMessage?.content || '');
    } else {
      setInput('');
    }
  };

  // Find the current language name
  const currentLanguageName = languages.find(l => l.code === currentLanguage)?.name || 'English';

  // Add this function to handle voice input
  const handleVoiceTranscript = (transcript: string) => {
    setInput(prevInput => {
      const newInput = prevInput ? `${prevInput} ${transcript}` : transcript;
      return newInput;
    });
  };

  return (
    <>
      <Head>
        <title>{title} - AI Email Assistant</title>
      </Head>
      <div className="flex h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        {/* Sidebar */}
        <div className="fixed top-0 left-0 z-40 flex h-full w-[280px] flex-none flex-col bg-[#1a1b1e] p-4 text-[14px] shadow-xl">
          {/* New Chat Button */}
          <button
            onClick={createNewChat}
            className="flex items-center gap-3 rounded-lg p-3 text-sm transition-all duration-200 hover:bg-blue-600/20 text-white border border-white/10 mb-6 hover:scale-105 active:scale-95"
          >
            <IconPlus size={18} className="text-blue-400" />
            <span>New Chat</span>
          </button>

          {/* Chat History */}
          <div className="flex-1 overflow-auto space-y-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`group flex items-center gap-3 rounded-lg p-3 text-sm transition-all duration-200 hover:bg-gray-700/50 text-white w-full ${
                  currentChatId === chat.id ? 'bg-gray-700/50 ring-1 ring-blue-500/50' : ''
                }`}
              >
                <button
                  onClick={() => selectChat(chat.id)}
                  className="flex-1 text-left truncate flex items-center gap-2"
                >
                  <IconMessage size={16} className="text-gray-400" />
                  <span className="truncate">{chat.title}</span>
                </button>
                <button
                  onClick={(e) => deleteChat(chat.id, e)}
                  className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 hover:bg-red-500/20 rounded-full hover:text-red-400"
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
            className="flex items-center justify-center gap-3 rounded-lg p-3 text-sm transition-all duration-200 hover:bg-blue-600 text-white bg-blue-500/20 hover:bg-blue-500 mt-4 w-full hover:scale-105 active:scale-95"
          >
            <IconHome size={18} />
            <span>Return to Home</span>
          </button>
        </div>
        
        <main className="flex-1 overflow-hidden ml-[280px]">
          <div className="flex h-full flex-col">
            {/* Header with Tone and Language Selectors */}
            <div className="border-b border-white/10 p-4 flex justify-between items-center bg-[#1a1b1e]/50 backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <IconMessage size={24} className="text-blue-400" />
                {title}
              </h2>
              <div className="flex items-center gap-3">
                {action !== 'summarize' && (
                  <button
                    onClick={() => setShowToneSelector(!showToneSelector)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50 text-white hover:bg-gray-700/50 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    <IconSettings size={18} className="text-blue-400" />
                    <span>Tone: {currentTone.charAt(0).toUpperCase() + currentTone.slice(1)}</span>
                  </button>
                )}
                <button
                  onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50 text-white hover:bg-gray-700/50 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <IconLanguage size={18} className="text-blue-400" />
                  <span>{currentLanguageName}</span>
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {currentChatId && chats.find(c => c.id === currentChatId)?.messages.map((message, index) => (
                <div
                  key={`${currentChatId}-${index}`}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 shadow-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-white'
                    }`}
                  >
                    <div className="text-sm mb-2 opacity-70 flex items-center gap-2">
                      {message.role === 'user' ? (
                        <>
                          <span className="w-2 h-2 bg-white rounded-full"></span>
                          You
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                          AI Assistant
                        </>
                      )}
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="max-w-[80%] rounded-2xl p-4 bg-gray-800 text-white shadow-lg">
                    <div className="text-sm mb-2 opacity-70 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      AI Assistant
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              {error && (
                <div className="flex justify-center animate-fade-in">
                  <div className="max-w-[80%] rounded-2xl p-4 bg-red-500/20 text-red-400 border border-red-500/50 shadow-lg">
                    {error}
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-white/10 p-4 bg-[#1a1b1e]/50 backdrop-blur-sm">
              <form onSubmit={handleSubmit} className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-gray-800/50 text-white rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none transition-all duration-200"
                    rows={3}
                  />
                  <div className="absolute bottom-4 right-4">
                    <VoiceInput
                      onTranscript={handleVoiceTranscript}
                      isRecording={isRecording}
                      onRecordingChange={setIsRecording}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className={`p-4 rounded-xl transition-all duration-200 ${
                    !input.trim() || loading
                      ? 'bg-gray-700 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-500 hover:scale-105 active:scale-95'
                  } text-white`}
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <IconSend size={24} />
                  )}
                </button>
              </form>
            </div>

            {/* Tone Selector Modal */}
            {showToneSelector && (
              <div className="absolute bottom-24 right-4 bg-gray-800 rounded-xl shadow-2xl border border-white/10 animate-fade-in">
                <ToneSelector selectedTone={currentTone} onToneChange={handleToneChange} />
              </div>
            )}

            {/* Language Selector Modal */}
            {showLanguageSelector && (
              <div className="absolute bottom-24 right-4 bg-gray-800 rounded-xl shadow-2xl border border-white/10 animate-fade-in">
                <LanguageSelector selectedLanguage={currentLanguage} onLanguageChange={handleLanguageChange} />
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default EmailActionPage; 