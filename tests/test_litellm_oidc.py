import os
import time
import re
from playwright.sync_api import sync_playwright, expect
from dotenv import load_dotenv
from auth_helper import perform_authentik_login

# Load environment variables
load_dotenv()

BASE_DOMAIN = os.getenv("BASE_DOMAIN", "localhost")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "password123")

def test_litellm_oidc_login():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(ignore_https_errors=True)
        page = context.new_page()
        page.set_default_timeout(30000)

        try:
            print(f"Navigating to LiteLLM UI: https://llm.{BASE_DOMAIN}/ui/")
            # Set up console log forwarding
            page.on("console", lambda msg: print(f"BROWSER ({msg.type}): {msg.text}"))
            
            page.goto(f"https://llm.{BASE_DOMAIN}/ui/")
            page.wait_for_load_state("networkidle")

            # Handle automatic redirect or manual login click
            if "flow/login" not in page.url:
                 login_btn = page.locator("text=Login")
                 if login_btn.is_visible():
                     login_btn.click()

            # Authentik Login Page (using helper)
            if not perform_authentik_login(page, ADMIN_EMAIL, ADMIN_PASSWORD):
                 raise Exception("Authentik login failed")

            # Wait for redirect back to LiteLLM
            print("Waiting for redirect back to LiteLLM...")
            # Verify URL
            expect(page).to_have_url(re.compile(f".*llm\\.{BASE_DOMAIN}.*"), timeout=60000)
            
            # Verify we are in the dashboard
            print("Waiting for Dashboard indicators...")
            page.wait_for_selector("text=Virtual Keys", timeout=60000)
            
            # Verify Admin Access
            print("Verifying Admin Access...")
            # 'Settings' usually indicates admin/configuration access in LiteLLM UI
            page.wait_for_selector("text=Settings", timeout=10000)
            
            print("Successfully logged into LiteLLM via OIDC!")

        except Exception as e:
            print(f"Test failed: {e}")
            page.screenshot(path="tests/debug/litellm_login_failure.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    test_litellm_oidc_login()
