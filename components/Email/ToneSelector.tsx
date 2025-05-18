import { IconMoodSmile, IconBriefcase, IconUsers, IconPencil } from '@tabler/icons-react';

export type EmailTone = 'professional' | 'friendly' | 'casual' | 'custom';

interface ToneSelectorProps {
  selectedTone: EmailTone;
  onToneChange: (tone: EmailTone) => void;
}

const toneOptions = [
  {
    id: 'professional',
    label: 'Professional',
    description: 'Formal and business-appropriate',
    icon: IconBriefcase,
  },
  {
    id: 'friendly',
    label: 'Friendly',
    description: 'Warm and personable',
    icon: IconUsers,
  },
  {
    id: 'casual',
    label: 'Casual',
    description: 'Relaxed and informal',
    icon: IconMoodSmile,
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Your own style',
    icon: IconPencil,
  },
] as const;

const ToneSelector = ({ selectedTone, onToneChange }: ToneSelectorProps) => {
  return (
    <div className="flex flex-col space-y-2 p-4 bg-[#2A2B32] rounded-lg">
      <h3 className="text-sm font-medium text-white mb-2">Select Email Tone</h3>
      <div className="grid grid-cols-2 gap-2">
        {toneOptions.map((tone) => {
          const Icon = tone.icon;
          return (
            <button
              key={tone.id}
              onClick={() => onToneChange(tone.id as EmailTone)}
              className={`flex flex-col items-center p-3 rounded-lg transition-all duration-200 ${
                selectedTone === tone.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#343541] text-gray-300 hover:bg-[#40414F]'
              }`}
            >
              <Icon size={20} className="mb-2" />
              <span className="text-sm font-medium">{tone.label}</span>
              <span className="text-xs opacity-75 text-center mt-1">
                {tone.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ToneSelector; 