import type { NextApiRequest, NextApiResponse } from 'next';
import { EmailTone } from '../../components/Email/ToneSelector';

type EmailAction = 'write' | 'summarize' | 'enhance' | 'reply';

interface EmailRequest {
  action: EmailAction;
  text: string;
  tone: EmailTone;
  previousEmail?: string;
  language: string;
}

interface EmailResponse {
  result: string;
}

interface LanguageInfo {
  name: string;
  formalGreeting: string;
  closing: string;
  dateFormat: string;
  nameFormat: string;
  honorifics: {
    male: string[];
    female: string[];
    neutral: string[];
  };
  culturalNotes: string[];
}

const getToneInstructions = (tone: EmailTone): string => {
  switch (tone) {
    case 'professional':
      return 'Write in a formal, business-appropriate tone using professional language and proper etiquette.';
    case 'friendly':
      return 'Write in a warm and personable tone while maintaining professionalism.';
    case 'casual':
      return 'Write in a relaxed and informal tone, as if speaking to a friend.';
    case 'custom':
      return 'Write in the user\'s preferred style based on the context.';
    default:
      return 'Write in a professional tone.';
  }
};

const getLanguageInstructions = (language: string): LanguageInfo => {
  const languageMap: { [key: string]: LanguageInfo } = {
    'ar': {
      name: 'Arabic (العربية)',
      formalGreeting: 'تحية طيبة وبعد،',
      closing: 'مع خالص التحيات،',
      dateFormat: 'DD/MM/YYYY',
      nameFormat: '{honorific} {firstName} {lastName}',
      honorifics: {
        male: ['أنا', 'أنت', 'أنتم'],
        female: ['أنت', 'أنتم'],
        neutral: ['أنت', 'أنتم']
      },
      culturalNotes: [
        'Use titles unless explicitly asked to use first names',
        'Keep paragraphs concise and well-spaced',
        'Be direct but polite'
      ]
    },
    'en': {
      name: 'English',
      formalGreeting: 'Dear',
      closing: 'Best regards,',
      dateFormat: 'MM/DD/YYYY',
      nameFormat: '{title} {firstName} {lastName}',
      honorifics: {
        male: ['Mr.', 'Dr.', 'Prof.'],
        female: ['Ms.', 'Mrs.', 'Dr.', 'Prof.'],
        neutral: ['Mx.', 'Dr.', 'Prof.']
      },
      culturalNotes: [
        'Use titles unless explicitly asked to use first names',
        'Keep paragraphs concise and well-spaced',
        'Be direct but polite'
      ]
    },
    'es': {
      name: 'Spanish (Español)',
      formalGreeting: 'Estimado/a',
      closing: 'Atentamente,',
      dateFormat: 'DD/MM/YYYY',
      nameFormat: '{honorific} {firstName} {lastName}',
      honorifics: {
        male: ['Sr.', 'Dr.', 'Prof.'],
        female: ['Sra.', 'Srita.', 'Dr.', 'Prof.'],
        neutral: ['Sr.', 'Dr.', 'Prof.']
      },
      culturalNotes: [
        'Use titles unless explicitly asked to use first names',
        'Keep paragraphs concise and well-spaced',
        'Be direct but polite'
      ]
    },
    'fr': {
      name: 'French (Français)',
      formalGreeting: 'Cher/Chère',
      closing: 'Cordialement,',
      dateFormat: 'DD/MM/YYYY',
      nameFormat: '{honorific} {firstName} {lastName}',
      honorifics: {
        male: ['M.', 'Mme.', 'Mlle.', 'Dr.', 'Prof.'],
        female: ['Mme.', 'Mlle.', 'Dr.', 'Prof.'],
        neutral: ['Mx.', 'Dr.', 'Prof.']
      },
      culturalNotes: [
        'Use titles unless explicitly asked to use first names',
        'Keep paragraphs concise and well-spaced',
        'Be direct but polite'
      ]
    },
    'de': {
      name: 'German (Deutsch)',
      formalGreeting: 'Sehr geehrte/r',
      closing: 'Mit freundlichen Grüßen,',
      dateFormat: 'DD.MM.YYYY',
      nameFormat: '{honorific} {firstName} {lastName}',
      honorifics: {
        male: ['Herr', 'Dr.', 'Prof.'],
        female: ['Frau', 'Dr.', 'Prof.'],
        neutral: ['Frau', 'Dr.', 'Prof.']
      },
      culturalNotes: [
        'Use titles unless explicitly asked to use first names',
        'Keep paragraphs concise and well-spaced',
        'Be direct but polite'
      ]
    },
    'he': {
      name: 'Hebrew (עברית)',
      formalGreeting: ',שלום רב',
      closing: ',בברכה',
      dateFormat: 'DD/MM/YYYY',
      nameFormat: '{honorific} {firstName} {lastName}',
      honorifics: {
        male: ['אודה לך', 'אודה לך', 'אודה לך'],
        female: ['אודה לך', 'אודה לך'],
        neutral: ['אודה לך', 'אודה לך']
      },
      culturalNotes: [
        'Use humble language (קול מלאך) when referring to yourself',
        'Use honorific language (שמחת מצדך) when referring to the recipient',
        'Include seasonal greetings (הלידה)',
        'Family name comes before given name'
      ]
    },
    'it': {
      name: 'Italian (Italiano)',
      formalGreeting: 'Gentile',
      closing: 'Cordiali saluti,',
      dateFormat: 'DD/MM/YYYY',
      nameFormat: '{honorific} {firstName} {lastName}',
      honorifics: {
        male: ['Sig.', 'Dr.', 'Prof.'],
        female: ['Sig.', 'Dr.', 'Prof.'],
        neutral: ['Sig.', 'Dr.', 'Prof.']
      },
      culturalNotes: [
        'Use titles unless explicitly asked to use first names',
        'Keep paragraphs concise and well-spaced',
        'Be direct but polite'
      ]
    },
    'pt': {
      name: 'Portuguese (Português)',
      formalGreeting: 'Prezado(a)',
      closing: 'Atenciosamente,',
      dateFormat: 'DD/MM/YYYY',
      nameFormat: '{honorific} {firstName} {lastName}',
      honorifics: {
        male: ['Sr.', 'Dr.', 'Prof.'],
        female: ['Sra.', 'Srita.', 'Dr.', 'Prof.'],
        neutral: ['Sr.', 'Dr.', 'Prof.']
      },
      culturalNotes: [
        'Use titles unless explicitly asked to use first names',
        'Keep paragraphs concise and well-spaced',
        'Be direct but polite'
      ]
    },
    'nl': {
      name: 'Dutch (Nederlands)',
      formalGreeting: 'Geachte',
      closing: 'Met vriendelijke groet,',
      dateFormat: 'DD/MM/YYYY',
      nameFormat: '{honorific} {firstName} {lastName}',
      honorifics: {
        male: ['Mijnheer', 'Dr.', 'Prof.'],
        female: ['Mevrouw', 'Dr.', 'Prof.'],
        neutral: ['Mevrouw', 'Dr.', 'Prof.']
      },
      culturalNotes: [
        'Use titles unless explicitly asked to use first names',
        'Keep paragraphs concise and well-spaced',
        'Be direct but polite'
      ]
    },
    'ru': {
      name: 'Russian (Русский)',
      formalGreeting: 'Уважаемый/ая',
      closing: 'С уважением,',
      dateFormat: 'DD.MM.YYYY',
      nameFormat: '{honorific} {firstName} {lastName}',
      honorifics: {
        male: ['Уважаемый', 'Доктор', 'Профессор'],
        female: ['Уважаемая', 'Доктор', 'Профессор'],
        neutral: ['Уважаемый', 'Доктор', 'Профессор']
      },
      culturalNotes: [
        'Use titles unless explicitly asked to use first names',
        'Keep paragraphs concise and well-spaced',
        'Be direct but polite'
      ]
    },
    'zh': {
      name: 'Chinese (中文)',
      formalGreeting: '尊敬的',
      closing: '此致\n敬礼,',
      dateFormat: 'YYYY年MM月DD日',
      nameFormat: '{lastName}{firstName}',
      honorifics: {
        male: ['先生'],
        female: ['女士', '小姐'],
        neutral: ['同志']
      },
      culturalNotes: [
        'Use formal expressions (书面语)',
        'Show respect through titles and honorifics',
        'Family name comes before given name',
        'Include proper level of formality based on hierarchy'
      ]
    },
    'ja': {
      name: 'Japanese (日本語)',
      formalGreeting: '拝啓',
      closing: '敬具,',
      dateFormat: 'YYYY年MM月DD日',
      nameFormat: '{lastName}{firstName}{honorific}',
      honorifics: {
        male: ['さん', 'くん', '様'],
        female: ['さん', '様'],
        neutral: ['様', 'さん']
      },
      culturalNotes: [
        'Use humble language (謙譲語) when referring to yourself',
        'Use honorific language (尊敬語) when referring to the recipient',
        'Include seasonal greetings (時候の挨拶)',
        'Family name comes before given name'
      ]
    },
    'ko': {
      name: 'Korean (한국어)',
      formalGreeting: '안녕하십니까',
      closing: '감사합니다,',
      dateFormat: 'YYYY년 MM월 DD일',
      nameFormat: '{honorific} {lastName} {firstName}',
      honorifics: {
        male: ['씨', '씨', '씨'],
        female: ['씨', '씨'],
        neutral: ['씨', '씨']
      },
      culturalNotes: [
        'Use humble language (겸양어) when referring to yourself',
        'Use honorific language (존대어) when referring to the recipient',
        'Include seasonal greetings (시간의 안부)',
        'Family name comes before given name'
      ]
    },
    'hi': {
      name: 'Hindi (हिन्दी)',
      formalGreeting: 'माननीय',
      closing: 'सादर,',
      dateFormat: 'DD/MM/YYYY',
      nameFormat: '{honorific} {firstName} {lastName}',
      honorifics: {
        male: ['आप', 'आप', 'आप'],
        female: ['आप', 'आप'],
        neutral: ['आप', 'आप']
      },
      culturalNotes: [
        'Use humble language (मलयायक भाषा) when referring to yourself',
        'Use honorific language (सम्मानायक भाषा) when referring to the recipient',
        'Include seasonal greetings (समय का आनन)',
        'Family name comes before given name'
      ]
    },
    'tr': {
      name: 'Turkish (Türkçe)',
      formalGreeting: 'Sayın',
      closing: 'Saygılarımla,',
      dateFormat: 'DD/MM/YYYY',
      nameFormat: '{honorific} {firstName} {lastName}',
      honorifics: {
        male: ['Efendim', 'Dr.', 'Prof.'],
        female: ['Efendim', 'Dr.', 'Prof.'],
        neutral: ['Efendim', 'Dr.', 'Prof.']
      },
      culturalNotes: [
        'Use titles unless explicitly asked to use first names',
        'Keep paragraphs concise and well-spaced',
        'Be direct but polite'
      ]
    },
    'pl': {
      name: 'Polish (Polski)',
      formalGreeting: 'Szanowny/a Panie/Pani',
      closing: 'Z poważaniem,',
      dateFormat: 'DD/MM/YYYY',
      nameFormat: '{honorific} {firstName} {lastName}',
      honorifics: {
        male: ['Panie', 'Dr.', 'Prof.'],
        female: ['Pani', 'Dr.', 'Prof.'],
        neutral: ['Pani', 'Dr.', 'Prof.']
      },
      culturalNotes: [
        'Use titles unless explicitly asked to use first names',
        'Keep paragraphs concise and well-spaced',
        'Be direct but polite'
      ]
    }
  };

  return languageMap[language] || languageMap['en'];
};

const createEmailPrompt = (text: string, tone: EmailTone, language: string, previousEmail?: string): string => {
  const toneInstructions = getToneInstructions(tone);
  const languageInfo = getLanguageInstructions(language);
  
  if (previousEmail) {
    return `Here is an existing email:

${previousEmail}

User request: ${text}

Please modify or enhance this email based on the user's request. Follow these guidelines:
- Write the ENTIRE response in ${languageInfo.name}
- Use proper ${languageInfo.name} grammar, punctuation, and formatting
- For formal emails in ${languageInfo.name}, use "${languageInfo.formalGreeting}" as greeting
- For formal emails in ${languageInfo.name}, use "${languageInfo.closing}" as closing
- Use the correct date format for ${languageInfo.name}: ${languageInfo.dateFormat}
- Follow the name format: ${languageInfo.nameFormat}
- Use appropriate honorifics based on gender and formality
- Maintain the same tone: ${toneInstructions}
- Preserve the email structure and format
- Incorporate the requested changes seamlessly
- Keep any relevant information from the original email
- Ensure the modified email is complete and coherent
- Make sure the response reads naturally in ${languageInfo.name}
- Follow these cultural notes for ${languageInfo.name}:
${languageInfo.culturalNotes.map(note => `  - ${note}`).join('\n')}`;
  }

  return `Write a professional email in ${languageInfo.name}. Follow these requirements:

Content Requirements:
- Use this context/request: ${text}
- Follow this tone: ${toneInstructions}

Language and Cultural Requirements:
- Write the ENTIRE email in ${languageInfo.name}
- Use proper ${languageInfo.name} grammar and punctuation
- For formal emails, use "${languageInfo.formalGreeting}" as greeting
- For formal emails, use "${languageInfo.closing}" as closing
- Use the correct date format: ${languageInfo.dateFormat}
- Follow the name format: ${languageInfo.nameFormat}
- Use appropriate honorifics based on gender and formality
- Follow these cultural notes:
${languageInfo.culturalNotes.map(note => `  - ${note}`).join('\n')}

Format Requirements:
- Include proper email format with greeting and signature
- Use appropriate spacing and paragraphs
- Be concise and clear
- Maintain professional formatting

Cultural Considerations:
- Use appropriate honorifics and titles for ${languageInfo.name}
- Follow cultural norms for formal communication in ${languageInfo.name}
- Use region-appropriate date formats
- Include any culture-specific formalities required in ${languageInfo.name} business communication`;
};

async function generateWithOllama(prompt: string): Promise<string> {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemma:2b',
        prompt: prompt,
        stream: false,
        max_tokens: 2000,
        temperature: 0.7,
        top_p: 0.9,
        top_k: 40,
        repeat_penalty: 1.1,
        stop: ["</email>", "---"]
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error calling Ollama:', error);
    throw new Error('Failed to generate email with Ollama');
  }
}

const handleEmailAction = async (action: EmailAction, text: string, tone: EmailTone, language: string, previousEmail?: string): Promise<string> => {
  console.log('Handling email action:', { action, text, tone, language, previousEmail: !!previousEmail });
  
  try {
    const prompt = createEmailPrompt(text, tone, language, previousEmail);
    const response = await generateWithOllama(prompt);
    console.log('Ollama response received');
    return response;
  } catch (error) {
    console.error('Error in handleEmailAction:', error);
    throw error;
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EmailResponse>
) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  try {
    const { action, text, tone = 'professional', language = 'en', previousEmail } = req.body as EmailRequest;
    
    if (!action || !text) {
      res.status(400).json({ result: 'Action and text are required' });
      return;
    }

    const result = await handleEmailAction(action, text, tone, language, previousEmail);
    res.status(200).json({ result });
  } catch (error) {
    console.error('Error processing email action:', error);
    res.status(500).json({ result: 'An error occurred while processing your request' });
  }
} 