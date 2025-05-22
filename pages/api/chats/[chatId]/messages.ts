import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.user.id;
  const { chatId } = req.query;

  // Verify chat ownership
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId as string,
      userId
    }
  });

  if (!chat) {
    return res.status(404).json({ error: 'Chat not found' });
  }

  switch (req.method) {
    case 'POST':
      try {
        const { message } = req.body;
        const messages = [...(chat.messages as any[]), message];
        
        const updatedChat = await prisma.chat.update({
          where: {
            id: chatId as string
          },
          data: {
            messages
          }
        });

        return res.status(200).json({ chat: updatedChat });
      } catch (error) {
        console.error('Error adding message:', error);
        return res.status(500).json({ error: 'Failed to add message' });
      }

    default:
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
} 