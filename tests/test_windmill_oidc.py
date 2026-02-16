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

def test_windmill_oidc_login():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(ignore_https_errors=True)
        page = context.new_page()
        page.set_default_timeout(30000)

        try:
            # Set up console log forwarding
            page.on("console", lambda msg: print(f"BROWSER ({msg.type}): {msg.text}"))

            target_url = f"https://windmill.{BASE_DOMAIN}/"
            print(f"Navigating to Windmill: {target_url}")

            page.goto(target_url)
            page.wait_for_load_state("networkidle")

            # Windmill login page should show SSO options
            # Click the Authentik SSO login button
            print("Looking for Authentik SSO login button...")
            try:
                # Windmill shows SSO buttons with the provider name
                auth_btn = page.locator("button:has-text('Authentik'), a:has-text('Authentik')").first
                auth_btn.wait_for(state="visible", timeout=15000)
                print("Clicking Authentik SSO button...")
                auth_btn.click()
            except Exception:
                print(f"Authentik SSO button not found. Current URL: {page.url}")
                page.screenshot(path="tests/debug/windmill_no_sso_button.png")
                with open("tests/debug/windmill_login_page.html", "w", encoding="utf-8") as f:
                    f.write(page.content())
                raise Exception("Authentik SSO button missing on Windmill login page")

            # Authentik Login Page (using shared helper)
            page.wait_for_load_state("networkidle")
            if not perform_authentik_login(page, ADMIN_EMAIL, ADMIN_PASSWORD):
                raise Exception("Authentik login failed")

            # Wait for redirect back to Windmill
            print("Waiting for redirect back to Windmill...")
            expect(page).to_have_url(re.compile(f".*windmill\\.{BASE_DOMAIN}.*"), timeout=60000)
            page.wait_for_load_state("networkidle")

            # Verify we landed in a Windmill workspace
            print("Verifying Windmill workspace access...")
            # Windmill workspace shows navigation items like Runs, Scripts, Flows, Schedules
            workspace_loaded = False
            for indicator in ["Runs", "Scripts", "Flows", "Schedules", "Home"]:
                try:
                    page.wait_for_selector(f"text={indicator}", timeout=15000)
                    print(f"Found workspace indicator: '{indicator}'")
                    workspace_loaded = True
                    break
                except Exception:
                    continue

            if not workspace_loaded:
                print(f"No workspace indicators found. Current URL: {page.url}")
                page.screenshot(path="tests/debug/windmill_no_workspace.png")
                with open("tests/debug/windmill_post_login.html", "w", encoding="utf-8") as f:
                    f.write(page.content())
                raise Exception("Windmill workspace not loaded after login")

            print("Successfully logged into Windmill via OIDC!")

        except Exception as e:
            print(f"Test failed: {e}")
            os.makedirs("tests/debug", exist_ok=True)
            page.screenshot(path="tests/debug/windmill_login_failure.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    test_windmill_oidc_login()
