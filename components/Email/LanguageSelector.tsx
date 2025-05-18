import { IconLanguage } from '@tabler/icons-react';

export type EmailLanguage = {
  code: string;
  name: string;
  flag: string;
};

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (code: string) => void;
}

const languages: EmailLanguage[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
];

const LanguageSelector = ({ selectedLanguage, onLanguageChange }: LanguageSelectorProps) => {
  return (
    <div className="flex flex-col space-y-2 p-4 bg-[#2A2B32] rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <IconLanguage size={20} className="text-blue-500" />
        <h3 className="text-sm font-medium text-white">Select Language</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onLanguageChange(lang.code)}
            className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-200 ${
              selectedLanguage === lang.code
                ? 'bg-blue-600 text-white'
                : 'bg-[#343541] text-gray-300 hover:bg-[#40414F]'
            }`}
          >
            <span className="text-xl">{lang.flag}</span>
            <span className="text-sm font-medium">{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;
export { languages }; 