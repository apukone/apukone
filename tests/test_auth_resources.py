import os
import time
from playwright.sync_api import sync_playwright, expect
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BASE_DOMAIN = os.getenv("BASE_DOMAIN", "localhost")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "miika.vonbell@outlook.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "password123") # Default from env or fallback

from auth_helper import perform_authentik_login

def login_wrapper(page):
    return perform_authentik_login(page, ADMIN_EMAIL, ADMIN_PASSWORD)

def verify_applications(page):
    print("Verifying Applications...")
    page.goto(f"https://sso.{BASE_DOMAIN}/if/admin/#/core/applications")
    page.wait_for_load_state("networkidle")
    time.sleep(2) # Give UI time to render
    
    # Wait for table or list to load
    page.wait_for_selector("ak-page-header", timeout=10000)
    
    # Check for OpenWebUI
    found_owui = page.get_by_text("OpenWebUI", exact=True).count() > 0
    if found_owui:
        print("PASS: Application 'OpenWebUI' found.")
    else:
        print("FAIL: Application 'OpenWebUI' NOT found.")
        raise Exception("Application 'OpenWebUI' missing")

    # Check for LiteLLM
    found_litellm = page.get_by_text("LiteLLM", exact=True).count() > 0
    if found_litellm:
        print("PASS: Application 'LiteLLM' found.")
    else:
        print("FAIL: Application 'LiteLLM' NOT found.")
        raise Exception("Application 'LiteLLM' missing")

def verify_providers(page):
    print("Verifying Providers...")
    page.goto(f"https://sso.{BASE_DOMAIN}/if/admin/#/core/providers")
    page.wait_for_load_state("networkidle")
    time.sleep(2) # Give UI time to render
    
    page.wait_for_selector("ak-page-header", timeout=10000)
    
    # Check for OpenWebUI
    found_owui = page.get_by_text("OpenWebUI", exact=True).count() > 0
    if found_owui:
        print("PASS: Provider 'OpenWebUI' found.")
    else:
        print("FAIL: Provider 'OpenWebUI' NOT found.")
        raise Exception("Provider 'OpenWebUI' missing")

    # Check for LiteLLM
    found_litellm = page.get_by_text("LiteLLM", exact=True).count() > 0
    if found_litellm:
        print("PASS: Provider 'LiteLLM' found.")
    else:
        print("FAIL: Provider 'LiteLLM' NOT found.")
        raise Exception("Provider 'LiteLLM' missing")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True) # Run headless for verification
        context = browser.new_context(ignore_https_errors=True)
        page = context.new_page()
        
        try:
            print(f"Accessing Admin Interface at https://sso.{BASE_DOMAIN}/if/admin/")
            page.goto(f"https://sso.{BASE_DOMAIN}/if/admin/")
            
            # Login if needed
            if "if/admin" not in page.url or "flow/login" in page.url:
                 login_wrapper(page)
            
            # Ensure we are at dashboard
            try:
                expect(page).to_have_url(f"https://sso.{BASE_DOMAIN}/if/admin/**", timeout=15000)
            except:
                print("URL check failed. Current URL: " + page.url)
            
            verify_applications(page)
            verify_providers(page)
            
            print("\nAll Resource Verifications PASSED")
            
        except Exception as e:
            print(f"\nVerification FAILED: {e}")
            page.screenshot(path="tests/resource_verification_failure.png")
            print("Saved screenshot to tests/resource_verification_failure.png")
            exit(1)
        finally:
            browser.close()
