import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { pub } from '../lib/redis';
import { isAgentConnected } from './sse';

const prisma = new PrismaClient();

export const getAllChats = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user;
    if (!user) return reply.status(401).send({ error: 'Unauthorized' });

    try {
        const chats = await prisma.chat.findMany({
            where: { userId: user.id }
        });
        return reply.send(chats);
    } catch (err) {
        console.error(err);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};

export const createChat = async (req: FastifyRequest<{ Body: { message: string; agentId: string } }>, reply: FastifyReply) => {
    const user = req.user;
    const { message, agentId } = req.body;

    if (!user) return reply.status(401).send({ error: 'Unauthorized' });
    if (!message || !agentId) return reply.status(400).send({ error: 'Message and AgentId required' });

    try {
        // Check if agent is online
        const online = isAgentConnected(agentId);
        const status = online ? 'queued' : 'offline_queued';
        console.log(`[createChat] Agent ${agentId} online status: ${online}, setting status: ${status}`);

        // Transaction: Create Chat + First Message
        const result = await prisma.$transaction(async (tx) => {
            const chat = await tx.chat.create({
                data: {
                    userId: user.id,
                    title: message.substring(0, 20),
                    description: message.substring(0, 20)
                }
            });

            const messageContent = JSON.stringify({ role: 'user', content: message });

            const msg = await tx.message.create({
                data: {
                    chatId: chat.id,
                    agentId: agentId,
                    content: messageContent,
                    status: status
                }
            });

            return { chat, msg };
        });

        if (online) {
            // Publish to Redis
            const payload = JSON.stringify({
                id: result.msg.id,
                chat_id: result.chat.id,
                agent_id: agentId,
                content: JSON.stringify([JSON.parse(result.msg.content)])
            });
            await pub.publish('unfinished_messages', payload);
        }

        return reply.send({
            id: result.chat.id,
            agentOnline: online,
            message: online ? undefined : 'Agent is currently offline. Your message has been queued and will be processed when the agent connects.'
        });

    } catch (err) {
        console.error(err);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};

export const getAllMessages = async (req: FastifyRequest<{ Body: { chatId: string } }>, reply: FastifyReply) => {
    const { chatId } = req.body;
    if (!chatId) return reply.status(400).send({ error: 'ChatId required' });

    try {
        const messages = await prisma.message.findMany({
            where: { chatId },
            orderBy: { createdAt: 'asc' }
        });
        return reply.send(messages);
    } catch (err) {
        console.error(err);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};

export const sendMessage = async (req: FastifyRequest<{ Body: { message: string; chatId: string; agentId: string } }>, reply: FastifyReply) => {
    const user = req.user;
    const { message, chatId, agentId } = req.body;

    if (!user) return reply.status(401).send({ error: 'Unauthorized' });
    if (!message || !chatId || !agentId) return reply.status(400).send({ error: 'Missing properties' });

    try {
        // Check if agent is online
        const online = isAgentConnected(agentId);
        const status = online ? 'queued' : 'offline_queued';
        console.log(`[sendMessage] Agent ${agentId} online status: ${online}, setting status: ${status}`);

        const messageRecord = await prisma.$transaction(async (tx) => {
            const msg = await tx.message.create({
                data: {
                    chatId,
                    agentId,
                    content: JSON.stringify({ role: 'user', content: message }),
                    status: status
                }
            });
            return msg;
        });

        if (online) {
            // Build Context
            const allMessages = await prisma.message.findMany({
                where: { chatId },
                orderBy: { createdAt: 'asc' }
            });

            const context = allMessages.map(m => JSON.parse(m.content));

            const payload = JSON.stringify({
                id: messageRecord.id,
                chat_id: chatId,
                agent_id: agentId,
                content: JSON.stringify(context)
            });

            await pub.publish('unfinished_messages', payload);
        }

        return reply.send({
            id: messageRecord.id,
            agentOnline: online,
            message: online ? undefined : 'Agent is currently offline. Your message has been queued and will be processed when the agent connects.'
        });

    } catch (err) {
        console.error(err);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};

export const deleteChat = async (req: FastifyRequest<{ Body: { chatId: string } }>, reply: FastifyReply) => {
    const user = req.user;
    const { chatId: id } = req.body;

    if (!user) return reply.status(401).send({ error: 'Unauthorized' });

    try {
        const chat = await prisma.chat.findUnique({ where: { id } });
        if (!chat) return reply.status(404).send({ error: 'Chat not found' });
        if (chat.userId !== user.id) return reply.status(403).send({ error: 'Forbidden' });

        await prisma.chat.delete({ where: { id } });
        return reply.send(true);
    } catch (err) {
        return reply.status(500).send(err);
    }
}
