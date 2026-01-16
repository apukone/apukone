# Installation

This section details how to install and configure Apukone for both local development and production.

## Requirements

- **Node.js**: v18 or newer
- **Docker**: For running the system and databases

## Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/apukone/apukone.git
   cd apukone
   ```

2. Start services with Docker Compose:
   ```bash
   docker-compose up -d
   ```

3. The service is now running at `http://localhost:8080`.

## Production setup

For production, we recommend using Caddy as a reverse proxy for HTTP/2 support and automatic SSL certificates.
