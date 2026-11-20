# SkinCheck – Android PWA (INCI-Scanner & Pflegeplan)

Installierbare Android Web-App (PWA) zum Analysieren von Kosmetik-Inhaltsstoffen (INCI) per **Live-Kamera**, **Galerie-Foto**, **Produkt-Link** oder **INCI-Text** – abgestimmt auf deinen gewählten Hauttyp, Hautzustände und Pflegeplan.

## Funktionen
- **🧬 Flexibles Hautprofil:** Wähle deinen Grund-Hauttyp (Normal, Trocken, Fettig, Mischhaut, Empfindlich) plus optionale Besonderheiten per Checkbox (*Psoriasis vulgaris*, *Seborrhoe*, *Neurodermitis*, *Rosazea*, *Akne/Unrein*, *Pigmentflecken/PIH*, *Locken CWC*).
- **📷 In-App Live-Kamera & Galerie:** Fotografiere die INCI-Liste auf der Rückseite direkt in der App (oder wähle ein Bild aus der Galerie). Gemini Vision liest Produktname, Kategorie und vollständige INCI-Liste aus.
- **🔗 Produkt-Link-Analyse:** Rossmann-, dm-, Müller- oder Apotheken-Link einfügen – liest die Produktseite über den lokalen Python-Proxy oder unterwegs auf GitHub Pages über CORS-Reader aus und wertet die INCIs aus.
- **📝 Offline INCI-Analyse-Engine:**
  - Automatische **1-%-Anker-Erkennung** (EU-Kosmetikverordnung: Phenoxyethanol, Carbomer, Xanthan Gum, Allantoin usw.) + Prozent-Schätzung nach Listenplatz.
  - **Blender-Warnung** (z. B. Urea/Panthenol/Glycerin hinter der 1-%-Linie) & **Signalmolekül-Erkennung** (Ceramide, Cica, B12, Allantoin wirken auch ≤ 1 %).
  - **Positionsabhängige Alkohol-Regel** (Platz 1–6 = Red Flag, hinter 1-%-Anker = unkritisch) & **Echtes vs. falsches Duschöl**.
  - **5-Hauttypen-Matrix** + konkrete **Pflegeplan-Einordnung**.
- **📋 Persönlicher Pflegeplan & Verlauf:** Befülle deinen eigenen Pflegeplan direkt aus jedem Foto-, Link- oder INCI-Scan (gruppiert nach Morgens, Abends, Körper, Haare, SOS) – inkl. dynamischer Pflegeregeln passend zu deinem Hautprofil und lokalem Verlauf.

---

## Kostenlosen Gemini API-Key erstellen (für Foto-Scan & Link-Auswertung)

Für die automatische Foto-Texterkennung (Vision) und die Link-Auswertung benötigt die App einen kostenlosen Google Gemini API-Key. **Der Key wird ausschließlich lokal in deinem Browser (`localStorage`) gespeichert und niemals an Dritte oder GitHub übertragen.**

1. Öffne **Google AI Studio**: [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey) (oder [https://aistudio.google.com](https://aistudio.google.com) → links im Menü **„Get API key“**).
2. Melde dich mit deinem normalen Google-Konto an.
3. Klicke auf **„Create API key“** (falls gefragt, wähle ein bestehendes Projekt oder erstelle mit einem Klick ein neues kostenloses Projekt).
4. Kopiere den angezeigten Schlüssel (beginnt mit `AIza...`).
5. Öffne in der SkinCheck-App den Tab **⚙️ Setup**:
   - Füge den Key im Feld **Gemini API-Key** ein.
   - Tippe auf **„🔌 Testen / Auto-Wahl“** (oder **„🔄 Modelle laden“**), damit die App automatisch das beste für deinen Key verfügbare kostenlose Flash-Modell auswählt und speichert.

*(Hinweis: Der Tab **📝 INCI-Text** und der **📋 Pflegeplan** funktionieren auch komplett offline ohne API-Key.)*

---

## Nutzung über GitHub Pages (empfohlen für Android unterwegs)

1. Erstelle ein öffentliches GitHub-Repository (z. B. `skincheck`) und lade die Dateien (`index.html`, `styles.css`, `manifest.webmanifest`, `sw.js`, `js/`, `icons/`) hoch.
2. Aktiviere unter **Settings → Pages** den Branch `main` mit Ordner `/ (root)`.
3. Öffne die HTTPS-Adresse `https://<dein-username>.github.io/<repo-name>/` auf deinem Android-Handy (in **Chrome** oder **Firefox Mobile**).
4. Tippe im Browser-Menü (**⋮**) auf **„App installieren“** bzw. **„Zum Startbildschirm hinzufügen“**.

## Lokal starten (Windows + Android im WLAN)

1. Doppelklick auf `start_app.bat` (oder im Terminal `python server.py`).
2. Am PC öffnen: `http://localhost:8080`
3. Auf dem Android-Handy (im selben WLAN) die angezeigte WLAN-Adresse öffnen (z. B. `http://192.168.178.x:8080`).
