// ============================================================================
// SkinCheck Domain Data – basiert 1:1 auf deinen Psoriasis- & DM-Routinen
// ============================================================================

export const PROFILES = {
  alex: {
    id: 'alex',
    shortName: 'Alex',
    title: 'Alex – Normaler Hauttyp + Psoriasis vulgaris',
    subtitle: 'Zonen-Management · Barriere-Schutz · 0 % Parfum',
    summary:
      'Normaler Grundhauttyp im Gesicht (braucht leichte O/W-Emulsionen ohne Porenstau), aber genetische Psoriasis-Bereitschaft (Koebner-Effekt!). Plaques brauchen gezielte Keratolyse (Urea/AHA/BHA) + Lipidersatz, offene/rissige Stellen strikt brennfreie Pflege (Panthenol, Totes Meer, Ceramide).',
    goldenRules: [
      'Soak & Seal (3-Minuten-Fenster): Seren & Lotionen direkt innerhalb von 3 Min. nach dem Waschen/Duschen auf leicht feuchte Haut auftragen.',
      'Tupfen statt Rubbeln (Koebner-Schutz): Niemals trockenrubbeln oder Schuppen trocken abkratzen.',
      'Keine mechanischen Peelings (Scrubs, Bürsten, Granulate): Mikroverletzungen können neue Plaques auslösen.',
      'Kein-Brennen-Regel: Urea, AHA und BHA strikt nur auf geschlossene Haut! Bei offenen Rissen/Rhagaden sofort auf Balea med Gesichtscreme, Mixa Panthenol Comfort oder Totes-Meer-Salbe wechseln.',
      'Bartansatz / Koteletten (seborrhoische Übergangszone): Flüssige/leichte Seren (Calming Barrier / 5% Urea) statt schwerer Salben in den Stoppeln; mechanische Reize (Rasur, Over-Ear-Kopfhörer) minimieren.',
      'Ärztliche Cremes (Kortison/Calcipotriol): 30–60 Minuten Abstand zur kosmetischen Pflege einhalten.'
    ],
    inventory: [
      { id: 1, name: 'ISANA Calming Barrier Serum', status: 'Aktiv', slot: 'Gesicht AM & PM (Schritt 2)', key: '5% Ceramide, 2% Niacinamid, Cica, B12, Panthenol', url: 'https://www.rossmann.de/de/pflege-und-duft-isana-calming-barrier-serum/p/4068134047359' },
      { id: 2, name: 'ISANA med 5% Urea Akut-Pflege Serum', status: 'Aktiv', slot: 'Gesicht PM Spot & Plaque Schicht 1', key: '5% Urea, Panthenol, Lipide (nicht auf offene Risse!)', url: 'https://www.rossmann.de/de/pflege-und-duft-isana-med-akut-pflege-serum-5-urea/p/4305615628882' },
      { id: 3, name: 'ISANA Anti-UV Tagesfluid LSF 50', status: 'Aktiv', slot: 'Gesicht AM (2-in-1 Tagespflege + UV)', key: '3% NMF, Panthenol, moderne Filter (ohne Octocrylen)', url: 'https://www.rossmann.de/de/pflege-und-duft-isana-anti-uv-tagesfluid-lsf-50/p/4068134036629' },
      { id: 4, name: 'ISANA med Ultra Sensitiv Totes Meer Waschlotion', status: 'Aktiv', slot: 'Gesicht AM/PM & Körper-Dusche', key: 'Coco-Glucoside, Glycerin, pH-hautneutral, Totes Meer', url: 'https://www.rossmann.de/de/pflege-und-duft/koerperpflege/medizinische-hautpflege/c/olcat3_6076392' },
      { id: 5, name: 'ISANA med Ultra Sensitiv Barriereschutz Körperlotion', status: 'Aktiv', slot: 'Körper täglich (Soak & Seal) / Sommer-Nachtcreme', key: '3-fach Ceramide (NP/AP/EOP), Squalan, Panthenol', url: 'https://www.rossmann.de/de/pflege-und-duft-isana-med-koerperlotion-ultra-sensitiv/p/4305615628875' },
      { id: 6, name: 'ISANA med Ultra Sensitiv Totes Meer Körperlotion', status: 'Aktiv', slot: 'Körper bei Juckreiz / Rötung / gereizter Haut', key: 'Totes-Meer-Mineralien (Magnesium), Panthenol, brennfrei', url: 'https://www.rossmann.de/de/pflege-und-duft-isana-med-koerperlotion-totes-meer/p/4305615608914' },
      { id: 7, name: 'ISANA med Totes Meer Salbe', status: 'Aktiv', slot: 'Plaque-Versiegelung Abends/Nachts (Schicht 2)', key: 'Okklusiv, Totes Meer, brennfrei auch bei Rissen', url: 'https://www.rossmann.de/de/pflege-und-duft-isana-med-salbe-totes-meer/p/4305615608921' },
      { id: 8, name: 'ISANA med Ultra Sensitiv + Anti-Schuppen Shampoo', status: 'Aktiv', slot: 'Kopfhaut 2–3x/Woche bei Schuppung', key: 'Pirocton Olamin, Niacinamid, Panthenol, 0% Menthol/Parfum', url: 'https://www.rossmann.de/de/pflege-und-duft-isana-med-ultra-sensitiv-anti-schuppen-shampoo/p/4068134169129' },
      { id: 9, name: 'ISANA med Ultra Sensitiv Shampoo', status: 'Aktiv', slot: 'Kopfhaut Alltag (Zwischentage)', key: 'DAAB-empfohlen, Panthenol, Allantoin, 0% Parfum', url: 'https://www.rossmann.de/de/pflege-und-duft-isana-med-shampoo-jeden-tag-ultra-sensitiv/p/4305615629223' },
      { id: 10, name: 'ISANA med pH 5,5 Hautneutral Shampoo', status: 'Aktiv', slot: 'Kopfhaut Alltag (Mikrobiom-Schutz)', key: 'pH 5,5 Säureschutzmantel-freundlich', url: '' },
      { id: 11, name: 'Neutrogena Anti-Pickel Waschgel (2% BHA)', status: 'Aktiv (nur Körper)', slot: '3-Min-Dusch-Trick auf dicken Körper-Plaques', key: '2% Salicylsäure – NICHT fürs Gesicht/offene Stellen!', url: '' },
      { id: 12, name: 'Balea med Gesichtscreme Ultra Sensitive', status: 'Aktiv', slot: 'Gesicht PM (Winter/Nacht) & brennfreie SOS-Pflege', key: 'Glycerin, Sheabutter, Panthenol, Allantoin, ohne Urea', url: 'https://www.dm.de/p/d/1565294/balea-med-gesichtscreme-ultra-sensitive' },
      { id: 13, name: 'Mixa Panthenol Comfort Hautberuhigende Creme', status: 'Offen – aktiv', slot: 'Winter-Körper, Plaque Schicht 2 tagsüber, Hände/Ohren', key: '5% Panthenol, Niacinamid, Sheabutter, Maisstärke (matt)', url: 'https://www.rossmann.de/de/pflege-und-duft-mixa-panthenol-comfort-hautberuhigende-creme/p/3600551124803' },
      { id: 14, name: 'ISANA med Panthenol Komfort Creme Ultra Sensitive', status: 'Reserve (zu)', slot: '1:1-Backup für Mixa / Körperlotion / Nachtcreme', key: 'Glycerin, Sheabutter, Panthenol, Squalan, Ceramide NP', url: 'https://www.rossmann.de/de/pflege-und-duft-isana-med-panthenol-komfort-creme-ultra-sensitive/p/4068134235367' }
    ],
    routines: [
      {
        title: '☀️ Gesicht Morgens (AM)',
        steps: [
          { step: 'Schritt 1 – Reinigung', product: 'Lauwarmes Wasser oder ISANA med Totes Meer Waschlotion', desc: 'Milde Reinigung ohne Lipidverlust; nur sanft trocken tupfen.' },
          { step: 'Schritt 2 – Barriere-Serum', product: 'ISANA Calming Barrier Serum', desc: '2–3 Tropfen auf noch leicht feuchte Haut (Ceramide, 2% Niacinamid, Cica, B12).' },
          { step: 'Schritt 3+4 – Tagespflege & UV (2-in-1)', product: 'ISANA Anti-UV Tagesfluid LSF 50', desc: 'Ersetzt Tagescreme + Sonnenschutz; schützt vor UV-Koebner-Triggern.' }
        ]
      },
      {
        title: '🌙 Gesicht Abends (PM)',
        steps: [
          { step: 'Schritt 1 – Reinigung', product: 'ISANA med Totes Meer Waschlotion', desc: 'Entfernt UV-Fluid und Alltagsschmutz pH-hautneutral.' },
          { step: 'Schritt 2 – Zonen-Serum', product: 'Calming Barrier Serum (Gesicht) + 5% Urea Serum (Schuppenstellen)', desc: 'Urea nur auf geschlossene Schuppenstellen (Stirn/Haaransatz/Bartansatz), nie ans Augenlid.' },
          { step: 'Schritt 3 – Nachtpflege', product: 'Balea med Gesichtscreme Ultra Sensitive (oder Mixa Panthenol Comfort)', desc: 'Erbsengroß über dem Serum; brennfreie SOS-Option bei offenen/gereizten Stellen.' }
        ]
      },
      {
        title: '🚿 Körper, Kopfhaut & Plaques',
        steps: [
          { step: 'Duschen (5–10 Min., 35–37 °C)', product: 'ISANA med Totes Meer Waschlotion', desc: 'Keine Bürsten/Peelings; danach innerhalb von 3 Minuten eincremen.' },
          { step: 'Kopfhaut (Rotation)', product: '2–3x/Wo Anti-Schuppen Shampoo (Pirocton Olamin) ↔ Ultra Sensitiv / pH 5,5', desc: 'Anti-Schuppen 2–3 Min. einwirken lassen, nicht kratzen.' },
          { step: 'Körper-Basis (Soak & Seal)', product: 'Barriereschutz Lotion / Totes Meer Lotion / Mixa Panthenol Comfort (Winter)', desc: 'Je nach Bedarf: Ceramide täglich, Totes Meer bei Juckreiz, Mixa im Winter.' },
          { step: 'Plaque-Intensiv (2-Schicht)', product: 'Schicht 1: 5% Urea Serum → Schicht 2: Totes Meer Salbe (Nacht) / Mixa (Tag)', desc: 'Bei dicken geschlossenen Panzerwänden 2–3x/Wo 3-Min BHA-Dusch-Trick (Neutrogena) oder ISANA 6% AHA.' }
        ]
      }
    ]
  },

  partner: {
    id: 'partner',
    shortName: 'Freundin',
    title: 'Freundin – Fettige Haut (Seborrhoe) & dunkle Locken',
    subtitle: 'Talgregulierung · Non-komedogen · CWC-Haarroutine (dm)',
    summary:
      'Überaktive Talgdrüsen (Glanz, vergrößerte Poren, Neigung zu Pickelmalen/PIH bei dunklem Haartyp). Braucht milde Reinigung + Double Cleansing abends, Azelain/Niacinamid + 2% BHA, leichte Gele statt schwerer Sheabutter-Cremes. Haare: Zonen-Pflege (CWC) für fettigen Ansatz & trockene Lockenspitzen.',
    goldenRules: [
      'Morgens keine schwere Tagescreme unter dem Sonnenschutz! Das SUNDANCE 50+ Sonnenfluid ersetzt die Tagescreme.',
      'Abends immer Double Cleansing (Reinigungsöl auf trockener Haut → Waschgel), um wasserfeste UV-Filter & Sebum restlos zu lösen.',
      'Keine schweren Öle/Buttern (Sheabutter, Kokosöl) tagsüber im Gesicht oder am Haaransatz.',
      'CWC-Methode beim Haarewaschen: Spülung in die trockenen Spitzen → Shampoo NUR auf die Kopfhaut → Spülung ab Ohrhöhe.',
      'Haaröl (1–2 Tropfen) strikt nur in die unteren 5 cm der Spitzen; dunkles Trockenshampoo abends an Tag 2/3 auf den Ansatz.'
    ],
    inventory: [
      { id: 1, name: 'Balea MED Ultra Sensitive Waschgel', status: 'Vorhanden', slot: 'Gesicht AM & PM (Schritt 2)', key: 'Milde Zuckertenside, Glycerin, Panthenol, Bisabolol', url: '' },
      { id: 2, name: 'Balea Beauty Expert Liquid Peeling 2% BHA', status: 'Vorhanden', slot: 'Gesicht PM (Di/Do/So) + Kopfhaut Pre-Wash', key: '2% Salicylsäure (fettlöslich), Grüntee – löst Porentalg', url: '' },
      { id: 3, name: 'SUNDANCE 50+ Sensitiv Sonnenfluid', status: 'Vorhanden', slot: 'Gesicht AM (Alleinige Tagespflege + UV)', key: 'Moderne Filter, Silica (mattierend), verhindert PIH', url: '' },
      { id: 4, name: 'Balea MED Ultra Sensitive Tagescreme', status: 'Umwidmen', slot: 'Zu schwer fürs Gesicht → Hals/Dekolleté abends', key: 'Enthält Sheabutter & Öl → fördert Glanz tagsüber', url: '' },
      { id: 5, name: 'Balea Pure Frische Shampoo', status: 'Vorhanden', slot: 'Haare Waschtag (CWC – nur Ansatz!)', key: 'SLES + Niacinamid + Menthol, silikonfrei – entfettet Ansatz', url: '' },
      { id: 6, name: 'Balea Prof. Aqua Hyaluron Serie', status: 'Vorhanden', slot: 'Wechsel-Shampoo & Längen/Spitzen (C1/C2)', key: 'Hyaluron, Aloe Vera, leicht & silikonfrei', url: '' },
      { id: 7, name: 'Balea Reinigungsöl (parfümfrei)', status: 'Empfehlung', slot: 'Gesicht PM Schritt 1 (Double Cleansing)', key: 'Löst UV-Filter & Talgpfropfen auf trockener Haut', url: '' },
      { id: 8, name: 'Balea Beauty Expert Azelain Booster', status: 'Empfehlung', slot: 'Gesicht AM täglich & PM (Mo/Mi/Fr/Sa)', key: '3% PAD (Azelain) + Niacinamid – talgregulierend & gegen PIH', url: '' },
      { id: 9, name: 'Balea Aqua Feuchtigkeits Creme-Gel', status: 'Empfehlung', slot: 'Gesicht PM Abschluss (leichtes Gel)', key: 'Wasserbasiert, Hyaluron, nicht-komedogen', url: '' },
      { id: 10, name: 'Langhaarmädchen Lockengel', status: 'Empfehlung', slot: 'Locken-Styling ab Ohrhöhe (ölfrei)', key: 'Aloe Vera & Leinsamen – Gel-Cast ohne Beschweren', url: '' }
    ],
    weekPlan: [
      { day: 'Mo', am: 'Waschgel + Azelain + SPF50+', pm: 'Öl + Waschgel + Azelain + Creme-Gel', hair: 'Wasser-Refresh | Abends Trockenshampoo' },
      { day: 'Di', am: 'Waschgel + Azelain + SPF50+', pm: 'Öl + Waschgel + 2% BHA + Creme-Gel', hair: 'CWC-Waschtag: Pure Frische + Maske + Gel' },
      { day: 'Mi', am: 'Waschgel + Azelain + SPF50+', pm: 'Öl + Waschgel + Azelain + Creme-Gel', hair: '1 Tr. Haaröl Spitzen | Abends Trockenshampoo' },
      { day: 'Do', am: 'Waschgel + Azelain + SPF50+', pm: 'Öl + Waschgel + 2% BHA + Creme-Gel', hair: 'CWC-Waschtag: Aqua Hyaluron + Maske + Gel' },
      { day: 'Fr', am: 'Waschgel + Azelain + SPF50+', pm: 'Öl + Waschgel + Azelain + Creme-Gel', hair: 'Wasser-Refresh | Abends Trockenshampoo' },
      { day: 'Sa', am: 'Waschgel + Azelain + SPF50+', pm: 'Öl + Waschgel + Azelain + Creme-Gel', hair: 'Ruhetag / 1 Tr. Haaröl in die Spitzen' },
      { day: 'So', am: 'Waschgel + Azelain + SPF50+', pm: 'Öl + Waschgel + 2% BHA + Creme-Gel', hair: '2% BHA Kopfhaut Pre-Wash + CWC-Wäsche' }
    ]
  }
};

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
  { keys: ['melaleuca alternifolia', 'mentha piperita', 'menthol', 'camphor', 'eucalyptus globulus', 'lavandula angustifolia', 'citrus limon peel oil', 'citrus aurantium dulcis peel oil', 'citrus paradisi peel oil', 'rosmarinus officinalis leaf oil'], name: 'Ätherisches Öl / Reizstoff', category: 'essential_oil', severity: 'bad', desc: 'Stark reizend für Psoriasis-Haut (Zitrusöle zudem phototoxisch). Ausnahme: Menthol im Kopfhaut-Shampoo bei fettigem Ansatz (Freundin).' },

  // --- MECHANISCHE REIBEKÖRPER ---
  { keys: ['prunus armeniaca seed powder', 'juglans regia shell powder', 'pumice', 'hydrated silica'], name: 'Mechanischer Peeling-/Reibekörper', category: 'scrub', severity: 'bad', desc: 'Gefahr für Mikroverletzungen & Koebner-Phänomen (neue Psoriasis-Plaques!).' },

  // --- HARTE TENSIDE ---
  { keys: ['sodium lauryl sulfate', 'ammonium lauryl sulfate', 'sodium c14-16 olefin sulfonate'], name: 'Stark entfettendes Sulfat-Tensid', category: 'harsh_surfactant', severity: 'bad', desc: 'Greift Barrierelipide stark an – bei Psoriasis und im Gesicht strikt meiden.' },
  { keys: ['sodium laureth sulfate'], name: 'SLES (Sulfat-Tensid)', category: 'sles', severity: 'warn', desc: 'Für Psoriasis-Haut & Gesicht zu austrocknend. Für fettigen Haaransatz (Freundin) mit CWC-Spitzenschutz jedoch nutzbar.' },

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
