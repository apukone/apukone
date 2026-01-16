import { FastifyInstance } from 'fastify';
import * as sseController from '../controllers/sse';

export default async function sseRoutes(fastify: FastifyInstance) {
    fastify.get('/users/results', sseController.userSse);
    fastify.get('/agents/messages', sseController.agentSse);
    // Note: agents request also uses /api/agents/messages? or just /api/agents/messages
    // original: /api/agents/messages
}
