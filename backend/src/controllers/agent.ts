import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { getAgentToken } from '../utils/token';
import { isAgentConnected } from './sse';

const prisma = new PrismaClient();

export const createAgent = async (req: FastifyRequest<{ Body: { title: string; description: string } }>, reply: FastifyReply) => {
    const { title, description } = req.body;
    const user = req.user; // We need to add a decorator/middleware to populate this

    if (!user) {
        return reply.status(401).send({ error: 'Unauthorized' });
    }

    if (!title || !description) {
        return reply.status(400).send({ error: 'Title and description required' });
    }

    try {
        const agent = await prisma.$transaction(async (tx) => {
            // Create agent
            const newAgent = await tx.agent.create({
                data: {
                    userId: user.id,
                    title,
                    description,
                    token: '' // Placeholder, will update
                }
            });

            // Generate token
            const token = getAgentToken(newAgent);

            // Update agent with token
            const updatedAgent = await tx.agent.update({
                where: { id: newAgent.id },
                data: { token }
            });

            // Create AgentUser link
            await tx.agentUser.create({
                data: {
                    userId: user.id,
                    agentId: newAgent.id
                }
            });

            return updatedAgent;
        });

        return reply.send(agent);

    } catch (err) {
        console.error(err);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};

export const getAllAgents = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user;
    if (!user) return reply.status(401).send({ error: 'Unauthorized' });

    try {
        const agentUsers = await prisma.agentUser.findMany({
            where: { userId: user.id },
            include: { agent: true }
        });

        const agents = agentUsers.map(au => ({
            id: au.agent.id,
            title: au.agent.title,
            description: au.agent.description,
            isOwner: au.agent.userId === user.id,
            token: au.agent.userId === user.id ? au.agent.token : '',
            isConnected: isAgentConnected(au.agent.id)
        }));

        return reply.send(agents);
    } catch (err) {
        console.error(err);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};

export const deleteAgent = async (req: FastifyRequest<{ Body: { agentId: string } }>, reply: FastifyReply) => {
    const user = req.user;
    const { agentId: id } = req.body;

    if (!user) return reply.status(401).send({ error: 'Unauthorized' });

    try {
        const agent = await prisma.agent.findUnique({ where: { id } });
        if (!agent) return reply.status(404).send({ error: 'Agent not found' });

        if (agent.userId !== user.id) {
            return reply.status(403).send({ error: 'Not authorized to delete this agent' });
        }

        await prisma.agent.delete({ where: { id } });
        return reply.send(true);
    } catch (err) {
        console.error(err);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};

export const shareAgent = async (req: FastifyRequest<{ Body: { agentId: string; username: string } }>, reply: FastifyReply) => {
    const user = req.user;
    const { agentId, username } = req.body;

    if (!user) return reply.status(401).send({ error: 'Unauthorized' });

    try {
        const agent = await prisma.agent.findUnique({ where: { id: agentId } });
        if (!agent) return reply.status(404).send({ error: 'Agent not found' });
        if (agent.userId !== user.id) return reply.status(403).send({ error: 'Not authorized' });

        const targetUser = await prisma.user.findUnique({ where: { username } });
        if (!targetUser) return reply.status(404).send({ error: 'User not found' });

        // Check if already shared
        const existing = await prisma.agentUser.findFirst({
            where: { agentId, userId: targetUser.id }
        });

        if (existing) return reply.status(400).send({ error: 'Agent already shared with this user' });

        await prisma.agentUser.create({
            data: {
                agentId,
                userId: targetUser.id
            }
        });

        return reply.send({ success: true });
    } catch (err) {
        console.error(err);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};

export const unshareAgent = async (req: FastifyRequest<{ Body: { agentId: string; userId: string } }>, reply: FastifyReply) => {
    const user = req.user;
    const { agentId, userId } = req.body;

    if (!user) return reply.status(401).send({ error: 'Unauthorized' });

    try {
        const agent = await prisma.agent.findUnique({ where: { id: agentId } });
        if (!agent) return reply.status(404).send({ error: 'Agent not found' });

        // Logic: 
        // 1. Owner can unshare anyone.
        // 2. Shared user can unshare themselves.

        const isOwner = agent.userId === user.id;
        const isSelfUnshare = userId === user.id;

        if (!isOwner && !isSelfUnshare) {
            return reply.status(403).send({ error: 'Not authorized to unshare this user' });
        }

        if (isOwner && isSelfUnshare) {
            return reply.status(400).send({ error: 'Owner cannot unshare themselves from their own agent (delete the agent instead)' });
        }

        await prisma.agentUser.deleteMany({
            where: { agentId, userId }
        });

        return reply.send({ success: true });
    } catch (err) {
        console.error(err);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};

export const getSharedUsers = async (req: FastifyRequest<{ Body: { agentId: string } }>, reply: FastifyReply) => {
    const user = req.user;
    const { agentId } = req.body;

    if (!user) return reply.status(401).send({ error: 'Unauthorized' });

    try {
        const agent = await prisma.agent.findUnique({ where: { id: agentId } });
        if (!agent) return reply.status(404).send({ error: 'Agent not found' });
        if (agent.userId !== user.id) return reply.status(403).send({ error: 'Not authorized' });

        const sharedUsers = await prisma.agentUser.findMany({
            where: {
                agentId,
                userId: { not: user.id }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                }
            }
        });

        return reply.send(sharedUsers.map(su => su.user));
    } catch (err) {
        console.error(err);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};
