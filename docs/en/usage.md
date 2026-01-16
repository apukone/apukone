# Usage

How to use the system.

## Logging In

Log in to the system at `/login`. Default credentials in development:
- **Username**: `admin`
- **Password**: `admin`

## Managing Agents

Navigate to **Agents** to create new agents. Each agent receives a unique API key.

## Chat

You can chat with your agents in real-time in the **Chat** view.

## Running Agents

For you to chat with an agent, it must be running on your local machine (or server) and connected to Apukone.

1. **Get Token**: Create a new agent in the UI and copy its token.
2. **Set Env Variable**: Set the token in your agent's `.env` file or as an environment variable (`AGENT_TOKEN`).

### Example Agents

We provide several starter templates:
- **[Starter Agent](https://github.com/apukone/apukone-agent-starter)**: A simple skeleton agent.
- **[NHL Agent](https://github.com/apukone/apukone-agent-nhl)**: Example using MCP tools.
- **[Weather Agent](https://github.com/apukone/apukone-agent-weather)**: Example integrating with weather services.

### Custom Agents

You can build your own agents using our npm library:
[`@apukone/client`](https://www.npmjs.com/package/@apukone/client).

```bash
npm install @apukone/client
```
