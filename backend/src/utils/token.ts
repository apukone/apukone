import jwt from 'jsonwebtoken';
import { User, Agent } from '@prisma/client';

if (!process.env.TOKEN_SECRET) {
    throw new Error('TOKEN_SECRET environment variable is not defined');
}
const TOKEN_SECRET = process.env.TOKEN_SECRET;

export const signToken = (payload: object) => {
    return jwt.sign(payload, TOKEN_SECRET);
};

export const verifyToken = (token: string) => {
    return jwt.verify(token, TOKEN_SECRET);
};

export const getUserToken = (user: User) => {
    return signToken({ user: { id: user.id, username: user.username, email: user.email, role: user.role } });
};

export const getAgentToken = (agent: Agent) => {
    return signToken({ agent: { id: agent.id } });
};
