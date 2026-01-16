import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { getUserToken } from '../utils/token';

const prisma = new PrismaClient();

// Signup removed as per requirements.

export const register = async (req: FastifyRequest<{ Body: { username: string; password: string; email: string; role?: string } }>, reply: FastifyReply) => {
    const { username, password, email, role } = req.body;

    if (!username || !password || !email) {
        return reply.status(400).send({ error: 'Username, password, email are required' });
    }

    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return reply.status(403).send({ error: 'Only admins can create new users.' });
        }

        const passwordDigest = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username,
                email,
                passwordDigest,
                role: (role === 'ADMIN' ? 'ADMIN' : 'USER') as any
            }
        });

        // We don't necessarily need to return a token here since admin is creating the account
        return reply.send({ message: 'User created successfully', user: { id: user.id, username: user.username, role: user.role } });
    } catch (err: any) {
        console.error(err);
        return reply.status(500).send({ error: err.message || 'Internal Server Error' });
    }
};

export const getAllUsers = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                role: true
            }
        });
        return reply.send(users);
    } catch (err: any) {
        console.error(err);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};

export const deleteUserById = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = req.params;
    try {
        // Prevent deleting yourself? 
        if (req.user?.id === id) {
            return reply.status(400).send({ error: 'You cannot delete your own account.' });
        }

        await prisma.user.delete({ where: { id } });
        return reply.send({ message: 'User deleted successfully' });
    } catch (err: any) {
        console.error(err);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};

export const login = async (req: FastifyRequest<{ Body: { username: string; password: string } }>, reply: FastifyReply) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return reply.status(400).send({ error: 'Username and password are required' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
            return reply.status(401).send({ error: 'Wrong id or password' });
        }

        const match = await bcrypt.compare(password, user.passwordDigest);
        if (!match) {
            return reply.status(401).send({ error: 'Wrong id or password' });
        }

        const token = getUserToken(user);
        return reply.send({ token });
    } catch (err) {
        console.error(err);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};

export const getUser = async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });
        return reply.send(user);
    } catch (err) {
        console.error(err);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};

export const deleteUser = async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    try {
        await prisma.user.delete({ where: { id: req.user.id } });
        return reply.send(true);
    } catch (err) {
        console.error(err);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};

export const changePassword = async (req: FastifyRequest<{ Body: { password: string } }>, reply: FastifyReply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { password } = req.body;

    if (!password) {
        return reply.status(400).send({ error: 'Password is required' });
    }

    try {
        const passwordDigest = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { id: req.user.id },
            data: { passwordDigest }
        });
        return reply.send({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};
