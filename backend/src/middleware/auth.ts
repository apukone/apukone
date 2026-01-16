import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../utils/token';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Augment FastifyRequest
declare module 'fastify' {
    interface FastifyRequest {
        user?: {
            id: string;
            username: string;
            email: string;
            role: string;
        }
    }
}

export const verifyAuth = async (req: FastifyRequest, reply: FastifyReply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return reply.status(401).send({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded: any = verifyToken(token);
        // Verify user exists in DB? Optional but safer.
        // For now trust the token as it's signed.

        // Check if it's a user token
        if (decoded.user) {
            req.user = decoded.user;
        } else {
            return reply.status(401).send({ error: 'Invalid token type' });
        }
    } catch (err) {
        return reply.status(401).send({ error: 'Invalid token' });
    }
};

export const verifyAdmin = async (req: FastifyRequest, reply: FastifyReply) => {
    await verifyAuth(req, reply);
    if (reply.sent) return;

    if (req.user?.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Forbidden: Admin access required' });
    }
};
