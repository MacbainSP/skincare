import {
  CONDITION_TIPS,
  ROUTINE_SLOTS,
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
  history: 'skincheck_history_v1',
  plan: 'skincheck_plan_v1'
};

const state = {
  settings: loadSettings(),
  history: loadHistory(),
  plan: loadPlan(),
  currentPhoto: null, // { base64Data, mimeType, previewUrl }
  cameraStream: null,
  lastAnalysis: null,
  lastAiSummary: '',
  deferredPrompt: null
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    const parsed = raw ? JSON.parse(raw) : {};
    const skinProfile = parsed.skinProfile && parsed.skinProfile.skinType
      ? {
          skinType: parsed.skinProfile.skinType,
          conditions: Array.isArray(parsed.skinProfile.conditions) ? parsed.skinProfile.conditions : []
        }
      : { skinType: 'normal', conditions: [] };
    return {
      skinProfile,
      apiKey: parsed.apiKey || '',
      model: parsed.model || 'gemini-flash-latest'
    };
  } catch {
    return {
      skinProfile: { skinType: 'normal', conditions: [] },
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

function loadPlan() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.plan);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePlan() {
  localStorage.setItem(STORAGE_KEYS.plan, JSON.stringify(state.plan));
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
  renderPlan();
  renderHistory();
});

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
}

function onSkinProfileChanged() {
  saveSettings();
  syncProfileUI();
  renderPlan();
  if (state.lastAnalysis) {
    const reanalyzed = analyzeInci({
      productName: state.lastAnalysis.productName,
      rawInci: state.lastAnalysis.rawInci,
      category: state.lastAnalysis.category,
      skinProfile: state.settings.skinProfile,
      userPlan: state.plan,
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
}

function switchView(viewName) {
  if (viewName !== 'scan') stopLiveCamera();
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

  // Dropdown & Checkboxes synchronisieren
  const selectEl = document.getElementById('select-skin-type');
  if (selectEl) selectEl.value = sp.skinType;

  document.querySelectorAll('#conditions-checkbox-grid .cond-chip').forEach((chip) => {
    const cb = chip.querySelector('input[type="checkbox"]');
    const isChecked = sp.conditions.includes(chip.dataset.condId);
    if (cb) cb.checked = isChecked;
    chip.classList.toggle('checked', isChecked);
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
      if (mode !== 'photo') stopLiveCamera();
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

async function openLiveCamera() {
  hideError();
  const fallbackInput = document.getElementById('input-camera-fallback');

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    fallbackInput.click();
    return;
  }

  try {
    stopLiveCamera();
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    });
    state.cameraStream = stream;
    const video = document.getElementById('camera-video');
    video.srcObject = stream;
    await video.play();
    document.getElementById('photo-preview-wrap').classList.add('hidden');
    document.getElementById('camera-live-wrap').classList.remove('hidden');
  } catch (err) {
    // Falls Kamera-Berechtigung blockiert oder kein HTTPS: Fallback auf System-Kamera
    if (err.name === 'NotAllowedError') {
      showError('Kamera-Zugriff wurde blockiert. Bitte erlaube den Kamera-Zugriff in den Browser-Einstellungen oder wähle ein Foto über „Galerie“.');
    } else {
      fallbackInput.click();
    }
  }
}

function stopLiveCamera() {
  if (state.cameraStream) {
    state.cameraStream.getTracks().forEach((t) => t.stop());
    state.cameraStream = null;
  }
  const video = document.getElementById('camera-video');
  if (video) video.srcObject = null;
  const wrap = document.getElementById('camera-live-wrap');
  if (wrap) wrap.classList.add('hidden');
}

function captureLiveFrame() {
  const video = document.getElementById('camera-video');
  if (!video || !video.videoWidth || !video.videoHeight) {
    showError('Kamera ist noch nicht bereit. Bitte einen Moment warten.');
    return;
  }
  const maxDim = 1600;
  let width = video.videoWidth;
  let height = video.videoHeight;
  if (width > maxDim || height > maxDim) {
    const scale = maxDim / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, width, height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
  const base64Data = dataUrl.split(',')[1];

  stopLiveCamera();
  state.currentPhoto = { base64Data, mimeType: 'image/jpeg', previewUrl: dataUrl };
  document.getElementById('photo-preview').src = dataUrl;
  document.getElementById('photo-preview-wrap').classList.remove('hidden');
}

function bindScanControls() {
  const cameraFallback = document.getElementById('input-camera-fallback');
  const galleryInput = document.getElementById('input-gallery');

  const onFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    hideError();
    stopLiveCamera();
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

  document.getElementById('btn-open-camera').addEventListener('click', openLiveCamera);
  document.getElementById('btn-capture-frame').addEventListener('click', captureLiveFrame);
  document.getElementById('btn-close-camera').addEventListener('click', stopLiveCamera);
  window.addEventListener('pagehide', stopLiveCamera);

  cameraFallback.addEventListener('change', onFileSelected);
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
        skinProfile: state.settings.skinProfile,
        userPlan: state.plan
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
          skinProfile: state.settings.skinProfile,
          userPlan: state.plan
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
    userPlan: state.plan,
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

  const slotOptionsHtml = ROUTINE_SLOTS.map(
    (s) => `<option value="${s.id}" ${s.id === a.routinePlacement.slotId ? 'selected' : ''}>${escapeHtml(s.label)}</option>`
  ).join('');

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

      <h3>📋 Einordnung in deinen Pflegeplan</h3>
      <div class="routine-slot-box">
        <h4>${escapeHtml(a.routinePlacement.slot)}</h4>
        <p>${escapeHtml(a.routinePlacement.advice)}</p>
        <p style="margin-top:6px; color: var(--text-muted);"><strong>Dein Pflegeplan:</strong> ${escapeHtml(a.routinePlacement.existingMatch)}</p>
      </div>

      <div class="add-plan-box">
        <div class="add-plan-row">
          <label class="field-label" for="add-plan-slot" style="margin-bottom:0;">Produkt in meinen Pflegeplan übernehmen</label>
          <select id="add-plan-slot" class="text-input">${slotOptionsHtml}</select>
          <input id="add-plan-note" type="text" class="text-input" placeholder="Eigene Notiz (optional, z. B. 2x/Woche abends)" />
          <button id="btn-add-to-plan" class="btn btn-primary btn-full" type="button">➕ Zum Pflegeplan hinzufügen</button>
          <p id="add-plan-feedback" class="hint-small" style="margin-top:0;"></p>
        </div>
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

  document.getElementById('btn-add-to-plan').addEventListener('click', () => {
    const slotId = document.getElementById('add-plan-slot').value;
    const note = document.getElementById('add-plan-note').value.trim();
    addAnalysisToPlan(a, slotId, note, aiSummary);
    const slotLabel = ROUTINE_SLOTS.find((s) => s.id === slotId)?.label || slotId;
    document.getElementById('add-plan-feedback').textContent = `✅ Gespeichert unter „${slotLabel}“!`;
  });

  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function addAnalysisToPlan(analysis, slotId, note = '', aiSummary = '') {
  state.plan.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    slotId,
    productName: analysis.productName,
    category: analysis.category,
    categoryLabel: analysis.categoryLabel,
    rawInci: analysis.rawInci,
    sourceUrl: analysis.sourceUrl || '',
    score: analysis.score,
    verdictCls: analysis.verdict.cls,
    note,
    aiSummary: aiSummary || '',
    addedAt: new Date().toISOString()
  });
  savePlan();
  renderPlan();
}

// ============================================================================
// PFLEGEPLAN VIEW (dynamisch vom Nutzer aus Scans befüllt)
// ============================================================================
function bindPlanControls() {
  document.getElementById('btn-clear-plan').addEventListener('click', () => {
    if (!state.plan.length) return;
    if (confirm('Alle Produkte aus deinem Pflegeplan entfernen?')) {
      state.plan = [];
      savePlan();
      renderPlan();
    }
  });
}

function renderPlan() {
  const container = document.getElementById('plan-content');
  const sp = state.settings.skinProfile;
  const profileLabel = formatSkinProfileLabel(sp);

  // Dynamische Tipps passend zu den angehakten Besonderheiten
  const activeTips = [];
  (sp.conditions || []).forEach((cid) => {
    if (CONDITION_TIPS[cid]) activeTips.push(...CONDITION_TIPS[cid]);
  });

  let html = `
    <div class="card">
      <h2>🧬 Aktives Hautprofil: ${escapeHtml(profileLabel)}</h2>
      <p class="helper-text" style="margin-bottom:0;">
        Dein Pflegeplan wird lokal auf deinem Gerät gespeichert. Scanne Produkte per <strong>Foto, Link oder INCI-Text</strong> und füge sie direkt dem passenden Pflegeschritt hinzu.
      </p>
    </div>
  `;

  if (!state.plan.length) {
    html += `
      <div class="card">
        <h2>📋 Noch keine Produkte im Pflegeplan</h2>
        <p class="helper-text">
          Wechsle zum Tab <strong>📷 Scanner</strong>, analysiere dein erstes Produkt (z. B. Reiniger, Serum, Creme oder LSF) und tippe im Ergebnis auf <strong>„➕ Zum Pflegeplan hinzufügen“</strong>.
        </p>
        <button id="btn-go-scan" class="btn btn-primary btn-full" type="button">📷 Erstes Produkt scannen</button>
      </div>
    `;
  } else {
    // Nach Gruppen rendern
    const groups = [...new Set(ROUTINE_SLOTS.map((s) => s.group))];
    groups.forEach((groupName) => {
      const groupSlotIds = ROUTINE_SLOTS.filter((s) => s.group === groupName).map((s) => s.id);
      const items = state.plan.filter((item) => groupSlotIds.includes(item.slotId));
      if (!items.length) return;

      const itemsHtml = items
        .map((item) => {
          const slotLabel = ROUTINE_SLOTS.find((s) => s.id === item.slotId)?.label || '';
          return `
            <div class="plan-product-row">
              <div class="plan-product-main" data-open-plan-id="${escapeHtml(item.id)}">
                <div class="plan-step-title">${escapeHtml(slotLabel)}</div>
                <div class="plan-step-product">${escapeHtml(item.productName)}</div>
                ${item.note ? `<div class="plan-step-desc">📝 ${escapeHtml(item.note)}</div>` : ''}
                <div class="hint-small" style="margin-top:2px;">Antippen für vollständige INCI-Analyse</div>
              </div>
              <div class="plan-product-actions">
                <span class="pill ${escapeHtml(item.verdictCls || 'badge-info')}">${item.score}/100</span>
                <button class="icon-btn" type="button" data-remove-plan-id="${escapeHtml(item.id)}" title="Entfernen">✕</button>
              </div>
            </div>`;
        })
        .join('');

      html += `
        <div class="card">
          <h2>${escapeHtml(groupName)}</h2>
          ${itemsHtml}
        </div>`;
    });
  }

  if (activeTips.length) {
    html += `
      <div class="card">
        <h2>🛡️ Pflegeregeln für dein Hautprofil</h2>
        <ul class="rule-list">
          ${activeTips.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}
        </ul>
      </div>`;
  }

  container.innerHTML = html;

  const goScan = document.getElementById('btn-go-scan');
  if (goScan) goScan.addEventListener('click', () => switchView('scan'));

  container.querySelectorAll('[data-open-plan-id]').forEach((el) => {
    el.addEventListener('click', () => {
      const item = state.plan.find((p) => p.id === el.dataset.openPlanId);
      if (!item) return;
      const reanalyzed = analyzeInci({
        productName: item.productName,
        rawInci: item.rawInci,
        category: item.category || 'auto',
        skinProfile: state.settings.skinProfile,
        userPlan: state.plan,
        sourceUrl: item.sourceUrl || ''
      });
      state.lastAnalysis = reanalyzed;
      state.lastAiSummary = item.aiSummary || '';
      switchView('scan');
      renderResult(reanalyzed, item.aiSummary || '');
    });
  });

  container.querySelectorAll('[data-remove-plan-id]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      state.plan = state.plan.filter((p) => p.id !== btn.dataset.removePlanId);
      savePlan();
      renderPlan();
    });
  });
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
      const label = h.profileLabel || 'Normal';
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
        userPlan: state.plan,
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
