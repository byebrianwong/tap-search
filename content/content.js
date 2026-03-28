(() => {
  'use strict';

  let currentHost = null;
  let currentShadow = null;
  let currentWord = null;
  let currentResult = null;

  const TOOLTIP_WIDTH = 380;
  const MARGIN = 8;
  const ARROW_SIZE = 8;
  const WORD_RE = /^[\p{L}'-]+$/u;

  // ── Styles ──────────────────────────────────────────────────────────────────

  const STYLES = `
    :host {
      all: initial;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      position: absolute;
      z-index: 2147483647;
    }

    .is-tooltip {
      width: ${TOOLTIP_WIDTH}px;
      background: #ffffff;
      border: 1px solid #e2e2e2;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.14);
      overflow: hidden;
      animation: is-fade-in 150ms ease-out;
      color: #1a1a1a;
      font-size: 14px;
      line-height: 1.55;
    }

    @keyframes is-fade-in {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ── Header ── */
    .is-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 14px 10px;
      border-bottom: 1px solid #f0f0f0;
    }

    .is-word {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .is-phonetic {
      font-size: 13px;
      color: #888;
      font-weight: 400;
      flex-shrink: 0;
    }

    .is-close {
      appearance: none;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 20px;
      color: #999;
      padding: 0;
      margin: 0;
      line-height: 1;
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 120ms;
    }

    .is-close:hover {
      background: #f1f3f4;
      color: #333;
    }

    .is-save {
      appearance: none;
      background: none;
      border: none;
      cursor: pointer;
      color: #999;
      padding: 0;
      margin: 0;
      line-height: 1;
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 120ms, color 120ms;
    }

    .is-save svg {
      width: 16px;
      height: 16px;
    }

    .is-save:hover {
      background: #f1f3f4;
      color: #e8a000;
    }

    .is-save.is-saved {
      color: #e8a000;
    }

    .is-save.is-saved:hover {
      color: #cc8c00;
    }

    /* ── Body ── */
    .is-body {
      padding: 0;
      max-height: 320px;
      overflow-y: auto;
    }

    .is-body::-webkit-scrollbar {
      width: 6px;
    }
    .is-body::-webkit-scrollbar-track {
      background: transparent;
    }
    .is-body::-webkit-scrollbar-thumb {
      background: #ddd;
      border-radius: 3px;
    }

    /* ── AI Summary Section ── */
    .is-ai-section {
      padding: 10px 14px;
      background: #f8f9ff;
      border-bottom: 1px solid #e8e8f0;
    }

    .is-ai-label {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 6px;
      padding: 2px 8px;
      border-radius: 10px;
    }

    .is-ai-label-gemini {
      background: #e8f0fe;
      color: #1a73e8;
    }

    .is-ai-label-claude {
      background: #fff3e0;
      color: #e65100;
    }

    .is-ai-summary {
      margin: 0;
      color: #333;
      font-size: 13px;
      line-height: 1.6;
    }

    /* ── Dictionary Section ── */
    .is-dict-section {
      padding: 10px 14px;
    }

    .is-dict-label {
      font-size: 11px;
      font-weight: 600;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 8px;
    }

    .is-meaning {
      margin-bottom: 10px;
    }

    .is-meaning:last-child {
      margin-bottom: 0;
    }

    .is-pos {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      color: #1a73e8;
      background: #e8f0fe;
      border-radius: 4px;
      padding: 1px 7px;
      margin-bottom: 5px;
    }

    .is-def-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .is-def-item {
      position: relative;
      padding: 2px 0 2px 16px;
      font-size: 13px;
      color: #333;
      line-height: 1.5;
    }

    .is-def-item::before {
      content: '';
      position: absolute;
      left: 4px;
      top: 10px;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #ccc;
    }

    .is-def-example {
      margin: 2px 0 0;
      color: #777;
      font-style: italic;
      font-size: 12px;
      padding-left: 16px;
    }

    .is-no-result {
      padding: 14px;
      color: #999;
      font-size: 13px;
      text-align: center;
    }

    .is-hint {
      padding: 8px 14px;
      color: #aaa;
      font-size: 11.5px;
      border-top: 1px solid #f0f0f0;
    }

    .is-ai-error {
      padding: 8px 14px;
      background: #fef7e0;
      border-bottom: 1px solid #f0e0b0;
      font-size: 12px;
      color: #b36b00;
      word-break: break-word;
    }

    /* ── Loading shimmer ── */
    .is-loading {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 14px;
    }

    .is-shimmer {
      height: 12px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      border-radius: 6px;
      animation: is-shimmer 1.2s ease-in-out infinite;
    }

    .is-shimmer:nth-child(2) { width: 85%; }
    .is-shimmer:nth-child(3) { width: 70%; }
    .is-shimmer:nth-child(4) { width: 55%; }

    @keyframes is-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* ── Actions ── */
    .is-actions {
      display: flex;
      gap: 8px;
      padding: 8px 14px 12px;
      border-top: 1px solid #f0f0f0;
    }

    .is-btn {
      appearance: none;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 7px 10px;
      border-radius: 8px;
      border: 1px solid #ddd;
      background: #fafafa;
      color: #333;
      font-size: 12.5px;
      font-weight: 500;
      cursor: pointer;
      transition: background 120ms, border-color 120ms;
      font-family: inherit;
      white-space: nowrap;
    }

    .is-btn:hover {
      background: #f0f0f0;
      border-color: #ccc;
    }

    .is-btn-google {
      background: #e8f0fe;
      border-color: #c5d8f8;
      color: #1a73e8;
    }

    .is-btn-google:hover {
      background: #d2e3fc;
    }

    .is-btn svg {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
    }

    .is-saved-link {
      display: block;
      text-align: center;
      padding: 6px 14px 10px;
      font-size: 12px;
      color: #888;
      cursor: pointer;
      text-decoration: none;
      transition: color 120ms;
    }

    .is-saved-link:hover {
      color: #1a73e8;
    }

    /* ── Dark mode ── */
    @media (prefers-color-scheme: dark) {
      .is-tooltip {
        background: #292a2d;
        border-color: #3c3c3c;
        color: #e0e0e0;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
      }

      .is-header { border-bottom-color: #3c3c3c; }
      .is-word { color: #e8eaed; }
      .is-phonetic { color: #888; }
      .is-close { color: #888; }
      .is-close:hover { background: #3c3c3c; color: #ddd; }
      .is-save { color: #888; }
      .is-save:hover { background: #3c3c3c; color: #f0c040; }
      .is-save.is-saved { color: #f0c040; }
      .is-save.is-saved:hover { color: #daa520; }

      .is-ai-section {
        background: #1e2030;
        border-bottom-color: #3c3c3c;
      }
      .is-ai-label-gemini { background: #1e3a5f; color: #8ab4f8; }
      .is-ai-label-claude { background: #3e2723; color: #ffab91; }
      .is-ai-summary { color: #ccc; }

      .is-dict-label { color: #777; }
      .is-pos { background: #1e3a5f; color: #8ab4f8; }
      .is-def-item { color: #ccc; }
      .is-def-item::before { background: #666; }
      .is-def-example { color: #888; }
      .is-no-result { color: #777; }
      .is-hint { color: #666; border-top-color: #3c3c3c; }
      .is-ai-error { background: #3e2723; border-bottom-color: #5d4037; color: #ffab91; }

      .is-shimmer {
        background: linear-gradient(90deg, #3c3c3c 25%, #4a4a4a 50%, #3c3c3c 75%);
        background-size: 200% 100%;
      }

      .is-actions { border-top-color: #3c3c3c; }
      .is-btn { background: #3c3c3c; border-color: #555; color: #ddd; }
      .is-btn:hover { background: #4a4a4a; border-color: #666; }

      .is-btn-google { background: #1e3a5f; border-color: #2962ff55; color: #8ab4f8; }
      .is-btn-google:hover { background: #264a7a; }

      .is-saved-link { color: #666; }
      .is-saved-link:hover { color: #8ab4f8; }

      .is-body::-webkit-scrollbar-thumb { background: #555; }
    }
  `;

  // ── SVG Icons ───────────────────────────────────────────────────────────────

  const ICON_BOOKMARK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
  const ICON_BOOKMARK_FILLED = `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;

  const ICON_WIKI = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>`;

  const ICON_GOOGLE = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>`;

  // ── Tooltip HTML builders ───────────────────────────────────────────────────

  function buildLoading(word) {
    return `
      <div class="is-tooltip">
        <div class="is-header">
          <span class="is-word">${esc(word)}</span>
          <button class="is-save" aria-label="Save" data-word="${esc(word)}">${ICON_BOOKMARK}</button>
          <button class="is-close" aria-label="Close">&times;</button>
        </div>
        <div class="is-body">
          <div class="is-loading">
            <div class="is-shimmer" style="width:100%"></div>
            <div class="is-shimmer"></div>
            <div class="is-shimmer"></div>
            <div class="is-shimmer"></div>
          </div>
        </div>
        <div class="is-actions">
          ${buildActionButtons(word)}
        </div>
      </div>
    `;
  }

  function buildResult(word, result) {
    if (!result || !result.success) {
      return `
        <div class="is-tooltip">
          <div class="is-header">
            <span class="is-word">${esc(word)}</span>
            <button class="is-save" aria-label="Save" data-word="${esc(word)}">${ICON_BOOKMARK}</button>
            <button class="is-close" aria-label="Close">&times;</button>
          </div>
          <div class="is-body">
            <div class="is-no-result">No results found. Try searching below.</div>
          </div>
          <div class="is-actions">
            ${buildActionButtons(word)}
          </div>
        </div>
      `;
    }

    const ai = result.ai;
    const dict = result.dictionary;

    let phoneticHtml = '';
    if (dict?.phonetic) {
      phoneticHtml = `<span class="is-phonetic">${esc(dict.phonetic)}</span>`;
    }

    // AI Summary section
    let aiHtml = '';
    if (ai) {
      const labelClass = ai.source === 'gemini' ? 'is-ai-label-gemini' : 'is-ai-label-claude';
      const labelText = ai.source === 'gemini' ? '✦ Gemini' : '● Claude';
      aiHtml = `
        <div class="is-ai-section">
          <div class="is-ai-label ${labelClass}">${labelText}</div>
          <p class="is-ai-summary">${esc(ai.summary)}</p>
        </div>
      `;
    } else if (result.aiError) {
      aiHtml = `<div class="is-ai-error">AI error: ${esc(result.aiError)}</div>`;
    }

    // Dictionary definitions section
    let dictHtml = '';
    if (dict && dict.meanings && dict.meanings.length > 0) {
      let meaningsHtml = '';
      for (const meaning of dict.meanings) {
        let defsHtml = '';
        for (const def of meaning.definitions) {
          defsHtml += `<li class="is-def-item">${esc(def.definition)}</li>`;
          if (def.example) {
            defsHtml += `<p class="is-def-example">"${esc(def.example)}"</p>`;
          }
        }
        meaningsHtml += `
          <div class="is-meaning">
            <span class="is-pos">${esc(meaning.partOfSpeech)}</span>
            <ol class="is-def-list">${defsHtml}</ol>
          </div>
        `;
      }
      dictHtml = `
        <div class="is-dict-section">
          ${ai ? '<div class="is-dict-label">Definitions</div>' : ''}
          ${meaningsHtml}
        </div>
      `;
    }

    // Hint if no AI
    let hintHtml = '';
    if (!ai && dict) {
      hintHtml = `<div class="is-hint">Add an AI key in extension settings for richer summaries.</div>`;
    }

    return `
      <div class="is-tooltip">
        <div class="is-header">
          <span class="is-word">${esc(word)}</span>
          ${phoneticHtml}
          <button class="is-save" aria-label="Save" data-word="${esc(word)}">${ICON_BOOKMARK}</button>
          <button class="is-close" aria-label="Close">&times;</button>
        </div>
        <div class="is-body">
          ${aiHtml}
          ${dictHtml}
          ${!aiHtml && !dictHtml ? '<div class="is-no-result">No results found.</div>' : ''}
        </div>
        ${hintHtml}
        <div class="is-actions">
          ${buildActionButtons(word)}
        </div>
        <a class="is-saved-link" data-open-saved>View saved words</a>
      </div>
    `;
  }

  function buildActionButtons(word) {
    const q = encodeURIComponent(word);
    return `
      <button class="is-btn is-btn-wiki" data-url="https://en.wikipedia.org/wiki/Special:Search?search=${q}">
        ${ICON_WIKI} Wikipedia
      </button>
      <button class="is-btn is-btn-google" data-url="https://www.google.com/search?q=${q}">
        ${ICON_GOOGLE} Google Search
      </button>
    `;
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function getSelectedWord() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;

    let text = sel.toString().trim();
    text = text.split(/\s+/)[0];
    text = text.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '');

    if (text.length < 2 || text.length > 50) return null;
    if (!WORD_RE.test(text)) return null;

    return text;
  }

  function getSelectionRect() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    return sel.getRangeAt(0).getBoundingClientRect();
  }

  // ── Positioning ─────────────────────────────────────────────────────────────

  function positionTooltip(host, rect) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
    left = Math.max(MARGIN, Math.min(left, vw - TOOLTIP_WIDTH - MARGIN));

    let top = rect.bottom + ARROW_SIZE + window.scrollY;

    const tooltipApproxHeight = 300;
    if (rect.bottom + tooltipApproxHeight + MARGIN > vh) {
      top = rect.top - tooltipApproxHeight - ARROW_SIZE + window.scrollY;
    }

    host.style.left = `${left}px`;
    host.style.top = `${top}px`;
  }

  // ── Tooltip lifecycle ───────────────────────────────────────────────────────

  function removeTooltip() {
    if (currentHost) {
      currentHost.remove();
      currentHost = null;
      currentShadow = null;
      currentWord = null;
      currentResult = null;
    }
  }

  function createTooltip(word, rect) {
    removeTooltip();

    const host = document.createElement('instant-search-tooltip');
    host.style.position = 'absolute';
    host.style.zIndex = '2147483647';

    const shadow = host.attachShadow({ mode: 'closed' });

    const styleEl = document.createElement('style');
    styleEl.textContent = STYLES;
    shadow.appendChild(styleEl);

    const container = document.createElement('div');
    container.innerHTML = buildLoading(word);
    shadow.appendChild(container);

    document.body.appendChild(host);
    positionTooltip(host, rect);

    currentHost = host;
    currentShadow = shadow;
    currentWord = word;
    currentResult = null;

    wireEvents(shadow);

    // Check if already saved and update bookmark icon
    chrome.runtime.sendMessage({ type: 'IS_SAVED', text: word }, (res) => {
      if (!currentHost || currentHost !== host) return;
      if (res?.saved) {
        const saveBtn = shadow.querySelector('.is-save');
        if (saveBtn) {
          saveBtn.classList.add('is-saved');
          saveBtn.innerHTML = ICON_BOOKMARK_FILLED;
        }
      }
    });

    chrome.runtime.sendMessage(
      { type: 'INSTANT_SEARCH_LOOKUP', word },
      (result) => {
        if (!currentHost || currentHost !== host) return;
        currentResult = result;
        container.innerHTML = buildResult(word, result);
        wireEvents(shadow);
        // Re-check saved state after re-render
        chrome.runtime.sendMessage({ type: 'IS_SAVED', text: word }, (res) => {
          if (!currentHost || currentHost !== host) return;
          if (res?.saved) {
            const saveBtn = shadow.querySelector('.is-save');
            if (saveBtn) {
              saveBtn.classList.add('is-saved');
              saveBtn.innerHTML = ICON_BOOKMARK_FILLED;
            }
          }
        });
      }
    );
  }

  function wireEvents(shadow) {
    const closeBtn = shadow.querySelector('.is-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeTooltip();
      });
    }

    shadow.querySelectorAll('.is-btn[data-url]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.open(btn.dataset.url, '_blank', 'noopener');
      });
    });

    const saveBtn = shadow.querySelector('.is-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const word = currentWord;
        const isSaved = saveBtn.classList.contains('is-saved');

        if (isSaved) {
          chrome.runtime.sendMessage({ type: 'UNSAVE_WORD', text: word }, () => {
            saveBtn.classList.remove('is-saved');
            saveBtn.innerHTML = ICON_BOOKMARK;
          });
        } else {
          const entry = {
            text: word,
            savedAt: Date.now(),
            ai: currentResult?.ai || null,
            dictionary: currentResult?.dictionary || null
          };
          chrome.runtime.sendMessage({ type: 'SAVE_WORD', entry }, () => {
            saveBtn.classList.add('is-saved');
            saveBtn.innerHTML = ICON_BOOKMARK_FILLED;
          });
        }
      });
    }

    const savedLink = shadow.querySelector('[data-open-saved]');
    if (savedLink) {
      savedLink.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        chrome.runtime.sendMessage({ type: 'OPEN_SAVED_PAGE' });
      });
    }
  }

  function isInsideTooltip(el) {
    if (!currentHost) return false;
    return currentHost === el || currentHost.contains(el);
  }

  function isEditable(el) {
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
    if (el.isContentEditable) return true;
    return false;
  }

  // ── Context menu handler ───────────────────────────────────────────────────

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type !== 'INSTANT_SEARCH_CONTEXT_MENU') return;

    let text = (message.text || '').trim();
    if (text.length < 1 || text.length > 200) return;

    const rect = getSelectionRect();
    if (!rect) return;

    createTooltip(text, rect);
  });

  // ── Event handlers ──────────────────────────────────────────────────────────

  document.addEventListener('dblclick', (e) => {
    if (isInsideTooltip(e.target)) return;
    if (isEditable(e.target)) return;

    const word = getSelectedWord();
    if (!word) return;

    const rect = getSelectionRect();
    if (!rect) return;

    createTooltip(word, rect);
  }, true);

  document.addEventListener('mousedown', (e) => {
    if (!currentHost) return;
    if (isInsideTooltip(e.target)) return;
    if (e.target === currentHost) return;
    removeTooltip();
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && currentHost) {
      removeTooltip();
    }
  }, true);

})();
