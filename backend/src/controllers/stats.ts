import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAgentStats = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = req.params;

    try {
        const [msgCount, avgInference, totalTokens, sessions] = await Promise.all([
            prisma.message.count({ where: { agentId: id, status: 'finished' } }),
            prisma.message.aggregate({
                _avg: { inferenceTime: true },
                where: { agentId: id, status: 'finished' }
            }),
            prisma.message.aggregate({
                _sum: { tokens: true },
                where: { agentId: id, status: 'finished' }
            }),
            (prisma as any).agentSession.findMany({ where: { agentId: id } })
        ]);

        let totalConnectionTime = 0;
        const now = new Date().getTime();
        sessions.forEach((s: any) => {
            const start = new Date(s.connectedAt).getTime();
            const end = s.disconnectedAt ? new Date(s.disconnectedAt).getTime() : now;
            totalConnectionTime += (end - start);
        });

        return reply.send({
            processed_messages: msgCount,
            avg_inference_time: avgInference._avg.inferenceTime || 0,
            total_tokens: totalTokens._sum.tokens || 0,
            total_connection_time: totalConnectionTime
        });

    } catch (err) {
        console.error('Error fetching stats:', err);
        return reply.status(500).send({ error: 'Failed to fetch statistics' });
    }
};
