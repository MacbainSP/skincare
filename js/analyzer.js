import { INCI_DB, ONE_PERCENT_ANCHORS } from './data.js';

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
export function analyzeInci({ productName = '', rawInci = '', category = 'auto', activeProfile = 'alex', sourceUrl = '' }) {
  const items = parseInciList(rawInci);
  if (items.length === 0) {
    throw new Error('Keine gültige INCI-Liste erkannt. Bitte kommagetrennte Inhaltsstoffe eingeben.');
  }

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

      // Positionsabhängige Sonderlogik
      if (rule.category === 'bad_alcohol') {
        if (pos <= 6 && !belowAnchor) {
          status = 'bad';
          desc = `Steht weit vorne (Platz ${pos}, ${est}) – trocknet aus & brennt auf Psoriasis-Plaques!`;
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

      // Blender-Check (Urea / Panthenol / Glycerin weit hinter 1-%-Anker)
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

  // --- BEWERTUNG FÜR ALEX (Normaler Hauttyp + Psoriasis vulgaris) ---
  let alexScore = 88;
  const alexReasons = [];
  const alexWarnings = [];

  if (flags.fragrance.length) {
    alexScore -= 35;
    alexWarnings.push(`Duftstoffe/Allergene erkannt (${flags.fragrance.slice(0, 3).join(', ')}) – Entzündungs- & Allergie-Trigger bei Psoriasis.`);
  }
  if (flags.badAlcoholHigh.length) {
    alexScore -= 30;
    alexWarnings.push(`Austrocknender Alkohol weit vorne (${flags.badAlcoholHigh.join(', ')}) – zerstört Lipide & brennt auf Plaques.`);
  }
  if (flags.essentialOil.length) {
    alexScore -= 28;
    alexWarnings.push(`Ätherische Öle / Reizstoffe (${flags.essentialOil.join(', ')}) – starkes Reizpotenzial.`);
  }
  if (flags.scrub.length) {
    alexScore -= 40;
    alexWarnings.push(`Mechanische Reibekörper (${flags.scrub.join(', ')}) – hohes Risiko für das Koebner-Phänomen (neue Plaques)!`);
  }
  if (flags.harshSurfactant.length) {
    alexScore -= 30;
    alexWarnings.push(`Aggressives Sulfat-Tensid (${flags.harshSurfactant.join(', ')}) – schädigt die Hautbarriere.`);
  }
  if (flags.sles.length && detectedCategory !== 'shampoo') {
    alexScore -= 18;
    alexWarnings.push(`SLES enthalten – für Psoriasis-Haut im Gesicht/Körper zu entfettend.`);
  }
  if (flags.badUv.length) {
    alexScore -= 15;
    alexWarnings.push(`Kritischer UV-Filter (${flags.badUv.join(', ')}) – erhöhtes Kontaktallergie-Risiko.`);
  }
  if (showerOilWarning) {
    alexScore -= 25;
    alexWarnings.push(showerOilWarning);
  }
  if (flags.blenderWarnings.length) {
    alexScore -= 8;
    alexWarnings.push(`Niedrig dosierte Kernwirkstoffe hinter der 1-%-Linie: ${flags.blenderWarnings.join(', ')}.`);
  }

  // Positiv-Punkte für Alex
  if (flags.barrier.length) { alexScore += 6; alexReasons.push(`Barrierelipide/Ceramide (${flags.barrier.slice(0, 3).join(', ')})`); }
  if (flags.soothing.length) { alexScore += 5; alexReasons.push(`Beruhigend & antientzündlich (${flags.soothing.slice(0, 3).join(', ')})`); }
  if (flags.keratolytic.length) { alexScore += 4; alexReasons.push(`Sanfte Keratolyse (${flags.keratolytic.join(', ')})`); }
  if (flags.humectant.length) { alexScore += 4; alexReasons.push(`Starke Feuchthalter (${flags.humectant.slice(0, 3).join(', ')})`); }
  if (flags.goodUv.length >= 2) { alexScore += 6; alexReasons.push(`Moderne, photostabile UV-Filter (${flags.goodUv.length}x)`); }
  if (flags.mildSurfactant.length) { alexScore += 5; alexReasons.push('Milde, barrierefreundliche Tenside'); }
  if (flags.badAlcoholLow.length && !flags.badAlcoholHigh.length) {
    alexReasons.push('Alkohol steht erst unter 1 % – für dich unkritisch');
  }
  if (flags.stingTriggers.length) {
    alexWarnings.push(`Kein-Brennen-Regel: Enthält ${flags.stingTriggers.join(', ')} – strikt nur auf geschlossene Haut auftragen, nicht auf offene Risse!`);
  }

  alexScore = Math.max(5, Math.min(100, alexScore));

  // --- BEWERTUNG FÜR FREUNDIN (Fettige Haut / Seborrhoe & Locken) ---
  let partnerScore = 84;
  const partnerNotes = [];
  if (flags.heavyLipidHigh.length && ['moisturizer', 'sunscreen', 'serum'].includes(detectedCategory)) {
    partnerScore -= 32;
    partnerNotes.push(`Zu reichhaltig/okklusiv für fettige Gesichtshaut (${flags.heavyLipidHigh.slice(0, 2).join(', ')} weit vorne) – fördert Glanz & Porenstau.`);
  }
  if (flags.fragrance.length) { partnerScore -= 15; partnerNotes.push('Enthält Parfum/Duftstoffe (unnötiges Reizrisiko).'); }
  if (flags.badAlcoholHigh.length) { partnerScore -= 20; partnerNotes.push('Viel austrocknender Alkohol – begünstigt „dehydrated oily skin“ & stärkeres Nachfetten.'); }
  if (flags.harshSurfactant.length) { partnerScore -= 25; partnerNotes.push('Zu harte Sulfate – zerstören Barriere & triggern Nachfetten.'); }
  if (flags.sles.length && detectedCategory === 'shampoo') {
    partnerScore += 5;
    partnerNotes.push('SLES im Shampoo: für fettigen Haaransatz geeignet, aber nur mit CWC-Spitzenschutz!');
  }
  if (flags.sebumActive.length || flags.keratolytic.some((k) => /salicylic/i.test(k))) {
    partnerScore += 10;
    partnerNotes.push('Top-Wirkstoffe gegen Sebum, Poren & Pickelmale (PIH)!');
  }
  if (flags.soothing.some((s) => /niacinamide/i.test(s))) {
    partnerScore += 6;
    partnerNotes.push('Niacinamid reguliert Talg & mildert Pickelmale.');
  }
  if (flags.lightLipid.length && !flags.heavyLipidHigh.length) {
    partnerScore += 5;
    partnerNotes.push('Leichte, nicht-komedogene Textur.');
  }
  partnerScore = Math.max(5, Math.min(100, partnerScore));

  // --- WEITERE HAUTTYPEN ---
  let dryScore = 78;
  if (flags.heavyLipidHigh.length || flags.barrier.length || flags.humectant.length) dryScore += 14;
  if (flags.badAlcoholHigh.length || flags.harshSurfactant.length) dryScore -= 35;
  if (flags.fragrance.length) dryScore -= 12;
  dryScore = Math.max(5, Math.min(100, dryScore));

  let normalScore = 84;
  if (flags.fragrance.length) normalScore -= 12;
  if (flags.badAlcoholHigh.length || flags.harshSurfactant.length) normalScore -= 25;
  if (flags.scrub.length) normalScore -= 15;
  if (flags.humectant.length || flags.soothing.length) normalScore += 8;
  normalScore = Math.max(5, Math.min(100, normalScore));

  let sensitiveScore = alexScore; // ähnlich streng wie Psoriasis (0 % Parfum/Alkohol)

  const skinTypes = [
    {
      id: 'alex',
      name: 'Normal + Psoriasis vulgaris (Alex)',
      score: alexScore,
      verdict: scoreToVerdict(alexScore),
      note: alexWarnings[0] || alexReasons[0] || 'Reizfreie, barrierefreundliche Formulierung.'
    },
    {
      id: 'partner',
      name: 'Fettige Haut / Seborrhoe (Freundin)',
      score: partnerScore,
      verdict: scoreToVerdict(partnerScore),
      note: partnerNotes[0] || (flags.heavyLipidHigh.length ? 'Eher reichhaltig.' : 'Gut verträglich & leicht.')
    },
    {
      id: 'dry',
      name: 'Trockene / barrieregestörte Haut',
      score: dryScore,
      verdict: scoreToVerdict(dryScore),
      note: flags.heavyLipidHigh.length || flags.barrier.length ? 'Schützend & rückfettend.' : 'Solide Feuchtigkeitsbasis.'
    },
    {
      id: 'normal',
      name: 'Normale Haut (ohne Psoriasis)',
      score: normalScore,
      verdict: scoreToVerdict(normalScore),
      note: normalScore >= 75 ? 'Gut geeignet für die tägliche Pflege.' : 'Enthält unnötige Reizstoffe.'
    },
    {
      id: 'sensitive',
      name: 'Empfindliche / zu Rötungen neigende Haut',
      score: sensitiveScore,
      verdict: scoreToVerdict(sensitiveScore),
      note: flags.fragrance.length || flags.essentialOil.length ? 'Wegen Duft-/Reizstoffen nicht ideal.' : 'Reizarm & hautberuhigend.'
    }
  ];

  // --- PFLEGEPLAN-EINORDNUNG ---
  const routinePlacement = buildRoutinePlacement({
    activeProfile,
    detectedCategory,
    flags,
    alexScore,
    partnerScore
  });

  const activeScore = activeProfile === 'partner' ? partnerScore : alexScore;
  const activeVerdict = scoreToVerdict(activeScore);

  return {
    productName: productName.trim() || 'Unbenanntes Produkt',
    category: detectedCategory,
    categoryLabel: CATEGORY_LABELS[detectedCategory] || 'Hautpflege',
    sourceUrl,
    activeProfile,
    score: activeScore,
    verdict: activeVerdict,
    alexScore,
    partnerScore,
    alexReasons,
    alexWarnings,
    partnerNotes,
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

function scoreToVerdict(score) {
  if (score >= 80) return { label: 'Passt sehr gut', cls: 'badge-ok', emoji: '✅' };
  if (score >= 58) return { label: 'Bedingt geeignet', cls: 'badge-warn', emoji: '⚠️' };
  return { label: 'Lieber im Regal lassen', cls: 'badge-bad', emoji: '🚫' };
}

function buildRoutinePlacement({ activeProfile, detectedCategory, flags, alexScore, partnerScore }) {
  if (activeProfile === 'partner') {
    if (partnerScore < 55) {
      return {
        slot: 'Nicht für die Gesichtsroutine empfohlen',
        advice: 'Aufgrund der INCI-Zusammensetzung (z. B. zu reichhaltig/okklusiv oder reizend) nicht fürs Gesicht nutzen – falls schon vorhanden, höchstens abends an Hals/Dekolleté oder Körper aufbrauchen.',
        existingMatch: 'Bleib bei deiner leichten dm-Routine (Balea MED Waschgel, Azelain Booster, 2% BHA, Aqua Creme-Gel, SUNDANCE 50+).'
      };
    }
    const map = {
      cleanser: {
        slot: 'Gesicht Morgens & Abends (Schritt 1 / 2 im Double Cleansing)',
        advice: 'Sanft 30 Sek. reinigen. Abends nach dem Balea Reinigungsöl als 2. Schritt anwenden.',
        existingMatch: 'Im Bestand: Balea MED Ultra Sensitive Waschgel.'
      },
      exfoliant: {
        slot: 'Gesicht Abends (Di / Do / So – BHA-Abend) + optional Kopfhaut Pre-Wash',
        advice: 'Auf T-Zone/Poren auftragen, 5–10 Min. einwirken lassen, danach leichtes Creme-Gel.',
        existingMatch: 'Im Bestand: Balea Beauty Expert Liquid Peeling 2% BHA.'
      },
      serum: {
        slot: 'Gesicht Morgens täglich & Abends (Mo / Mi / Fr / Sa)',
        advice: '3–4 Tropfen auf leicht feuchte Haut vor dem Sonnenschutz bzw. Creme-Gel.',
        existingMatch: 'Ziel-Slot: Balea Beauty Expert Azelain Booster / Niacinamide Serum.'
      },
      sunscreen: {
        slot: 'Gesicht Morgens – ALLEINIGE Tagespflege (keine Creme darunter!)',
        advice: '2 Fingerlängen auftragen; schützt vor Sebum-Oxidation und dunklen Pickelmalen (PIH). Abends per Double Cleansing entfernen.',
        existingMatch: 'Im Bestand: SUNDANCE 50+ Sensitiv Sonnenfluid.'
      },
      moisturizer: {
        slot: 'Gesicht Abends (Schritt 4 – leichter Abschluss)',
        advice: 'Erbsengroße Menge abends über dem Serum/BHA. Morgens unter LSF 50+ weglassen.',
        existingMatch: 'Ziel-Slot: Balea Aqua Feuchtigkeits Creme-Gel.'
      },
      shampoo: {
        slot: 'Haare Waschtag (alle 2–3 Tage) – CWC-Methode NUR auf die Kopfhaut!',
        advice: 'Vorher Spitzen mit Spülung schützen (C1), dann Shampoo 60 Sek. nur am fettigen Ansatz einmassieren.',
        existingMatch: 'Im Bestand: Balea Pure Frische Shampoo ↔ Aqua Hyaluron Shampoo.'
      },
      conditioner: {
        slot: 'Haare – strikt ab Ohrhöhe abwärts (Längen & trockene Spitzen)',
        advice: 'Niemals an den fettigen Ansatz geben! Ideal für C1 (Spitzenschutz) & C2 (Squish to Condish).',
        existingMatch: 'Im Bestand: Balea Prof. Aqua Hyaluron Serie / Langhaarmädchen Lockengel.'
      }
    };
    return map[detectedCategory] || {
      slot: 'Ergänzende Pflege',
      advice: 'Sparsam testen und auf Glanzbildung / Komedogenität achten.',
      existingMatch: 'Prüfe, ob ein leichtes Produkt aus deinem dm-Plan den Schritt schon abdeckt.'
    };
  }

  // --- ALEX (Psoriasis vulgaris + Normaler Hauttyp) ---
  if (alexScore < 55) {
    return {
      slot: 'Nicht für deinen Psoriasis-Pflegeplan empfohlen',
      advice: 'Enthält Red-Flag-Inhaltsstoffe (z. B. Duftstoffe, viel Alkohol, ätherische Öle oder mechanische Peelings), die Reizungen oder neue Plaques (Koebner-Effekt) auslösen können.',
      existingMatch: 'Dein bestehender 14-Produkte-Bestand deckt bereits alle Pflegeschritte reizfrei ab.'
    };
  }

  const alexMap = {
    cleanser: {
      slot: 'Gesicht AM/PM (Schritt 1) oder Körper-Dusche',
      advice: 'Lauwarm reinigen, danach nur trocken tupfen (nicht rubbeln!) und innerhalb von 3 Minuten eincremen (Soak & Seal).',
      existingMatch: 'Im Bestand: ISANA med Ultra Sensitiv Totes Meer Waschlotion (#4).'
    },
    shower_oil: {
      slot: 'Körper-Dusche (besonders im Winter bei trockener Haut)',
      advice: 'Lauwarm (35–37 °C) 5–10 Min. duschen, danach direkt innerhalb von 3 Min. eincremen.',
      existingMatch: 'Im Bestand: ISANA med Totes Meer Waschlotion (#4) – ein echtes Duschöl (Öl auf Platz 1) ist ein tolles Winter-Upgrade.'
    },
    serum: {
      slot: flags.keratolytic.length
        ? 'Gesicht Abends (Spot auf geschlossene Schuppen/Bartansatz) & Plaque Schicht 1'
        : 'Gesicht Morgens & Abends (Schritt 2 – ganzes Gesicht & Bartansatz)',
      advice: flags.stingTriggers.length
        ? 'Auf leicht feuchte, geschlossene Haut geben. Bei offenen Rissen/Rhagaden pausieren (Stinging-Gefahr)!'
        : '2–3 Tropfen auf leicht feuchte Haut auftragen – stärkt die Barriere und schützt vor dem Koebner-Effekt.',
      existingMatch: flags.keratolytic.length
        ? 'Im Bestand: ISANA med 5% Urea Akut-Pflege Serum (#2).'
        : 'Im Bestand: ISANA Calming Barrier Serum (#1).'
    },
    moisturizer: {
      slot: flags.heavyLipidHigh.length
        ? 'Gesicht Abends (Schritt 3 – Winter/Nacht) & brennfreie SOS-Pflege'
        : 'Gesicht Abends (Schritt 3 – leichte Nachtpflege für normale Haut)',
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
        : 'Perfekt für die tägliche Basistherapie – auch auf gereizter oder juckender Haut brennfrei nutzbar.',
      existingMatch: 'Im Bestand: ISANA med Barriereschutz Lotion (#5), Totes Meer Lotion (#6) & Mixa Panthenol Comfort (#13).'
    },
    ointment: {
      slot: 'Plaque-Intensivpflege Abends/Nachts (Schicht 2 – Okklusion / „Slugging“)',
      advice: 'Über dem 5% Urea Serum auf Ellbogen/Knie/Schienbeine auftragen – oder solo bei offenen, rissigen Herden.',
      existingMatch: 'Im Bestand: ISANA med Totes Meer Salbe (#7) & Mixa Panthenol Comfort (#13 tagsüber).'
    },
    exfoliant: {
      slot: 'Spezial-Behandlung bei dicken, geschlossenen Schuppenpanzern (2–3x/Woche abends)',
      advice: 'Strikt nur auf geschlossene Plaques! Nicht mit Urea am selben Abend kombinieren. Danach dick versiegeln & morgens LSF 50 nutzen.',
      existingMatch: 'Im Bestand: Neutrogena 2% BHA Waschgel (#11 als 3-Min-Dusch-Trick) / Nachkauf-Option: ISANA 6% AHA.'
    },
    shampoo: {
      slot: flags.soothing.some((s) => /piroctone/i.test(s))
        ? 'Kopfhaut 2–3x/Woche bei Schuppung/Juckreiz (2–3 Min. einwirken lassen)'
        : 'Kopfhaut Alltag (milde Wäsche an den Zwischentagen)',
      advice: 'Mit den Fingerkuppen sanft einmassieren, niemals mit den Fingernägeln kratzen (Koebner-Schutz).',
      existingMatch: 'Im Bestand: ISANA med Anti-Schuppen (#8), Ultra Sensitiv (#9) & pH 5,5 (#10).'
    },
    lip_balm: {
      slot: 'Lippenpflege nach Bedarf (tagsüber / draußen)',
      advice: 'Reizfreie Lippenpflege schützt vor Einrissen und UV-Stress an den Lippen.',
      existingMatch: 'Gut kombinierbar mit deiner täglichen Routine (ohne Konflikt zu den 14 Bestandsprodukten).'
    }
  };

  return alexMap[detectedCategory] || {
    slot: 'Ergänzende Hautpflege (nach Bedarf)',
    advice: 'Zuerst kleinflächig testen und die 5 Goldenen Psoriasis-Regeln beachten.',
    existingMatch: 'Prüfe im Tab „Pflegeplan“, ob eines deiner 14 Bestandsprodukte diesen Zweck schon erfüllt.'
  };
}
