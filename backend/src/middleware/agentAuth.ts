import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../utils/token';

// Augment FastifyRequest
declare module 'fastify' {
    interface FastifyRequest {
        agent?: {
            id: string;
        }
    }
}

export const verifyAgentAuth = async (req: FastifyRequest, reply: FastifyReply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return reply.status(401).send({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded: any = verifyToken(token);

        // Check if it's an agent token
        if (decoded.agent) {
            req.agent = decoded.agent;
        } else {
            return reply.status(401).send({ error: 'Invalid token type' });
        }
    } catch (err) {
        return reply.status(401).send({ error: 'Invalid token' });
    }
};
