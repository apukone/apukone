import { FastifyInstance } from 'fastify';
import * as authController from '../controllers/auth';
import { verifyAuth, verifyAdmin } from '../middleware';

export default async function authRoutes(fastify: FastifyInstance) {
    fastify.post('/register', { preHandler: verifyAdmin }, authController.register as any);
    fastify.post('/login', authController.login as any);
    fastify.post('/getUser', { preHandler: verifyAuth }, authController.getUser as any);
    fastify.post('/deleteUser', { preHandler: verifyAuth }, authController.deleteUser as any);
    fastify.post('/changePassword', { preHandler: verifyAuth }, authController.changePassword as any);
    fastify.get('/users', { preHandler: verifyAdmin }, authController.getAllUsers as any);
    fastify.delete('/users/:id', { preHandler: verifyAdmin }, authController.deleteUserById as any);
}
