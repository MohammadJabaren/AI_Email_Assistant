import { generateResponse } from '@/lib/api';

// In your chat component
const handleSendMessage = async (message: string) => {
  try {
    const response = await generateResponse(message);
    // Handle the response
    console.log('Response:', response);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}; 