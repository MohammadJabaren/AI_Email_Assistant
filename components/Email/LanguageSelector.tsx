import { IconLanguage } from '@tabler/icons-react';

export type EmailLanguage = {
  code: string;
  name: string;
};

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (code: string) => void;
}

const languages: EmailLanguage[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'nl', name: 'Dutch' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'tr', name: 'Turkish' },
  { code: 'pl', name: 'Polish' },
  { code: 'he', name: 'Hebrew' }
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
            <span className="text-sm font-medium">{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;
export { languages }; 