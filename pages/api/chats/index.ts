import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const { type } = req.query;
      const chats = await prisma.chat.findMany({
        where: {
          userId: session.user.id,
          type: type as string,
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return res.status(200).json({ chats });
    } catch (error) {
      console.error('Error fetching chats:', error);
      return res.status(500).json({ error: 'Failed to fetch chats' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { title, type, tone, language } = req.body;

      const chat = await prisma.chat.create({
        data: {
          title,
          type,
          tone,
          language,
          userId: session.user.id,
        },
        include: {
          messages: true,
        },
      });

      return res.status(201).json(chat);
    } catch (error) {
      console.error('Error creating chat:', error);
      return res.status(500).json({ error: 'Failed to create chat' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 