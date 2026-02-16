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

def test_openwebui_oidc_login():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(ignore_https_errors=True)
        page = context.new_page()
        page.set_default_timeout(30000)
        try:
            # Set up console log and error forwarding
            page.on("console", lambda msg: print(f"BROWSER ({msg.type}): {msg.text}"))
            page.on("request", lambda r: print(f"REQ: {r.method} {r.url}"))
            page.on("requestfailed", lambda r: print(f"FAILED REQUEST: {r.url}"))
            
            target_url = f"https://chat.{BASE_DOMAIN}/"
            print(f"Navigating to OpenWebUI: {target_url}")
            
            page.goto(target_url)
            page.wait_for_load_state("networkidle")

            # Force hide the splash screen if it's blocking
            page.add_style_tag(content="#splash-screen { display: none !important; } .splash { display: none !important; }")
            time.sleep(1)

            # Check if already logged in or needs provider selection
            # Handle Splash Screen / Get Started
            splash_btn = page.locator("button[aria-labelledby='get-started']")
            if splash_btn.is_visible():
                print("Splash button found. Clicking...")
                splash_btn.click()
                time.sleep(1)
            elif page.locator("text='Get started'").is_visible():
                 print("Splash text found. Clicking...")
                 page.click("text='Get started'")
                 time.sleep(1)

            # Verification: If splash is still there, NUKE IT.
            # The splash sets overflow: hidden which prevents scrolling to the auth button.
            page.evaluate("""
                () => {
                    const splash = document.querySelector('#splash-screen') || document.querySelector('.image'); 
                    if (splash) splash.remove();
                    document.documentElement.style.overflowY = 'auto';
                    document.body.style.overflowY = 'auto';
                }
            """)
            time.sleep(1)

            # Wait for Authentik button
            try:
                page.wait_for_selector("button:has-text('Continue with Authentik')", timeout=10000)
                print("Clicking 'Continue with Authentik' (forcing)...")
                page.click("button:has-text('Continue with Authentik')", force=True)
            except Exception:
                print(f"Authentik button not found or not clickable. Current URL: {page.url}")
                page.screenshot(path="tests/debug/openwebui_no_auth_button.png")
                # Dump HTML again just in case
                with open("tests/debug/openwebui_failure_content.html", "w", encoding="utf-8") as f:
                    f.write(page.content())
                raise Exception("Authentik button missing")

            # Authentik Login Page (using helper)
            # Credentials - Using akadmin as fallback since initial admin is broken
            # Authentik Login Page (using helper)
            email = ADMIN_EMAIL 
            password = ADMIN_PASSWORD
            
            if not perform_authentik_login(page, email, password):
                 raise Exception("Authentik login failed")

            # Wait for redirect back to OpenWebUI
            print("Waiting for OIDC callback processing...")
            
            # OpenWebUI might land on /auth?redirect=/ before finally landing on /
            # If we hit an error page, try to manually go to / as the session might be set
            for _ in range(5):
                curr_url = page.url
                print(f"Current URL during redirect: {curr_url}")
                if "chrome-error" in curr_url or "chromewebdata" in curr_url:
                    print("Error page detected, attempting manual navigation to chat root...")
                    page.goto(f"https://chat.{BASE_DOMAIN}/", wait_until="networkidle")
                
                # Handle "What's New" Modal if it appears
                try:
                    okay_btn_selector = "button:has-text('Okay, Let\'s Go!')"
                    # Try both specific and generic dismissal
                    if page.locator(okay_btn_selector).is_visible():
                        print("Changelog modal detected. Clicking 'Okay, Let's Go!'...")
                        page.click(okay_btn_selector)
                        time.sleep(1)
                    
                    # Also try the 'X' button if it's there
                    close_btn = page.locator("button[aria-label='Close']")
                    if close_btn.is_visible():
                        print("Modal close button detected. Clicking...")
                        close_btn.click()
                        time.sleep(1)
                except:
                    pass

                # If we see dashboard elements in content, we have arrived
                if "New Chat" in page.content() or ".chat-container" in page.content():
                    print("Dashboard elements found in content! Login successful.")
                    break
                
                time.sleep(2)

            # Dismiss any modals if possible, but don't block on them
            print("Attempting to dismiss any modals...")
            try:
                # Click 'Okay, Let's Go!' or close button if they exist
                page.locator("button:has-text('Okay, Let\'s Go!')").click(timeout=5000)
                time.sleep(1)
            except:
                pass
            try:
                page.locator("button[aria-label='Close']").click(timeout=5000)
                time.sleep(1)
            except:
                pass

            # Verify Admin Access by direct navigation - this is the strongest proof of admin status
            print("Verifying Admin Access via direct navigation to /admin...")
            try: 
                # OpenWebUI admin panel is at /admin
                page.goto(f"https://chat.{BASE_DOMAIN}/admin", wait_until="networkidle")
                # The screenshot shows "Users" is definitely there
                page.wait_for_selector("text=Users", timeout=15000)
                print("Successfully verified Admin access in OpenWebUI!")
                print("Successfully logged into OpenWebUI via OIDC!")
            except Exception as e:
                print(f"Admin verification failed at /admin: {e}")
                page.screenshot(path="tests/debug/openwebui_admin_failure.png")
                # If we can see 'New Chat' but can't see admin, we are a regular user
                if "New Chat" in page.content() or ".chat-container" in page.content():
                    print("User logged in but does NOT have Admin access.")
                    raise Exception("Regular user access verified, but Admin access denied.")
                else:
                    print("Login itself seems to have failed or timed out.")
                    raise e
                if "Get started" in page.content() or "Sign In" in page.content():
                    print("Landed back on login page. OIDC flow failed to establish session.")
                    raise Exception("OIDC flow failed - back on login page")
                else:
                    print(f"Unknown state. URL: {page.url}")
                    page.screenshot(path="tests/debug/openwebui_unknown_state.png")
                    raise Exception("OIDC flow timed out in unknown state")

        except Exception as e:
            print(f"Test failed: {e}")
            page.screenshot(path="tests/debug/openwebui_login_failure.png")
            with open("tests/debug/openwebui_failure_content.html", "w", encoding="utf-8") as f:
                f.write(page.content())
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    test_openwebui_oidc_login()
