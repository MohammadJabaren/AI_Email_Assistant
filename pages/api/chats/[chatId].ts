import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '../../../lib/prisma';

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
    case 'PATCH':
      try {
        const { tone, language } = req.body;
        const updatedChat = await prisma.chat.update({
          where: {
            id: chatId as string
          },
          data: {
            ...(tone && { tone }),
            ...(language && { language })
          }
        });
        return res.status(200).json({ chat: updatedChat });
      } catch (error) {
        console.error('Error updating chat:', error);
        return res.status(500).json({ error: 'Failed to update chat' });
      }

    case 'DELETE':
      try {
        await prisma.chat.delete({
          where: {
            id: chatId as string
          }
        });
        return res.status(204).end();
      } catch (error) {
        console.error('Error deleting chat:', error);
        return res.status(500).json({ error: 'Failed to delete chat' });
      }

    default:
      res.setHeader('Allow', ['PATCH', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
} 