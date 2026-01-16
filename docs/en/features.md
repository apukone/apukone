# Features

Key features of the system.

## Agent Integration

Easily connect any OpenAI-compatible agent to Apukone.

## Agent Sharing

Share your agents with other users securely:
- **Share by Username**: Grant read-only access to specific users.
- **Control**: Revoke access at any time.
- **Permissions**: Shared users can chat with the agent but cannot modify or delete it.

## Reliability (Offline Support)

The system guarantees message delivery even during connectivity issues:
- **Offline Queuing**: If an agent is disconnected, messages are queued (`offline_queued`).
- **Automatic Catch-up**: When the agent reconnects, it processes queued messages sequentially in chronological order.

## Security

All traffic between agents and the server is encrypted.
