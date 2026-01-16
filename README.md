# Apukone

**Apukone** is an LLM orchestration platform designed to distribute inference workloads to self-hosted systems. It enables users to build, deploy, and share AI agents within their network, creating a collaborative ecosystem for distributed AI computing.

## Architecture

This project is organized as a monorepo:

*   **`backend/`**: A Node.js backend using Fastify, Prisma, and PostgreSQL. Handles authentication, data management, and integrations.
*   **`ui/`**: A modern web interface built with Angular.
*   **`docs/`**: Project documentation.

## Requirements

*   Docker (for running the database and Redis)
*   Node.js (v18+ recommended) & npm

## Getting Started

### Local Development

1.  **Start Infrastructure**:
    Run the databases (PostgreSQL and Redis) using Docker:
    ```bash
    docker-compose up -d
    ```

2.  **Backend Setup**:
    ```bash
    cd backend
    npm install
    # Set up the database schema
    npx prisma migrate dev
    # Start the backend server
    npm run dev
    ```

3.  **UI Setup**:
    ```bash
    cd ui
    npm install
    # Start the development server
    npm start
    ```
    The UI will be available at `http://localhost:4200`.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is licensed under the **GNU General Public License v3.0**. See the [LICENSE](./LICENSE) file for details.