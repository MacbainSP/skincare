import { ROUTINE_SLOTS, SKIN_TYPES, SKIN_CONDITIONS, formatSkinProfileLabel } from './data.js';
import { pickLang } from './i18n.js';

function describeSkinProfile(skinProfile, lang = 'de') {
  const label = formatSkinProfileLabel(skinProfile, lang);
  const st = SKIN_TYPES.find((s) => s.id === skinProfile?.skinType) || SKIN_TYPES[0];
  const conds = (skinProfile?.conditions || [])
    .map((id) => SKIN_CONDITIONS.find((c) => c.id === id))
    .filter(Boolean);
  const details = [
    pickLang(st.desc, lang),
    ...conds.map((c) => `${pickLang(c.label, lang)}: ${pickLang(c.desc, lang)}`)
  ].join(' ');
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
 * Komprimiert ein Foto im Browser (max. 1600px, JPEG 0.86) speicherschonend via ObjectURL.
 */
export function compressImageFile(file, maxDim = 1600) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Bildformat wird nicht unterstützt oder konnte nicht geladen werden.'));
    };
    img.onload = () => {
      try {
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
        URL.revokeObjectURL(objectUrl);
        resolve({ base64Data, mimeType: 'image/jpeg', previewUrl: dataUrl });
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Foto konnte nicht verarbeitet werden.'));
      }
    };
    img.src = objectUrl;
  });
}

/**
 * Liest Produktname, Kategorie und vollständige INCI-Liste aus einem Foto per Gemini Vision.
 */
export async function extractFromPhoto({ apiKey, model, base64Data, mimeType, skinProfile, lang = 'de' }) {
  const isEn = lang === 'en';
  const { label, details } = describeSkinProfile(skinProfile, lang);
  const outLang = isEn ? 'English' : 'Deutsch';
  const prompt = `You are a precise dermocosmetic INCI scanner.
Analyze this product photo and extract EXACTLY:
1. "productName": Brand + product name (if visible on the photo, otherwise best estimate).
2. "category": exactly one of: "cleanser", "serum", "moisturizer", "sunscreen", "body_lotion", "ointment", "shower_oil", "exfoliant", "shampoo", "conditioner", "lip_balm", "auto".
3. "rawInci": the complete comma-separated INCI ingredient list in the exact order printed on the package (fix line breaks/hyphens, do not invent ingredients). If no INCI list is readable, return "".
4. "aiSummary": concise, practical assessment (3-5 sentences in ${outLang}) tailored to the skin profile "${label}" (${details}).

Respond strictly as a JSON object with keys: productName, category, rawInci, aiSummary.`;

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
    throw new Error(
      isEn
        ? 'Could not read an INCI list from the photo. Please take a sharper, closer photo of the “Ingredients” section.'
        : 'Auf dem Foto konnte keine INCI-Liste gelesen werden. Bitte fotografiere die Rückseite mit den „Ingredients“ möglichst scharf und nah.'
    );
  }
  return parsed;
}

/**
 * Holt Seitentext über öffentliche, CORS-fähige Read-Proxies (für GitHub Pages / Handy ohne lokalen Server).
 */
async function fetchPageTextViaCorsProxy(targetUrl) {
  const candidates = [
    {
      url: `https://r.jina.ai/${targetUrl}`,
      headers: { Accept: 'text/plain' }
    },
    {
      url: `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
      headers: {}
    }
  ];

  for (const c of candidates) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(c.url, { headers: c.headers, signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) continue;
      const text = await res.text();
      if (text && text.length > 200) {
        // HTML ggf. grob bereinigen
        const cleaned = text.includes('<html') || text.includes('<body')
          ? text
              .replace(/<script[\s\S]*?<\/script>/gi, ' ')
              .replace(/<style[\s\S]*?<\/style>/gi, ' ')
              .replace(/<[^>]+>/g, '\n')
              .replace(/[ \t]+/g, ' ')
              .replace(/\n{2,}/g, '\n')
          : text;
        // Relevante Passage rund um Inhaltsstoffe/Ingredients herausschneiden
        const match = cleaned.match(/inhaltsstoffe|ingredients|bestandteile|aqua\s*,/i);
        if (match && match.index !== undefined) {
          const start = Math.max(0, match.index - 400);
          return cleaned.slice(start, start + 7000);
        }
        return cleaned.slice(0, 7000);
      }
    } catch {
      // nächsten Proxy probieren
    }
  }
  return '';
}

/**
 * Holt Produktname + INCI-Liste von einer URL:
 * 1) Zuerst über den lokalen Python-Proxy (/api/fetch-url)
 * 2) Auf GitHub Pages / Handy über CORS-fähige Reader-Proxies (r.jina.ai / allorigins)
 * 3) Extraktion mit normalem Gemini generateContent (OHNE google_search-Tool, daher kein 429-Free-Tier-Limit!)
 */
export async function extractFromUrl({ url, apiKey, model, skinProfile, userPlan = [], lang = 'de' }) {
  const isEn = lang === 'en';
  const trimmedUrl = (url || '').trim();
  if (!/^https?:\/\//i.test(trimmedUrl)) {
    throw new Error(isEn ? 'Please enter a valid product URL (starting with https://).' : 'Bitte gib eine gültige Produkt-URL ein (beginnend mit https://).');
  }

  let proxyResult = null;
  try {
    const res = await fetch(`/api/fetch-url?url=${encodeURIComponent(trimmedUrl)}`);
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        proxyResult = await res.json();
      }
    }
  } catch {
    // Kein lokaler Proxy aktiv
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
          skinProfile,
          userPlan,
          lang
        });
      } catch {
        // Deterministische Analyse reicht als Fallback
      }
    }
    return {
      productName: proxyResult.productName || (isEn ? 'Product from Link' : 'Produkt aus Link'),
      category: 'auto',
      rawInci: proxyResult.rawInci,
      aiSummary,
      source: 'Local Link Parser'
    };
  }

  let pageSnippet = proxyResult?.snippet || '';
  if (!pageSnippet) {
    pageSnippet = await fetchPageTextViaCorsProxy(trimmedUrl);
  }

  if (!apiKey || !apiKey.trim()) {
    throw new Error(
      isEn
        ? 'Please add your free Gemini API key in the “Setup” tab for automatic link analysis (or paste the INCI list directly in the “INCI Text” tab).'
        : 'Für die automatische Link-Auswertung auf GitHub Pages bitte deinen kostenlosen Gemini API-Key im Tab „Setup“ eintragen (oder die INCI-Liste direkt im Tab „INCI-Text“ einfügen).'
    );
  }

  const { label, details } = describeSkinProfile(skinProfile, lang);
  const outLang = isEn ? 'English' : 'Deutsch';

  if (pageSnippet) {
    const prompt = `Extract the product name and complete, exact INCI ingredient list from this product page excerpt.
URL: ${trimmedUrl}

Page excerpt:
${pageSnippet}

Respond strictly as a JSON object:
{
  "productName": "Brand + Product Name",
  "category": "cleanser|serum|moisturizer|sunscreen|body_lotion|ointment|shower_oil|exfoliant|shampoo|conditioner|lip_balm|auto",
  "rawInci": "Complete comma-separated INCI list (or empty string if not present)",
  "aiSummary": "Concise assessment (3-4 sentences in ${outLang}) for skin profile: ${label} (${details})"
}`;

    const text = await callGemini({
      apiKey,
      model,
      useSearch: false,
      jsonMode: true,
      parts: [{ text: prompt }]
    });

    const parsed = parseJsonLoose(text);
    if (parsed.rawInci && parsed.rawInci.trim().length > 10) {
      return { ...parsed, source: 'Web Fetch + Gemini' };
    }
  }

  throw new Error(
    isEn
      ? 'This online store blocks automated page fetching (bot protection). Please copy the ingredients into the “📝 INCI Text” tab or take a photo in the “📷 Photo” tab.'
      : 'Dieser Online-Shop blockiert leider den automatischen Seitenabruf (Bot-Schutz). Kopiere die Inhaltsstoffe auf der Produktseite kurz in den Tab „📝 INCI-Text“ oder fotografiere die Rückseite im Tab „📷 Foto“.'
  );
}

/**
 * Kurze, personalisierte KI-Zweitmeinung für ein bereits analysiertes Produkt.
 */
export async function getAiSecondOpinion({ apiKey, model, productName, rawInci, skinProfile, userPlan = [], lang = 'de' }) {
  if (!apiKey || !apiKey.trim()) return '';
  const isEn = lang === 'en';
  const { label, details } = describeSkinProfile(skinProfile, lang);
  const outLang = isEn ? 'English' : 'Deutsch';

  let inventorySection = '';
  if (userPlan && userPlan.length) {
    const lines = userPlan.map((item) => {
      const slotObj = ROUTINE_SLOTS.find((s) => s.id === item.slotId);
      const slotLabel = slotObj ? pickLang(slotObj.label, lang) : item.slotId;
      return `- ${item.productName} (${slotLabel})`;
    });
    inventorySection = `\nAlready saved in the user's personal routine:\n${lines.join('\n')}`;
  }

  const prompt = `You are an evidence-based dermocosmetics advisor.
Selected skin profile: ${label}
Details: ${details}${inventorySection}

Analyzed product: ${productName || 'Unknown'}
INCI list: ${rawInci}

Provide a concise, practical assessment in at most 5 short sentences in ${outLang}:
1) Does it fit the selected skin profile (and if not, which skin type does it suit better)?
2) Where in the routine should it be used – and are there overlaps or conflicts with already saved products?
3) Any key usage rule (e.g., No-Sting rule, Soak & Seal, CWC, SPF)?`;

  return callGemini({
    apiKey,
    model,
    parts: [{ text: prompt }]
  });
}
