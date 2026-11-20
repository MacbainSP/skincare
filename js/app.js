import {
  PROFILES,
  PROFILE_PRESETS,
  SAMPLE_PRODUCTS,
  SKIN_CONDITIONS,
  SKIN_TYPES,
  formatSkinProfileLabel
} from './data.js';
import { analyzeInci } from './analyzer.js';
import {
  compressImageFile,
  extractFromPhoto,
  extractFromUrl,
  getAiSecondOpinion,
  listAvailableModels,
  testOrAutoSelectModel
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
    // Migration von altem activeProfile auf flexibles skinProfile
    const defaultSkinProfile = parsed.activeProfile === 'partner'
      ? { skinType: 'oily', conditions: ['seborrhoe', 'pih', 'curly_oily'] }
      : { skinType: 'normal', conditions: ['psoriasis'] };
    const skinProfile = parsed.skinProfile && parsed.skinProfile.skinType
      ? {
          skinType: parsed.skinProfile.skinType,
          conditions: Array.isArray(parsed.skinProfile.conditions) ? parsed.skinProfile.conditions : []
        }
      : defaultSkinProfile;
    return {
      skinProfile,
      apiKey: parsed.apiKey || '',
      model: parsed.model || 'gemini-flash-latest'
    };
  } catch {
    return {
      skinProfile: { skinType: 'normal', conditions: ['psoriasis'] },
      apiKey: '',
      model: 'gemini-flash-latest'
    };
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
  initSkinProfileSelector();
  bindNavigation();
  bindModeTabs();
  bindScanControls();
  bindPlanControls();
  bindHistoryControls();
  bindSettingsControls();
  syncProfileUI();
  renderPlan(getMatchingPlanId());
  renderHistory();
});

function getMatchingPlanId() {
  const sp = state.settings.skinProfile;
  if (sp.skinType === 'oily' || sp.conditions.includes('seborrhoe') || sp.conditions.includes('curly_oily')) {
    return sp.conditions.includes('psoriasis') ? 'alex' : 'partner';
  }
  return 'alex';
}

function initSkinProfileSelector() {
  const selectEl = document.getElementById('select-skin-type');
  selectEl.innerHTML = SKIN_TYPES.map(
    (st) => `<option value="${st.id}">${escapeHtml(st.label)} – ${escapeHtml(st.desc)}</option>`
  ).join('');

  const gridEl = document.getElementById('conditions-checkbox-grid');
  gridEl.innerHTML = SKIN_CONDITIONS.map(
    (c) => `
      <label class="cond-chip" data-cond-id="${c.id}" title="${escapeHtml(c.desc)}">
        <input type="checkbox" value="${c.id}" />
        <span>${escapeHtml(c.short)}</span>
      </label>`
  ).join('');

  selectEl.addEventListener('change', () => {
    state.settings.skinProfile.skinType = selectEl.value;
    onSkinProfileChanged();
  });

  gridEl.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.addEventListener('change', () => {
      const checked = Array.from(gridEl.querySelectorAll('input[type="checkbox"]:checked')).map((i) => i.value);
      state.settings.skinProfile.conditions = checked;
      onSkinProfileChanged();
    });
  });

  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      applyPreset(btn.dataset.preset);
    });
  });
}

function applyPreset(presetId) {
  const preset = PROFILE_PRESETS[presetId];
  if (!preset) return;
  state.settings.skinProfile = {
    skinType: preset.skinType,
    conditions: [...preset.conditions]
  };
  onSkinProfileChanged();
}

function onSkinProfileChanged() {
  saveSettings();
  syncProfileUI();
  renderPlan(getMatchingPlanId());
  if (state.lastAnalysis) {
    const reanalyzed = analyzeInci({
      productName: state.lastAnalysis.productName,
      rawInci: state.lastAnalysis.rawInci,
      category: state.lastAnalysis.category,
      skinProfile: state.settings.skinProfile,
      sourceUrl: state.lastAnalysis.sourceUrl
    });
    state.lastAnalysis = reanalyzed;
    renderResult(reanalyzed, state.lastAiSummary);
  }
}

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
    const isAlex = matchesPreset('alex');
    applyPreset(isAlex ? 'partner' : 'alex');
  });
}

function matchesPreset(presetId) {
  const preset = PROFILE_PRESETS[presetId];
  if (!preset) return false;
  const sp = state.settings.skinProfile;
  if (sp.skinType !== preset.skinType) return false;
  if (sp.conditions.length !== preset.conditions.length) return false;
  return preset.conditions.every((c) => sp.conditions.includes(c));
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
  const sp = state.settings.skinProfile;
  const label = formatSkinProfileLabel(sp);
  document.getElementById('header-profile-label').textContent = label;

  const isAlex = matchesPreset('alex');
  const isPartner = matchesPreset('partner');
  document.getElementById('profile-chip-text').textContent = isAlex ? 'Alex' : isPartner ? 'Freundin' : 'Eigene';

  // Dropdown & Checkboxes synchronisieren
  const selectEl = document.getElementById('select-skin-type');
  if (selectEl) selectEl.value = sp.skinType;

  document.querySelectorAll('#conditions-checkbox-grid .cond-chip').forEach((chip) => {
    const cb = chip.querySelector('input[type="checkbox"]');
    const isChecked = sp.conditions.includes(chip.dataset.condId);
    if (cb) cb.checked = isChecked;
    chip.classList.toggle('checked', isChecked);
  });

  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.classList.toggle('active', matchesPreset(btn.dataset.preset));
  });

  const planId = getMatchingPlanId();
  document.querySelectorAll('.segment-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.planProfile === planId);
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
        skinProfile: state.settings.skinProfile
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
        skinProfile: state.settings.skinProfile
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
          skinProfile: state.settings.skinProfile
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
    skinProfile: state.settings.skinProfile,
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
    profileLabel: analysis.profileLabel,
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

  const profileLabel = a.profileLabel || formatSkinProfileLabel(state.settings.skinProfile);
  const warningsHtml = a.warnings.length
    ? `<div class="verdict-box ${a.score < 58 ? 'badge-bad' : 'badge-warn'}"><strong>⚠️ Wichtige Hinweise für dein Hautprofil (${escapeHtml(profileLabel)})</strong><ul class="bullet-list">${a.warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join('')}</ul></div>`
    : `<div class="verdict-box badge-ok"><strong>✅ Keine Red Flags für dein Profil erkannt</strong>Reizfreie, gut abgestimmte Formulierung für ${escapeHtml(profileLabel)}.</div>`;

  const reasonsHtml = a.reasons.length
    ? `<div class="verdict-box badge-info"><strong>✨ Pluspunkte</strong><ul class="bullet-list">${a.reasons.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}</ul></div>`
    : '';

  const skinTypesHtml = a.skinTypes
    .map((st) => `
      <div class="skintype-row ${st.id === a.skinProfile?.skinType ? 'active-profile' : ''}">
        <div>
          <div class="skintype-name">${escapeHtml(st.name)} ${st.id === a.skinProfile?.skinType ? '<span class="pill badge-info">Dein Grundtyp</span>' : ''}</div>
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
      const label = h.profileLabel || PROFILES[h.activeProfile]?.shortName || 'Normal';
      return `
        <div class="card history-card" data-history-id="${escapeHtml(h.id)}">
          <div style="min-width:0;">
            <strong style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(h.productName)}</strong>
            <div class="hint-small">${dt} · ${escapeHtml(label)}</div>
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
        skinProfile: state.settings.skinProfile,
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
function populateModelDropdown(selectEl, models, selectedId) {
  if (!models || !models.length) return;
  selectEl.innerHTML = models
    .map((m) => `<option value="${escapeHtml(m.id)}">${escapeHtml(m.id)}${m.displayName && m.displayName !== m.id ? ` (${escapeHtml(m.displayName)})` : ''}</option>`)
    .join('');
  if (selectedId && models.some((m) => m.id === selectedId)) {
    selectEl.value = selectedId;
  }
}

function bindSettingsControls() {
  const apiKeyInput = document.getElementById('input-api-key');
  const modelSelect = document.getElementById('input-gemini-model');
  const feedback = document.getElementById('settings-feedback');

  apiKeyInput.value = state.settings.apiKey;
  if (state.settings.model && !Array.from(modelSelect.options).some((o) => o.value === state.settings.model)) {
    const opt = document.createElement('option');
    opt.value = state.settings.model;
    opt.textContent = state.settings.model;
    modelSelect.prepend(opt);
  }
  modelSelect.value = state.settings.model;

  document.getElementById('btn-save-settings').addEventListener('click', () => {
    state.settings.apiKey = apiKeyInput.value.trim();
    state.settings.model = modelSelect.value;
    saveSettings();
    syncProfileUI();
    feedback.textContent = `✅ Einstellungen lokal gespeichert (Modell: ${state.settings.model}).`;
  });

  document.getElementById('btn-load-models').addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
      feedback.textContent = '⚠️ Bitte zuerst deinen Gemini API-Key eintragen.';
      return;
    }
    feedback.textContent = 'Lade verfügbare Modelle für deinen API-Key…';
    try {
      const models = await listAvailableModels(key);
      if (!models.length) {
        feedback.textContent = '⚠️ Keine generateContent-Modelle für diesen Key gefunden.';
        return;
      }
      populateModelDropdown(modelSelect, models, modelSelect.value);
      state.settings.apiKey = key;
      state.settings.model = modelSelect.value;
      saveSettings();
      syncProfileUI();
      feedback.textContent = `✅ ${models.length} verfügbare Modelle geladen! Gewählt: ${state.settings.model}`;
    } catch (err) {
      feedback.textContent = `❌ ${err.message}`;
    }
  });

  document.getElementById('btn-test-api').addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    const preferredModel = modelSelect.value;
    if (!key) {
      feedback.textContent = '⚠️ Bitte zuerst einen Gemini API-Key eintragen.';
      return;
    }
    feedback.textContent = 'Teste Verbindung (und suche automatisch ein freies Modell falls nötig)…';
    try {
      const res = await testOrAutoSelectModel(key, preferredModel);
      if (res.models && res.models.length) {
        populateModelDropdown(modelSelect, res.models, res.model);
      } else {
        modelSelect.value = res.model;
      }
      state.settings.apiKey = key;
      state.settings.model = res.model;
      saveSettings();
      syncProfileUI();
      feedback.textContent = res.autoSwitched
        ? `✅ Automatisch auf verfügbares Modell „${res.model}“ gewechselt & gespeichert! Antwort: „${res.reply}“`
        : `✅ Verbindung erfolgreich mit „${res.model}“! Antwort: „${res.reply}“`;
    } catch (err) {
      feedback.textContent = `❌ ${err.message}`;
    }
  });
}
