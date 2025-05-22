import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.user.id;

  switch (req.method) {
    case 'GET':
      try {
        const { action } = req.query;
        const chats = await prisma.chat.findMany({
          where: {
            userId,
            action: action as string
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
        return res.status(200).json({ chats });
      } catch (error) {
        console.error('Error fetching chats:', error);
        return res.status(500).json({ error: 'Failed to fetch chats' });
      }

    case 'POST':
      try {
        const { chat, action } = req.body;
        const newChat = await prisma.chat.create({
          data: {
            ...chat,
            userId,
            action
          }
        });
        return res.status(201).json({ chat: newChat });
      } catch (error) {
        console.error('Error creating chat:', error);
        return res.status(500).json({ error: 'Failed to create chat' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
} 