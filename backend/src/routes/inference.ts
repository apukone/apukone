import { FastifyInstance } from 'fastify';
import * as inferenceController from '../controllers/inference';

// "verifyAuth" expects a USER token.
// Agents usually authenticate differently (Agent Token).
// We should check "verifyAuthTokenAgent" from original code.
// It verifies agent token and sets `res.locals.agentId`.
// So I need a separate middleware for Agent Auth.

import { verifyAgentAuth } from '../middleware'; // Need to create this

export default async function inferenceRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', verifyAgentAuth);

    fastify.post('/finalize', inferenceController.finalizeMessage);
}
