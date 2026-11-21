"""
Simple Local Web Server for the UCS Route Planning Web Application
Run this script to launch the visualizer in your default browser:
    python server.py
"""

import http.server
import socketserver
import webbrowser
import threading
import time
import os

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        # Keep terminal output clean
        print(f"[HTTP] {self.address_string()} - {format % args}")

def open_browser():
    time.sleep(0.8)
    url = f"http://localhost:{PORT}/index.html"
    print(f"\n[Browser] Opening {url}...")
    webbrowser.open(url)

if __name__ == "__main__":
    # Allow port reuse
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("=" * 65)
        print(f"🚀 UCS Web Application running at http://localhost:{PORT}/index.html")
        print("   Press Ctrl+C to stop the server at any time.")
        print("=" * 65)
        threading.Thread(target=open_browser, daemon=True).start()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server. Goodbye!")

