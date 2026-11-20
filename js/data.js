// ============================================================================
// SkinCheck Domain Data – Allgemein nutzbar & 100 % konfigurierbar
// ============================================================================

export const SKIN_TYPES = [
  { id: 'normal', label: 'Normale Haut', short: 'Normal', desc: 'Ausgeglichene Talg- & Feuchtigkeitsbalance.' },
  { id: 'dry', label: 'Trockene Haut', short: 'Trocken', desc: 'Lipid- & feuchtigkeitsarm, neigt zu Spannen/Schuppung.' },
  { id: 'oily', label: 'Fettige Haut', short: 'Fettig', desc: 'Erhöhte Talgproduktion, Glanz, erweiterte Poren.' },
  { id: 'combination', label: 'Mischhaut', short: 'Mischhaut', desc: 'Fettige T-Zone, normale bis trockene Wangen.' },
  { id: 'sensitive', label: 'Empfindliche Haut', short: 'Empfindlich', desc: 'Reagiert schnell mit Rötung, Brennen oder Juckreiz.' }
];

export const SKIN_CONDITIONS = [
  { id: 'psoriasis', label: 'Psoriasis vulgaris', short: 'Psoriasis', desc: 'Schuppenflechte – Koebner-Schutz, 0 % Parfum, Zonen-Management.' },
  { id: 'seborrhoe', label: 'Seborrhoe / Seb. Ekzem', short: 'Seborrhoe', desc: 'Überaktive Talgdrüsen / Malassezia-sensibel – leichte Texturen.' },
  { id: 'neurodermitis', label: 'Neurodermitis / Atopisch', short: 'Neurodermitis', desc: 'Gestörte Barriere – Ceramide, Lipide, strikt reiz- & duftfrei.' },
  { id: 'rosacea', label: 'Rosazea / Couperose', short: 'Rosazea', desc: 'Gefäß- & Rötungsneigung – kein Alkohol, kein Menthol, LSF 50.' },
  { id: 'acne', label: 'Akne / Unreine Haut', short: 'Akne/Unrein', desc: 'Komedogen-sensibel – BHA, Azelain, Niacinamid, keine schweren Fette.' },
  { id: 'pih', label: 'Pigmentflecken / Pickelmale', short: 'PIH/Flecken', desc: 'Neigung zu dunklen Flecken – konsequenter LSF 50, Niacinamid/Azelain.' },
  { id: 'curly_oily', label: 'Locken (fettiger Ansatz / trockene Spitzen)', short: 'Locken CWC', desc: 'Zonen-Haarpflege nach der CWC-Methode.' }
];

export const ROUTINE_SLOTS = [
  { id: 'am_cleanse', group: '☀️ Morgens (AM)', label: 'Morgens – Reinigung' },
  { id: 'am_serum', group: '☀️ Morgens (AM)', label: 'Morgens – Serum / Wirkstoff' },
  { id: 'am_care', group: '☀️ Morgens (AM)', label: 'Morgens – Tagespflege / Sonnenschutz (LSF)' },
  { id: 'pm_cleanse', group: '🌙 Abends (PM)', label: 'Abends – Reinigung / Double Cleansing' },
  { id: 'pm_treatment', group: '🌙 Abends (PM)', label: 'Abends – Serum / Peeling / Spot-Treatment' },
  { id: 'pm_care', group: '🌙 Abends (PM)', label: 'Abends – Nachtpflege / Creme' },
  { id: 'body', group: '🚿 Körper & Dusche', label: 'Körper – Dusche / Lotion' },
  { id: 'hair', group: '💇 Kopfhaut & Haare', label: 'Kopfhaut & Haare (Shampoo / Spülung / Styling)' },
  { id: 'sos', group: '🩹 Spezial- & SOS-Pflege', label: 'SOS / Plaques / Lippenpflege' }
];

export const CONDITION_TIPS = {
  psoriasis: [
    'Soak & Seal (3-Minuten-Fenster): Seren & Lotionen direkt nach dem Waschen auf leicht feuchte Haut auftragen.',
    'Tupfen statt Rubbeln & keine mechanischen Peelings (Schutz vor dem Koebner-Effekt).',
    'Kein-Brennen-Regel: Urea, AHA und BHA strikt nur auf geschlossene Haut – bei offenen Rissen brennfreie Panthenol-/Ceramid-/Salbenpflege nutzen.'
  ],
  seborrhoe: [
    'Leichte, öl- und butterarme Texturen bevorzugen; abends gründlich reinigen (bei wasserfestem LSF per Double Cleansing).',
    'Morgens reicht ein leichtes Sonnenfluid oft als alleinige Tagespflege ohne zusätzliche Creme darunter.'
  ],
  neurodermitis: [
    'Strikt auf Duftstoffe, ätherische Öle und aggressive Sulfate verzichten; Fokus auf Ceramide, Glycerin & Panthenol.',
    'Direkt nach lauwarmem Duschen (max. 35–37 °C) eincremen, um Wasserverlust (TEWL) zu stoppen.'
  ],
  rosacea: [
    'Konsequenter, reizfreier UV-Schutz (LSF 50+) ist Pflicht – UV-Strahlung ist einer der häufigsten Flush-Trigger.',
    'Austrocknenden Alkohol, Menthol, Kampfer, Duftstoffe und starke Peelings meiden; beruhigende Wirkstoffe wie Azelain, Niacinamid, Panthenol & Cica bevorzugen.'
  ],
  acne: [
    'Nicht-komedogene, leichte Texturen wählen; BHA (Salicylsäure) und Azelainsäure/Niacinamid langsam einschleichen (2–3x/Woche).',
    'Nicht „quietschend sauber“ waschen – eine intakte Barriere verhindert überschießendes Nachfetten.'
  ],
  pih: [
    'Täglicher Breitband-UV-Schutz (LSF 50) verhindert, dass dunkle Flecken & Pickelmale nachdunkeln.',
    'Niacinamid und Azelainsäure helfen, postinflammatorische Hyperpigmentierung sanft aufzuhellen.'
  ],
  curly_oily: [
    'CWC-Methode beim Waschen: Spülung in die trockenen Spitzen → Shampoo nur auf die Kopfhaut → Spülung ab Ohrhöhe.',
    'Öle und reichhaltige Masken strikt nur in die unteren Längen/Spitzen geben, niemals an den Ansatz.'
  ]
};

export function formatSkinProfileLabel(skinProfile) {
  const st = SKIN_TYPES.find((s) => s.id === skinProfile?.skinType) || SKIN_TYPES[0];
  const conds = (skinProfile?.conditions || [])
    .map((id) => SKIN_CONDITIONS.find((c) => c.id === id)?.short)
    .filter(Boolean);
  return conds.length ? `${st.short} + ${conds.join(', ')}` : st.label;
}

// 1%-Anker-Stoffe (EU-Kosmetikverordnung VO 1223/2009)
export const ONE_PERCENT_ANCHORS = [
  { match: 'phenoxyethanol', label: '1-%-Anker (max. 1,0 % EU-Limit)', approxMax: 1.0 },
  { match: 'xanthan gum', label: '0,5-%-Anker (Gelbildner)', approxMax: 0.6 },
  { match: 'carbomer', label: '0,5-%-Anker (Gelbildner)', approxMax: 0.6 },
  { match: 'acrylates/c10-30 alkyl acrylate crosspolymer', label: '0,5-%-Anker (Verdicker)', approxMax: 0.6 },
  { match: 'sodium hyaluronate', label: '0,5-%-Anker (Hyaluron-Gel)', approxMax: 0.5 },
  { match: 'allantoin', label: '0,5-%-Anker (Beruhigung, max. ~0,5 %)', approxMax: 0.5 },
  { match: 'bisabolol', label: '0,5-%-Anker (Beruhigung, max. ~0,5 %)', approxMax: 0.5 },
  { match: 'sodium hydroxide', label: 'pH-Regulator (< 0,2 %)', approxMax: 0.2 },
  { match: 'citric acid', label: 'pH-Regulator (< 0,2 %)', approxMax: 0.2 }
];

// INCI-Wissensdatenbank (deterministische Analyse)
export const INCI_DB = [
  // --- RED FLAGS: DUFTSTOFFE & ALLERGENE ---
  { keys: ['parfum', 'fragrance', 'aroma'], name: 'Duftstoff / Parfum', category: 'fragrance', severity: 'bad', desc: 'Häufigster Kontaktallergen- und Entzündungstrigger bei Psoriasis & empfindlicher Haut.' },
  { keys: ['linalool', 'limonene', 'citronellol', 'geraniol', 'citral', 'coumarin', 'eugenol', 'benzyl salicylate', 'hexyl cinnamal', 'amyl cinnamal', 'farnesol', 'hydroxycitronellal', 'alpha-isomethyl ionone'], name: 'Deklarationspflichtiges Duftallergen', category: 'fragrance_allergen', severity: 'bad', desc: 'Einzel-Duftstoff mit hohem Allergie- und Reizpotenzial – bei Psoriasis meiden.' },

  // --- GUTE FETTALKOHOLE (müssen VOR den schlechten Alkoholen geprüft werden!) ---
  { keys: ['cetearyl alcohol', 'cetyl alcohol', 'stearyl alcohol', 'behenyl alcohol', 'myristyl alcohol', 'octyldodecanol', 'arachidyl alcohol'], name: 'Pflegender Fett-/Wachsalkohol', category: 'good_alcohol', severity: 'ok', desc: 'Kein austrocknender Alkohol! Macht Cremes geschmeidig und stärkt die Lipidbarriere.' },

  // --- AUSTROCKNENDE ALKOHOLE (Positionsabhängig!) ---
  { keys: ['alcohol denat', 'alcohol denat.', 'ethanol', 'isopropyl alcohol', 'sd alcohol'], name: 'Austrocknender Alkohol', category: 'bad_alcohol', severity: 'warn', desc: 'Entfettet & brennt auf Plaques, wenn weit vorne (Platz 1–6). Unterhalb der 1-%-Linie meist nur Lösungsmittel/Träger und unkritisch.' },
  { keys: ['alcohol'], exact: true, name: 'Einfacher Alkohol (Ethanol)', category: 'bad_alcohol', severity: 'warn', desc: 'Auf Platz 1–6 austrocknend & brennend bei Psoriasis; unterhalb der 1-%-Grenze (z. B. als Extrakt-Träger) in der Regel unproblematisch.' },

  // --- ÄTHERISCHE ÖLE & REIZSTOFFE ---
  { keys: ['melaleuca alternifolia', 'mentha piperita', 'menthol', 'camphor', 'eucalyptus globulus', 'lavandula angustifolia', 'citrus limon peel oil', 'citrus aurantium dulcis peel oil', 'citrus paradisi peel oil', 'rosmarinus officinalis leaf oil'], name: 'Ätherisches Öl / Reizstoff', category: 'essential_oil', severity: 'bad', desc: 'Stark reizend für empfindliche/Psoriasis-Haut (Zitrusöle zudem phototoxisch). Ausnahme: Menthol im Kopfhaut-Shampoo bei fettigem Ansatz.' },

  // --- MECHANISCHE REIBEKÖRPER ---
  { keys: ['prunus armeniaca seed powder', 'juglans regia shell powder', 'pumice', 'hydrated silica'], name: 'Mechanischer Peeling-/Reibekörper', category: 'scrub', severity: 'bad', desc: 'Gefahr für Mikroverletzungen & Koebner-Phänomen (neue Psoriasis-Plaques!).' },

  // --- HARTE TENSIDE ---
  { keys: ['sodium lauryl sulfate', 'ammonium lauryl sulfate', 'sodium c14-16 olefin sulfonate'], name: 'Stark entfettendes Sulfat-Tensid', category: 'harsh_surfactant', severity: 'bad', desc: 'Greift Barrierelipide stark an – bei empfindlicher Haut und im Gesicht strikt meiden.' },
  { keys: ['sodium laureth sulfate'], name: 'SLES (Sulfat-Tensid)', category: 'sles', severity: 'warn', desc: 'Für Psoriasis-/empfindliche Haut & Gesicht zu austrocknend. Für fettigen Haaransatz mit CWC-Spitzenschutz jedoch nutzbar.' },

  // --- MILDE TENSIDE ---
  { keys: ['coco-glucoside', 'decyl glucoside', 'lauryl glucoside', 'cocamidopropyl betaine', 'sodium cocoamphoacetate', 'sodium cocoyl glutamate', 'disodium cocoyl glutamate', 'disodium laureth sulfosuccinate', 'glyceryl oleate'], name: 'Mildes Tensid / Rückfetter', category: 'mild_surfactant', severity: 'ok', desc: 'Barriere- und mikrobiomfreundliche Reinigung (pH-schonend).' },

  // --- KRITISCHE VS. MODERNE UV-FILTER ---
  { keys: ['octocrylene', 'benzophenone-3', 'oxybenzone', 'homosalate'], name: 'Älterer / kritischer UV-Filter', category: 'bad_uv', severity: 'warn', desc: 'Bei empfindlicher & Psoriasis-Haut häufiger Kontaktallergien (bes. Octocrylen).' },
  { keys: ['bis-ethylhexyloxyphenol methoxyphenyl triazine', 'diethylamino hydroxybenzoyl hexyl benzoate', 'ethylhexyl triazone', 'ethylhexyl salicylate', 'phenylbenzimidazole sulfonic acid', 'diethylhexyl butamido triazone', 'titanium dioxide', 'zinc oxide', 'tris-biphenyl triazine'], name: 'Moderner, photostabiler UV-Filter', category: 'good_uv', severity: 'ok', desc: 'Hochverträglicher UV-Schutz gegen Sonnenbrand-Trigger (Koebner-Effekt) & Pickelmale (PIH).' },

  // --- KERATOLYSE (SCHUPPENLÖSER – Stinging-Warnung!) ---
  { keys: ['urea'], exact: true, name: 'Urea (Harnstoff)', category: 'keratolytic', severity: 'ok', needsHighPos: true, stingWarning: true, desc: 'Goldstandard der S3-Psoriasis-Leitlinie: ~5 % (Platz 3–4) feuchtigkeitsspendend, ~10 % (Platz 2) stark schuppenlösend. Nicht auf offene Risse!' },
  { keys: ['salicylic acid'], name: 'Salicylsäure (BHA)', category: 'keratolytic_bha', severity: 'ok', stingWarning: true, desc: 'Fettlöslich: löst Schuppenpanzer (Psoriasis) und tiefsitzenden Porentalg (fettige Haut). Nicht auf offene Stellen!' },
  { keys: ['glycolic acid'], name: 'Glykolsäure (AHA)', category: 'keratolytic_aha', severity: 'ok', stingWarning: true, desc: 'Wasserlösliche Fruchtsäure: löst dicke, trockene Oberflächen-Plaques effektiv. Nur auf geschlossener Haut & mit LSF 50!' },
  { keys: ['gluconolactone', 'lactobionic acid'], name: 'PHA (Polyhydroxysäure)', category: 'keratolytic_pha', severity: 'ok', desc: 'Sehr milde chemische Schuppenlösung, bindet gleichzeitig stark Wasser, brennt kaum.' },

  // --- BARRIERE & CERAMIDE (Signalmoleküle – auch <= 1 % wirksam!) ---
  { keys: ['ceramide np', 'ceramide ap', 'ceramide eop', 'ceramide ng', 'ceramide ns', 'cholesterol', 'phytosphingosine', 'hydrogenated lecithin'], name: 'Hautidentisches Ceramid / Barrierelipid', category: 'barrier_signal', severity: 'ok', signalMolecule: true, desc: 'Füllt Lücken im Lipidmörtel von Psoriasis-Haut. Schon ab 0,05–0,2 % (auch hinter der 1-%-Linie) hochwirksam!' },

  // --- BERUHIGUNG & ANTI-ENTZÜNDUNG ---
  { keys: ['niacinamide'], name: 'Niacinamid (Vitamin B3)', category: 'soothing_sebum', severity: 'ok', desc: 'Stärkt Ceramid-Synthese, mildert Rötungen & reguliert Talg (ideal für Psoriasis bei 2–5 % und für fettige Haut).' },
  { keys: ['panthenol'], name: 'Panthenol (Provitamin B5)', category: 'soothing', severity: 'ok', needsHighPos: true, desc: 'Beruhigt sofort, fördert Wundheilung & brennt nicht auf offenen Plaques.' },
  { keys: ['allantoin', 'bisabolol'], name: 'Allantoin / Bisabolol', category: 'soothing_signal', severity: 'ok', signalMolecule: true, desc: 'Stark beruhigend & reizlindernd; wirkt optimal bei 0,1–0,5 % (darf unter 1 % stehen).' },
  { keys: ['madecassoside', 'asiaticoside', 'centella asiatica'], name: 'Cica (Centella Asiatica)', category: 'soothing_signal', severity: 'ok', signalMolecule: true, desc: 'Entzündungs- und rötungshemmend; bereits ab 0,1 % wirksam.' },
  { keys: ['cyanocobalamin'], name: 'Vitamin B12', category: 'soothing_signal', severity: 'ok', signalMolecule: true, desc: 'Senkt Stickstoffmonoxid (NO) & Rötungen bei Psoriasis; wirkt schon ab 0,01 %.' },
  { keys: ['ectoin'], name: 'Ectoin', category: 'soothing_signal', severity: 'ok', signalMolecule: true, desc: 'Zellschützend, barriere- und feuchtigkeitsstabilisierend (ab 0,5 %).' },
  { keys: ['maris sal', 'sea salt'], name: 'Totes-Meer-Salz (Magnesium)', category: 'soothing_deadsea', severity: 'ok', desc: 'Hemmt entzündliche Hautreaktionen und löst Schuppen brennfrei.' },
  { keys: ['piroctone olamine'], name: 'Pirocton Olamin', category: 'scalp_active', severity: 'ok', signalMolecule: true, desc: 'Reguliert Kopfhaut-Mikrobiom (gegen Malassezia & Schuppen) ohne Reizung.' },

  // --- FEUCHTHALTER / NMF ---
  { keys: ['glycerin'], name: 'Glycerin', category: 'humectant', severity: 'ok', needsHighPos: true, desc: 'Top-Feuchthalter (AQP3-Kanäle), hält Plaques geschmeidig und verhindert Risse.' },
  { keys: ['betaine', 'sodium pca', 'sodium lactate', 'arginine', 'serine', 'glycine', 'propanediol', 'pentylene glycol', 'aloe barbadensis'], name: 'NMF / Feuchthalter', category: 'humectant', severity: 'ok', desc: 'Leichte, nicht-fettende Tiefenhydratation für normale, fettige und Psoriasis-Haut.' },
  { keys: ['sodium hyaluronate', 'hyaluronic acid', 'hydrolyzed hyaluronic acid'], name: 'Hyaluronsäure', category: 'humectant_signal', severity: 'ok', signalMolecule: true, desc: 'Bindet extrem viel Wasser; wirkt bereits bei 0,1–0,5 %.' },

  // --- TALGREGULIERUNG / FETTIGE HAUT ---
  { keys: ['potassium azeloyl diglycinate', 'azelaic acid'], name: 'Azelainsäure / PAD', category: 'sebum_active', severity: 'ok', desc: 'Talgregulierend, entzündungshemmend & gegen dunkle Pickelmale (Top für fettige Haut).' },
  { keys: ['zinc pca', 'silica', 'zea mays starch', 'camellia sinensis'], name: 'Mattierer / Sebum-Helfer', category: 'sebum_helper', severity: 'ok', desc: 'Nimmt überschüssigen Glanz auf (Maisstärke/Silica) oder wirkt antioxidativ (Grüntee).' },

  // --- LEICHTE VS. SCHWERE / OKKLUSIVE LIPIDE ---
  { keys: ['squalane', 'caprylic/capric triglyceride', 'dicaprylyl ether', 'coco-caprylate', 'coco-caprylate/caprate'], name: 'Leichtes, nicht-komedogenes Lipid', category: 'light_lipid', severity: 'ok', desc: 'Sehr hautverträglich, stärkt die Barriere ohne Poren zu verstopfen.' },
  { keys: ['butyrospermum parkii butter', 'butyrospermum parkii', 'shea butter', 'petrolatum', 'paraffinum liquidum', 'cera microcristallina', 'cera alba', 'ricinus communis seed oil', 'cocos nucifera oil', 'theobroma cacao seed butter', 'olus oil'], name: 'Reichhaltiges / okklusives Lipid', category: 'heavy_lipid', severity: 'ok', desc: 'Super für Psoriasis-Plaques, Winterpflege & trockene Haut – aber für fettige Gesichtshaut tagsüber oft zu schwer/glänzend.' },
  { keys: ['glycine soja oil', 'helianthus annuus seed oil', 'helianthus annuus hybrid oil', 'prunus amygdalus dulcis oil', 'simmondsia chinensis seed oil', 'canola oil', 'argania spinosa kernel oil'], name: 'Pflanzenöl', category: 'plant_oil', severity: 'ok', desc: 'Pflegendes Pflanzenöl (in Duschölen ideal auf Platz 1–2; bei fettiger Gesichtshaut tagsüber sparsam).' },

  // --- KONDI / HAAR ---
  { keys: ['behentrimonium chloride', 'cetrimonium chloride', 'polyquaternium'], name: 'Haar-Conditioner / Filmbildner', category: 'hair_cond', severity: 'neutral', desc: 'Entwirrt Locken & glättet die Schuppenschicht – bei fettigem Ansatz nur ab Ohrhöhe anwenden.' }
];

// Schnelltest-Beispiele (100 % offline testbar)
export const SAMPLE_PRODUCTS = {
  urea_serum: {
    name: 'ISANA med 5% Urea Akut-Pflege Serum',
    category: 'serum',
    inci: 'Aqua, Glycerin, Urea, Caprylic/Capric Triglyceride, Panthenol, Cetearyl Alcohol, Glyceryl Stearate Citrate, Allantoin, Tocopherol, Xanthan Gum, Phenoxyethanol, Lactic Acid'
  },
  bad_cream: {
    name: 'Beispiel: Parfümierte Anti-Glanz Creme',
    category: 'moisturizer',
    inci: 'Aqua, Alcohol Denat., Glycerin, Butyrospermum Parkii Butter, Parfum, Linalool, Limonene, Menthol, Prunus Armeniaca Seed Powder, Carbomer, Phenoxyethanol, Panthenol, Urea'
  },
  bha_peeling: {
    name: 'Balea Beauty Expert Liquid Peeling 2% BHA',
    category: 'exfoliant',
    inci: 'Aqua, Propanediol, Salicylic Acid, Glycerin, Camellia Sinensis Leaf Extract, Sodium Hydroxide, Phenoxyethanol'
  },
  lip_sunozon: {
    name: 'sunozon Sensitiv Lippenpflegestift LSF 50',
    category: 'lip_balm',
    inci: 'Ricinus Communis Seed Oil, Butyrospermum Parkii Butter, Dibutyl Adipate, Diethylamino Hydroxybenzoyl Hexyl Benzoate, Ethylhexyl Triazone, Bis-Ethylhexyloxyphenol Methoxyphenyl Triazine, Cera Alba, Tocopheryl Acetate, Bisabolol, Alcohol'
  }
};
