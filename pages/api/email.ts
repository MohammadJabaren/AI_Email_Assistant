import type { NextApiRequest, NextApiResponse } from 'next';
import { EmailTone } from '../../components/Email/ToneSelector';
import { spawn } from 'child_process';

interface EmailRequest {
  action: 'write' | 'summarize' | 'enhance' | 'reply';
  text: string;
  tone: EmailTone;
  previousEmail?: string;
  language: string;
}

interface EmailResponse {
  result: string;
}

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

    // Validate based on action type
    switch (action) {
      case 'reply':
      case 'enhance':
      case 'summarize':
        if (!previousEmail) {
          res.status(400).json({ result: 'Previous email is required for this action' });
          return;
        }
        break;
    }

    // Call Python script with all parameters
    const pythonProcess = spawn('python3', [
      'email_service.py',
      '--action', action,
      '--text', text,
      '--tone', tone,
      '--language', language,
      ...(previousEmail ? ['--previous-email', previousEmail] : [])
    ]);

    let result = '';
    let error = '';

    // Collect data from script
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    // Handle process completion
    const response = await new Promise<string>((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const response = JSON.parse(result);
            if (response.status === 'error') {
              resolve(response.error || 'An error occurred');
            } else {
              resolve(response.result);
            }
          } catch (e) {
            resolve(result.trim());
          }
        } else {
          resolve(error.trim() || 'An error occurred');
        }
      });
    });

    res.status(200).json({ result: response });
  } catch (error: any) {
    console.error('Error in handler:', error);
    res.status(500).json({ result: `Error: ${error?.message || 'Unknown error'}` });
  }
} 