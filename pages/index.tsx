import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  IconMail, 
  IconFileText, 
  IconPencil, 
  IconArrowBack,
  IconBrain,
  IconClock,
  IconLanguage,
  IconMoodSmile,
  IconBriefcase,
  IconStar,
  IconLogin,
  IconUserPlus
} from '@tabler/icons-react';

const features = [
  {
    title: "Smart Composition",
    description: "AI-powered email writing that adapts to your tone and style",
    icon: IconBrain,
  },
  {
    title: "Quick Summaries",
    description: "Get the key points from long email threads instantly",
    icon: IconClock,
  },
  {
    title: "Multiple Tones",
    description: "Switch between professional, friendly, and casual tones",
    icon: IconMoodSmile,
  },
  {
    title: "Business Ready",
    description: "Perfect for professional communication and business emails",
    icon: IconBriefcase,
  },
  {
    title: "Multi-Language",
    description: "Support for multiple languages and regional styles",
    icon: IconLanguage,
  },
  {
    title: "Top Quality",
    description: "Advanced AI ensures high-quality email content",
    icon: IconStar,
  },
];

const HomePage = () => {
  const router = useRouter();

  const emailActions = [
    { title: 'Write Email', path: '/write', icon: IconPencil, description: 'Create a new email from scratch' },
    { title: 'Summarize Email', path: '/summarize', icon: IconFileText, description: 'Get a concise summary of your email' },
    { title: 'Enhance Email', path: '/enhance', icon: IconMail, description: 'Improve your email\'s content and tone' },
    { title: 'Reply to Email', path: '/reply', icon: IconArrowBack, description: 'Generate a response to an email' },
  ];

  return (
    <>
      <Head>
        <title>AI Email Assistant - Smart Email Writing & Enhancement</title>
        <meta name="description" content="AI-powered email assistant for writing, summarizing, enhancing, and replying to emails with smart composition and multiple tone options." />
      </Head>
      
      <div className="flex h-screen">
        <div className="fixed top-0 left-0 z-40 flex h-full w-[260px] flex-none flex-col bg-[#202123] p-2 text-[14px]">
          <div className="flex flex-col space-y-2">
            {emailActions.map((action) => (
              <button
                key={action.path}
                onClick={() => router.push(action.path)}
                className="flex items-center gap-3 rounded-lg p-3 text-sm transition-colors duration-200 hover:bg-gray-500/10 text-white"
              >
                <action.icon size={16} />
                <span>{action.title}</span>
              </button>
            ))}
            
            <div className="border-t border-gray-700 my-2"></div>
            
            <button
              onClick={() => router.push('/auth/signin')}
              className="flex items-center gap-3 rounded-lg p-3 text-sm transition-colors duration-200 hover:bg-gray-500/10 text-white"
            >
              <IconLogin size={16} />
              <span>Sign In</span>
            </button>
            
            <button
              onClick={() => router.push('/auth/signup')}
              className="flex items-center gap-3 rounded-lg p-3 text-sm transition-colors duration-200 hover:bg-gray-500/10 text-white"
            >
              <IconUserPlus size={16} />
              <span>Sign Up</span>
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-auto bg-[#343541] ml-[260px]">
          {/* Hero Section */}
          <div className="relative">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/10 to-purple-600/10 pointer-events-none" />
            <div className="relative z-10 pt-20 pb-12 text-center px-4">
              <h1 className="text-5xl font-bold text-white mb-4 animate-fade-in">
                AI Email Assistant
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto animate-fade-in-delay">
                Craft perfect emails with AI-powered writing, summarization, and enhancement tools
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="max-w-7xl mx-auto px-4 pb-20">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Powerful Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} 
                    className="p-6 rounded-lg bg-[#2A2B32] hover:bg-[#3A3B42] transition-all duration-300 transform hover:-translate-y-1">
                    <Icon size={24} className="text-blue-500 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-300">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-800 py-8 text-center text-gray-400">
            <p>Powered by Advanced AI Technology</p>
          </div>
        </main>
      </div>
    </>
  );
};

export default HomePage;
