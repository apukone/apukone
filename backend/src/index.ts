import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import path from 'path';
import { redis, pub, sub } from './lib/redis';
import fastifyStatic from '@fastify/static';

// Register Routes
import authRoutes from './routes/auth';
import agentRoutes from './routes/agent';
import chatRoutes from './routes/chat';
import sseRoutes from './routes/sse';
import inferenceRoutes from './routes/inference';

dotenv.config();

const prisma = new PrismaClient();

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
const PORT_HTTP2 = 8081; // Hardcoded or from env

async function registerApp(server: FastifyInstance<any, any, any, any>) {
    // Register plugins
    server.register(cors, {
        origin: process.env.CORS_ORIGIN || '*',
    });

    server.register(authRoutes, { prefix: '/api' });
    server.register(agentRoutes, { prefix: '/api' });
    server.register(chatRoutes, { prefix: '/api' });
    server.register(inferenceRoutes, { prefix: '/api/inference' });
    server.register(sseRoutes, { prefix: '/api' });

    // Serve Static Files (Docs)
    server.register(async (instance) => {
        await instance.register(fastifyStatic, {
            root: path.join(__dirname, '../docs/dist'),
            prefix: '/', // Mounted at /docs via plugin prefix
        });
    }, { prefix: '/docs' });

    // Serve Static Files (UI)
    server.register(fastifyStatic, {
        root: path.join(__dirname, '../ui/dist'),
        prefix: '/',
    });

    // SPA Fallback
    server.setNotFoundHandler((req, reply) => {
        if (req.raw.url && req.raw.url.startsWith('/api')) {
            reply.code(404).send({ error: 'Endpoint not found' });
        } else {
            reply.sendFile('index.html');
        }
    });

    // Health check
    server.get('/health', async () => {
        return { status: 'ok' };
    });
}

// HTTP/1.1 Server (for Browser UI)
const server = Fastify({
    logger: true
});

// HTTP/2 Server (for Agent)
const serverHttp2 = Fastify({
    logger: true,
    http2: true
});

// Start server
const start = async () => {
    try {
        await registerApp(server);
        await registerApp(serverHttp2);

        const address = await server.listen({ port: PORT, host: '0.0.0.0' });
        console.log(`HTTP/1.1 Server listening at ${address}`);

        const addressHttp2 = await serverHttp2.listen({ port: PORT_HTTP2, host: '0.0.0.0' });
        console.log(`HTTP/2 Server listening at ${addressHttp2}`);

        // Seed default admin
        const adminUser = await prisma.user.findFirst({
            where: { role: Role.ADMIN }
        });

        if (!adminUser) {
            console.log('No admin user found. Creating default admin...');
            const passwordDigest = await bcrypt.hash('admin', 10);
            await prisma.user.create({
                data: {
                    username: 'admin',
                    email: 'admin@apukone.local',
                    passwordDigest,
                    role: Role.ADMIN
                }
            });
            console.log('Default admin user created: admin/admin');
        }

    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
