import { FastifyInstance } from 'fastify';
import * as chatController from '../controllers/chat';
import { verifyAuth } from '../middleware/auth';

export default async function chatRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', verifyAuth);

    fastify.post('/getAllChats', chatController.getAllChats);
    fastify.post('/createChat', chatController.createChat);
    fastify.post('/sendMessage', chatController.sendMessage);
    fastify.post('/getAllMessages', chatController.getAllMessages);
    fastify.post('/deleteChat', chatController.deleteChat);
}
// Original getAllMessages used req.body.chatId, so POST is appropriate or GET with query params.
// Original function: "functions/src/main/chat/message/getAll.ts" -> req.body.chatId
// So I will stick to POST '/messages' to match client expectations if they send body, or change to GET with params.
// The user said "unify", so I can improve it, but simplest migration is keeping method roughly same.
// However, typically "getAllMessages" checks "req.body.chatId". GET requests with body are rare/bad practice.
// I will keep it as POST for now to ensure compatibility if client sends body.
