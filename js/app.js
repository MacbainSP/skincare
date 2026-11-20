import { PROFILES, SAMPLE_PRODUCTS } from './data.js';
import { analyzeInci } from './analyzer.js';
import {
  compressImageFile,
  extractFromPhoto,
  extractFromUrl,
  getAiSecondOpinion,
  testGeminiConnection
} from './gemini.js';

const STORAGE_KEYS = {
  settings: 'skincheck_settings_v1',
  history: 'skincheck_history_v1'
};

const state = {
  settings: loadSettings(),
  history: loadHistory(),
  currentPhoto: null, // { base64Data, mimeType, previewUrl }
  lastAnalysis: null,
  lastAiSummary: '',
  deferredPrompt: null
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      activeProfile: parsed.activeProfile === 'partner' ? 'partner' : 'alex',
      apiKey: parsed.apiKey || '',
      model: parsed.model || 'gemini-2.5-flash'
    };
  } catch {
    return { activeProfile: 'alex', apiKey: '', model: 'gemini-2.5-flash' };
  }
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state.settings));
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.history);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory() {
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(state.history.slice(0, 40)));
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ============================================================================
// INIT
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  registerServiceWorker();
  setupInstallPrompt();
  bindNavigation();
  bindModeTabs();
  bindScanControls();
  bindPlanControls();
  bindHistoryControls();
  bindSettingsControls();
  syncProfileUI();
  renderPlan(state.settings.activeProfile);
  renderHistory();
});

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

function setupInstallPrompt() {
  const btn = document.getElementById('btn-install-pwa');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.deferredPrompt = e;
    btn.classList.remove('hidden');
  });
  btn.addEventListener('click', async () => {
    if (!state.deferredPrompt) return;
    state.deferredPrompt.prompt();
    await state.deferredPrompt.userChoice;
    state.deferredPrompt = null;
    btn.classList.add('hidden');
  });
}

// ============================================================================
// NAVIGATION & PROFILE SWITCH
// ============================================================================
function bindNavigation() {
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.view;
      switchView(target);
    });
  });

  document.getElementById('quick-profile-switch').addEventListener('click', () => {
    state.settings.activeProfile = state.settings.activeProfile === 'alex' ? 'partner' : 'alex';
    saveSettings();
    syncProfileUI();
    renderPlan(state.settings.activeProfile);
    if (state.lastAnalysis) {
      // Sofort für das neue Profil neu bewerten!
      const reanalyzed = analyzeInci({
        productName: state.lastAnalysis.productName,
        rawInci: state.lastAnalysis.rawInci,
        category: state.lastAnalysis.category,
        activeProfile: state.settings.activeProfile,
        sourceUrl: state.lastAnalysis.sourceUrl
      });
      state.lastAnalysis = reanalyzed;
      renderResult(reanalyzed, state.lastAiSummary);
    }
  });
}

function switchView(viewName) {
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  document.getElementById(`view-${viewName}`).classList.add('active');
  document.querySelectorAll('.nav-item').forEach((n) => {
    n.classList.toggle('active', n.dataset.view === viewName);
  });
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function syncProfileUI() {
  const p = PROFILES[state.settings.activeProfile];
  document.getElementById('header-profile-label').textContent = `Profil: ${p.title}`;
  document.getElementById('profile-chip-text').textContent = p.shortName;

  document.querySelectorAll('input[name="default-profile"]').forEach((r) => {
    r.checked = r.value === state.settings.activeProfile;
  });

  document.querySelectorAll('.segment-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.planProfile === state.settings.activeProfile);
  });

  const apiHint = document.getElementById('photo-api-hint');
  if (state.settings.apiKey) {
    apiHint.textContent = `✅ Gemini API-Key aktiv (${state.settings.model}) – Foto-Scan & Link-Suche einsatzbereit.`;
  } else {
    apiHint.textContent = 'ℹ️ Für Foto-Scan bitte kostenlosen Gemini API-Key im Tab „Setup“ eintragen. Text-Analysen funktionieren auch komplett offline.';
  }
}

// ============================================================================
// SCANNER CONTROLS
// ============================================================================
function bindModeTabs() {
  document.querySelectorAll('.mode-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.mode;
      document.querySelectorAll('.mode-tab').forEach((t) => {
        t.classList.toggle('active', t === tab);
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      });
      document.querySelectorAll('.mode-panel').forEach((p) => {
        p.classList.toggle('active', p.id === `panel-${mode}`);
      });
      hideError();
    });
  });
}

function bindScanControls() {
  const cameraInput = document.getElementById('input-camera');
  const galleryInput = document.getElementById('input-gallery');

  const onFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    hideError();
    try {
      setLoading(true, 'Bereite Foto vor…');
      const compressed = await compressImageFile(file);
      state.currentPhoto = compressed;
      document.getElementById('photo-preview').src = compressed.previewUrl;
      document.getElementById('photo-preview-wrap').classList.remove('hidden');
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  cameraInput.addEventListener('change', onFileSelected);
  galleryInput.addEventListener('change', onFileSelected);

  document.getElementById('btn-clear-photo').addEventListener('click', () => {
    state.currentPhoto = null;
    document.getElementById('photo-preview-wrap').classList.add('hidden');
  });

  document.getElementById('btn-analyze-photo').addEventListener('click', async () => {
    if (!state.currentPhoto) return;
    hideError();
    try {
      setLoading(true, 'Lese INCI-Liste per Gemini Vision aus…');
      const extracted = await extractFromPhoto({
        apiKey: state.settings.apiKey,
        model: state.settings.model,
        base64Data: state.currentPhoto.base64Data,
        mimeType: state.currentPhoto.mimeType,
        activeProfile: state.settings.activeProfile
      });
      runAnalysisAndRender({
        productName: extracted.productName,
        rawInci: extracted.rawInci,
        category: extracted.category || 'auto',
        aiSummary: extracted.aiSummary || ''
      });
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  });

  document.getElementById('btn-analyze-url').addEventListener('click', async () => {
    const url = document.getElementById('input-url').value.trim();
    if (!url) {
      showError('Bitte füge zuerst einen Produkt-Link ein.');
      return;
    }
    hideError();
    try {
      setLoading(true, 'Lese Produktseite & INCI-Liste aus…');
      const extracted = await extractFromUrl({
        url,
        apiKey: state.settings.apiKey,
        model: state.settings.model,
        activeProfile: state.settings.activeProfile
      });
      runAnalysisAndRender({
        productName: extracted.productName,
        rawInci: extracted.rawInci,
        category: extracted.category || 'auto',
        sourceUrl: url,
        aiSummary: extracted.aiSummary || ''
      });
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  });

  document.getElementById('btn-analyze-text').addEventListener('click', async () => {
    const productName = document.getElementById('input-product-name').value.trim();
    const category = document.getElementById('input-product-category').value;
    const rawInci = document.getElementById('input-inci').value.trim();
    hideError();
    if (!rawInci) {
      showError('Bitte gib eine INCI-Liste ein.');
      return;
    }
    try {
      const result = runAnalysisAndRender({ productName, rawInci, category, aiSummary: '' });
      if (state.settings.apiKey) {
        setLoading(true, 'Hole personalisierte KI-Zweitmeinung…');
        const aiText = await getAiSecondOpinion({
          apiKey: state.settings.apiKey,
          model: state.settings.model,
          productName: result.productName,
          rawInci: result.rawInci,
          activeProfile: state.settings.activeProfile
        }).catch(() => '');
        if (aiText) {
          state.lastAiSummary = aiText;
          renderResult(result, aiText);
          updateLatestHistoryAi(aiText);
        }
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  });

  document.querySelectorAll('[data-sample]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sample = SAMPLE_PRODUCTS[btn.dataset.sample];
      if (!sample) return;
      document.getElementById('input-product-name').value = sample.name;
      document.getElementById('input-product-category').value = sample.category;
      document.getElementById('input-inci').value = sample.inci;
      runAnalysisAndRender({
        productName: sample.name,
        rawInci: sample.inci,
        category: sample.category,
        aiSummary: ''
      });
    });
  });
}

function runAnalysisAndRender({ productName, rawInci, category = 'auto', sourceUrl = '', aiSummary = '' }) {
  const analysis = analyzeInci({
    productName,
    rawInci,
    category,
    activeProfile: state.settings.activeProfile,
    sourceUrl
  });
  state.lastAnalysis = analysis;
  state.lastAiSummary = aiSummary;

  // In Verlauf speichern
  state.history.unshift({
    id: Date.now().toString(36),
    productName: analysis.productName,
    category: analysis.category,
    rawInci: analysis.rawInci,
    sourceUrl: analysis.sourceUrl,
    score: analysis.score,
    verdictLabel: analysis.verdict.label,
    verdictCls: analysis.verdict.cls,
    activeProfile: analysis.activeProfile,
    aiSummary,
    timestamp: analysis.timestamp
  });
  saveHistory();
  renderHistory();
  renderResult(analysis, aiSummary);
  return analysis;
}

function updateLatestHistoryAi(aiText) {
  if (state.history.length > 0) {
    state.history[0].aiSummary = aiText;
    saveHistory();
  }
}

function setLoading(isLoading, text = '') {
  const banner = document.getElementById('status-banner');
  document.getElementById('status-text').textContent = text;
  banner.classList.toggle('hidden', !isLoading);
}

function showError(msg) {
  const el = document.getElementById('error-banner');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideError() {
  document.getElementById('error-banner').classList.add('hidden');
}

// ============================================================================
// RESULT RENDERING
// ============================================================================
function renderResult(a, aiSummary = '') {
  const container = document.getElementById('result-container');
  container.classList.remove('hidden');

  const profileLabel = PROFILES[a.activeProfile].shortName;
  const warningsHtml = a.activeProfile === 'alex'
    ? (a.alexWarnings.length
        ? `<div class="verdict-box badge-bad"><strong>⚠️ Wichtige Hinweise für dein Psoriasis-Profil</strong><ul class="bullet-list">${a.alexWarnings.map((w) => `<li>${escapeHtml(w)}</li>`).join('')}</ul></div>`
        : `<div class="verdict-box badge-ok"><strong>✅ Keine Psoriasis-Red-Flags erkannt</strong>Frei von Duftstoffen, problematischen Alkoholen weit vorne, ätherischen Ölen und mechanischen Reibekörpern.</div>`)
    : (a.partnerNotes.length
        ? `<div class="verdict-box ${a.partnerScore >= 75 ? 'badge-ok' : 'badge-warn'}"><strong>Hinweise für fettige Haut / Locken</strong><ul class="bullet-list">${a.partnerNotes.map((n) => `<li>${escapeHtml(n)}</li>`).join('')}</ul></div>`
        : '');

  const reasonsHtml = a.activeProfile === 'alex' && a.alexReasons.length
    ? `<div class="verdict-box badge-info"><strong>✨ Pluspunkte</strong><ul class="bullet-list">${a.alexReasons.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}</ul></div>`
    : '';

  const skinTypesHtml = a.skinTypes
    .map((st) => `
      <div class="skintype-row ${st.id === a.activeProfile ? 'active-profile' : ''}">
        <div>
          <div class="skintype-name">${escapeHtml(st.name)} ${st.id === a.activeProfile ? '<span class="pill badge-info">Aktiv</span>' : ''}</div>
          <div class="skintype-note">${escapeHtml(st.note)}</div>
        </div>
        <span class="pill ${st.verdict.cls}">${st.score}/100</span>
      </div>
    `)
    .join('');

  const inciItemsHtml = a.breakdown
    .map((item) => {
      const divider = item.isAnchor
        ? `<div class="anchor-divider">── 1-%-Linie erkannt: ${escapeHtml(item.anchorLabel)} ──</div>`
        : '';
      return `
        ${divider}
        <div class="inci-item status-${item.status}">
          <div class="inci-pos">#${item.pos}</div>
          <div class="inci-main">
            <div class="inci-name">${escapeHtml(item.raw)}</div>
            <div class="inci-desc"><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.desc)}</div>
          </div>
          <div class="inci-est">${escapeHtml(item.est)}</div>
        </div>
      `;
    })
    .join('');

  const aiHtml = aiSummary
    ? `<div class="card"><h2>🤖 Personalisierte KI-Einschätzung</h2><div class="ai-box">${escapeHtml(aiSummary)}</div></div>`
    : '';

  container.innerHTML = `
    <div class="card">
      <div class="verdict-header">
        <div>
          <h2 class="verdict-title">${escapeHtml(a.productName)}</h2>
          <div class="verdict-meta">
            Kategorie: <strong>${escapeHtml(a.categoryLabel)}</strong> · ${a.totalCount} Inhaltsstoffe · Profil: <strong>${escapeHtml(profileLabel)}</strong>
            ${a.sourceUrl ? ` · <a href="${escapeHtml(a.sourceUrl)}" target="_blank" rel="noopener">Link</a>` : ''}
          </div>
        </div>
        <div class="score-badge ${a.verdict.cls}">
          ${a.score}
          <small>${escapeHtml(a.verdict.label)}</small>
        </div>
      </div>

      ${warningsHtml}
      ${reasonsHtml}

      <h3>📋 Einordnung in den Pflegeplan (${escapeHtml(profileLabel)})</h3>
      <div class="routine-slot-box">
        <h4>${escapeHtml(a.routinePlacement.slot)}</h4>
        <p>${escapeHtml(a.routinePlacement.advice)}</p>
        <p style="margin-top:6px; color: var(--text-muted);"><strong>Bestandsabgleich:</strong> ${escapeHtml(a.routinePlacement.existingMatch)}</p>
      </div>
    </div>

    ${aiHtml}

    <div class="card">
      <h2>🎯 Zu welchem Hauttyp passt das Produkt?</h2>
      <div class="skintype-grid">${skinTypesHtml}</div>
    </div>

    <div class="card">
      <h2>🔬 INCI-Aufschlüsselung (${a.totalCount} Stoffe)</h2>
      <p class="helper-text">
        ${a.anchorFound
          ? `Die unsichtbare <strong>1-%-Linie</strong> wurde ab <strong>Platz #${a.anchorPos}</strong> erkannt (${escapeHtml(a.anchorLabel)}). Alles davor ist absteigend nach Gewicht sortiert.`
          : 'Kein klassischer 1-%-Anker (z. B. Phenoxyethanol/Carbomer) gefunden – Mengenangaben sind grobe Richtwerte nach Listenplatz.'}
      </p>
      <div class="inci-list">${inciItemsHtml}</div>
    </div>
  `;

  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================================
// PFLEGEPLAN VIEW
// ============================================================================
function bindPlanControls() {
  document.querySelectorAll('.segment-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = btn.dataset.planProfile;
      document.querySelectorAll('.segment-btn').forEach((b) => b.classList.toggle('active', b === btn));
      renderPlan(p);
    });
  });
}

function renderPlan(profileId) {
  const container = document.getElementById('plan-content');
  const p = PROFILES[profileId] || PROFILES.alex;

  let routineHtml = '';
  if (profileId === 'alex') {
    routineHtml = p.routines
      .map(
        (block) => `
      <div class="card">
        <h2>${escapeHtml(block.title)}</h2>
        ${block.steps
          .map(
            (s) => `
          <div class="plan-step">
            <div class="plan-step-title">${escapeHtml(s.step)}</div>
            <div class="plan-step-product">${escapeHtml(s.product)}</div>
            <div class="plan-step-desc">${escapeHtml(s.desc)}</div>
          </div>`
          )
          .join('')}
      </div>`
      )
      .join('');
  } else {
    routineHtml = `
      <div class="card">
        <h2>📅 Wochenplan (Haut &amp; Locken CWC)</h2>
        <table class="week-table">
          <thead>
            <tr><th>Tag</th><th>Morgens</th><th>Abends (Double Cleanse)</th><th>Haare</th></tr>
          </thead>
          <tbody>
            ${p.weekPlan
              .map(
                (w) => `<tr><td><strong>${w.day}</strong></td><td>${escapeHtml(w.am)}</td><td>${escapeHtml(w.pm)}</td><td>${escapeHtml(w.hair)}</td></tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>`;
  }

  const rulesHtml = `
    <div class="card">
      <h2>🛡️ Goldene Regeln</h2>
      <ul class="rule-list">
        ${p.goldenRules.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}
      </ul>
    </div>`;

  const invHtml = `
    <div class="card">
      <h2>🧴 Produktbestand (${p.inventory.length})</h2>
      ${p.inventory
        .map(
          (item) => `
        <div class="inventory-item">
          <div>
            <strong>#${item.id} ${escapeHtml(item.name)}</strong>
            <div class="hint-small" style="margin-top:2px;">${escapeHtml(item.slot)}</div>
            <div class="hint-small" style="margin-top:2px;">${escapeHtml(item.key)}</div>
          </div>
          <div style="text-align:right; flex-shrink:0;">
            <span class="pill ${item.status.includes('Reserve') || item.status.includes('Empfehlung') ? 'badge-info' : item.status.includes('Umwidmen') ? 'badge-warn' : 'badge-ok'}">${escapeHtml(item.status)}</span>
            ${item.url ? `<div style="margin-top:4px;"><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">Shop ↗</a></div>` : ''}
          </div>
        </div>`
        )
        .join('')}
    </div>`;

  container.innerHTML = `
    <div class="card">
      <h2>${escapeHtml(p.title)}</h2>
      <p class="helper-text" style="margin-bottom:0;">${escapeHtml(p.summary)}</p>
    </div>
    ${routineHtml}
    ${rulesHtml}
    ${invHtml}
  `;
}

// ============================================================================
// HISTORY VIEW
// ============================================================================
function bindHistoryControls() {
  document.getElementById('btn-clear-history').addEventListener('click', () => {
    if (!state.history.length) return;
    if (confirm('Alle gespeicherten Analysen löschen?')) {
      state.history = [];
      saveHistory();
      renderHistory();
    }
  });
}

function renderHistory() {
  const container = document.getElementById('history-list');
  if (!state.history.length) {
    container.innerHTML = `<div class="card"><p class="helper-text" style="margin:0;">Noch keine Produkte gescannt. Nutze den Tab „Scanner“, um dein erstes Produkt per Foto, Link oder INCI-Text zu prüfen.</p></div>`;
    return;
  }

  container.innerHTML = state.history
    .map((h) => {
      const dt = new Date(h.timestamp).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
      return `
        <div class="card history-card" data-history-id="${escapeHtml(h.id)}">
          <div style="min-width:0;">
            <strong style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(h.productName)}</strong>
            <div class="hint-small">${dt} · Profil: ${escapeHtml(PROFILES[h.activeProfile]?.shortName || 'Alex')}</div>
          </div>
          <span class="pill ${escapeHtml(h.verdictCls)}">${h.score}/100</span>
        </div>`;
    })
    .join('');

  container.querySelectorAll('.history-card').forEach((card) => {
    card.addEventListener('click', () => {
      const entry = state.history.find((x) => x.id === card.dataset.historyId);
      if (!entry) return;
      const reanalyzed = analyzeInci({
        productName: entry.productName,
        rawInci: entry.rawInci,
        category: entry.category || 'auto',
        activeProfile: state.settings.activeProfile,
        sourceUrl: entry.sourceUrl || ''
      });
      state.lastAnalysis = reanalyzed;
      state.lastAiSummary = entry.aiSummary || '';
      switchView('scan');
      renderResult(reanalyzed, entry.aiSummary || '');
    });
  });
}

// ============================================================================
// SETTINGS VIEW
// ============================================================================
function bindSettingsControls() {
  const apiKeyInput = document.getElementById('input-api-key');
  const modelSelect = document.getElementById('input-gemini-model');
  const feedback = document.getElementById('settings-feedback');

  apiKeyInput.value = state.settings.apiKey;
  modelSelect.value = state.settings.model;

  document.querySelectorAll('input[name="default-profile"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        state.settings.activeProfile = radio.value;
        saveSettings();
        syncProfileUI();
        renderPlan(state.settings.activeProfile);
      }
    });
  });

  document.getElementById('btn-save-settings').addEventListener('click', () => {
    state.settings.apiKey = apiKeyInput.value.trim();
    state.settings.model = modelSelect.value;
    saveSettings();
    syncProfileUI();
    feedback.textContent = '✅ Einstellungen lokal gespeichert.';
  });

  document.getElementById('btn-test-api').addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    const model = modelSelect.value;
    if (!key) {
      feedback.textContent = '⚠️ Bitte zuerst einen Gemini API-Key eintragen.';
      return;
    }
    feedback.textContent = 'Teste Verbindung zu Gemini…';
    try {
      const reply = await testGeminiConnection(key, model);
      state.settings.apiKey = key;
      state.settings.model = model;
      saveSettings();
      syncProfileUI();
      feedback.textContent = `✅ Verbindung erfolgreich! Antwort: „${reply}“`;
    } catch (err) {
      feedback.textContent = `❌ ${err.message}`;
    }
  });
}
