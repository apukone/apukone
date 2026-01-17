import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { pub } from '../lib/redis';
import { triggerNextMessage, broadcastMessageStatus } from './sse';

const prisma = new PrismaClient();

export const finalizeMessage = async (req: FastifyRequest<{ Body: { message: any; chat_id: string; agent_id: string; stats?: { inferenceTime?: number; tokens?: number } } }>, reply: FastifyReply) => {
    // Agent Authentication is handled by hook in routes
    const { message, chat_id, agent_id, stats } = req.body;

    if (!message || !chat_id || !agent_id) {
        return reply.status(400).send({ error: 'Missing properties' });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Mark the user's message that was being processed as 'finished'
            // Since we process sequentially per chat, there should only be one.
            const messagesToFinish = await tx.message.findMany({
                where: {
                    chatId: chat_id,
                    agentId: agent_id,
                    status: 'processing'
                }
            });

            await tx.message.updateMany({
                where: {
                    chatId: chat_id,
                    agentId: agent_id,
                    status: 'processing'
                },
                data: { status: 'finished' }
            });

            // Get userId
            const chat = await tx.chat.findUnique({ where: { id: chat_id } });
            if (!chat) throw new Error('Chat not found');

            // Broadcast status update for user messages
            for (const m of messagesToFinish) {
                await broadcastMessageStatus(chat.userId, m.id, chat_id, 'finished');
            }

            // Create agent's response message with status 'finished'
            const msg = await tx.message.create({
                data: {
                    chatId: chat_id,
                    agentId: agent_id,
                    content: JSON.stringify(message), // agent sends JSON object usually?
                    status: 'finished',
                    inferenceTime: stats?.inferenceTime,
                    tokens: stats?.tokens
                }
            });

            return { msg, userId: chat.userId };
        });

        // Publish to processed_messages
        const payload = JSON.stringify({
            ...result.msg,
            chat_id: result.msg.chatId,
            agent_id: result.msg.agentId,
            userId: result.userId
        });

        await pub.publish('processed_messages', payload);

        // Trigger next message for this agent (sequential catch-up)
        await triggerNextMessage(agent_id);

        return reply.send(result.msg.id);

    } catch (err) {
        console.error(err);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};
