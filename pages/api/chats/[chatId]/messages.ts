import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { chatId } = req.query;

  // Verify chat ownership
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId as string,
      userId: session.user.id,
    },
  });

  if (!chat) {
    return res.status(404).json({ error: 'Chat not found' });
  }

  if (req.method === 'POST') {
    try {
      const { role, content } = req.body;

      const message = await prisma.message.create({
        data: {
          role,
          content,
          chatId: chatId as string,
        },
      });

      return res.status(201).json(message);
    } catch (error) {
      console.error('Error creating message:', error);
      return res.status(500).json({ error: 'Failed to create message' });
    }
  }

  if (req.method === 'GET') {
    try {
      const messages = await prisma.message.findMany({
        where: {
          chatId: chatId as string,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return res.status(200).json({ messages });
    } catch (error) {
      console.error('Error fetching messages:', error);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 