import type { NextApiRequest, NextApiResponse } from 'next';
import { EmailTone } from '../../components/Email/ToneSelector';

type EmailAction = 'write' | 'summarize' | 'enhance' | 'reply';

interface EmailRequest {
  action: EmailAction;
  text: string;
  tone: EmailTone;
}

interface EmailResponse {
  result: string;
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

// This is a mock implementation. Replace with actual AI integration later.
const handleEmailAction = (action: EmailAction, text: string, tone: EmailTone): string => {
  const toneInstructions = getToneInstructions(tone);
  
  switch (action) {
    case 'write':
      return `Here's a ${tone} email based on your input:\n\nDear [Recipient],\n\n[Following ${toneInstructions}]\n[AI-generated content will go here based on: ${text}]\n\nBest regards,\n[Your name]`;
    
    case 'summarize':
      return `Summary of the email (${tone} tone):\n\nKey points:\n1. [First key point]\n2. [Second key point]\n3. [Third key point]\n\nThis is a mock summary. Replace with actual AI summarization.`;
    
    case 'enhance':
      return `Enhanced version of your email (${tone} tone):\n\n${text}\n\n[AI improvements will be applied here following ${toneInstructions}]`;
    
    case 'reply':
      return `Suggested ${tone} reply:\n\n[Following ${toneInstructions}]\nThank you for your email.\n\n[AI-generated reply will go here based on: ${text}]\n\nBest regards,\n[Your name]`;
    
    default:
      throw new Error('Invalid action');
  }
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<EmailResponse>
) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  try {
    const { action, text, tone = 'professional' } = req.body as EmailRequest;
    
    if (!action || !text) {
      res.status(400).json({ result: 'Action and text are required' });
      return;
    }

    const result = handleEmailAction(action, text, tone);
    res.status(200).json({ result });
  } catch (error) {
    console.error('Error processing email action:', error);
    res.status(500).json({ result: 'An error occurred while processing your request' });
  }
} 