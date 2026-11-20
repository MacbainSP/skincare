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
  skinProfile = { skinType: 'normal', conditions: [] },
  userPlan = [],
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
    score,
    userPlan
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

function buildRoutinePlacement({ skinType, conditions, detectedCategory, flags, score, userPlan = [] }) {
  const hasCond = (c) => conditions.includes(c);

  // Empfohlenen Standard-Slot bestimmen
  let slotId = 'pm_care';
  let slot = 'Abends – Nachtpflege / Creme';
  let advice = 'Dünn auftragen und die Reaktion deiner Haut beobachten.';

  if (detectedCategory === 'cleanser') {
    slotId = 'am_cleanse';
    slot = 'Morgens & Abends – Reinigung';
    advice = 'Lauwarm reinigen und sanft trocken tupfen (nicht rubbeln).' + (skinType === 'oily' || hasCond('seborrhoe') ? ' Abends bei wasserfestem LSF ideal als 2. Schritt nach einem Reinigungsöl.' : '');
  } else if (detectedCategory === 'shower_oil') {
    slotId = 'body';
    slot = 'Körper – Dusche';
    advice = 'Lauwarm (35–37 °C) duschen und danach direkt innerhalb von 3 Minuten eincremen (Soak & Seal).';
  } else if (detectedCategory === 'sunscreen') {
    slotId = 'am_care';
    slot = 'Morgens – UV-Schutz (letzter Schritt)';
    advice = 'Großzügig auftragen (ca. 2 Fingerlängen fürs Gesicht).' + (skinType === 'oily' || hasCond('seborrhoe') ? ' Ersetzt morgens bei fettiger Haut die Tagescreme – abends gründlich abwaschen.' : ' Schützt zuverlässig vor UV-Triggern & Pigmentflecken.');
  } else if (detectedCategory === 'serum') {
    if (flags.keratolytic.length) {
      slotId = 'pm_treatment';
      slot = 'Abends – Wirkstoff-Serum / Spot-Treatment';
      advice = 'Auf geschlossene Haut auftragen.' + (flags.stingTriggers.length ? ' Nicht auf offene oder gereizte Stellen geben (Brenn-Gefahr)!' : '');
    } else {
      slotId = 'am_serum';
      slot = 'Morgens & Abends – Serum / Wirkstoff';
      advice = '2–3 Tropfen auf die noch leicht feuchte Haut auftragen und danach mit Creme oder LSF einschließen.';
    }
  } else if (detectedCategory === 'exfoliant') {
    slotId = 'pm_treatment';
    slot = 'Abends – Chemisches Peeling (1–3x pro Woche)';
    advice = 'Langsam einschleichen, nicht mit anderen starken Säuren/Urea am selben Abend kombinieren und morgens LSF 50 nutzen.';
  } else if (detectedCategory === 'moisturizer') {
    if (flags.heavyLipidHigh.length) {
      slotId = 'pm_care';
      slot = 'Abends – Reichhaltige Nachtpflege / Barriere-Creme';
      advice = 'Ideal als schützender Abschluss abends oder im Winter über einem Serum.';
    } else {
      slotId = 'pm_care';
      slot = 'Morgens (unter LSF) und/oder Abends – Gesichtscreme';
      advice = 'Leichte Pflege nach dem Serum auftragen.';
    }
  } else if (detectedCategory === 'body_lotion') {
    slotId = 'body';
    slot = 'Körper – Tägliche Basistherapie (nach dem Duschen)';
    advice = 'Direkt innerhalb von 3 Minuten nach dem Duschen auf die noch leicht feuchte Haut auftragen (Soak & Seal).';
  } else if (detectedCategory === 'ointment') {
    slotId = 'sos';
    slot = 'Spezial- / SOS-Pflege (punktuell & über Nacht)';
    advice = 'Versiegelt Feuchtigkeit auf trockenen, schuppigen oder rissigen Stellen („Slugging“).';
  } else if (detectedCategory === 'shampoo') {
    slotId = 'hair';
    slot = 'Kopfhaut & Haare – Haarwäsche';
    advice = hasCond('curly_oily')
      ? 'Nur auf die Kopfhaut/den Ansatz geben (CWC-Methode: vorher trockene Spitzen mit Spülung schützen).'
      : 'Sanft mit den Fingerkuppen einmassieren, nicht kratzen.';
  } else if (detectedCategory === 'conditioner') {
    slotId = 'hair';
    slot = 'Haare – Längen & Spitzen';
    advice = hasCond('curly_oily')
      ? 'Strikt ab Ohrhöhe abwärts in die Längen & Spitzen geben – niemals an den fettigen Ansatz!'
      : 'Nach dem Waschen in Längen und Spitzen einarbeiten.';
  } else if (detectedCategory === 'lip_balm') {
    slotId = 'sos';
    slot = 'Lippenpflege (nach Bedarf)';
    advice = 'Tagsüber und bei Sonne/Kälte zum Schutz der Lippenbarriere nutzen.';
  }

  if (score < 55) {
    advice = '⚠️ Für dein gewähltes Hautprofil wegen der erkannten Reizstoffe/Textur eher nicht empfohlen. ' + advice;
  }

  const sameSlotItems = (userPlan || []).filter((p) => p.slotId === slotId);
  const existingMatch = sameSlotItems.length
    ? `In diesem Schritt hast du bereits gespeichert: ${sameSlotItems.map((p) => p.productName).join(', ')}.`
    : 'Dieser Schritt ist in deinem persönlichen Pflegeplan noch frei – du kannst das Produkt unten direkt hinzufügen.';

  return { slotId, slot, advice, existingMatch };
}
