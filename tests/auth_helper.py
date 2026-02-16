import time
import os

def perform_authentik_login(page, email, password):
    """
    Robustly handles Authentik login flow by looping until redirect.
    Handles UID, password, and consent stages dynamically.
    Uses direct active-element targeting for reliability.
    """
    print(f"Handling Authentik login for {email}...")
    page.wait_for_load_state("networkidle")
    
    # Ensure debug directory exists
    os.makedirs("tests/debug", exist_ok=True)
    
    # Max attempts to prevent infinite loop
    for attempt in range(1, 21):
        url = page.url
        print(f"Auth loop attempt {attempt}. Current URL: {url}")
        
        # Capture debug screenshot
        try:
            page.screenshot(path=f"tests/debug/auth_attempt_{attempt}.png")
        except:
            pass
            
        if "authentik" not in url.lower() and "/if/flow" not in url.lower() and attempt > 1:
            print("Redirected away from Authentik. Login sequence finished.")
            return True
            
        # 1. Use JS to find the TRULY visible and active input
        active_input_info = page.evaluate("""() => {
            function findRecursive(root) {
                const inputs = root.querySelectorAll('input');
                for (const i of inputs) {
                    // Check if actually visible and not hidden
                    const style = window.getComputedStyle(i);
                    if (style.display !== 'none' && 
                        style.visibility !== 'hidden' && 
                        i.offsetParent !== null && 
                        !i.disabled) {
                        return {
                            name: i.name,
                            type: i.type,
                            placeholder: i.placeholder,
                            value: i.value
                        };
                    }
                }
                const all = root.querySelectorAll('*');
                for (const node of all) {
                    if (node.shadowRoot) {
                        const found = findRecursive(node.shadowRoot);
                        if (found) return found;
                    }
                }
                return null;
            }
            return findRecursive(document);
        }""")

        if active_input_info:
            print(f"Active input found: {active_input_info}")
            name = active_input_info.get('name', '')
            itype = active_input_info.get('type', '')
            val = active_input_info.get('value', '')
            
            if not val:
                # Decide what to fill
                if name == "uid" or "username" in itype or "Email" in active_input_info.get('placeholder', ''):
                    print(f"Filling Identity: {email}")
                    page.locator('input[name="uid"], input[autocomplete="username"]').first.fill(email)
                    time.sleep(1)
                    page.keyboard.press("Enter")
                    time.sleep(3)
                    continue
                elif name == "password" or itype == "password":
                    print("Filling Password...")
                    page.locator('input[name="password"], input[autocomplete="current-password"]').first.fill(password)
                    time.sleep(1)
                    page.keyboard.press("Enter")
                    time.sleep(3)
                    continue

        # 2. Handle Buttons if no empty input was found or filling didn't advance
        button_clicked = False
        for btn_text in ['Log in', 'Continue', 'Authorize', 'Next']:
            btn = page.locator(f"button:has-text('{btn_text}')").first
            if btn.count() > 0 and btn.is_visible() and btn.is_enabled():
                # Double check: if we see an input that is visible and empty, don't click button yet
                if active_input_info and not active_input_info.get('value'):
                    continue
                
                print(f"Clicking button: {btn_text}")
                btn.click()
                time.sleep(4)
                button_clicked = True
                break
        
        if button_clicked:
            continue

        # 3. Handle User Bubble/Account selection (fallback)
        bubbles = page.locator(f"text='{email}', text='akadmin'")
        if bubbles.count() > 0:
            bubble = bubbles.first
            if bubble.is_visible():
                print("Account bubble detected. Clicking...")
                bubble.click()
                time.sleep(2)
                continue

        # 4. Recovery
        if "Invalid password" in page.content() or "denied" in page.content():
            print("Detected denial/error. Attempting recovery...")
            not_you = page.locator("text='Not you?'").first
            if not_you.count() > 0 and not_you.is_visible():
                not_you.click()
                time.sleep(3)
                continue

        print("No definitive action. Waiting...")
        time.sleep(3)
        
    print("FAIL: Authentik login sequence timed out or got stuck.")
    return False
