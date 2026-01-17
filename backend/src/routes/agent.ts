import { FastifyInstance } from 'fastify';
import * as agentController from '../controllers/agent';
import { verifyAuth } from '../middleware/auth'; // We need to create this

import * as statsController from '../controllers/stats';

export default async function agentRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', verifyAuth); // Protect all routes

    fastify.post('/createAgent', agentController.createAgent);
    fastify.post('/getAllAgents', agentController.getAllAgents);
    fastify.post('/deleteAgent', agentController.deleteAgent);
    fastify.post('/shareAgent', agentController.shareAgent);
    fastify.post('/unshareAgent', agentController.unshareAgent);
    fastify.post('/getSharedUsers', agentController.getSharedUsers);

    fastify.get('/:id/statistics', statsController.getAgentStats);
}
