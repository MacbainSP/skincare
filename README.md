# SkinCheck – Android PWA (INCI-Scanner & Pflegeplan)

Installierbare Android Web-App (PWA), gebaut aus deinen persönlichen Psoriasis- & DM-Hautpflege-Analysen.

## Funktionen
- **📷 Foto-Scan (Kamera / Galerie):** Fotografiere die INCI-Liste auf der Rückseite. Gemini Vision liest Produktname, Kategorie und vollständige INCI-Liste aus.
- **🔗 Produkt-Link-Analyse:** Rossmann-, dm-, Müller- oder Apotheken-Link einfügen (nutzt den lokalen Python-Proxy `server.py` gegen CORS-Blockaden + Gemini Web-Suche als Fallback).
- **📝 Offline INCI-Analyse-Engine:**
  - Automatische **1-%-Anker-Erkennung** (EU-Kosmetikverordnung: Phenoxyethanol, Carbomer, Xanthan Gum, Allantoin usw.) + Prozent-Schätzung nach Listenplatz.
  - **Blender-Warnung** (z. B. Urea/Panthenol/Glycerin hinter der 1-%-Linie) & **Signalmolekül-Erkennung** (Ceramide, Cica, B12, Allantoin wirken auch ≤ 1 %).
  - **Positionsabhängige Alkohol-Regel** (Platz 1–6 = Red Flag, hinter 1-%-Anker = unkritisch) & **Echtes vs. falsches Duschöl**.
  - **5-Hauttypen-Matrix** inkl. **Alex (Normal + Psoriasis vulgaris)** und **Freundin (Fettige Haut / Seborrhoe & Locken)**.
  - **Pflegeplan-Einordnung** inkl. Abgleich mit deinen 14 Bestandsprodukten und der Kein-Brennen-Regel.
- **📋 Interaktiver Pflegeplan & Verlauf:** Beide Routinen (inkl. Wochenplan & 14-Produkte-Bestand) + lokaler Scan-Verlauf.

## Starten (Windows + Android im WLAN)
1. Doppelklick auf `start_app.bat` (oder im Terminal `python server.py`).
2. Am PC öffnen: `http://localhost:8080`
3. Auf dem Android-Handy (im selben WLAN) in **Google Chrome** die angezeigte WLAN-Adresse öffnen (z. B. `http://192.168.178.151:8080`).
4. In Chrome oben rechts auf **⋮ → „Zum Startbildschirm hinzufügen“** tippen.
5. Im Tab **⚙️ Setup** deinen kostenlosen Gemini API-Key eintragen (wird nur lokal im Browser gespeichert).

## Unterwegs nutzen (z. B. im Rossmann / dm)
Alle Frontend-Dateien (`index.html`, `styles.css`, `manifest.webmanifest`, `sw.js`, `js/`, `icons/`) sind 100 % statisch und können kostenlos bei **GitHub Pages**, **Cloudflare Pages** oder **Netlify** hochgeladen werden. Mit HTTPS installiert Chrome die App als vollwertige PWA, und Foto-Scan + Gemini-Link-Suche funktionieren auch mobil unterwegs!
