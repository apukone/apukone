#!/usr/bin/env bash
#
# Apukone - Secret Generation Script
# Generates random secrets and ensures .env is populated
#
# Usage: ./scripts/generate-secrets.sh
#
set -euo pipefail

# Values
MYSETTINGS_FILE="mysettings.env"
ENV_FILE=".env"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# Check if .env exists, if not create from mysettings.env
if [[ ! -f "$ENV_FILE" ]]; then
    if [[ -f "$MYSETTINGS_FILE" ]]; then
        log_info "Creating $ENV_FILE from $MYSETTINGS_FILE..."
        cp "$MYSETTINGS_FILE" "$ENV_FILE"
    else
        log_warn "$MYSETTINGS_FILE not found. Creating empty $ENV_FILE."
        touch "$ENV_FILE"
    fi
else
    log_info "$ENV_FILE already exists. Merging values from $MYSETTINGS_FILE..."
fi

# Merge mysettings.env values into .env (add any keys missing from .env)
if [[ -f "$MYSETTINGS_FILE" ]]; then
    while IFS= read -r line || [[ -n "$line" ]]; do
        # Skip empty lines and comments
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        # Extract key
        local_key="${line%%=*}"
        # Add to .env if key is not already present
        if ! grep -q "^${local_key}=" "$ENV_FILE" 2>/dev/null; then
            echo "$line" >> "$ENV_FILE"
            log_info "Merged ${local_key} from $MYSETTINGS_FILE"
        fi
    done < "$MYSETTINGS_FILE"
fi

# Ensure file ends with a newline before appending
if [[ -s "$ENV_FILE" ]] && [[ "$(tail -c 1 "$ENV_FILE")" != "" ]]; then
    echo "" >> "$ENV_FILE"
fi

# Function to generate secrets
generate_hex() { openssl rand -hex "$1"; }
generate_password() { openssl rand -base64 24 | tr -d '/+=' | head -c 32; }

# Helper to check and append env var
check_and_append() {
    local key=$1
    local value_cmd=$2
    
    # Check if key exists in .env
    if ! grep -q "^${key}=" "$ENV_FILE"; then
        # Generate value
        local value
        value=$(eval "$value_cmd")
        
        # Append to .env
        echo "${key}=${value}" >> "$ENV_FILE"
        echo "Generated ${key}"
    fi
}

log_info "Generating missing secrets..."

# Add header if file was just created (optional, but keeps it tidy if we append)
if [[ ! -s "$ENV_FILE" ]]; then
    echo "# Auto-generated secrets" >> "$ENV_FILE"
fi

# --- Authentik ---
check_and_append "AUTHENTIK_SECRET_KEY" "generate_hex 64"
check_and_append "AUTHENTIK_POSTGRES_PASSWORD" "generate_password"
check_and_append "AUTHENTIK_BOOTSTRAP_TOKEN" "generate_hex 32"

# --- LiteLLM ---
check_and_append "LITELLM_MASTER_KEY" "generate_password"
check_and_append "LITELLM_POSTGRES_PASSWORD" "generate_password"
check_and_append "LITELLM_OIDC_CLIENT_ID" "generate_hex 10"  # 20 chars
check_and_append "LITELLM_OIDC_CLIENT_SECRET" "generate_hex 16" # 32 chars

# --- OpenWebUI ---
check_and_append "OPENWEBUI_OIDC_CLIENT_ID" "generate_hex 10"
check_and_append "OPENWEBUI_OIDC_CLIENT_SECRET" "generate_hex 16"
check_and_append "WEBUI_SECRET_KEY" "generate_hex 32"

# --- Windmill ---
check_and_append "WINDMILL_OIDC_CLIENT_ID" "generate_hex 10"
check_and_append "WINDMILL_OIDC_CLIENT_SECRET" "generate_hex 16"
check_and_append "WINDMILL_POSTGRES_PASSWORD" "generate_password"

# --- Production Readiness: OIDC Discovery ---
log_info "Generating dynamic OIDC configuration..."
# Load BASE_DOMAIN from .env to ensure we have the latest value
PLATFORM_DOMAIN=$(grep "^BASE_DOMAIN=" "$ENV_FILE" | cut -d'=' -f2)
if [[ -z "$PLATFORM_DOMAIN" ]]; then
    log_warn "BASE_DOMAIN not found in $ENV_FILE. Using 'localhost' for OIDC configuration."
    PLATFORM_DOMAIN="localhost"
fi

OIDC_TEMPLATE="services/openwebui/config/oidc/openid-configuration.json.template"
OIDC_TARGET="services/openwebui/config/oidc/openid-configuration.json"

if [[ -f "$OIDC_TEMPLATE" ]]; then
    # Use sed to replace {{BASE_DOMAIN}} with actual domain
    sed "s/{{BASE_DOMAIN}}/${PLATFORM_DOMAIN}/g" "$OIDC_TEMPLATE" > "$OIDC_TARGET"
    log_success "Generated $OIDC_TARGET (Domain: $PLATFORM_DOMAIN)"
else
    log_warn "OIDC template $OIDC_TEMPLATE not found. Skipping generation."
fi

log_success "Secrets generation complete. Configuration is ready in $ENV_FILE."
log_info "You can now run: docker compose up -d"
