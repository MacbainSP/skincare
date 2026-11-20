import { INCI_DB, ONE_PERCENT_ANCHORS, formatSkinProfileLabel } from './data.js';

/**
 * Zerlegt einen rohen INCI-Text in eine saubere Liste einzelner Inhaltsstoffe.
 */
export function parseInciList(rawText) {
  if (!rawText) return [];
  let cleaned = rawText
    .replace(/\r?\n/g, ', ')
    .replace(/^(ingredients|inhaltsstoffe|inci|bestandteile)\s*[:\-]?\s*/i, '')
    .replace(/\s*\.\s*$/, '')
    .replace(/;/g, ',');

  // Kommas innerhalb von Klammern schützen
  let depth = 0;
  let current = '';
  const items = [];
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === '(' || ch === '[') depth++;
    if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) {
      if (current.trim()) items.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) items.push(current.trim());

  return items
    .map((s) => s.replace(/^[\d\.\)\-\*\•]+\s*/, '').replace(/\s+/g, ' ').trim())
    .filter((s) => s.length > 1 && !/^(\*|\*\*|aus kontrolliert|from organic)/i.test(s));
}

function matchInciRule(normalized) {
  for (const rule of INCI_DB) {
    for (const key of rule.keys) {
      if (rule.exact) {
        if (normalized === key || normalized === `${key}.`) return rule;
      } else {
        if (normalized.includes(key)) return rule;
      }
    }
  }
  return null;
}

function findAnchorIndex(items) {
  for (let i = 0; i < items.length; i++) {
    const norm = items[i].toLowerCase();
    for (const anchor of ONE_PERCENT_ANCHORS) {
      if (norm.includes(anchor.match)) {
        return { index: i, anchor };
      }
    }
  }
  return { index: -1, anchor: null };
}

function estimatePercentage(pos1Based, isWaterBased, anchorIndex) {
  if (anchorIndex >= 0 && pos1Based - 1 >= anchorIndex) {
    return '≤ 1 %';
  }
  if (pos1Based === 1) {
    return isWaterBased ? 'ca. 60–85 %' : 'ca. 40–70 %';
  }
  if (pos1Based === 2) return 'ca. 8–15 %';
  if (pos1Based <= 4) return 'ca. 3–7 %';
  if (pos1Based <= 7) return 'ca. 1,5–3 %';
  return anchorIndex >= 0 ? 'ca. 1–2 %' : 'ca. ≤ 1–2 %';
}

export function detectCategory(productName = '', items = [], userCategory = 'auto') {
  if (userCategory && userCategory !== 'auto') return userCategory;
  const name = (productName || '').toLowerCase();
  const joined = items.join(' ').toLowerCase();

  if (/lippen|lip\s*balm|lippenpflege/.test(name)) return 'lip_balm';
  if (/lsf|spf|sonnen|anti-uv|uv-fluid|sunozon|sundance/.test(name)) return 'sunscreen';
  if (/shampoo/.test(name)) return 'shampoo';
  if (/spülung|conditioner|haarmaske|lockengel|haaröl|trockenshampoo/.test(name)) return 'conditioner';
  if (/duschöl/.test(name)) return 'shower_oil';
  if (/peeling|bha|aha|pha|salicyl|glykol/.test(name)) return 'exfoliant';
  if (/waschgel|waschlotion|reinigung|cleanser|mizellen|duschgel/.test(name)) return 'cleanser';
  if (/salbe|balsam|ointment/.test(name)) return 'ointment';
  if (/körperlotion|körpermilch|bodylotion|body/.test(name)) return 'body_lotion';
  if (/serum|konzentrat|booster|ampulle/.test(name)) return 'serum';
  if (/creme|fluid|gel|lotion|pflege/.test(name)) return 'moisturizer';

  // Fallback über INCI-Signatur
  const uvCount = items.filter((i) => {
    const r = matchInciRule(i.toLowerCase());
    return r && (r.category === 'good_uv' || r.category === 'bad_uv');
  }).length;
  if (uvCount >= 2) return 'sunscreen';

  const hasSurfactant = items.slice(0, 6).some((i) => {
    const r = matchInciRule(i.toLowerCase());
    return r && ['mild_surfactant', 'harsh_surfactant', 'sles'].includes(r.category);
  });
  if (hasSurfactant) return 'cleanser';

  if (/behentrimonium|cetrimonium/.test(joined)) return 'conditioner';
  if (/salicylic acid|glycolic acid/.test(joined) && items.length <= 14) return 'exfoliant';
  if (items.length > 0 && !/aqua|water/.test(items[0].toLowerCase()) && /petrolatum|cera alba|ricinus|butyrospermum/.test(joined)) {
    return 'ointment';
  }
  return 'moisturizer';
}

export const CATEGORY_LABELS = {
  cleanser: 'Gesichtsreinigung / Waschlotion',
  serum: 'Serum / Konzentrat',
  moisturizer: 'Gesichtscreme / Pflege',
  sunscreen: 'Sonnenschutz (LSF)',
  body_lotion: 'Körperlotion / Körpercreme',
  ointment: 'Plaque-Salbe / Okklusivpflege',
  shower_oil: 'Duschöl / Körperreinigung',
  exfoliant: 'Chemisches Peeling (AHA/BHA/PHA)',
  shampoo: 'Shampoo / Kopfhaut',
  conditioner: 'Spülung / Haarmaske / Styling',
  lip_balm: 'Lippenpflege'
};

/**
 * Führt die komplette deterministische INCI-Analyse durch.
 */
export function analyzeInci({
  productName = '',
  rawInci = '',
  category = 'auto',
  skinProfile = { skinType: 'normal', conditions: ['psoriasis'] },
  sourceUrl = ''
}) {
  const items = parseInciList(rawInci);
  if (items.length === 0) {
    throw new Error('Keine gültige INCI-Liste erkannt. Bitte kommagetrennte Inhaltsstoffe eingeben.');
  }

  const skinType = skinProfile?.skinType || 'normal';
  const conditions = Array.isArray(skinProfile?.conditions) ? skinProfile.conditions : [];
  const hasCond = (c) => conditions.includes(c);
  const profileLabel = formatSkinProfileLabel({ skinType, conditions });

  const detectedCategory = detectCategory(productName, items, category);
  const isWaterBased = /^aqua\b|^water\b/i.test(items[0]);
  const { index: anchorIndex, anchor: anchorInfo } = findAnchorIndex(items);

  const flags = {
    fragrance: [],
    badAlcoholHigh: [],
    badAlcoholLow: [],
    essentialOil: [],
    scrub: [],
    harshSurfactant: [],
    sles: [],
    badUv: [],
    goodUv: [],
    keratolytic: [],
    barrier: [],
    soothing: [],
    humectant: [],
    sebumActive: [],
    heavyLipidHigh: [],
    lightLipid: [],
    mildSurfactant: [],
    blenderWarnings: [],
    stingTriggers: []
  };

  const breakdown = items.map((raw, idx) => {
    const pos = idx + 1;
    const norm = raw.toLowerCase();
    const rule = matchInciRule(norm);
    const est = estimatePercentage(pos, isWaterBased, anchorIndex);
    const belowAnchor = anchorIndex >= 0 && idx >= anchorIndex;

    let status = 'neutral';
    let label = 'Basis- / Hilfsstoff';
    let desc = belowAnchor ? 'Unterhalb der 1-%-Linie (Hilfs-, Konservierungs- oder Zusatzstoff).' : 'Träger-, Emulgator- oder Basisstoff.';

    if (rule) {
      label = rule.name;
      desc = rule.desc;
      status = rule.severity;

      if (rule.category === 'bad_alcohol') {
        if (pos <= 6 && !belowAnchor) {
          status = 'bad';
          desc = `Steht weit vorne (Platz ${pos}, ${est}) – trocknet aus & reizt die Hautbarriere!`;
          flags.badAlcoholHigh.push(raw);
        } else {
          status = 'neutral';
          desc = `Steht weit hinten (Platz ${pos}, ${est}) – vermutlich nur Lösungsmittel/Extrakt-Träger (< 1 %), i. d. R. unkritisch.`;
          flags.badAlcoholLow.push(raw);
        }
      } else if (rule.category === 'fragrance' || rule.category === 'fragrance_allergen') {
        flags.fragrance.push(raw);
      } else if (rule.category === 'essential_oil') {
        flags.essentialOil.push(raw);
      } else if (rule.category === 'scrub') {
        flags.scrub.push(raw);
      } else if (rule.category === 'harsh_surfactant') {
        flags.harshSurfactant.push(raw);
      } else if (rule.category === 'sles') {
        flags.sles.push(raw);
      } else if (rule.category === 'bad_uv') {
        flags.badUv.push(raw);
      } else if (rule.category === 'good_uv') {
        flags.goodUv.push(raw);
      } else if (rule.category.startsWith('keratolytic')) {
        flags.keratolytic.push(raw);
        if (rule.stingWarning) flags.stingTriggers.push(raw);
      } else if (rule.category === 'barrier_signal') {
        flags.barrier.push(raw);
      } else if (rule.category.startsWith('soothing') || rule.category === 'scalp_active') {
        flags.soothing.push(raw);
      } else if (rule.category.startsWith('humectant')) {
        flags.humectant.push(raw);
      } else if (rule.category.startsWith('sebum')) {
        flags.sebumActive.push(raw);
      } else if (rule.category === 'heavy_lipid') {
        if (pos <= 6) flags.heavyLipidHigh.push(raw);
      } else if (rule.category === 'light_lipid') {
        flags.lightLipid.push(raw);
      } else if (rule.category === 'mild_surfactant') {
        flags.mildSurfactant.push(raw);
      }

      if (rule.needsHighPos && belowAnchor) {
        status = 'warn';
        desc += ' ⚠️ Steht erst hinter der 1-%-Linie – wahrscheinlich zu niedrig dosiert (Blender-Gefahr)!';
        flags.blenderWarnings.push(raw);
      }
    } else if (pos === 1 && isWaterBased) {
      label = 'Wasser (Basis)';
      desc = 'Hauptlösungsmittel (ca. 60–85 % bei wasserbasierten Produkten).';
    }

    return {
      pos,
      raw,
      label,
      desc,
      est,
      status,
      isAnchor: idx === anchorIndex,
      anchorLabel: idx === anchorIndex ? anchorInfo.label : null
    };
  });

  // Sondercheck: Echtes vs. falsches Duschöl
  let showerOilWarning = null;
  if (detectedCategory === 'shower_oil') {
    const firstIsOil = /oil|olea|glycine soja|ricinus|helianthus|prunus/.test(items[0].toLowerCase());
    if (!firstIsOil && isWaterBased && (flags.sles.length || flags.harshSurfactant.length)) {
      showerOilWarning = 'Falsches „Duschöl“! Wasser steht auf Platz 1 + Sulfat-Tenside – reinigt wie ein austrocknendes Duschgel statt wie ein echtes Öl (50–65 % Pflanzenöl auf Platz 1–2).';
    }
  }

  // --- DYNAMISCHE BEWERTUNG FÜR DAS AKTIVE HAUTPROFIL ---
  const isStrictSensitive =
    skinType === 'sensitive' || hasCond('psoriasis') || hasCond('neurodermitis') || hasCond('rosacea');
  const isOilyProne =
    skinType === 'oily' || skinType === 'combination' || hasCond('seborrhoe') || hasCond('acne');
  const isDryProne =
    skinType === 'dry' || hasCond('neurodermitis');

  let score = 86;
  const reasons = [];
  const warnings = [];

  // 1. Duftstoffe
  if (flags.fragrance.length) {
    const pen = isStrictSensitive ? 35 : 14;
    score -= pen;
    warnings.push(
      `Duftstoffe/Allergene (${flags.fragrance.slice(0, 3).join(', ')})` +
        (isStrictSensitive ? ' – starker Reiz- & Allergie-Trigger für dein Profil.' : ' – unnötiges Reizpotenzial.')
    );
  }

  // 2. Alkohol weit vorne
  if (flags.badAlcoholHigh.length) {
    const pen = isStrictSensitive || isDryProne ? 30 : 20;
    score -= pen;
    warnings.push(
      `Austrocknender Alkohol weit vorne (${flags.badAlcoholHigh.join(', ')}) – schwächt die Lipidbarriere` +
        (isOilyProne ? ' und fördert „dehydrated oily skin“ / Nachfetten.' : ' & kann brennen.')
    );
  } else if (flags.badAlcoholLow.length) {
    reasons.push('Alkohol steht erst unter der 1-%-Linie – i. d. R. unkritisch');
  }

  // 3. Ätherische Öle / Menthol
  if (flags.essentialOil.length) {
    const isCwcShampoo = detectedCategory === 'shampoo' && hasCond('curly_oily') && !isStrictSensitive;
    if (isCwcShampoo) {
      reasons.push('Menthol/erfrischende Extrakte im Ansatz-Shampoo (bei CWC-Technik OK für fettige Kopfhaut)');
    } else {
      score -= isStrictSensitive ? 28 : 14;
      warnings.push(`Ätherische Öle / Reizstoffe (${flags.essentialOil.join(', ')}) – hohes Reiz- & Rötungspotenzial.`);
    }
  }

  // 4. Mechanische Reibekörper
  if (flags.scrub.length) {
    score -= hasCond('psoriasis') || hasCond('rosacea') ? 40 : 18;
    warnings.push(
      `Mechanische Reibekörper (${flags.scrub.join(', ')})` +
        (hasCond('psoriasis') ? ' – hohes Risiko für das Koebner-Phänomen (neue Plaques)!' : ' – können Mikroverletzungen & Rötungen fördern.')
    );
  }

  // 5. Tenside
  if (flags.harshSurfactant.length) {
    score -= 30;
    warnings.push(`Aggressives Sulfat-Tensid (${flags.harshSurfactant.join(', ')}) – zerstört Barrierelipide.`);
  }
  if (flags.sles.length) {
    if (detectedCategory === 'shampoo' && (hasCond('curly_oily') || skinType === 'oily') && !hasCond('psoriasis')) {
      score += 4;
      reasons.push('SLES im Shampoo entfettet fettigen Ansatz gründlich (mit CWC-Spitzenschutz anwenden)');
    } else if (isStrictSensitive || isDryProne || detectedCategory !== 'shampoo') {
      score -= 18;
      warnings.push('SLES enthalten – für Gesicht/empfindliche oder trockene Haut zu entfettend.');
    }
  }

  // 6. Schwere Lipide bei fettiger Haut / Seborrhoe / Akne
  if (flags.heavyLipidHigh.length && ['moisturizer', 'sunscreen', 'serum'].includes(detectedCategory)) {
    if (isOilyProne) {
      score -= skinType === 'combination' && !hasCond('acne') ? 18 : 30;
      warnings.push(
        `Sehr reichhaltig/okklusiv (${flags.heavyLipidHigh.slice(0, 2).join(', ')} weit vorne) – kann bei fettiger Haut, Seborrhoe oder Akne Glanz & Unreinheiten fördern.`
      );
    } else if (isDryProne || hasCond('psoriasis')) {
      score += 6;
      reasons.push(`Schützende Lipide (${flags.heavyLipidHigh.slice(0, 2).join(', ')}) – ideal für Barriere/Winter/Plaques`);
    }
  }

  // 7. UV-Filter
  if (flags.badUv.length) {
    score -= isStrictSensitive ? 15 : 8;
    warnings.push(`Älterer/kritischer UV-Filter (${flags.badUv.join(', ')}) – höheres Allergierisiko.`);
  }
  if (flags.goodUv.length >= 2) {
    score += hasCond('pih') || hasCond('rosacea') || hasCond('psoriasis') ? 8 : 5;
    reasons.push(`Moderne, photostabile UV-Filter (${flags.goodUv.length}x) – schützt vor UV-Schüben & Pigmentflecken`);
  }

  // 8. Keratolyse / Säuren / Urea
  if (flags.keratolytic.length) {
    if (hasCond('rosacea')) {
      score -= 12;
      warnings.push(`Enthält ${flags.keratolytic.join(', ')} – bei Rosazea sehr vorsichtig testen (Flush-/Reizgefahr).`);
    } else {
      score += hasCond('psoriasis') || hasCond('acne') || hasCond('seborrhoe') ? 6 : 4;
      reasons.push(`Gezielte Keratolyse / Porenklärung (${flags.keratolytic.join(', ')})`);
    }
  }
  if (flags.stingTriggers.length && (hasCond('psoriasis') || hasCond('neurodermitis'))) {
    warnings.push(`Kein-Brennen-Regel: ${flags.stingTriggers.join(', ')} strikt nur auf geschlossene Haut auftragen, nicht auf offene Risse!`);
  }

  // 9. Weitere Pluspunkte
  if (flags.barrier.length) { score += isDryProne || isStrictSensitive ? 8 : 5; reasons.push(`Barrierelipide/Ceramide (${flags.barrier.slice(0, 3).join(', ')})`); }
  if (flags.soothing.length) { score += 5; reasons.push(`Beruhigend & antientzündlich (${flags.soothing.slice(0, 3).join(', ')})`); }
  if (flags.humectant.length) { score += 4; reasons.push(`Feuchthalter / NMF (${flags.humectant.slice(0, 3).join(', ')})`); }
  if (flags.mildSurfactant.length) { score += 5; reasons.push('Milde, barrierefreundliche Tenside'); }
  if (flags.sebumActive.length && (isOilyProne || hasCond('rosacea') || hasCond('pih'))) {
    score += 8;
    reasons.push(`Talg-/Rötungs-/PIH-Wirkstoffe (${flags.sebumActive.slice(0, 3).join(', ')})`);
  }
  if (flags.lightLipid.length && !flags.heavyLipidHigh.length && (isOilyProne || skinType === 'normal')) {
    score += 4;
    reasons.push('Leichte, nicht-komedogene Lipidbasis');
  }
  if (showerOilWarning) { score -= 25; warnings.push(showerOilWarning); }
  if (flags.blenderWarnings.length) { score -= 8; warnings.push(`Kernwirkstoff hinter 1-%-Linie (evtl. zu niedrig dosiert): ${flags.blenderWarnings.join(', ')}.`); }

  score = Math.max(5, Math.min(100, score));

  // --- ALLGEMEINE 5-HAUTTYPEN-MATRIX (für „Zu welchem Hauttyp passt es?“) ---
  const skinTypes = buildSkinTypeMatrix(flags, detectedCategory, showerOilWarning);

  // --- PFLEGEPLAN-EINORDNUNG ---
  const routinePlacement = buildRoutinePlacement({
    skinType,
    conditions,
    detectedCategory,
    flags,
    score
  });

  const verdict = scoreToVerdict(score);

  return {
    productName: productName.trim() || 'Unbenanntes Produkt',
    category: detectedCategory,
    categoryLabel: CATEGORY_LABELS[detectedCategory] || 'Hautpflege',
    sourceUrl,
    skinProfile: { skinType, conditions },
    profileLabel,
    score,
    verdict,
    reasons,
    warnings,
    skinTypes,
    routinePlacement,
    anchorFound: anchorIndex >= 0,
    anchorPos: anchorIndex >= 0 ? anchorIndex + 1 : null,
    anchorLabel: anchorInfo ? anchorInfo.label : null,
    totalCount: items.length,
    breakdown,
    rawInci: items.join(', '),
    timestamp: new Date().toISOString()
  };
}

function buildSkinTypeMatrix(flags, detectedCategory, showerOilWarning) {
  const clamp = (n) => Math.max(5, Math.min(100, n));

  let normal = 85;
  if (flags.fragrance.length) normal -= 12;
  if (flags.badAlcoholHigh.length) normal -= 22;
  if (flags.harshSurfactant.length) normal -= 25;
  if (flags.humectant.length || flags.soothing.length) normal += 6;
  normal = clamp(normal);

  let dry = 80;
  if (flags.heavyLipidHigh.length || flags.barrier.length || flags.humectant.length) dry += 14;
  if (flags.badAlcoholHigh.length || flags.harshSurfactant.length || flags.sles.length) dry -= 30;
  if (flags.fragrance.length) dry -= 12;
  if (showerOilWarning) dry -= 20;
  dry = clamp(dry);

  let oily = 84;
  if (flags.heavyLipidHigh.length && ['moisturizer', 'sunscreen', 'serum'].includes(detectedCategory)) oily -= 32;
  if (flags.sebumActive.length || flags.keratolytic.some((k) => /salicylic/i.test(k))) oily += 10;
  if (flags.badAlcoholHigh.length || flags.harshSurfactant.length) oily -= 22;
  if (flags.fragrance.length) oily -= 12;
  if (flags.lightLipid.length && !flags.heavyLipidHigh.length) oily += 5;
  oily = clamp(oily);

  let combo = Math.round((normal + oily) / 2);

  let sensitive = 88;
  if (flags.fragrance.length) sensitive -= 35;
  if (flags.badAlcoholHigh.length) sensitive -= 30;
  if (flags.essentialOil.length) sensitive -= 28;
  if (flags.scrub.length) sensitive -= 38;
  if (flags.harshSurfactant.length) sensitive -= 30;
  if (flags.badUv.length) sensitive -= 15;
  if (flags.barrier.length || flags.soothing.length) sensitive += 8;
  sensitive = clamp(sensitive);

  return [
    { id: 'normal', name: 'Normale Haut', score: normal, verdict: scoreToVerdict(normal), note: normal >= 75 ? 'Gut geeignet für die tägliche Basispflege.' : 'Enthält unnötig austrocknende/reizende Stoffe.' },
    { id: 'dry', name: 'Trockene Haut / Barriereschutz', score: dry, verdict: scoreToVerdict(dry), note: flags.heavyLipidHigh.length || flags.barrier.length ? 'Pflegend & lipidergänzend.' : 'Eher leicht – im Winter ggf. kombinieren.' },
    { id: 'oily', name: 'Fettige Haut / Seborrhoe / Unrein', score: oily, verdict: scoreToVerdict(oily), note: flags.heavyLipidHigh.length ? 'Für fettige Gesichtshaut tagsüber oft zu schwer.' : 'Leicht & gut verträglich.' },
    { id: 'combination', name: 'Mischhaut', score: combo, verdict: scoreToVerdict(combo), note: flags.heavyLipidHigh.length ? 'Eher für trockene Wangen als für die T-Zone.' : 'Ausgewogen für T-Zone & Wangen.' },
    { id: 'sensitive', name: 'Empfindliche Haut / Psoriasis / Rosazea', score: sensitive, verdict: scoreToVerdict(sensitive), note: sensitive >= 75 ? 'Reizarm & barrierefreundlich.' : 'Wegen Duft-, Alkohol- oder Reizstoffen meiden.' }
  ];
}

function scoreToVerdict(score) {
  if (score >= 80) return { label: 'Passt sehr gut', cls: 'badge-ok', emoji: '✅' };
  if (score >= 58) return { label: 'Bedingt geeignet', cls: 'badge-warn', emoji: '⚠️' };
  return { label: 'Lieber meiden', cls: 'badge-bad', emoji: '🚫' };
}

function buildRoutinePlacement({ skinType, conditions, detectedCategory, flags, score }) {
  const hasCond = (c) => conditions.includes(c);

  if (score < 55) {
    return {
      slot: 'Nicht für dein gewähltes Hautprofil empfohlen',
      advice: 'Aufgrund der erkannten Reizstoffe oder unpassenden Textur lieber im Regal lassen (falls schon gekauft, höchstens an unempfindlichen Körperstellen aufbrauchen).',
      existingMatch: hasCond('psoriasis')
        ? 'Dein 14-Produkte-Psoriasis-Bestand deckt bereits alle Pflegeschritte reizfrei ab.'
        : 'Prüfe im Tab „Pflegeplan“ passende Alternativen.'
    };
  }

  // Spezifischer Bestandsabgleich für Psoriasis (Alex)
  if (hasCond('psoriasis')) {
    const alexMap = {
      cleanser: {
        slot: 'Gesicht AM/PM (Schritt 1) oder Körper-Dusche',
        advice: 'Lauwarm reinigen, danach nur trocken tupfen (nicht rubbeln!) und innerhalb von 3 Minuten eincremen (Soak & Seal).',
        existingMatch: 'Im Bestand: ISANA med Ultra Sensitiv Totes Meer Waschlotion (#4).'
      },
      shower_oil: {
        slot: 'Körper-Dusche (besonders im Winter bei trockener Haut)',
        advice: 'Lauwarm (35–37 °C) 5–10 Min. duschen, danach direkt innerhalb von 3 Min. eincremen.',
        existingMatch: 'Im Bestand: ISANA med Totes Meer Waschlotion (#4) – echtes Duschöl (Öl auf Platz 1) ist ein gutes Winter-Upgrade.'
      },
      serum: {
        slot: flags.keratolytic.length
          ? 'Gesicht Abends (Spot auf geschlossene Schuppen/Bartansatz) & Plaque Schicht 1'
          : 'Gesicht Morgens & Abends (Schritt 2 – ganzes Gesicht & Bartansatz)',
        advice: flags.stingTriggers.length
          ? 'Auf leicht feuchte, geschlossene Haut geben. Bei offenen Rissen/Rhagaden pausieren (Stinging-Gefahr)!'
          : '2–3 Tropfen auf leicht feuchte Haut auftragen – stärkt die Barriere gegen den Koebner-Effekt.',
        existingMatch: flags.keratolytic.length
          ? 'Im Bestand: ISANA med 5% Urea Akut-Pflege Serum (#2).'
          : 'Im Bestand: ISANA Calming Barrier Serum (#1).'
      },
      moisturizer: {
        slot: flags.heavyLipidHigh.length
          ? 'Gesicht Abends (Schritt 3 – Winter/Nacht) & brennfreie SOS-Pflege'
          : 'Gesicht Abends (Schritt 3 – leichte Nachtpflege)',
        advice: 'Erbsengroße Menge über dem Serum auftragen. Morgens unter deinem LSF-50-Fluid meist nicht extra nötig.',
        existingMatch: 'Im Bestand: Balea med Gesichtscreme Ultra Sensitive (#12), Mixa Panthenol Comfort (#13) & Reserve ISANA med Panthenol Komfort (#14).'
      },
      sunscreen: {
        slot: 'Gesicht Morgens (Schritt 3+4 als 2-in-1 Tagespflege + UV-Schutz)',
        advice: 'Großzügig auftragen – verhindert Sonnenbrand-Trigger (Koebner-Effekt). Abends sanft abwaschen.',
        existingMatch: 'Im Bestand: ISANA Anti-UV Tagesfluid LSF 50 (#3).'
      },
      body_lotion: {
        slot: 'Körper täglich nach dem Duschen (Soak & Seal innerhalb von 3 Min.)',
        advice: flags.stingTriggers.length
          ? 'Ideal für geschlossene, schuppige Körperareale. Bei aufgekratzten Stellen auf brennfreie Pflege wechseln.'
          : 'Perfekt für die tägliche Basistherapie – auch auf gereizter Haut brennfrei nutzbar.',
        existingMatch: 'Im Bestand: ISANA med Barriereschutz Lotion (#5), Totes Meer Lotion (#6) & Mixa Panthenol Comfort (#13).'
      },
      ointment: {
        slot: 'Plaque-Intensivpflege Abends/Nachts (Schicht 2 – Okklusion / „Slugging“)',
        advice: 'Über dem 5% Urea Serum auf Ellbogen/Knie/Schienbeine auftragen – oder solo bei offenen, rissigen Herden.',
        existingMatch: 'Im Bestand: ISANA med Totes Meer Salbe (#7) & Mixa Panthenol Comfort (#13 tagsüber).'
      },
      exfoliant: {
        slot: 'Spezial-Behandlung bei dicken, geschlossenen Schuppenpanzern (2–3x/Woche abends)',
        advice: 'Strikt nur auf geschlossene Plaques! Nicht mit Urea am selben Abend kombinieren. Danach versiegeln & morgens LSF 50 nutzen.',
        existingMatch: 'Im Bestand: Neutrogena 2% BHA Waschgel (#11 als 3-Min-Dusch-Trick) / Nachkauf: ISANA 6% AHA.'
      },
      shampoo: {
        slot: flags.soothing.some((s) => /piroctone/i.test(s))
          ? 'Kopfhaut 2–3x/Woche bei Schuppung/Juckreiz (2–3 Min. einwirken lassen)'
          : 'Kopfhaut Alltag (milde Wäsche an den Zwischentagen)',
        advice: 'Mit den Fingerkuppen sanft einmassieren, niemals mit den Fingernägeln kratzen.',
        existingMatch: 'Im Bestand: ISANA med Anti-Schuppen (#8), Ultra Sensitiv (#9) & pH 5,5 (#10).'
      },
      lip_balm: {
        slot: 'Lippenpflege nach Bedarf (tagsüber / draußen)',
        advice: 'Reizfreie Lippenpflege schützt vor Einrissen und UV-Stress an den Lippen.',
        existingMatch: 'Gut kombinierbar mit deiner täglichen Routine.'
      }
    };
    if (alexMap[detectedCategory]) return alexMap[detectedCategory];
  }

  // Spezifischer Plan für Fettige Haut / Seborrhoe / Locken
  if (skinType === 'oily' || hasCond('seborrhoe') || hasCond('curly_oily')) {
    const partnerMap = {
      cleanser: {
        slot: 'Gesicht Morgens & Abends (Schritt 2 im Double Cleansing)',
        advice: 'Sanft 30 Sek. reinigen. Abends nach einem Reinigungsöl anwenden, um UV-Filter & Sebum zu lösen.',
        existingMatch: 'dm-Plan: Balea MED Ultra Sensitive Waschgel.'
      },
      exfoliant: {
        slot: 'Gesicht Abends (2–3x/Woche) + optional Kopfhaut Pre-Wash',
        advice: 'Auf T-Zone/Poren auftragen, 5–10 Min. einwirken lassen, danach leichtes Creme-Gel.',
        existingMatch: 'dm-Plan: Balea Beauty Expert Liquid Peeling 2% BHA.'
      },
      serum: {
        slot: 'Gesicht Morgens täglich & Abends an BHA-freien Tagen',
        advice: '3–4 Tropfen auf leicht feuchte Haut vor dem Sonnenschutz bzw. Creme-Gel.',
        existingMatch: 'dm-Plan: Balea Beauty Expert Azelain Booster / Niacinamide Serum.'
      },
      sunscreen: {
        slot: 'Gesicht Morgens – ALLEINIGE Tagespflege (keine Creme darunter!)',
        advice: '2 Fingerlängen auftragen; schützt vor Sebum-Oxidation und Pickelmalen (PIH). Abends per Double Cleansing entfernen.',
        existingMatch: 'dm-Plan: SUNDANCE 50+ Sensitiv Sonnenfluid.'
      },
      moisturizer: {
        slot: 'Gesicht Abends (leichter Abschluss)',
        advice: 'Erbsengroße Menge abends über dem Serum. Morgens unter LSF 50+ weglassen.',
        existingMatch: 'dm-Plan: Balea Aqua Feuchtigkeits Creme-Gel.'
      },
      shampoo: {
        slot: 'Haare Waschtag (alle 2–3 Tage) – CWC-Methode NUR auf die Kopfhaut!',
        advice: 'Vorher trockene Spitzen mit Spülung schützen (C1), dann Shampoo nur am Ansatz einmassieren.',
        existingMatch: 'dm-Plan: Balea Pure Frische ↔ Aqua Hyaluron Shampoo.'
      },
      conditioner: {
        slot: 'Haare – strikt ab Ohrhöhe abwärts (Längen & trockene Spitzen)',
        advice: 'Niemals an den fettigen Ansatz geben! Ideal für C1 (Spitzenschutz) & C2.',
        existingMatch: 'dm-Plan: Balea Prof. Aqua Hyaluron Serie / Langhaarmädchen Lockengel.'
      }
    };
    if (partnerMap[detectedCategory]) return partnerMap[detectedCategory];
  }

  // Allgemeine Pflegeplan-Zuordnung für alle anderen Kombinationen
  const generalMap = {
    cleanser: { slot: 'Morgens & Abends – Schritt 1 (Reinigung)', advice: 'Lauwarm reinigen und sanft trocken tupfen.', existingMatch: 'Basis-Schritt jeder Routine.' },
    serum: { slot: 'Morgens und/oder Abends – Schritt 2 (Wirkstoff-Serum)', advice: 'Auf leicht feuchte Haut auftragen und danach mit Creme oder LSF einschließen.', existingMatch: 'Gezielte Wirkstoff-Ergänzung.' },
    moisturizer: { slot: 'Morgens (unter LSF) und/oder Abends – Schritt 3 (Pflege)', advice: 'Je nach Hautgefühl dünn auftragen – bei trockener Haut ggf. abends etwas reichhaltiger.', existingMatch: 'Tägliche Barriere- und Feuchtigkeitspflege.' },
    sunscreen: { slot: 'Morgens – letzter Schritt (UV-Schutz)', advice: 'Großzügig auftragen (ca. 2 Fingerlängen fürs Gesicht), abends gründlich abwaschen.', existingMatch: 'Wichtigster Schutz gegen Hautalterung, Rötungen & Pigmentflecken.' },
    exfoliant: { slot: 'Abends – 1–3x pro Woche (Chemisches Peeling)', advice: 'Langsam einschleichen, nicht mit anderen Säuren kombinieren und tagsüber LSF 50 nutzen.', existingMatch: 'Aktiv-Behandlung nach Bedarf.' },
    body_lotion: { slot: 'Körper – direkt nach dem Duschen (Soak & Seal)', advice: 'Auf noch leicht feuchter Haut eincremen, um Feuchtigkeit einzuschließen.', existingMatch: 'Tägliche Körper-Basistherapie.' },
    ointment: { slot: 'Punktuell Abends / auf sehr trockenen Stellen', advice: 'Versiegelt Feuchtigkeit über Nacht und schützt rissige Areale.', existingMatch: 'Intensiv- & SOS-Pflege.' },
    shampoo: { slot: 'Haarwäsche (Kopfhaut)', advice: 'Sanft mit den Fingerkuppen einmassieren und lauwarm ausspülen.', existingMatch: 'Kopfhautpflege.' },
    conditioner: { slot: 'Haarlängen & Spitzen (nach dem Waschen)', advice: 'Nur in die Längen und Spitzen geben, Ansatz aussparen.', existingMatch: 'Haarpflege.' },
    lip_balm: { slot: 'Lippenpflege nach Bedarf', advice: 'Mehrmals täglich und bei Sonne/Kälte anwenden.', existingMatch: 'Alltags-Schutz.' }
  };

  return generalMap[detectedCategory] || {
    slot: 'Ergänzende Hautpflege (nach Bedarf)',
    advice: 'Zuerst kleinflächig testen und gut beobachten, wie deine Haut reagiert.',
    existingMatch: 'Individuelle Ergänzung.'
  };
}
