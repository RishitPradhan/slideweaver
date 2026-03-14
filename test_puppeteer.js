const puppeteer = require('puppeteer');

(async () => {
    console.log("Starting Puppeteer test...");
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => {
        console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
        console.log(`[PAGE ERROR] ${error.message}`);
    });

    console.log("Navigating to http://localhost:8000...");
    await page.goto("http://localhost:8000", { waitUntil: 'networkidle2' });
    
    console.log("Injecting script to start game...");
    await page.evaluate(() => {
        document.getElementById('progressSection').style.display = 'block';
        if (typeof window.startGame === 'function') {
            console.log("SUCCESS: startGame exists, calling it!");
            window.startGame();
        } else {
            console.error("FAIL: window.startGame is undefined.");
        }
    });

    await page.waitForTimeout(2000);
    await browser.close();
    console.log("Done.");
})();
