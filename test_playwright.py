import asyncio
import http.server
import socketserver
import threading
from playwright.async_api import async_playwright

def start_server():
    handler = http.server.SimpleHTTPRequestHandler
    httpd = socketserver.TCPServer(("127.0.0.1", 8080), handler)
    httpd.serve_forever()

async def main():
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 720})

        await page.goto("http://127.0.0.1:8080/index.html")
        await page.wait_for_timeout(1000)

        await page.screenshot(path="screenshot_start.png")

        start_btn = page.locator("#start-btn")
        if await start_btn.is_visible():
            await start_btn.click()

        await page.wait_for_timeout(3000)

        await page.screenshot(path="game_screenshot.png")
        await browser.close()
        print("Playwright screenshot captured successfully: game_screenshot.png")

if __name__ == "__main__":
    asyncio.run(main())
