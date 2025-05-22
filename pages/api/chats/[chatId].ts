import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { chatId } = req.query;

  if (req.method === 'GET') {
    try {
      const chat = await prisma.chat.findUnique({
        where: {
          id: chatId as string,
          userId: session.user.id,
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }

      return res.status(200).json(chat);
    } catch (error) {
      console.error('Error fetching chat:', error);
      return res.status(500).json({ error: 'Failed to fetch chat' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { tone, language } = req.body;

      const chat = await prisma.chat.update({
        where: {
          id: chatId as string,
          userId: session.user.id,
        },
        data: {
          ...(tone && { tone }),
          ...(language && { language }),
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      return res.status(200).json(chat);
    } catch (error) {
      console.error('Error updating chat:', error);
      return res.status(500).json({ error: 'Failed to update chat' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.chat.delete({
        where: {
          id: chatId as string,
          userId: session.user.id,
        },
      });

      return res.status(204).end();
    } catch (error) {
      console.error('Error deleting chat:', error);
      return res.status(500).json({ error: 'Failed to delete chat' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 