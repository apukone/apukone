# Apukone

A simple and robust Docker Compose platform for AI orchestration, featuring central identity management ([Authentik](https://goauthentik.io)), a unified chat interface ([OpenWebUI](https://openwebui.com)), an AI gateway ([LiteLLM](https://litellm.ai)), and background tasks ([Windmill](https://windmill.dev)).

## 🚀 Quick Start

The platform is designed for a simple, streamlined setup using only Docker Compose and environment files. No complex installation scripts are required.

```bash
# 1. Clone the repository
git clone https://github.com/apukone/apukone.git
cd apukone

# 2. Configure your environment
cp mysettings.env.example mysettings.env
# Edit mysettings.env to add your domain, admin email, and API keys
nano mysettings.env

# 3. Generate secure secrets
# This merges your settings into .env and generates all required secrets automatically
./scripts/generate-secrets.sh

# 4. Launch the platform
docker compose up --build -d
```

## 📦 Core Services

| Service | URL | Description |
|---------|-----|-------------|
| **[Authentik](https://goauthentik.io)** | `sso.{domain}` | Identity provider (OIDC/SSO) |
| **[OpenWebUI](https://openwebui.com)** | `chat.{domain}` | Unified AI chat interface |
| **[LiteLLM](https://litellm.ai)** | `llm.{domain}` | AI gateway & model management |
| **[Windmill](https://windmill.dev)** | `windmill.{domain}` | Background task orchestration |

## 🛠️ Prerequisites

- **Docker** and Docker Compose v2.20+
- **Domain** with subdomains (sso, chat, llm, windmill) pointing to your server IP.

## 🔐 Administrative Access

The platform uses an **email-based admin strategy**. The user defined as `ADMIN_EMAIL` in your `mysettings.env` will automatically be granted administrative privileges in OpenWebUI, LiteLLM, and Windmill upon their first OIDC login.

1. Login to `sso.{domain}` using the `ADMIN_EMAIL` and `ADMIN_PASSWORD` defined in your settings.
2. Access `chat.{domain}`, `llm.{domain}`, and `windmill.{domain}` via the "Continue with Authentik" buttons.
3. Your admin permissions are synchronized automatically across all services.

## 🧪 Automation Tests

We prioritize stability and reliability. The platform includes a comprehensive test suite to verify OIDC flows and administrative access.

```bash
# Set up test environment
python3 -m venv venv
source venv/bin/activate
pip install -r tests/requirements.txt
playwright install

# Run verification tests
venv/bin/python tests/test_openwebui_oidc.py
venv/bin/python tests/test_litellm_oidc.py
```

## 📂 Project Structure

- `services/`: Docker Compose configurations and service-specific settings.
- `scripts/`: Platform management scripts (secret generation).
- `tests/`: End-to-end automation tests.
- `mysettings.env`: Your primary configuration hub.

## 🔧 Useful Commands

```bash
# View all service status
docker compose ps

# Follow logs for all or specific services
docker compose logs -f
docker compose logs -f openwebui

# Restart the platform
docker compose restart

# Update the platform
git pull
./scripts/generate-secrets.sh
docker compose up -d --build
```

## 📝 License

MIT