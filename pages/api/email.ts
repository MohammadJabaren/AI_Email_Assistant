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

    // For reply, enhance, and summarize actions, we need the previous email
    if (['reply', 'enhance', 'summarize'].includes(action) && !previousEmail) {
      res.status(400).json({ result: 'Previous email is required for this action' });
      return;
    }

    // Call Python script with all parameters
    const pythonProcess = spawn('python3', [
      'email_service.py',
      '--action', action,
      '--text', text,
      '--tone', tone,
      '--language', language,
      '--previous-email', previousEmail || ''  // Pass empty string if no previous email
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
              reject(new Error(response.error || 'An error occurred'));
            } else {
              // Clean up the response for better formatting
              const cleanedResponse = response.result
                .replace(/^\s*[\r\n]/gm, '') // Remove empty lines at start
                .replace(/\n{3,}/g, '\n\n')  // Replace multiple newlines with double newlines
                .trim();
              resolve(cleanedResponse);
            }
          } catch (e) {
            // If the response isn't JSON, use it as is
            resolve(result.trim());
          }
        } else {
          reject(new Error(error.trim() || 'An error occurred'));
        }
      });
    });

    // Make sure we're sending a proper response
    if (!response) {
      throw new Error('No response from email service');
    }

    res.status(200).json({ result: response });
  } catch (error: any) {
    console.error('Error in handler:', error);
    res.status(500).json({ 
      result: `Error: ${error?.message || 'Unknown error'}` 
    });
  }
} 