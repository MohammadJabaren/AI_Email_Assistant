import { useState, useEffect } from 'react';
import Head from 'next/head';
import { IconSend, IconHome, IconPlus, IconTrash, IconSettings, IconLanguage } from '@tabler/icons-react';
import Sidebar from '../Sidebar/Sidebar';
import { ChatMessage } from '../Chat/ChatMessage';
import { useRouter } from 'next/router';
import ToneSelector, { EmailTone } from './ToneSelector';
import LanguageSelector, { languages } from './LanguageSelector';
import { useSession } from 'next-auth/react';

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
  const router = useRouter();
  const { data: session } = useSession();

  // Get current chat's tone and language or default values
  const currentTone = currentChatId 
    ? chats.find(c => c.id === currentChatId)?.tone || 'professional'
    : 'professional';
  const currentLanguage = currentChatId
    ? chats.find(c => c.id === currentChatId)?.language || 'en'
    : 'en';

  // Load chats from database on component mount
  useEffect(() => {
    if (session?.user) {
      fetchChats();
    }
  }, [session, action]);

  const fetchChats = async () => {
    try {
      const response = await fetch(`/api/chats?type=${action}`);
      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }
      const data = await response.json();
      if (data.chats && data.chats.length > 0) {
        setChats(data.chats);
        setCurrentChatId(data.chats[0].id);
      } else {
        createNewChat();
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      createNewChat();
    }
  };

  const createNewChat = async () => {
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `New ${title} ${new Date().toLocaleString()}`,
          type: action,
          tone: 'professional',
          language: 'en',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create chat');
      }

      const newChat = await response.json();
      setChats(prevChats => [newChat, ...prevChats]);
      setCurrentChatId(newChat.id);
    } catch (error) {
      console.error('Error creating chat:', error);
      setError('Failed to create new chat');
    }
  };

  const handleToneChange = async (newTone: EmailTone) => {
    if (currentChatId) {
      try {
        const response = await fetch(`/api/chats/${currentChatId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tone: newTone }),
        });

        if (!response.ok) {
          throw new Error('Failed to update tone');
        }

        const updatedChats = chats.map(chat => {
          if (chat.id === currentChatId) {
            return { ...chat, tone: newTone };
          }
          return chat;
        });
        setChats(updatedChats);
      } catch (error) {
        console.error('Error updating tone:', error);
        setError('Failed to update tone');
      }
    }
    setShowToneSelector(false);
  };

  const handleLanguageChange = async (newLanguage: string) => {
    if (currentChatId) {
      try {
        const response = await fetch(`/api/chats/${currentChatId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ language: newLanguage }),
        });

        if (!response.ok) {
          throw new Error('Failed to update language');
        }

        const updatedChats = chats.map(chat => {
          if (chat.id === currentChatId) {
            return { ...chat, language: newLanguage };
          }
          return chat;
        });
        setChats(updatedChats);
      } catch (error) {
        console.error('Error updating language:', error);
        setError('Failed to update language');
      }
    }
    setShowLanguageSelector(false);
  };

  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }

      const updatedChats = chats.filter(chat => chat.id !== chatId);
      setChats(updatedChats);
      if (currentChatId === chatId) {
        setCurrentChatId(updatedChats[0]?.id || null);
        setInput('');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      setError('Failed to delete chat');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      setError('Please sign in to continue');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // If there's no active chat, create one
      if (!currentChatId) {
        await createNewChat();
      }

      // Get the current chat
      const currentChat = chats.find(c => c.id === currentChatId);
      if (!currentChat) {
        throw new Error('No active chat');
      }

      // Add user message to database
      const messageResponse = await fetch(`/api/chats/${currentChatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'user',
          content: input,
        }),
      });

      if (!messageResponse.ok) {
        throw new Error('Failed to save message');
      }

      // Update local state
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

      // Get the last assistant message for previous email
      const lastAssistantMessage = currentChat.messages
        .filter(m => m.role === 'assistant')
        .pop()?.content;

      // For reply, enhance, and summarize actions, we need the previous email
      if (['reply', 'enhance', 'summarize'].includes(action)) {
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
        
        // Save assistant's response to database
        const assistantMessageResponse = await fetch(`/api/chats/${currentChatId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role: 'assistant',
            content: data.result,
          }),
        });

        if (!assistantMessageResponse.ok) {
          throw new Error('Failed to save assistant message');
        }

        // Update local state
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
        
        // Save assistant's response to database
        const assistantMessageResponse = await fetch(`/api/chats/${currentChatId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role: 'assistant',
            content: data.result,
          }),
        });

        if (!assistantMessageResponse.ok) {
          throw new Error('Failed to save assistant message');
        }

        // Update local state
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

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentChatId && chats.find(c => c.id === currentChatId)?.messages.map((message, index) => (
                <div
                  key={`${currentChatId}-${index}`}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-[#2A2B32] text-white'
                    }`}
                  >
                    <div className="text-sm mb-1 opacity-70">
                      {message.role === 'user' ? 'You' : 'AI Assistant'}
                    </div>
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-4 bg-[#2A2B32] text-white">
                    <div className="text-sm mb-1 opacity-70">AI Assistant</div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              {error && (
                <div className="flex justify-center">
                  <div className="max-w-[80%] rounded-lg p-4 bg-red-500 text-white">
                    {error}
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-white/20 p-4">
              <form onSubmit={handleSubmit} className="flex items-center gap-4">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 bg-[#40414F] text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className={`p-3 rounded-lg ${
                    !input.trim() || loading
                      ? 'bg-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600'
                  } text-white transition-colors`}
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
              <div className="absolute bottom-24 right-4 bg-[#2A2B32] rounded-lg shadow-lg border border-white/20">
                <ToneSelector selectedTone={currentTone} onToneChange={handleToneChange} />
              </div>
            )}

            {/* Language Selector Modal */}
            {showLanguageSelector && (
              <div className="absolute bottom-24 right-4 bg-[#2A2B32] rounded-lg shadow-lg border border-white/20">
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