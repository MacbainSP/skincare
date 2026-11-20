import { INCI_DB, ONE_PERCENT_ANCHORS, formatSkinProfileLabel } from './data.js';
import { pickLang } from './i18n.js';

export function parseInciList(rawText) {
  if (!rawText) return [];
  let cleaned = rawText
    .replace(/\r?\n/g, ', ')
    .replace(/^(ingredients|inhaltsstoffe|inci|bestandteile)\s*[:\-]?\s*/i, '')
    .replace(/\s*\.\s*$/, '')
    .replace(/;/g, ',');

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

function estimatePercentage(pos1Based, isWaterBased, anchorIndex, lang = 'de') {
  const approx = lang === 'en' ? '~' : 'ca. ';
  if (anchorIndex >= 0 && pos1Based - 1 >= anchorIndex) return '≤ 1 %';
  if (pos1Based === 1) return isWaterBased ? `${approx}60–85 %` : `${approx}40–70 %`;
  if (pos1Based === 2) return `${approx}8–15 %`;
  if (pos1Based <= 4) return `${approx}3–7 %`;
  if (pos1Based <= 7) return lang === 'en' ? '~1.5–3 %' : 'ca. 1,5–3 %';
  return anchorIndex >= 0 ? `${approx}1–2 %` : `${approx}≤ 1–2 %`;
}

export function detectCategory(productName = '', items = [], userCategory = 'auto') {
  if (userCategory && userCategory !== 'auto') return userCategory;
  const name = (productName || '').toLowerCase();
  const joined = items.join(' ').toLowerCase();

  if (/lippen|lip\s*balm|lippenpflege/.test(name)) return 'lip_balm';
  if (/lsf|spf|sonnen|anti-uv|uv-fluid|sunscreen|sun\s*fluid/.test(name)) return 'sunscreen';
  if (/shampoo/.test(name)) return 'shampoo';
  if (/spülung|conditioner|haarmaske|hair\s*mask|lockengel|haaröl|trockenshampoo/.test(name)) return 'conditioner';
  if (/duschöl|shower\s*oil/.test(name)) return 'shower_oil';
  if (/peeling|exfoliant|bha|aha|pha|salicyl|glykol|glycolic/.test(name)) return 'exfoliant';
  if (/waschgel|waschlotion|reinigung|cleanser|face\s*wash|mizellen|duschgel/.test(name)) return 'cleanser';
  if (/salbe|balsam|ointment|balm/.test(name)) return 'ointment';
  if (/körperlotion|körpermilch|body\s*lotion|body\s*cream/.test(name)) return 'body_lotion';
  if (/serum|konzentrat|booster|ampulle|concentrate/.test(name)) return 'serum';
  if (/creme|cream|fluid|gel|lotion|moisturizer|pflege/.test(name)) return 'moisturizer';

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
  cleanser: { de: 'Gesichtsreinigung / Waschlotion', en: 'Cleanser / Wash' },
  serum: { de: 'Serum / Konzentrat', en: 'Serum / Concentrate' },
  moisturizer: { de: 'Gesichtscreme / Pflege', en: 'Moisturizer / Fluid' },
  sunscreen: { de: 'Sonnenschutz (LSF)', en: 'Sunscreen (SPF)' },
  body_lotion: { de: 'Körperlotion / Körpercreme', en: 'Body Lotion / Cream' },
  ointment: { de: 'Plaque-Salbe / Okklusivpflege', en: 'Ointment / Occlusive Balm' },
  shower_oil: { de: 'Duschöl / Körperreinigung', en: 'Shower Oil / Body Wash' },
  exfoliant: { de: 'Chemisches Peeling (AHA/BHA/PHA)', en: 'Chemical Exfoliant (AHA/BHA/PHA)' },
  shampoo: { de: 'Shampoo / Kopfhaut', en: 'Shampoo / Scalp' },
  conditioner: { de: 'Spülung / Haarmaske / Styling', en: 'Conditioner / Hair Mask / Styling' },
  lip_balm: { de: 'Lippenpflege', en: 'Lip Care' }
};

export function analyzeInci({
  productName = '',
  rawInci = '',
  category = 'auto',
  skinProfile = { skinType: 'normal', conditions: [] },
  userPlan = [],
  sourceUrl = '',
  lang = 'de'
}) {
  const isEn = lang === 'en';
  const items = parseInciList(rawInci);
  if (items.length === 0) {
    throw new Error(
      isEn
        ? 'No valid INCI list detected. Please enter comma-separated ingredients.'
        : 'Keine gültige INCI-Liste erkannt. Bitte kommagetrennte Inhaltsstoffe eingeben.'
    );
  }

  const skinType = skinProfile?.skinType || 'normal';
  const conditions = Array.isArray(skinProfile?.conditions) ? skinProfile.conditions : [];
  const hasCond = (c) => conditions.includes(c);
  const profileLabel = formatSkinProfileLabel({ skinType, conditions }, lang);

  const detectedCategory = detectCategory(productName, items, category);
  const isWaterBased = /^aqua\b|^water\b/i.test(items[0]);
  const { index: anchorIndex, anchor: anchorInfo } = findAnchorIndex(items);

  const flags = {
    fragrance: [], badAlcoholHigh: [], badAlcoholLow: [], essentialOil: [],
    scrub: [], harshSurfactant: [], sles: [], badUv: [], goodUv: [],
    keratolytic: [], barrier: [], soothing: [], humectant: [], sebumActive: [],
    heavyLipidHigh: [], lightLipid: [], mildSurfactant: [], blenderWarnings: [], stingTriggers: []
  };

  const breakdown = items.map((raw, idx) => {
    const pos = idx + 1;
    const norm = raw.toLowerCase();
    const rule = matchInciRule(norm);
    const est = estimatePercentage(pos, isWaterBased, anchorIndex, lang);
    const belowAnchor = anchorIndex >= 0 && idx >= anchorIndex;

    let status = 'neutral';
    let label = isEn ? 'Base / Auxiliary' : 'Basis- / Hilfsstoff';
    let desc = belowAnchor
      ? (isEn ? 'Below the 1% line (preservative, stabilizer, or trace additive).' : 'Unterhalb der 1-%-Linie (Hilfs-, Konservierungs- oder Zusatzstoff).')
      : (isEn ? 'Carrier, emulsifier, or base ingredient.' : 'Träger-, Emulgator- oder Basisstoff.');

    if (rule) {
      label = pickLang(rule.name, lang);
      desc = pickLang(rule.desc, lang);
      status = rule.severity;

      if (rule.category === 'bad_alcohol') {
        if (pos <= 6 && !belowAnchor) {
          status = 'bad';
          desc = isEn
            ? `High up on the list (pos. ${pos}, ${est}) – drying & irritating to the skin barrier!`
            : `Steht weit vorne (Platz ${pos}, ${est}) – trocknet aus & reizt die Hautbarriere!`;
          flags.badAlcoholHigh.push(raw);
        } else {
          status = 'neutral';
          desc = isEn
            ? `Low on the list (pos. ${pos}, ${est}) – likely a solvent/extract carrier (< 1%), usually unproblematic.`
            : `Steht weit hinten (Platz ${pos}, ${est}) – vermutlich nur Lösungsmittel/Extrakt-Träger (< 1 %), i. d. R. unkritisch.`;
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
        desc += isEn
          ? ' ⚠️ Listed after the 1% line – likely under-dosed (marketing dose)!'
          : ' ⚠️ Steht erst hinter der 1-%-Linie – wahrscheinlich zu niedrig dosiert (Blender-Gefahr)!';
        flags.blenderWarnings.push(raw);
      }
    } else if (pos === 1 && isWaterBased) {
      label = isEn ? 'Water (Base)' : 'Wasser (Basis)';
      desc = isEn ? 'Main solvent (~60–85% in water-based formulas).' : 'Hauptlösungsmittel (ca. 60–85 % bei wasserbasierten Produkten).';
    }

    return {
      pos, raw, label, desc, est, status,
      isAnchor: idx === anchorIndex,
      anchorLabel: idx === anchorIndex ? pickLang(anchorInfo.label, lang) : null
    };
  });

  let showerOilWarning = null;
  if (detectedCategory === 'shower_oil') {
    const firstIsOil = /oil|olea|glycine soja|ricinus|helianthus|prunus/.test(items[0].toLowerCase());
    if (!firstIsOil && isWaterBased && (flags.sles.length || flags.harshSurfactant.length)) {
      showerOilWarning = isEn
        ? 'Not a true “shower oil”! Water is #1 + sulfate surfactants – cleanses like a drying shower gel rather than a true oil (50–65% plant oil at #1–2).'
        : 'Falsches „Duschöl“! Wasser steht auf Platz 1 + Sulfat-Tenside – reinigt wie ein austrocknendes Duschgel statt wie ein echtes Öl (50–65 % Pflanzenöl auf Platz 1–2).';
    }
  }

  const isStrictSensitive = skinType === 'sensitive' || hasCond('psoriasis') || hasCond('neurodermitis') || hasCond('rosacea');
  const isOilyProne = skinType === 'oily' || skinType === 'combination' || hasCond('seborrhoe') || hasCond('acne');
  const isDryProne = skinType === 'dry' || hasCond('neurodermitis');

  let score = 86;
  const reasons = [];
  const warnings = [];

  if (flags.fragrance.length) {
    score -= isStrictSensitive ? 35 : 14;
    warnings.push(
      isEn
        ? `Fragrance/allergens (${flags.fragrance.slice(0, 3).join(', ')})` + (isStrictSensitive ? ' – major irritation & allergy trigger for your profile.' : ' – unnecessary irritation risk.')
        : `Duftstoffe/Allergene (${flags.fragrance.slice(0, 3).join(', ')})` + (isStrictSensitive ? ' – starker Reiz- & Allergie-Trigger für dein Profil.' : ' – unnötiges Reizpotenzial.')
    );
  }

  if (flags.badAlcoholHigh.length) {
    score -= isStrictSensitive || isDryProne ? 30 : 20;
    warnings.push(
      isEn
        ? `Drying alcohol high up (${flags.badAlcoholHigh.join(', ')}) – weakens the lipid barrier` + (isOilyProne ? ' and can trigger dehydrated oily skin / rebound oiliness.' : ' and may sting.')
        : `Austrocknender Alkohol weit vorne (${flags.badAlcoholHigh.join(', ')}) – schwächt die Lipidbarriere` + (isOilyProne ? ' und fördert „dehydrated oily skin“ / Nachfetten.' : ' & kann brennen.')
    );
  } else if (flags.badAlcoholLow.length) {
    reasons.push(isEn ? 'Alcohol is below the 1% line – generally unproblematic' : 'Alkohol steht erst unter der 1-%-Linie – i. d. R. unkritisch');
  }

  if (flags.essentialOil.length) {
    const isCwcShampoo = detectedCategory === 'shampoo' && hasCond('curly_oily') && !isStrictSensitive;
    if (isCwcShampoo) {
      reasons.push(isEn ? 'Menthol/cooling extracts in scalp shampoo (fine for oily roots with CWC)' : 'Menthol/erfrischende Extrakte im Ansatz-Shampoo (bei CWC-Technik OK für fettige Kopfhaut)');
    } else {
      score -= isStrictSensitive ? 28 : 14;
      warnings.push(isEn
        ? `Essential oils / irritants (${flags.essentialOil.join(', ')}) – high irritation & redness risk.`
        : `Ätherische Öle / Reizstoffe (${flags.essentialOil.join(', ')}) – hohes Reiz- & Rötungspotenzial.`);
    }
  }

  if (flags.scrub.length) {
    score -= hasCond('psoriasis') || hasCond('rosacea') ? 40 : 18;
    warnings.push(isEn
      ? `Physical scrub particles (${flags.scrub.join(', ')})` + (hasCond('psoriasis') ? ' – high risk for the Koebner phenomenon (new plaques)!' : ' – can cause micro-tears & redness.')
      : `Mechanische Reibekörper (${flags.scrub.join(', ')})` + (hasCond('psoriasis') ? ' – hohes Risiko für das Koebner-Phänomen (neue Plaques)!' : ' – können Mikroverletzungen & Rötungen fördern.'));
  }

  if (flags.harshSurfactant.length) {
    score -= 30;
    warnings.push(isEn
      ? `Harsh sulfate surfactant (${flags.harshSurfactant.join(', ')}) – strips barrier lipids.`
      : `Aggressives Sulfat-Tensid (${flags.harshSurfactant.join(', ')}) – zerstört Barrierelipide.`);
  }
  if (flags.sles.length) {
    if (detectedCategory === 'shampoo' && (hasCond('curly_oily') || skinType === 'oily') && !hasCond('psoriasis')) {
      score += 4;
      reasons.push(isEn ? 'SLES cleanses oily roots thoroughly (use with CWC end protection)' : 'SLES im Shampoo entfettet fettigen Ansatz gründlich (mit CWC-Spitzenschutz anwenden)');
    } else if (isStrictSensitive || isDryProne || detectedCategory !== 'shampoo') {
      score -= 18;
      warnings.push(isEn ? 'Contains SLES – too stripping for sensitive, dry, or facial skin.' : 'SLES enthalten – für Gesicht/empfindliche oder trockene Haut zu entfettend.');
    }
  }

  if (flags.heavyLipidHigh.length && ['moisturizer', 'sunscreen', 'serum'].includes(detectedCategory)) {
    if (isOilyProne) {
      score -= skinType === 'combination' && !hasCond('acne') ? 18 : 30;
      warnings.push(isEn
        ? `Very rich/occlusive (${flags.heavyLipidHigh.slice(0, 2).join(', ')} high up) – may cause shine or clogged pores on oily/acne-prone skin.`
        : `Sehr reichhaltig/okklusiv (${flags.heavyLipidHigh.slice(0, 2).join(', ')} weit vorne) – kann bei fettiger Haut, Seborrhoe oder Akne Glanz & Unreinheiten fördern.`);
    } else if (isDryProne || hasCond('psoriasis')) {
      score += 6;
      reasons.push(isEn
        ? `Protective lipids (${flags.heavyLipidHigh.slice(0, 2).join(', ')}) – great for barrier/winter/plaques`
        : `Schützende Lipide (${flags.heavyLipidHigh.slice(0, 2).join(', ')}) – ideal für Barriere/Winter/Plaques`);
    }
  }

  if (flags.badUv.length) {
    score -= isStrictSensitive ? 15 : 8;
    warnings.push(isEn
      ? `Older/sensitizing UV filter (${flags.badUv.join(', ')}) – higher allergy potential.`
      : `Älterer/kritischer UV-Filter (${flags.badUv.join(', ')}) – höheres Allergierisiko.`);
  }
  if (flags.goodUv.length >= 2) {
    score += hasCond('pih') || hasCond('rosacea') || hasCond('psoriasis') ? 8 : 5;
    reasons.push(isEn
      ? `Modern photostable UV filters (${flags.goodUv.length}x) – protects against UV flare-ups & dark spots`
      : `Moderne, photostabile UV-Filter (${flags.goodUv.length}x) – schützt vor UV-Schüben & Pigmentflecken`);
  }

  if (flags.keratolytic.length) {
    if (hasCond('rosacea')) {
      score -= 12;
      warnings.push(isEn
        ? `Contains ${flags.keratolytic.join(', ')} – patch-test carefully with rosacea (flushing risk).`
        : `Enthält ${flags.keratolytic.join(', ')} – bei Rosazea sehr vorsichtig testen (Flush-/Reizgefahr).`);
    } else {
      score += hasCond('psoriasis') || hasCond('acne') || hasCond('seborrhoe') ? 6 : 4;
      reasons.push(isEn
        ? `Targeted keratolysis / pore clearing (${flags.keratolytic.join(', ')})`
        : `Gezielte Keratolyse / Porenklärung (${flags.keratolytic.join(', ')})`);
    }
  }
  if (flags.stingTriggers.length && (hasCond('psoriasis') || hasCond('neurodermitis'))) {
    warnings.push(isEn
      ? `No-Sting Rule: Apply ${flags.stingTriggers.join(', ')} strictly to intact skin, never to open cracks!`
      : `Kein-Brennen-Regel: ${flags.stingTriggers.join(', ')} strikt nur auf geschlossene Haut auftragen, nicht auf offene Risse!`);
  }

  if (flags.barrier.length) { score += isDryProne || isStrictSensitive ? 8 : 5; reasons.push(isEn ? `Barrier lipids/ceramides (${flags.barrier.slice(0, 3).join(', ')})` : `Barrierelipide/Ceramide (${flags.barrier.slice(0, 3).join(', ')})`); }
  if (flags.soothing.length) { score += 5; reasons.push(isEn ? `Soothing & anti-inflammatory (${flags.soothing.slice(0, 3).join(', ')})` : `Beruhigend & antientzündlich (${flags.soothing.slice(0, 3).join(', ')})`); }
  if (flags.humectant.length) { score += 4; reasons.push(isEn ? `Humectants / NMF (${flags.humectant.slice(0, 3).join(', ')})` : `Feuchthalter / NMF (${flags.humectant.slice(0, 3).join(', ')})`); }
  if (flags.mildSurfactant.length) { score += 5; reasons.push(isEn ? 'Gentle, barrier-friendly surfactants' : 'Milde, barrierefreundliche Tenside'); }
  if (flags.sebumActive.length && (isOilyProne || hasCond('rosacea') || hasCond('pih'))) {
    score += 8;
    reasons.push(isEn ? `Sebum/redness/PIH actives (${flags.sebumActive.slice(0, 3).join(', ')})` : `Talg-/Rötungs-/PIH-Wirkstoffe (${flags.sebumActive.slice(0, 3).join(', ')})`);
  }
  if (flags.lightLipid.length && !flags.heavyLipidHigh.length && (isOilyProne || skinType === 'normal')) {
    score += 4;
    reasons.push(isEn ? 'Lightweight, non-comedogenic lipid base' : 'Leichte, nicht-komedogene Lipidbasis');
  }
  if (showerOilWarning) { score -= 25; warnings.push(showerOilWarning); }
  if (flags.blenderWarnings.length) {
    score -= 8;
    warnings.push(isEn
      ? `Key active below the 1% line (possibly under-dosed): ${flags.blenderWarnings.join(', ')}.`
      : `Kernwirkstoff hinter 1-%-Linie (evtl. zu niedrig dosiert): ${flags.blenderWarnings.join(', ')}.`);
  }

  score = Math.max(5, Math.min(100, score));

  const skinTypes = buildSkinTypeMatrix(flags, detectedCategory, showerOilWarning, lang);
  const routinePlacement = buildRoutinePlacement({ skinType, conditions, detectedCategory, flags, score, userPlan, lang });
  const verdict = scoreToVerdict(score, lang);

  return {
    productName: productName.trim() || (isEn ? 'Unnamed Product' : 'Unbenanntes Produkt'),
    category: detectedCategory,
    categoryLabel: pickLang(CATEGORY_LABELS[detectedCategory], lang) || (isEn ? 'Skincare' : 'Hautpflege'),
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
    anchorLabel: anchorInfo ? pickLang(anchorInfo.label, lang) : null,
    totalCount: items.length,
    breakdown,
    rawInci: items.join(', '),
    timestamp: new Date().toISOString()
  };
}

function buildSkinTypeMatrix(flags, detectedCategory, showerOilWarning, lang = 'de') {
  const isEn = lang === 'en';
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
    {
      id: 'normal',
      name: isEn ? 'Normal Skin' : 'Normale Haut',
      score: normal,
      verdict: scoreToVerdict(normal, lang),
      note: normal >= 75
        ? (isEn ? 'Well suited for daily baseline care.' : 'Gut geeignet für die tägliche Basispflege.')
        : (isEn ? 'Contains unnecessarily drying/irritating ingredients.' : 'Enthält unnötig austrocknende/reizende Stoffe.')
    },
    {
      id: 'dry',
      name: isEn ? 'Dry Skin / Barrier Support' : 'Trockene Haut / Barriereschutz',
      score: dry,
      verdict: scoreToVerdict(dry, lang),
      note: flags.heavyLipidHigh.length || flags.barrier.length
        ? (isEn ? 'Nourishing & lipid-replenishing.' : 'Pflegend & lipidergänzend.')
        : (isEn ? 'Lighter formula – layer with a richer cream in winter if needed.' : 'Eher leicht – im Winter ggf. kombinieren.')
    },
    {
      id: 'oily',
      name: isEn ? 'Oily / Seborrhea / Blemish-Prone' : 'Fettige Haut / Seborrhoe / Unrein',
      score: oily,
      verdict: scoreToVerdict(oily, lang),
      note: flags.heavyLipidHigh.length
        ? (isEn ? 'Often too heavy for oily facial skin during the day.' : 'Für fettige Gesichtshaut tagsüber oft zu schwer.')
        : (isEn ? 'Lightweight & well tolerated.' : 'Leicht & gut verträglich.')
    },
    {
      id: 'combination',
      name: isEn ? 'Combination Skin' : 'Mischhaut',
      score: combo,
      verdict: scoreToVerdict(combo, lang),
      note: flags.heavyLipidHigh.length
        ? (isEn ? 'Better suited for dry cheeks than the oily T-zone.' : 'Eher für trockene Wangen als für die T-Zone.')
        : (isEn ? 'Balanced for both T-zone and cheeks.' : 'Ausgewogen für T-Zone & Wangen.')
    },
    {
      id: 'sensitive',
      name: isEn ? 'Sensitive / Psoriasis / Rosacea' : 'Empfindliche Haut / Psoriasis / Rosazea',
      score: sensitive,
      verdict: scoreToVerdict(sensitive, lang),
      note: sensitive >= 75
        ? (isEn ? 'Low-irritation & barrier-friendly.' : 'Reizarm & barrierefreundlich.')
        : (isEn ? 'Avoid due to fragrance, drying alcohol, or irritants.' : 'Wegen Duft-, Alkohol- oder Reizstoffen meiden.')
    }
  ];
}

function scoreToVerdict(score, lang = 'de') {
  const isEn = lang === 'en';
  if (score >= 80) return { label: isEn ? 'Great match' : 'Passt sehr gut', cls: 'badge-ok', emoji: '✅' };
  if (score >= 58) return { label: isEn ? 'Use with caution' : 'Bedingt geeignet', cls: 'badge-warn', emoji: '⚠️' };
  return { label: isEn ? 'Better avoid' : 'Lieber meiden', cls: 'badge-bad', emoji: '🚫' };
}

function buildRoutinePlacement({ skinType, conditions, detectedCategory, flags, score, userPlan = [], lang = 'de' }) {
  const isEn = lang === 'en';
  const hasCond = (c) => conditions.includes(c);

  let slotId = 'pm_care';
  let slot = isEn ? 'Evening – Night Moisturizer' : 'Abends – Nachtpflege / Creme';
  let advice = isEn ? 'Apply thinly and observe how your skin responds.' : 'Dünn auftragen und die Reaktion deiner Haut beobachten.';

  if (detectedCategory === 'cleanser') {
    slotId = 'am_cleanse';
    slot = isEn ? 'Morning & Evening – Cleanser' : 'Morgens & Abends – Reinigung';
    advice = isEn
      ? 'Cleanse with lukewarm water and pat dry gently (do not rub).' + (skinType === 'oily' || hasCond('seborrhoe') ? ' At night, great as step 2 after a cleansing oil to remove water-resistant SPF.' : '')
      : 'Lauwarm reinigen und sanft trocken tupfen (nicht rubbeln).' + (skinType === 'oily' || hasCond('seborrhoe') ? ' Abends bei wasserfestem LSF ideal als 2. Schritt nach einem Reinigungsöl.' : '');
  } else if (detectedCategory === 'shower_oil') {
    slotId = 'body';
    slot = isEn ? 'Body – Shower Wash' : 'Körper – Dusche';
    advice = isEn
      ? 'Shower lukewarm (35–37 °C) and moisturize within 3 minutes afterward (Soak & Seal).'
      : 'Lauwarm (35–37 °C) duschen und danach direkt innerhalb von 3 Minuten eincremen (Soak & Seal).';
  } else if (detectedCategory === 'sunscreen') {
    slotId = 'am_care';
    slot = isEn ? 'Morning – UV Protection (Final Step)' : 'Morgens – UV-Schutz (letzter Schritt)';
    advice = isEn
      ? 'Apply generously (~2 finger lengths for the face).' + (skinType === 'oily' || hasCond('seborrhoe') ? ' Replaces morning moisturizer on oily skin – wash off thoroughly at night.' : ' Protects reliably against UV triggers & dark spots.')
      : 'Großzügig auftragen (ca. 2 Fingerlängen fürs Gesicht).' + (skinType === 'oily' || hasCond('seborrhoe') ? ' Ersetzt morgens bei fettiger Haut die Tagescreme – abends gründlich abwaschen.' : ' Schützt zuverlässig vor UV-Triggern & Pigmentflecken.');
  } else if (detectedCategory === 'serum') {
    if (flags.keratolytic.length) {
      slotId = 'pm_treatment';
      slot = isEn ? 'Evening – Active Serum / Spot Treatment' : 'Abends – Wirkstoff-Serum / Spot-Treatment';
      advice = isEn
        ? 'Apply to intact skin.' + (flags.stingTriggers.length ? ' Avoid open or cracked areas (stinging risk)!' : '')
        : 'Auf geschlossene Haut auftragen.' + (flags.stingTriggers.length ? ' Nicht auf offene oder gereizte Stellen geben (Brenn-Gefahr)!' : '');
    } else {
      slotId = 'am_serum';
      slot = isEn ? 'Morning & Evening – Serum / Active' : 'Morgens & Abends – Serum / Wirkstoff';
      advice = isEn
        ? 'Apply 2–3 drops to slightly damp skin, then seal with moisturizer or SPF.'
        : '2–3 Tropfen auf die noch leicht feuchte Haut auftragen und danach mit Creme oder LSF einschließen.';
    }
  } else if (detectedCategory === 'exfoliant') {
    slotId = 'pm_treatment';
    slot = isEn ? 'Evening – Chemical Exfoliant (1–3x/week)' : 'Abends – Chemisches Peeling (1–3x pro Woche)';
    advice = isEn
      ? 'Introduce gradually, do not layer with other strong acids/urea on the same night, and wear SPF 50 in the morning.'
      : 'Langsam einschleichen, nicht mit anderen starken Säuren/Urea am selben Abend kombinieren und morgens LSF 50 nutzen.';
  } else if (detectedCategory === 'moisturizer') {
    slotId = 'pm_care';
    slot = flags.heavyLipidHigh.length
      ? (isEn ? 'Evening – Rich Night / Barrier Cream' : 'Abends – Reichhaltige Nachtpflege / Barriere-Creme')
      : (isEn ? 'Morning (under SPF) and/or Evening – Moisturizer' : 'Morgens (unter LSF) und/oder Abends – Gesichtscreme');
    advice = flags.heavyLipidHigh.length
      ? (isEn ? 'Ideal as a protective final layer at night or in winter over a serum.' : 'Ideal als schützender Abschluss abends oder im Winter über einem Serum.')
      : (isEn ? 'Apply lightweight care after your serum.' : 'Leichte Pflege nach dem Serum auftragen.');
  } else if (detectedCategory === 'body_lotion') {
    slotId = 'body';
    slot = isEn ? 'Body – Daily Moisturizer (After Shower)' : 'Körper – Tägliche Basistherapie (nach dem Duschen)';
    advice = isEn
      ? 'Apply within 3 minutes after showering to slightly damp skin (Soak & Seal).'
      : 'Direkt innerhalb von 3 Minuten nach dem Duschen auf die noch leicht feuchte Haut auftragen (Soak & Seal).';
  } else if (detectedCategory === 'ointment') {
    slotId = 'sos';
    slot = isEn ? 'Special / SOS Care (Spot & Overnight)' : 'Spezial- / SOS-Pflege (punktuell & über Nacht)';
    advice = isEn
      ? 'Seals in moisture on dry, scaly, or cracked areas (“slugging”).'
      : 'Versiegelt Feuchtigkeit auf trockenen, schuppigen oder rissigen Stellen („Slugging“).';
  } else if (detectedCategory === 'shampoo') {
    slotId = 'hair';
    slot = isEn ? 'Scalp & Hair – Wash' : 'Kopfhaut & Haare – Haarwäsche';
    advice = hasCond('curly_oily')
      ? (isEn ? 'Apply only to the scalp/roots (CWC method: coat dry ends with conditioner first).' : 'Nur auf die Kopfhaut/den Ansatz geben (CWC-Methode: vorher trockene Spitzen mit Spülung schützen).')
      : (isEn ? 'Massage gently with fingertips, never scratch with nails.' : 'Sanft mit den Fingerkuppen einmassieren, nicht kratzen.');
  } else if (detectedCategory === 'conditioner') {
    slotId = 'hair';
    slot = isEn ? 'Hair – Lengths & Ends' : 'Haare – Längen & Spitzen';
    advice = hasCond('curly_oily')
      ? (isEn ? 'Apply strictly from ear-level down to lengths & ends – never to oily roots!' : 'Strikt ab Ohrhöhe abwärts in die Längen & Spitzen geben – niemals an den fettigen Ansatz!')
      : (isEn ? 'Work into lengths and ends after washing.' : 'Nach dem Waschen in Längen und Spitzen einarbeiten.');
  } else if (detectedCategory === 'lip_balm') {
    slotId = 'sos';
    slot = isEn ? 'Lip Care (As Needed)' : 'Lippenpflege (nach Bedarf)';
    advice = isEn
      ? 'Use throughout the day and in sun/cold to protect the lip barrier.'
      : 'Tagsüber und bei Sonne/Kälte zum Schutz der Lippenbarriere nutzen.';
  }

  if (score < 55) {
    advice = (isEn
      ? '⚠️ Not recommended for your selected skin profile due to detected irritants or texture. '
      : '⚠️ Für dein gewähltes Hautprofil wegen der erkannten Reizstoffe/Textur eher nicht empfohlen. ') + advice;
  }

  const sameSlotItems = (userPlan || []).filter((p) => p.slotId === slotId);
  const existingMatch = sameSlotItems.length
    ? (isEn
        ? `Already saved in this step: ${sameSlotItems.map((p) => p.productName).join(', ')}.`
        : `In diesem Schritt hast du bereits gespeichert: ${sameSlotItems.map((p) => p.productName).join(', ')}.`)
    : (isEn
        ? 'This step is still open in your routine – you can add this product directly below.'
        : 'Dieser Schritt ist in deinem persönlichen Pflegeplan noch frei – du kannst das Produkt unten direkt hinzufügen.');

  return { slotId, slot, advice, existingMatch };
}
