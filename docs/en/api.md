# API Reference

List of all backend API endpoints.

## Authentication (`/api/auth`)

- `POST /register`: Register a new user (Admin only).
- `POST /login`: Log in and retrieve JWT token.

## Agents (`/api/agents`)

- `GET /`: List all agents.
- `POST /`: Create a new agent.
- `DELETE /:id`: Delete an agent.
- `POST /share`: Share agent with a user (`{ agentId, username }`).
- `POST /unshare`: Revoke share (`{ agentId, userId }`).
- `POST /shared-users`: List users who have access to the agent.

## Inference (`/api/inference`)

API for agent utilization.

- `POST /finalize`: Mark message processing as complete and send final response. triggers next message in queue.

## Chat (`/api/chat`)

- `POST /`: Start a new conversation.
- `GET /:id/messages`: Retrieve message history.
