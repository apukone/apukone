import os
import json

base_domain = os.environ.get("BASE_DOMAIN", "localhost")
client_id = os.environ.get("WINDMILL_OIDC_CLIENT_ID")
client_secret = os.environ.get("WINDMILL_OIDC_CLIENT_SECRET")

oauth_config = {
    "Authentik": {
        "id": client_id,
        "secret": client_secret,
        "login_config": {
            "auth_url": f"https://sso.{base_domain}/application/o/authorize/",
            "token_url": "http://apukone-authentik-server:9000/application/o/token/",
            "userinfo_url": "http://apukone-authentik-server:9000/application/o/userinfo/",
            "jwks_url": "http://apukone-authentik-server:9000/application/o/windmill/jwks/"
        },
        "scopes": ["openid", "email", "profile", "groups"]
    }
}

with open("/usr/src/app/oauth.json", "w") as f:
    json.dump(oauth_config, f, indent=2)

print("Generated /usr/src/app/oauth.json")
