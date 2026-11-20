#!/usr/bin/env python3
"""
SkinCheck PWA Local Server & Product Link Proxy (Python 3 Standard Library).
Startet die Android-PWA im lokalen WLAN und liest Produktseiten (Rossmann, dm, etc.)
ohne CORS-Blockade aus.
"""

import html
import ipaddress
import json
import os
import re
import socket
import urllib.error
import urllib.parse
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = int(os.environ.get("PORT", "8080"))
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))


def get_lan_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def is_safe_public_url(url: str) -> bool:
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        return False
    host = parsed.hostname.lower()
    if host in ("localhost", "127.0.0.1", "::1"):
        return False
    try:
        ip = ipaddress.ip_address(host)
        if ip.is_private or ip.is_loopback or ip.is_link_local:
            return False
    except ValueError:
        pass
    return True


def strip_html(raw_html: str) -> str:
    text = re.sub(r"<script[\s\S]*?</script>", " ", raw_html, flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "\n", text)
    text = html.unescape(text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{2,}", "\n", text)
    return text.strip()


def extract_product_info(page_html: str) -> dict:
    product_name = ""
    raw_inci = ""

    # 1. Produktname aus og:title oder <title>
    og = re.search(r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)["\']', page_html, re.I)
    if og:
        product_name = html.unescape(og.group(1)).strip()
    if not product_name:
        title = re.search(r"<title[^>]*>(.*?)</title>", page_html, re.I | re.S)
        if title:
            product_name = html.unescape(re.sub(r"\s+", " ", title.group(1))).strip()

    # Shop-Suffixe bereinigen
    product_name = re.sub(r"\s*[\|\-–]\s*(ROSSMANN|dm\.de|dm-drogerie markt|Müller|ONLINE KAUFEN).*$", "", product_name, flags=re.I).strip()

    # 2. Text-Extraktion für INCI
    plain = strip_html(page_html)

    # Muster A: Expliziter Abschnitt nach "Inhaltsstoffe" / "Ingredients"
    inci_patterns = [
        r"(?:Inhaltsstoffe|Ingredients|Bestandteile)\s*[:\-]?\s*\n?\s*([A-Za-z][A-Za-z0-9\s,\-\./\(\)%]{35,1800})",
        r"\b(Aqua(?:\s*\([^)]+\))?\s*,\s*[A-Za-z0-9\s,\-\./\(\)%]{35,1800})",
        r"\b((?:Ricinus Communis|Glycine Soja|Helianthus Annuus|Butyrospermum Parkii|Petrolatum)[A-Za-z0-9\s,\-\./\(\)%]{35,1800})"
    ]

    for pat in inci_patterns:
        for m in re.finditer(pat, plain, re.I):
            candidate = m.group(1).strip()
            # Abschneiden bei typischen Folge-Überschriften
            candidate = re.split(
                r"\n(?:Anwendung|Hinweise|Warnhinweise|Verwendung|Hersteller|Anschrift|Kontakt|Aufbewahrung|Über dieses Produkt|Bewertungen)",
                candidate,
                maxsplit=1,
                flags=re.I,
            )[0].strip()
            candidate = re.sub(r"\s*\n\s*", ", ", candidate)
            if candidate.count(",") >= 3:
                raw_inci = candidate
                break
        if raw_inci:
            break

    # Relevanter Textausschnitt als Kontext für Gemini-Fallback
    snippet = ""
    idx = re.search(r"inhaltsstoffe|ingredients|aqua\s*,", plain, re.I)
    if idx:
        start = max(0, idx.start() - 300)
        snippet = plain[start : start + 5000]
    else:
        snippet = plain[:4000]

    return {
        "productName": product_name,
        "rawInci": raw_inci,
        "snippet": snippet,
    }


class SkinCheckHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".webmanifest": "application/manifest+json",
        ".js": "application/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".html": "text/html; charset=utf-8",
        ".svg": "image/svg+xml",
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT_DIR, **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/fetch-url":
            self.handle_fetch_url(parsed)
            return
        super().do_GET()

    def handle_fetch_url(self, parsed):
        qs = urllib.parse.parse_qs(parsed.query)
        target_url = (qs.get("url") or [""])[0].strip()

        if not is_safe_public_url(target_url):
            self.send_json(400, {"error": "Ungültige oder nicht erlaubte URL."})
            return

        req = urllib.request.Request(
            target_url,
            headers={
                "User-Agent": "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
                "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                raw_bytes = resp.read(2_500_000)
                charset = resp.headers.get_content_charset() or "utf-8"
                page_html = raw_bytes.decode(charset, errors="replace")
            info = extract_product_info(page_html)
            self.send_json(200, info)
        except urllib.error.HTTPError as e:
            self.send_json(200, {"error": f"Shop blockiert Direktabruf (HTTP {e.code}). Gemini Web-Suche übernimmt als Fallback."})
        except Exception as e:
            self.send_json(200, {"error": f"Direktabruf fehlgeschlagen: {e}"})

    def send_json(self, status: int, payload: dict):
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)


if __name__ == "__main__":
    lan_ip = get_lan_ip()
    server = ThreadingHTTPServer(("0.0.0.0", PORT), SkinCheckHandler)
    print("=" * 64)
    print("  SkinCheck Android PWA läuft!")
    print(f"  PC / Lokal:    http://localhost:{PORT}")
    print(f"  Android WLAN:  http://{lan_ip}:{PORT}")
    print("  Zum Beenden:   Strg + C")
    print("=" * 64)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer beendet.")
