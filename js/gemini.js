import { PROFILES, SKIN_TYPES, SKIN_CONDITIONS, formatSkinProfileLabel } from './data.js';

function describeSkinProfile(skinProfile) {
  const label = formatSkinProfileLabel(skinProfile);
  const st = SKIN_TYPES.find((s) => s.id === skinProfile?.skinType) || SKIN_TYPES[0];
  const conds = (skinProfile?.conditions || [])
    .map((id) => SKIN_CONDITIONS.find((c) => c.id === id))
    .filter(Boolean);
  const details = [st.desc, ...conds.map((c) => `${c.label}: ${c.desc}`)].join(' ');
  return { label, details, condIds: skinProfile?.conditions || [] };
}

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

async function callGemini({ apiKey, model = 'gemini-flash-latest', parts, useSearch = false, jsonMode = false }) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Bitte trage zuerst deinen kostenlosen Gemini API-Key im Tab „Setup“ ein.');
  }

  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.2
    }
  };

  if (jsonMode && !useSearch) {
    body.generationConfig.responseMimeType = 'application/json';
  }
  if (useSearch) {
    body.tools = [{ google_search: {} }];
  }

  const endpoint = `${GEMINI_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    let detail = '';
    try {
      const errJson = await res.json();
      detail = errJson?.error?.message || '';
    } catch {
      detail = await res.text();
    }
    throw new Error(`Gemini API Fehler (${res.status}): ${detail || res.statusText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('\n').trim();
  if (!text) {
    throw new Error('Gemini hat keine verwertbare Antwort geliefert.');
  }
  return text;
}

function parseJsonLoose(text) {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error('Antwort konnte nicht als JSON gelesen werden.');
  }
}

export async function listAvailableModels(apiKey) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Bitte zuerst einen Gemini API-Key eintragen.');
  }
  const url = `${GEMINI_BASE}?key=${encodeURIComponent(apiKey.trim())}&pageSize=100`;
  const res = await fetch(url);
  if (!res.ok) {
    let detail = '';
    try {
      const errJson = await res.json();
      detail = errJson?.error?.message || '';
    } catch {
      detail = await res.text();
    }
    throw new Error(`Modelle konnten nicht geladen werden (${res.status}): ${detail || res.statusText}`);
  }
  const data = await res.json();
  const models = (data.models || [])
    .filter((m) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
    .map((m) => ({
      id: (m.name || '').replace(/^models\//, ''),
      displayName: m.displayName || (m.name || '').replace(/^models\//, '')
    }))
    .filter((m) => /^gemini-/i.test(m.id) && !/(embedding|tts|imagen|veo|robotics|computer-use|deep-research|audio-only)/i.test(m.id));

  // Bevorzugte Flash-Modelle nach oben sortieren
  models.sort((a, b) => {
    const score = (id) => {
      let s = 0;
      if (/flash-latest/i.test(id)) s += 50;
      if (/flash/i.test(id)) s += 30;
      if (/lite/i.test(id)) s += 10;
      if (/preview|exp/i.test(id)) s -= 5;
      if (/2\.0/i.test(id)) s -= 20;
      return s;
    };
    return score(b.id) - score(a.id) || b.id.localeCompare(a.id);
  });

  return models;
}

export async function testGeminiConnection(apiKey, model) {
  const reply = await callGemini({
    apiKey,
    model,
    parts: [{ text: 'Antworte nur mit: OK' }]
  });
  return reply.slice(0, 40);
}

/**
 * Testet das gewählte Modell; falls es für neue Nutzer gesperrt/veraltet ist,
 * lädt automatisch alle verfügbaren Modelle des API-Keys und probiert das beste Flash-Modell.
 */
export async function testOrAutoSelectModel(apiKey, preferredModel) {
  try {
    const reply = await testGeminiConnection(apiKey, preferredModel);
    return { model: preferredModel, reply, autoSwitched: false, models: null };
  } catch (firstErr) {
    const models = await listAvailableModels(apiKey);
    const candidates = models.map((m) => m.id).filter((id) => id !== preferredModel).slice(0, 6);
    for (const candidate of candidates) {
      try {
        const reply = await testGeminiConnection(apiKey, candidate);
        return { model: candidate, reply, autoSwitched: true, models };
      } catch {
        // nächstes Modell versuchen
      }
    }
    throw firstErr;
  }
}

/**
 * Komprimiert ein Foto im Browser (max. 1600px, JPEG 0.85), damit Handy-Fotos schnell hochgeladen werden.
 */
export function compressImageFile(file, maxDim = 1600) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Foto konnte nicht gelesen werden.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Bildformat wird nicht unterstützt.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
        const base64Data = dataUrl.split(',')[1];
        resolve({ base64Data, mimeType: 'image/jpeg', previewUrl: dataUrl });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Liest Produktname, Kategorie und vollständige INCI-Liste aus einem Foto per Gemini Vision.
 */
export async function extractFromPhoto({ apiKey, model, base64Data, mimeType, skinProfile }) {
  const { label, details } = describeSkinProfile(skinProfile);
  const prompt = `Du bist ein präziser Dermokosmetik-INCI-Scanner.
Analysiere dieses Produktfoto und extrahiere EXAKT:
1. "productName": Markenname + Produktname (falls auf dem Foto sichtbar, sonst bestmögliche Bezeichnung).
2. "category": genau einer dieser Werte: "cleanser", "serum", "moisturizer", "sunscreen", "body_lotion", "ointment", "shower_oil", "exfoliant", "shampoo", "conditioner", "lip_balm", "auto".
3. "rawInci": die vollständige, kommagetrennte INCI-Liste in exakt der Reihenfolge wie auf der Packung (korrigiere offensichtliche Zeilenumbrüche/Trennstriche, aber erfinde keine Stoffe hinzu). Falls keine INCI-Liste auf dem Bild lesbar ist, gib "" zurück.
4. "aiSummary": kurze, konkrete Einschätzung (3–5 Sätze auf Deutsch) speziell für das Hautprofil "${label}" (${details}).

Antworte ausschließlich als JSON-Objekt mit den Schlüsseln: productName, category, rawInci, aiSummary.`;

  const text = await callGemini({
    apiKey,
    model,
    jsonMode: true,
    parts: [
      { text: prompt },
      { inline_data: { mime_type: mimeType, data: base64Data } }
    ]
  });

  const parsed = parseJsonLoose(text);
  if (!parsed.rawInci || parsed.rawInci.trim().length < 5) {
    throw new Error('Auf dem Foto konnte keine INCI-Liste gelesen werden. Bitte fotografiere die Rückseite mit den „Ingredients“ möglichst scharf und nah.');
  }
  return parsed;
}

/**
 * Holt Produktname + INCI-Liste von einer URL:
 * 1) Zuerst über den lokalen Python-Proxy (/api/fetch-url)
 * 2) Falls unvollständig oder offline vom Proxy: Fallback über Gemini mit Google Search Grounding
 */
export async function extractFromUrl({ url, apiKey, model, skinProfile }) {
  const trimmedUrl = (url || '').trim();
  if (!/^https?:\/\//i.test(trimmedUrl)) {
    throw new Error('Bitte gib eine gültige Produkt-URL ein (beginnend mit https://).');
  }

  let proxyResult = null;
  try {
    const res = await fetch(`/api/fetch-url?url=${encodeURIComponent(trimmedUrl)}`);
    if (res.ok) {
      proxyResult = await res.json();
    }
  } catch {
    // Kein lokaler Proxy aktiv (z. B. statisches Hosting) -> Fallback auf Gemini Search
  }

  if (proxyResult && proxyResult.rawInci && proxyResult.rawInci.length > 25) {
    let aiSummary = '';
    if (apiKey && apiKey.trim()) {
      try {
        aiSummary = await getAiSecondOpinion({
          apiKey,
          model,
          productName: proxyResult.productName,
          rawInci: proxyResult.rawInci,
          skinProfile
        });
      } catch {
        // Deterministische Analyse reicht als Fallback
      }
    }
    return {
      productName: proxyResult.productName || 'Produkt aus Link',
      category: 'auto',
      rawInci: proxyResult.rawInci,
      aiSummary,
      source: 'Lokaler Link-Parser'
    };
  }

  if (apiKey && apiKey.trim()) {
    const { label, details } = describeSkinProfile(skinProfile);
    const contextSnippet = proxyResult?.snippet
      ? `\n\nAuszug der Webseite:\n${proxyResult.snippet.slice(0, 6000)}`
      : '';

    const prompt = `Finde den Produktnamen und die offizielle, vollständige INCI-Liste (Ingredients) für dieses Kosmetikprodukt:
URL: ${trimmedUrl}${contextSnippet}

Gib die Antwort ausschließlich als JSON-Objekt zurück (ohne Markdown-Codeblock):
{
  "productName": "Marke + Produktname",
  "category": "cleanser|serum|moisturizer|sunscreen|body_lotion|ointment|shower_oil|exfoliant|shampoo|conditioner|lip_balm|auto",
  "rawInci": "Aqua, Glycerin, ...",
  "aiSummary": "Kurze Einschätzung (3-4 Sätze auf Deutsch) für das Hautprofil: ${label} (${details})"
}`;

    const text = await callGemini({
      apiKey,
      model,
      useSearch: !contextSnippet,
      jsonMode: Boolean(contextSnippet),
      parts: [{ text: prompt }]
    });

    const parsed = parseJsonLoose(text);
    if (parsed.rawInci && parsed.rawInci.trim().length > 10) {
      return { ...parsed, source: contextSnippet ? 'Proxy + Gemini' : 'Gemini Web-Suche' };
    }
  }

  throw new Error(
    proxyResult?.error ||
      'Die INCI-Liste konnte nicht automatisch von dieser Shop-Seite ausgelesen werden. Tipp: Hinterlege einen Gemini API-Key im Tab „Setup“ oder kopiere die Inhaltsstoffe direkt in den Tab „INCI-Text“.'
  );
}

/**
 * Kurze, personalisierte KI-Zweitmeinung für ein bereits analysiertes Produkt.
 */
export async function getAiSecondOpinion({ apiKey, model, productName, rawInci, skinProfile }) {
  if (!apiKey || !apiKey.trim()) return '';
  const { label, details, condIds } = describeSkinProfile(skinProfile);

  let inventorySection = '';
  if (condIds.includes('psoriasis')) {
    inventorySection = `\nVorhandener Psoriasis-Bestand:\n${PROFILES.alex.inventory.map((i) => `- ${i.name} (${i.slot})`).join('\n')}`;
  } else if (condIds.includes('seborrhoe') || skinProfile?.skinType === 'oily') {
    inventorySection = `\nRelevante dm-Routine:\n${PROFILES.partner.inventory.map((i) => `- ${i.name} (${i.slot})`).join('\n')}`;
  }

  const prompt = `Du bist ein evidenzbasierter Dermokosmetik-Berater.
Gewähltes Hautprofil: ${label}
Details: ${details}${inventorySection}

Analysiertes Produkt: ${productName || 'Unbekannt'}
INCI-Liste: ${rawInci}

Gib eine prägnante, praxisnahe Einschätzung in maximal 5 kurzen Sätzen auf Deutsch:
1) Passt es zum gewählten Hautprofil (und falls nein, zu welchem Hauttyp eher)?
2) Wo genau im Pflegeplan einsetzen – oder ist es durch den Bestand bereits abgedeckt?
3) Gibt es eine wichtige Anwendungsregel (z. B. Kein-Brennen-Regel, Soak & Seal, CWC, LSF)?`;

  return callGemini({
    apiKey,
    model,
    parts: [{ text: prompt }]
  });
}
