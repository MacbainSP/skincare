// ============================================================================
// SkinCheck Domain Data – Bilingual (DE / EN) & 100 % konfigurierbar
// ============================================================================

import { pickLang } from './i18n.js';

export const SKIN_TYPES = [
  {
    id: 'normal',
    label: { de: 'Normale Haut', en: 'Normal Skin' },
    short: { de: 'Normal', en: 'Normal' },
    desc: { de: 'Ausgeglichene Talg- & Feuchtigkeitsbalance.', en: 'Balanced sebum and hydration levels.' }
  },
  {
    id: 'dry',
    label: { de: 'Trockene Haut', en: 'Dry Skin' },
    short: { de: 'Trocken', en: 'Dry' },
    desc: { de: 'Lipid- & feuchtigkeitsarm, neigt zu Spannen/Schuppung.', en: 'Low in lipids and moisture, prone to tightness or flaking.' }
  },
  {
    id: 'oily',
    label: { de: 'Fettige Haut', en: 'Oily Skin' },
    short: { de: 'Fettig', en: 'Oily' },
    desc: { de: 'Erhöhte Talgproduktion, Glanz, erweiterte Poren.', en: 'Excess sebum production, shine, enlarged pores.' }
  },
  {
    id: 'combination',
    label: { de: 'Mischhaut', en: 'Combination Skin' },
    short: { de: 'Mischhaut', en: 'Combo' },
    desc: { de: 'Fettige T-Zone, normale bis trockene Wangen.', en: 'Oily T-zone with normal to dry cheeks.' }
  },
  {
    id: 'sensitive',
    label: { de: 'Empfindliche Haut', en: 'Sensitive Skin' },
    short: { de: 'Empfindlich', en: 'Sensitive' },
    desc: { de: 'Reagiert schnell mit Rötung, Brennen oder Juckreiz.', en: 'Reacts easily with redness, stinging, or itching.' }
  }
];

export const SKIN_CONDITIONS = [
  {
    id: 'psoriasis',
    label: { de: 'Psoriasis vulgaris', en: 'Psoriasis vulgaris' },
    short: { de: 'Psoriasis', en: 'Psoriasis' },
    desc: { de: 'Schuppenflechte – Koebner-Schutz, 0 % Parfum, Zonen-Management.', en: 'Koebner protection, 0% fragrance, zone management.' }
  },
  {
    id: 'seborrhoe',
    label: { de: 'Seborrhoe / Seb. Ekzem', en: 'Seborrhea / Seb. Dermatitis' },
    short: { de: 'Seborrhoe', en: 'Seborrhea' },
    desc: { de: 'Überaktive Talgdrüsen / Malassezia-sensibel – leichte Texturen.', en: 'Overactive sebaceous glands / Malassezia-prone – lightweight textures.' }
  },
  {
    id: 'neurodermitis',
    label: { de: 'Neurodermitis / Atopisch', en: 'Eczema / Atopic Skin' },
    short: { de: 'Neurodermitis', en: 'Eczema' },
    desc: { de: 'Gestörte Barriere – Ceramide, Lipide, strikt reiz- & duftfrei.', en: 'Impaired barrier – ceramides, lipids, strictly fragrance-free.' }
  },
  {
    id: 'rosacea',
    label: { de: 'Rosazea / Couperose', en: 'Rosacea / Redness' },
    short: { de: 'Rosazea', en: 'Rosacea' },
    desc: { de: 'Gefäß- & Rötungsneigung – kein Alkohol, kein Menthol, LSF 50.', en: 'Prone to flushing/redness – no alcohol, no menthol, daily SPF 50.' }
  },
  {
    id: 'acne',
    label: { de: 'Akne / Unreine Haut', en: 'Acne / Blemish-Prone' },
    short: { de: 'Akne/Unrein', en: 'Acne-Prone' },
    desc: { de: 'Komedogen-sensibel – BHA, Azelain, Niacinamid, keine schweren Fette.', en: 'Non-comedogenic focus – BHA, azelaic acid, niacinamide, avoid heavy fats.' }
  },
  {
    id: 'pih',
    label: { de: 'Pigmentflecken / Pickelmale', en: 'Hyperpigmentation / PIH' },
    short: { de: 'PIH/Flecken', en: 'Dark Spots/PIH' },
    desc: { de: 'Neigung zu dunklen Flecken – konsequenter LSF 50, Niacinamid/Azelain.', en: 'Prone to dark spots – daily SPF 50, niacinamide/azelaic acid.' }
  },
  {
    id: 'curly_oily',
    label: { de: 'Locken (fettiger Ansatz / trockene Spitzen)', en: 'Curly Hair (Oily Roots / Dry Ends)' },
    short: { de: 'Locken CWC', en: 'Curly CWC' },
    desc: { de: 'Zonen-Haarpflege nach der CWC-Methode.', en: 'Zone hair care using the CWC (Condition-Wash-Condition) method.' }
  }
];

export const ROUTINE_SLOTS = [
  { id: 'am_cleanse', group: { de: '☀️ Morgens (AM)', en: '☀️ Morning (AM)' }, label: { de: 'Morgens – Reinigung', en: 'Morning – Cleanser' } },
  { id: 'am_serum', group: { de: '☀️ Morgens (AM)', en: '☀️ Morning (AM)' }, label: { de: 'Morgens – Serum / Wirkstoff', en: 'Morning – Serum / Active' } },
  { id: 'am_care', group: { de: '☀️ Morgens (AM)', en: '☀️ Morning (AM)' }, label: { de: 'Morgens – Tagespflege / Sonnenschutz (LSF)', en: 'Morning – Day Care / Sunscreen (SPF)' } },
  { id: 'pm_cleanse', group: { de: '🌙 Abends (PM)', en: '🌙 Evening (PM)' }, label: { de: 'Abends – Reinigung / Double Cleansing', en: 'Evening – Cleanser / Double Cleanse' } },
  { id: 'pm_treatment', group: { de: '🌙 Abends (PM)', en: '🌙 Evening (PM)' }, label: { de: 'Abends – Serum / Peeling / Spot-Treatment', en: 'Evening – Serum / Exfoliant / Spot Treatment' } },
  { id: 'pm_care', group: { de: '🌙 Abends (PM)', en: '🌙 Evening (PM)' }, label: { de: 'Abends – Nachtpflege / Creme', en: 'Evening – Night Moisturizer' } },
  { id: 'body', group: { de: '🚿 Körper & Dusche', en: '🚿 Body & Shower' }, label: { de: 'Körper – Dusche / Lotion', en: 'Body – Wash / Lotion' } },
  { id: 'hair', group: { de: '💇 Kopfhaut & Haare', en: '💇 Scalp & Hair' }, label: { de: 'Kopfhaut & Haare (Shampoo / Spülung / Styling)', en: 'Scalp & Hair (Shampoo / Conditioner / Styling)' } },
  { id: 'sos', group: { de: '🩹 Spezial- & SOS-Pflege', en: '🩹 Special & SOS Care' }, label: { de: 'SOS / Plaques / Lippenpflege', en: 'SOS / Plaques / Lip Care' } }
];

export const CONDITION_TIPS = {
  psoriasis: {
    de: [
      'Soak & Seal (3-Minuten-Fenster): Seren & Lotionen direkt nach dem Waschen auf leicht feuchte Haut auftragen.',
      'Tupfen statt Rubbeln & keine mechanischen Peelings (Schutz vor dem Koebner-Effekt).',
      'Kein-Brennen-Regel: Urea, AHA und BHA strikt nur auf geschlossene Haut – bei offenen Rissen brennfreie Panthenol-/Ceramid-/Salbenpflege nutzen.'
    ],
    en: [
      'Soak & Seal (3-minute window): Apply serums and lotions to slightly damp skin right after washing.',
      'Pat dry instead of rubbing, and avoid physical scrubs (protects against the Koebner phenomenon).',
      'No-Sting Rule: Use urea, AHA, and BHA strictly on intact skin – switch to sting-free panthenol/ceramide/ointment care on cracked areas.'
    ]
  },
  seborrhoe: {
    de: [
      'Leichte, öl- und butterarme Texturen bevorzugen; abends gründlich reinigen (bei wasserfestem LSF per Double Cleansing).',
      'Morgens reicht ein leichtes Sonnenfluid oft als alleinige Tagespflege ohne zusätzliche Creme darunter.'
    ],
    en: [
      'Prefer lightweight, low-oil textures; cleanse thoroughly at night (use double cleansing for water-resistant SPF).',
      'In the morning, a lightweight sunscreen fluid often replaces a separate day cream.'
    ]
  },
  neurodermitis: {
    de: [
      'Strikt auf Duftstoffe, ätherische Öle und aggressive Sulfate verzichten; Fokus auf Ceramide, Glycerin & Panthenol.',
      'Direkt nach lauwarmem Duschen (max. 35–37 °C) eincremen, um Wasserverlust (TEWL) zu stoppen.'
    ],
    en: [
      'Strictly avoid fragrance, essential oils, and harsh sulfates; focus on ceramides, glycerin, and panthenol.',
      'Moisturize immediately after lukewarm showers (max. 35–37 °C) to lock in hydration.'
    ]
  },
  rosacea: {
    de: [
      'Konsequenter, reizfreier UV-Schutz (LSF 50+) ist Pflicht – UV-Strahlung ist einer der häufigsten Flush-Trigger.',
      'Austrocknenden Alkohol, Menthol, Kampfer, Duftstoffe und starke Peelings meiden; beruhigende Wirkstoffe wie Azelain, Niacinamid, Panthenol & Cica bevorzugen.'
    ],
    en: [
      'Daily gentle broad-spectrum SPF 50+ is essential – UV exposure is a major flushing trigger.',
      'Avoid drying alcohol, menthol, camphor, fragrance, and harsh acids; favor azelaic acid, niacinamide, panthenol, and cica.'
    ]
  },
  acne: {
    de: [
      'Nicht-komedogene, leichte Texturen wählen; BHA (Salicylsäure) und Azelainsäure/Niacinamid langsam einschleichen (2–3x/Woche).',
      'Nicht „quietschend sauber“ waschen – eine intakte Barriere verhindert überschießendes Nachfetten.'
    ],
    en: [
      'Choose lightweight non-comedogenic textures; introduce BHA (salicylic acid) and azelaic acid/niacinamide gradually (2–3x/week).',
      'Avoid stripping cleansers – an intact barrier prevents rebound oiliness.'
    ]
  },
  pih: {
    de: [
      'Täglicher Breitband-UV-Schutz (LSF 50) verhindert, dass dunkle Flecken & Pickelmale nachdunkeln.',
      'Niacinamid und Azelainsäure helfen, postinflammatorische Hyperpigmentierung sanft aufzuhellen.'
    ],
    en: [
      'Daily broad-spectrum SPF 50 prevents dark spots and post-acne marks from darkening.',
      'Niacinamide and azelaic acid help gently fade post-inflammatory hyperpigmentation.'
    ]
  },
  curly_oily: {
    de: [
      'CWC-Methode beim Waschen: Spülung in die trockenen Spitzen → Shampoo nur auf die Kopfhaut → Spülung ab Ohrhöhe.',
      'Öle und reichhaltige Masken strikt nur in die unteren Längen/Spitzen geben, niemals an den Ansatz.'
    ],
    en: [
      'CWC wash method: Conditioner on dry ends → shampoo only on the scalp → conditioner from ear-level down.',
      'Apply oils and rich masks strictly to the lower lengths/ends, never to the roots.'
    ]
  }
};

export function formatSkinProfileLabel(skinProfile, lang = 'de') {
  const st = SKIN_TYPES.find((s) => s.id === skinProfile?.skinType) || SKIN_TYPES[0];
  const conds = (skinProfile?.conditions || [])
    .map((id) => {
      const c = SKIN_CONDITIONS.find((x) => x.id === id);
      return c ? pickLang(c.short, lang) : '';
    })
    .filter(Boolean);
  return conds.length ? `${pickLang(st.short, lang)} + ${conds.join(', ')}` : pickLang(st.label, lang);
}

// 1%-Anker-Stoffe (EU-Kosmetikverordnung VO 1223/2009)
export const ONE_PERCENT_ANCHORS = [
  { match: 'phenoxyethanol', label: { de: '1-%-Anker (max. 1,0 % EU-Limit)', en: '1% Anchor (max. 1.0% EU limit)' }, approxMax: 1.0 },
  { match: 'xanthan gum', label: { de: '0,5-%-Anker (Gelbildner)', en: '0.5% Anchor (gelling agent)' }, approxMax: 0.6 },
  { match: 'carbomer', label: { de: '0,5-%-Anker (Gelbildner)', en: '0.5% Anchor (gelling agent)' }, approxMax: 0.6 },
  { match: 'acrylates/c10-30 alkyl acrylate crosspolymer', label: { de: '0,5-%-Anker (Verdicker)', en: '0.5% Anchor (thickener)' }, approxMax: 0.6 },
  { match: 'sodium hyaluronate', label: { de: '0,5-%-Anker (Hyaluron-Gel)', en: '0.5% Anchor (hyaluronic gel)' }, approxMax: 0.5 },
  { match: 'allantoin', label: { de: '0,5-%-Anker (Beruhigung, max. ~0,5 %)', en: '0.5% Anchor (soothing, max. ~0.5%)' }, approxMax: 0.5 },
  { match: 'bisabolol', label: { de: '0,5-%-Anker (Beruhigung, max. ~0,5 %)', en: '0.5% Anchor (soothing, max. ~0.5%)' }, approxMax: 0.5 },
  { match: 'sodium hydroxide', label: { de: 'pH-Regulator (< 0,2 %)', en: 'pH adjuster (< 0.2%)' }, approxMax: 0.2 },
  { match: 'citric acid', label: { de: 'pH-Regulator (< 0,2 %)', en: 'pH adjuster (< 0.2%)' }, approxMax: 0.2 }
];

// INCI-Wissensdatenbank (bilingual DE / EN)
export const INCI_DB = [
  {
    keys: ['parfum', 'fragrance', 'aroma'],
    name: { de: 'Duftstoff / Parfum', en: 'Fragrance / Parfum' },
    category: 'fragrance', severity: 'bad',
    desc: { de: 'Häufigster Kontaktallergen- und Entzündungstrigger bei empfindlicher Haut & Psoriasis.', en: 'Top contact allergy and irritation trigger for sensitive skin & psoriasis.' }
  },
  {
    keys: ['linalool', 'limonene', 'citronellol', 'geraniol', 'citral', 'coumarin', 'eugenol', 'benzyl salicylate', 'hexyl cinnamal', 'amyl cinnamal', 'farnesol', 'hydroxycitronellal', 'alpha-isomethyl ionone'],
    name: { de: 'Deklarationspflichtiges Duftallergen', en: 'Declarable Fragrance Allergen' },
    category: 'fragrance_allergen', severity: 'bad',
    desc: { de: 'Einzel-Duftstoff mit hohem Allergie- und Reizpotenzial.', en: 'Individual fragrance component with high allergy and irritation potential.' }
  },
  {
    keys: ['cetearyl alcohol', 'cetyl alcohol', 'stearyl alcohol', 'behenyl alcohol', 'myristyl alcohol', 'octyldodecanol', 'arachidyl alcohol'],
    name: { de: 'Pflegender Fett-/Wachsalkohol', en: 'Conditioning Fatty Alcohol' },
    category: 'good_alcohol', severity: 'ok',
    desc: { de: 'Kein austrocknender Alkohol! Macht Cremes geschmeidig und stärkt die Lipidbarriere.', en: 'Not a drying alcohol! Softens creams and supports the lipid barrier.' }
  },
  {
    keys: ['alcohol denat', 'alcohol denat.', 'ethanol', 'isopropyl alcohol', 'sd alcohol'],
    name: { de: 'Austrocknender Alkohol', en: 'Drying Alcohol' },
    category: 'bad_alcohol', severity: 'warn',
    desc: { de: 'Entfettet & brennt, wenn weit vorne (Platz 1–6). Unterhalb der 1-%-Linie meist unkritisch.', en: 'Drying & stinging if high up (pos. 1–6). Usually harmless below the 1% line.' }
  },
  {
    keys: ['alcohol'], exact: true,
    name: { de: 'Einfacher Alkohol (Ethanol)', en: 'Simple Alcohol (Ethanol)' },
    category: 'bad_alcohol', severity: 'warn',
    desc: { de: 'Auf Platz 1–6 austrocknend; unterhalb der 1-%-Grenze (z. B. als Extrakt-Träger) meist unproblematisch.', en: 'Drying at pos. 1–6; usually unproblematic below 1% (e.g. as extract carrier).' }
  },
  {
    keys: ['melaleuca alternifolia', 'mentha piperita', 'menthol', 'camphor', 'eucalyptus globulus', 'lavandula angustifolia', 'citrus limon peel oil', 'citrus aurantium dulcis peel oil', 'citrus paradisi peel oil', 'rosmarinus officinalis leaf oil'],
    name: { de: 'Ätherisches Öl / Reizstoff', en: 'Essential Oil / Irritant' },
    category: 'essential_oil', severity: 'bad',
    desc: { de: 'Stark reizend für empfindliche Haut (Zitrusöle zudem phototoxisch). Ausnahme: Menthol im Kopfhaut-Shampoo bei fettigem Ansatz.', en: 'Highly irritating for sensitive skin (citrus oils are also phototoxic). Exception: menthol in scalp shampoo for oily roots.' }
  },
  {
    keys: ['prunus armeniaca seed powder', 'juglans regia shell powder', 'pumice', 'hydrated silica'],
    name: { de: 'Mechanischer Peeling-/Reibekörper', en: 'Physical Scrub Particle' },
    category: 'scrub', severity: 'bad',
    desc: { de: 'Gefahr für Mikroverletzungen & Koebner-Phänomen (neue Plaques!).', en: 'Risk of micro-tears and Koebner phenomenon (can trigger new plaques!).' }
  },
  {
    keys: ['sodium lauryl sulfate', 'ammonium lauryl sulfate', 'sodium c14-16 olefin sulfonate'],
    name: { de: 'Stark entfettendes Sulfat-Tensid', en: 'Harsh Sulfate Surfactant' },
    category: 'harsh_surfactant', severity: 'bad',
    desc: { de: 'Greift Barrierelipide stark an – bei empfindlicher Haut und im Gesicht strikt meiden.', en: 'Strips barrier lipids aggressively – avoid on sensitive skin and the face.' }
  },
  {
    keys: ['sodium laureth sulfate'],
    name: { de: 'SLES (Sulfat-Tensid)', en: 'SLES (Sulfate Surfactant)' },
    category: 'sles', severity: 'warn',
    desc: { de: 'Für empfindliche Haut & Gesicht zu austrocknend. Für fettigen Haaransatz mit CWC-Spitzenschutz jedoch nutzbar.', en: 'Too drying for sensitive skin & face. Usable on oily scalp roots with CWC end protection.' }
  },
  {
    keys: ['coco-glucoside', 'decyl glucoside', 'lauryl glucoside', 'cocamidopropyl betaine', 'sodium cocoamphoacetate', 'sodium cocoyl glutamate', 'disodium cocoyl glutamate', 'disodium laureth sulfosuccinate', 'glyceryl oleate'],
    name: { de: 'Mildes Tensid / Rückfetter', en: 'Gentle Surfactant / Refatting Agent' },
    category: 'mild_surfactant', severity: 'ok',
    desc: { de: 'Barriere- und mikrobiomfreundliche Reinigung (pH-schonend).', en: 'Barrier- and microbiome-friendly gentle cleansing.' }
  },
  {
    keys: ['octocrylene', 'benzophenone-3', 'oxybenzone', 'homosalate'],
    name: { de: 'Älterer / kritischer UV-Filter', en: 'Older / Sensitizing UV Filter' },
    category: 'bad_uv', severity: 'warn',
    desc: { de: 'Bei empfindlicher Haut häufiger Kontaktallergien (bes. Octocrylen).', en: 'Higher risk of contact allergy on sensitive skin (especially octocrylene).' }
  },
  {
    keys: ['bis-ethylhexyloxyphenol methoxyphenyl triazine', 'diethylamino hydroxybenzoyl hexyl benzoate', 'ethylhexyl triazone', 'ethylhexyl salicylate', 'phenylbenzimidazole sulfonic acid', 'diethylhexyl butamido triazone', 'titanium dioxide', 'zinc oxide', 'tris-biphenyl triazine'],
    name: { de: 'Moderner, photostabiler UV-Filter', en: 'Modern Photostable UV Filter' },
    category: 'good_uv', severity: 'ok',
    desc: { de: 'Hochverträglicher UV-Schutz gegen Sonnenbrand-Trigger & Pigmentflecken (PIH).', en: 'Well-tolerated UV protection against sunburn triggers & dark spots (PIH).' }
  },
  {
    keys: ['urea'], exact: true,
    name: { de: 'Urea (Harnstoff)', en: 'Urea' },
    category: 'keratolytic', severity: 'ok', needsHighPos: true, stingWarning: true,
    desc: { de: 'Goldstandard: ~5 % (Platz 3–4) feuchtigkeitsspendend, ~10 % (Platz 2) stark schuppenlösend. Nicht auf offene Risse!', en: 'Gold standard: ~5% (pos. 3–4) hydrating, ~10% (pos. 2) strongly keratolytic. Do not apply to open cracks!' }
  },
  {
    keys: ['salicylic acid'],
    name: { de: 'Salicylsäure (BHA)', en: 'Salicylic Acid (BHA)' },
    category: 'keratolytic_bha', severity: 'ok', stingWarning: true,
    desc: { de: 'Fettlöslich: löst Schuppenpanzer und tiefsitzenden Porentalg. Nicht auf offene Stellen!', en: 'Oil-soluble: dissolves plaques and unclogs oily pores. Do not use on broken skin!' }
  },
  {
    keys: ['glycolic acid'],
    name: { de: 'Glykolsäure (AHA)', en: 'Glycolic Acid (AHA)' },
    category: 'keratolytic_aha', severity: 'ok', stingWarning: true,
    desc: { de: 'Wasserlösliche Fruchtsäure: löst dicke Verhornungen effektiv. Nur auf geschlossener Haut & mit LSF 50!', en: 'Water-soluble exfoliating acid: smooths thick surface scaling. Use on intact skin & pair with SPF 50!' }
  },
  {
    keys: ['gluconolactone', 'lactobionic acid'],
    name: { de: 'PHA (Polyhydroxysäure)', en: 'PHA (Polyhydroxy Acid)' },
    category: 'keratolytic_pha', severity: 'ok',
    desc: { de: 'Sehr milde chemische Schuppenlösung, bindet gleichzeitig stark Wasser, brennt kaum.', en: 'Very gentle chemical exfoliation that binds water and rarely stings.' }
  },
  {
    keys: ['ceramide np', 'ceramide ap', 'ceramide eop', 'ceramide ng', 'ceramide ns', 'cholesterol', 'phytosphingosine', 'hydrogenated lecithin'],
    name: { de: 'Hautidentisches Ceramid / Barrierelipid', en: 'Skin-Identical Ceramide / Barrier Lipid' },
    category: 'barrier_signal', severity: 'ok', signalMolecule: true,
    desc: { de: 'Füllt Lücken im Lipidmörtel der Hautbarriere. Schon ab 0,05–0,2 % (auch unter 1 %) hochwirksam!', en: 'Repairs lipid gaps in the skin barrier. Effective even at 0.05–0.2% (below the 1% line)!' }
  },
  {
    keys: ['niacinamide'],
    name: { de: 'Niacinamid (Vitamin B3)', en: 'Niacinamide (Vitamin B3)' },
    category: 'soothing_sebum', severity: 'ok',
    desc: { de: 'Stärkt Ceramid-Synthese, mildert Rötungen/PIH & reguliert Talg.', en: 'Boosts ceramide synthesis, calms redness/PIH, and helps regulate sebum.' }
  },
  {
    keys: ['panthenol'],
    name: { de: 'Panthenol (Provitamin B5)', en: 'Panthenol (Pro-Vitamin B5)' },
    category: 'soothing', severity: 'ok', needsHighPos: true,
    desc: { de: 'Beruhigt sofort, fördert Regeneration & brennt nicht auf gereizter Haut.', en: 'Calms immediately, supports repair, and does not sting on irritated skin.' }
  },
  {
    keys: ['allantoin', 'bisabolol'],
    name: { de: 'Allantoin / Bisabolol', en: 'Allantoin / Bisabolol' },
    category: 'soothing_signal', severity: 'ok', signalMolecule: true,
    desc: { de: 'Stark beruhigend & reizlindernd; wirkt optimal bei 0,1–0,5 % (darf unter 1 % stehen).', en: 'Strongly soothing; optimal at 0.1–0.5% (effective below 1%).' }
  },
  {
    keys: ['madecassoside', 'asiaticoside', 'centella asiatica'],
    name: { de: 'Cica (Centella Asiatica)', en: 'Cica (Centella Asiatica)' },
    category: 'soothing_signal', severity: 'ok', signalMolecule: true,
    desc: { de: 'Entzündungs- und rötungshemmend; bereits ab 0,1 % wirksam.', en: 'Anti-inflammatory & redness-reducing; effective from 0.1%.' }
  },
  {
    keys: ['cyanocobalamin'],
    name: { de: 'Vitamin B12', en: 'Vitamin B12' },
    category: 'soothing_signal', severity: 'ok', signalMolecule: true,
    desc: { de: 'Senkt Stickstoffmonoxid (NO) & Rötungen; wirkt schon ab 0,01 %.', en: 'Reduces local nitric oxide (NO) & redness; effective from 0.01%.' }
  },
  {
    keys: ['ectoin'],
    name: { de: 'Ectoin', en: 'Ectoin' },
    category: 'soothing_signal', severity: 'ok', signalMolecule: true,
    desc: { de: 'Zellschützend, barriere- und feuchtigkeitsstabilisierend (ab 0,5 %).', en: 'Cell-protecting, barrier- and moisture-stabilizing (from 0.5%).' }
  },
  {
    keys: ['maris sal', 'sea salt'],
    name: { de: 'Totes-Meer-Salz (Magnesium)', en: 'Dead Sea Salt (Magnesium)' },
    category: 'soothing_deadsea', severity: 'ok',
    desc: { de: 'Hemmt entzündliche Hautreaktionen und löst Schuppen brennfrei.', en: 'Calms inflammation and gently loosens scaling without stinging.' }
  },
  {
    keys: ['piroctone olamine'],
    name: { de: 'Pirocton Olamin', en: 'Piroctone Olamine' },
    category: 'scalp_active', severity: 'ok', signalMolecule: true,
    desc: { de: 'Reguliert Kopfhaut-Mikrobiom (gegen Malassezia & Schuppen) ohne Reizung.', en: 'Balances scalp microbiome (targets Malassezia & dandruff) gently.' }
  },
  {
    keys: ['glycerin'],
    name: { de: 'Glycerin', en: 'Glycerin' },
    category: 'humectant', severity: 'ok', needsHighPos: true,
    desc: { de: 'Top-Feuchthalter, hält die Haut geschmeidig und verhindert Risse.', en: 'Top humectant that hydrates deeply and keeps skin supple.' }
  },
  {
    keys: ['betaine', 'sodium pca', 'sodium lactate', 'arginine', 'serine', 'glycine', 'propanediol', 'pentylene glycol', 'aloe barbadensis'],
    name: { de: 'NMF / Feuchthalter', en: 'NMF / Humectant' },
    category: 'humectant', severity: 'ok',
    desc: { de: 'Leichte, nicht-fettende Tiefenhydratation für alle Hauttypen.', en: 'Lightweight, non-greasy hydration suitable for all skin types.' }
  },
  {
    keys: ['sodium hyaluronate', 'hyaluronic acid', 'hydrolyzed hyaluronic acid'],
    name: { de: 'Hyaluronsäure', en: 'Hyaluronic Acid' },
    category: 'humectant_signal', severity: 'ok', signalMolecule: true,
    desc: { de: 'Bindet extrem viel Wasser; wirkt bereits bei 0,1–0,5 %.', en: 'Binds large amounts of water; effective at 0.1–0.5%.' }
  },
  {
    keys: ['potassium azeloyl diglycinate', 'azelaic acid'],
    name: { de: 'Azelainsäure / PAD', en: 'Azelaic Acid / PAD' },
    category: 'sebum_active', severity: 'ok',
    desc: { de: 'Talgregulierend, entzündungshemmend & gegen Rötungen/Pickelmale.', en: 'Regulates sebum, calms redness/rosacea, and fades dark spots.' }
  },
  {
    keys: ['zinc pca', 'silica', 'zea mays starch', 'camellia sinensis'],
    name: { de: 'Mattierer / Sebum-Helfer', en: 'Mattifier / Sebum Helper' },
    category: 'sebum_helper', severity: 'ok',
    desc: { de: 'Nimmt überschüssigen Glanz auf (Maisstärke/Silica) oder wirkt antioxidativ (Grüntee).', en: 'Absorbs excess shine (corn starch/silica) or provides antioxidant support (green tea).' }
  },
  {
    keys: ['squalane', 'caprylic/capric triglyceride', 'dicaprylyl ether', 'coco-caprylate', 'coco-caprylate/caprate'],
    name: { de: 'Leichtes, nicht-komedogenes Lipid', en: 'Lightweight Non-Comedogenic Lipid' },
    category: 'light_lipid', severity: 'ok',
    desc: { de: 'Sehr hautverträglich, stärkt die Barriere ohne Poren zu verstopfen.', en: 'Very well tolerated; supports the barrier without clogging pores.' }
  },
  {
    keys: ['butyrospermum parkii butter', 'butyrospermum parkii', 'shea butter', 'petrolatum', 'paraffinum liquidum', 'cera microcristallina', 'cera alba', 'ricinus communis seed oil', 'cocos nucifera oil', 'theobroma cacao seed butter', 'olus oil'],
    name: { de: 'Reichhaltiges / okklusives Lipid', en: 'Rich / Occlusive Lipid' },
    category: 'heavy_lipid', severity: 'ok',
    desc: { de: 'Super für Plaques, Winterpflege & trockene Haut – aber für fettige Gesichtshaut tagsüber oft zu schwer.', en: 'Great for plaques, winter care & dry skin – often too heavy for oily facial skin during the day.' }
  },
  {
    keys: ['glycine soja oil', 'helianthus annuus seed oil', 'helianthus annuus hybrid oil', 'prunus amygdalus dulcis oil', 'simmondsia chinensis seed oil', 'canola oil', 'argania spinosa kernel oil'],
    name: { de: 'Pflanzenöl', en: 'Plant Oil' },
    category: 'plant_oil', severity: 'ok',
    desc: { de: 'Pflegendes Pflanzenöl (in Duschölen ideal auf Platz 1–2; bei fettiger Gesichtshaut tagsüber sparsam).', en: 'Nourishing plant oil (ideal at pos. 1–2 in shower oils; use sparingly on oily facial skin).' }
  },
  {
    keys: ['behentrimonium chloride', 'cetrimonium chloride', 'polyquaternium'],
    name: { de: 'Haar-Conditioner / Filmbildner', en: 'Hair Conditioner / Film Former' },
    category: 'hair_cond', severity: 'neutral',
    desc: { de: 'Entwirrt Locken & glättet die Schuppenschicht – bei fettigem Ansatz nur ab Ohrhöhe anwenden.', en: 'Detangles & smooths hair cuticles – apply from ear-level down if roots get oily.' }
  }
];

export const SAMPLE_PRODUCTS = {
  urea_serum: {
    name: { de: 'Beispiel: 5% Urea Akut-Pflege Serum', en: 'Sample: 5% Urea Acute Care Serum' },
    category: 'serum',
    inci: 'Aqua, Glycerin, Urea, Caprylic/Capric Triglyceride, Panthenol, Cetearyl Alcohol, Glyceryl Stearate Citrate, Allantoin, Tocopherol, Xanthan Gum, Phenoxyethanol, Lactic Acid'
  },
  bad_cream: {
    name: { de: 'Beispiel: Parfümierte Anti-Glanz Creme', en: 'Sample: Fragranced Anti-Shine Cream' },
    category: 'moisturizer',
    inci: 'Aqua, Alcohol Denat., Glycerin, Butyrospermum Parkii Butter, Parfum, Linalool, Limonene, Menthol, Prunus Armeniaca Seed Powder, Carbomer, Phenoxyethanol, Panthenol, Urea'
  },
  bha_peeling: {
    name: { de: 'Beispiel: 2% BHA Liquid Peeling', en: 'Sample: 2% BHA Liquid Exfoliant' },
    category: 'exfoliant',
    inci: 'Aqua, Propanediol, Salicylic Acid, Glycerin, Camellia Sinensis Leaf Extract, Sodium Hydroxide, Phenoxyethanol'
  },
  lip_sunozon: {
    name: { de: 'Beispiel: Sensitiv Lippenpflegestift LSF 50', en: 'Sample: Sensitive SPF 50 Lip Balm' },
    category: 'lip_balm',
    inci: 'Ricinus Communis Seed Oil, Butyrospermum Parkii Butter, Dibutyl Adipate, Diethylamino Hydroxybenzoyl Hexyl Benzoate, Ethylhexyl Triazone, Bis-Ethylhexyloxyphenol Methoxyphenyl Triazine, Cera Alba, Tocopheryl Acetate, Bisabolol, Alcohol'
  }
};
