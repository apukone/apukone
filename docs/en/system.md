# System

Technical architecture and technologies used.

## Technologies

- **Frontend**: Angular 19, Angular Material.
- **Backend**: Node.js, Fastify (HTTP/1.1 & HTTP/2).
- **Database**: PostgreSQL (Prisma ORM).
- **Cache/Queue**: Redis (Pub/Sub, Streams).
- **Infrastructure**: Docker, Docker Compose.

## Protocols

- **HTTP/1.1**: User Interface (UI) and public API.
- **HTTP/2**: Dedicated server (`port: 8081`) for persistent agent connections. Enables bidirectional streaming and instant message delivery without polling.
- **SSE (Server-Sent Events)**: Real-time UI updates.
- **WebSocket**: (Not currently used, replaced by HTTP/2 and SSE).
