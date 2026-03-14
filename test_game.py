import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

print("Starting Selenium test...")

chrome_options = Options()
chrome_options.add_argument('--headless')
driver = webdriver.Chrome(options=chrome_options)

try:
    print("Navigating to http://localhost:8000...")
    driver.get("http://localhost:8000")
    time.sleep(2)
    
    print("Injecting script to start game directly...")
    driver.execute_script("""
        document.getElementById('progressSection').style.display = 'block';
        if (window.startGame) {
            console.log('startGame exists, calling it...');
            window.startGame();
        } else {
            console.error('window.startGame DOES NOT EXIST');
        }
    """)
    time.sleep(2)
    
    print("--- BROWSER CONSOLE LOGS ---")
    for log in driver.get_log('browser'):
        print(f"[{log['level']}] {log['message']}")
    print("----------------------------")
    
finally:
    driver.quit()
