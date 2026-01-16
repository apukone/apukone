import { FastifyRequest, FastifyReply } from 'fastify';
import { sub } from '../lib/redis';
import { verifyToken } from '../utils/token';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Connection Maps
const userConnections = new Map<string, FastifyReply>();
const agentConnections = new Map<string, FastifyReply[]>();
const agentIndices = new Map<string, number>();

export const isAgentConnected = (agentId: string): boolean => {
    const conns = agentConnections.get(agentId);
    return !!conns && conns.length > 0;
};

const getNextAgentConnection = (agentId: string): FastifyReply | undefined => {
    const conns = agentConnections.get(agentId);
    if (!conns || conns.length === 0) return undefined;

    const index = agentIndices.get(agentId) || 0;
    const reply = conns[index % conns.length];
    agentIndices.set(agentId, (index + 1) % conns.length);
    return reply;
};

// Subscribe to Redis Channels
sub.subscribe('unfinished_messages', 'processed_messages', (err) => {
    if (err) console.error('Failed to subscribe:', err);
});

sub.on('message', async (channel, message) => {
    try {
        const data = JSON.parse(message);

        if (channel === 'unfinished_messages') {
            // Message for Agent: { agent_id, ... }
            const { agent_id } = data;
            // Instead of just streaming, we try to process backlog which now handles sequentiality
            await processAgentBacklog(agent_id);
        } else if (channel === 'processed_messages') {
            // Message for User: { userId, ... }
            const { userId } = data;
            if (userConnections.has(userId)) {
                const conn = userConnections.get(userId);
                conn?.raw.write(`data: ${message}\n\n`);
            }
        }
    } catch (err) {
        console.error('Error processing redis message:', err);
    }
});

export const processAgentBacklog = async (agentId: string, reply?: FastifyReply) => {
    try {
        // Find the oldest message for each chat where NO message is currently 'processing'
        // We use DISTINCT ON (chat_id) and ORDER BY chat_id, created_at to get one message per free chat.
        // We pull both 'offline_queued' and 'queued' to ensure we catch everything.
        const claimed = await prisma.$queryRawUnsafe<any[]>(
            `UPDATE messages 
             SET status = 'processing' 
             WHERE id IN (
                 SELECT DISTINCT ON (chat_id) id 
                 FROM messages m
                 WHERE agent_id = $1 AND status IN ('offline_queued', 'queued')
                 AND NOT EXISTS (
                     SELECT 1 FROM messages m2 
                     WHERE m2.chat_id = m.chat_id AND m2.status = 'processing'
                 )
                 ORDER BY chat_id, created_at ASC
             ) 
             RETURNING id, "chat_id" as "chatId", content, "created_at" as "createdAt", 
             (SELECT "user_id" FROM chats WHERE id = messages."chat_id") as "userId"`,
            agentId
        );

        if (!claimed || claimed.length === 0) return;

        console.log(`Agent ${agentId} processing ${claimed.length} chats sequentially.`);

        for (const msg of claimed) {
            // Re-build the context for each message
            const allMessages = await prisma.message.findMany({
                where: { chatId: msg.chatId, createdAt: { lte: msg.createdAt } },
                orderBy: { createdAt: 'asc' }
            });

            const context = allMessages.map(m => {
                try {
                    return JSON.parse(m.content);
                } catch (e) {
                    return { role: 'user', content: m.content };
                }
            });

            const payload = JSON.stringify({
                id: msg.id,
                chat_id: msg.chatId,
                agent_id: agentId,
                content: JSON.stringify(context)
            });

            const targetReply = reply || getNextAgentConnection(agentId);
            if (targetReply) {
                targetReply.raw.write(`data: ${payload}\n\n`);

                // Notify User that message is processing
                if (msg.userId) {
                    const userConn = userConnections.get(msg.userId);
                    if (userConn) {
                        userConn.raw.write(`data: ${JSON.stringify({
                            type: 'message_status',
                            messageId: msg.id,
                            chatId: msg.chatId,
                            status: 'processing'
                        })}\n\n`);
                    }
                }

            } else {
                // If no connection, revert status so it can be picked up later
                console.warn(`No connection available for agent ${agentId} during backlog processing, reverting ${msg.id}`);
                await prisma.message.update({
                    where: { id: msg.id },
                    data: { status: 'queued' }
                });
            }
        }
    } catch (err) {
        console.error(`Error processing backlog for agent ${agentId}:`, err);
    }
};

export const triggerNextMessage = async (agentId: string) => {
    await processAgentBacklog(agentId);
};


export const broadcastMessageStatus = async (userId: string, messageId: string, chatId: string, status: string) => {
    const conn = userConnections.get(userId);
    if (conn) {
        conn.raw.write(`data: ${JSON.stringify({
            type: 'message_status',
            messageId,
            chatId,
            status
        })}\n\n`);
    }
};

const broadcastAgentStatus = async (agentId: string, isConnected: boolean) => {
    try {
        // Find users who have access to this agent
        const agentUsers = await prisma.agentUser.findMany({
            where: { agentId }
        });

        // Also notify the owner
        const agent = await prisma.agent.findUnique({
            where: { id: agentId },
            select: { userId: true }
        });

        const userIds = new Set<string>();
        agentUsers.forEach(au => userIds.add(au.userId));
        if (agent) userIds.add(agent.userId);

        userIds.forEach(uid => {
            const conn = userConnections.get(uid);
            if (conn) {
                conn.raw.write(`data: ${JSON.stringify({
                    type: 'agent_status',
                    agentId,
                    isConnected
                })}\n\n`);
            }
        });
    } catch (err) {
        console.error('Error broadcasting agent status:', err);
    }
};

export const userSse = async (req: FastifyRequest<{ Querystring: { token: string } }>, reply: FastifyReply) => {
    const { token } = req.query;
    if (!token) {
        reply.code(400).send('Missing token');
        return;
    }

    try {
        const decoded: any = verifyToken(token);
        const userId = decoded.user?.id;

        if (!userId) {
            reply.code(401).send('Invalid token');
            return;
        }

        // Headers
        reply.raw.setHeader('Content-Type', 'text/event-stream');
        reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
        reply.raw.setHeader('Connection', 'keep-alive');
        reply.raw.setHeader('Content-Encoding', 'none');
        reply.raw.setHeader('Access-Control-Allow-Origin', '*');
        reply.raw.setHeader('X-Accel-Buffering', 'no');

        userConnections.set(userId, reply);
        console.log(`User connected: ${userId}`);

        // Send initial agent statuses
        const myAgents = await prisma.agentUser.findMany({
            where: { userId },
            select: { agentId: true }
        });
        const ownedAgents = await prisma.agent.findMany({
            where: { userId },
            select: { id: true }
        });

        const allAgentIds = new Set([...myAgents.map(a => a.agentId), ...ownedAgents.map(a => a.id)]);

        allAgentIds.forEach(aid => {
            const isConnected = isAgentConnected(aid);
            reply.raw.write(`data: ${JSON.stringify({
                type: 'agent_status',
                agentId: aid,
                isConnected
            })}\n\n`);
        });

        const interval = setInterval(() => {
            reply.raw.write(': ping\n\n');
        }, 30000);

        req.raw.on('close', () => {
            clearInterval(interval);
            console.log(`User disconnected: ${userId}`);
            userConnections.delete(userId);
        });

        reply.hijack();
        reply.raw.write(':' + ' '.repeat(2048) + '\n\n'); // 2KB padding for Cloudflare
        reply.raw.write(': connected\n\n');

    } catch (err) {
        if (!reply.raw.headersSent) {
            reply.code(401).send('Invalid token');
        }
    }
};

export const agentSse = async (req: FastifyRequest, reply: FastifyReply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        reply.code(401).send('No token');
        return;
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded: any = verifyToken(token);
        const agentId = decoded.agent?.id;

        if (!agentId) {
            reply.code(401).send('Invalid agent token');
            return;
        }

        reply.raw.setHeader('Content-Type', 'text/event-stream');
        reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
        reply.raw.setHeader('Content-Encoding', 'none');
        reply.raw.setHeader('Access-Control-Allow-Origin', '*');
        reply.raw.setHeader('X-Accel-Buffering', 'no');

        // Manage multi-connection
        if (!agentConnections.has(agentId)) {
            agentConnections.set(agentId, []);
            agentIndices.set(agentId, 0);
        }
        const conns = agentConnections.get(agentId)!;
        conns.push(reply);

        console.log(`Agent connected: ${agentId}. Total instances: ${conns.length}`);

        // Broadcast online status if this is the first connection
        if (conns.length === 1) {
            await broadcastAgentStatus(agentId, true);
        }

        const interval = setInterval(() => {
            reply.raw.write(': ping\n\n');
        }, 30000);

        req.raw.on('close', async () => {
            clearInterval(interval);
            const currentConns = agentConnections.get(agentId);
            if (currentConns) {
                const index = currentConns.indexOf(reply);
                if (index > -1) {
                    currentConns.splice(index, 1);
                }
                console.log(`Agent disconnected: ${agentId}. Remaining instances: ${currentConns.length}`);
                if (currentConns.length === 0) {
                    agentConnections.delete(agentId);
                    agentIndices.delete(agentId);
                    // Broadcast offline status
                    await broadcastAgentStatus(agentId, false);
                }
            }
        });

        reply.hijack();
        reply.raw.write(':' + ' '.repeat(2048) + '\n\n'); // 2KB padding for Cloudflare
        reply.raw.write(': connected\n\n');

        // Process any backlog (Sequential per chat)
        await processAgentBacklog(agentId, reply);

    } catch (err) {
        if (!reply.raw.headersSent) {
            reply.code(401).send('Invalid token');
        }
    }
}
