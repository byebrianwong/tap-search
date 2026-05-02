(() => {
  'use strict';

  const listEl = document.getElementById('list');
  const emptyEl = document.getElementById('empty');
  const noResultsEl = document.getElementById('no-results');
  const countEl = document.getElementById('count');
  const searchEl = document.getElementById('search');
  const exportBtn = document.getElementById('export-btn');
  const importBtn = document.getElementById('import-btn');
  const importFile = document.getElementById('import-file');
  const driveBackupBtn = document.getElementById('drive-backup-btn');
  const driveRestoreBtn = document.getElementById('drive-restore-btn');
  const driveDivider = document.getElementById('drive-divider');
  const toolbarStatus = document.getElementById('toolbar-status');

  let allWords = [];

  function esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function buildAiHtml(ai) {
    if (!ai) return '';
    const labelClass = ai.source === 'gemini' ? 'ai-label-gemini' : 'ai-label-claude';
    const labelText = ai.source === 'gemini' ? '&#10022; Gemini' : '&#9679; Claude';
    return `
      <div class="ai-section">
        <div class="ai-label ${labelClass}">${labelText}</div>
        <p class="ai-summary">${esc(ai.summary)}</p>
      </div>
    `;
  }

  function buildDictHtml(dict, hasAi) {
    if (!dict || !dict.meanings || dict.meanings.length === 0) return '';

    let meaningsHtml = '';
    for (const meaning of dict.meanings) {
      let defsHtml = '';
      for (const def of meaning.definitions) {
        defsHtml += `<li class="def-item">${esc(def.definition)}</li>`;
        if (def.example) {
          defsHtml += `<p class="def-example">"${esc(def.example)}"</p>`;
        }
      }
      meaningsHtml += `
        <div class="meaning">
          <span class="pos">${esc(meaning.partOfSpeech)}</span>
          <ol class="def-list">${defsHtml}</ol>
        </div>
      `;
    }

    return `
      <div class="dict-section">
        ${hasAi ? '<div class="dict-label">Definitions</div>' : ''}
        ${meaningsHtml}
      </div>
    `;
  }

  function buildCard(entry) {
    const phoneticHtml = entry.dictionary?.phonetic
      ? `<span class="word-phonetic">${esc(entry.dictionary.phonetic)}</span>`
      : '';

    const bodyContent = buildAiHtml(entry.ai) + buildDictHtml(entry.dictionary, !!entry.ai);
    const q = encodeURIComponent(entry.text);

    return `
      <div class="word-card" data-text="${esc(entry.text)}">
        <div class="word-card-header">
          <span class="word-title">${esc(entry.text)}</span>
          ${phoneticHtml}
          <span class="word-date">${formatDate(entry.savedAt)}</span>
          <span class="word-expand">&#9660;</span>
        </div>
        <div class="word-card-body">
          ${bodyContent || '<p style="color:#999;font-size:14px;">No summary or definitions saved.</p>'}
          <div class="card-footer">
            <div class="card-actions">
              <a class="card-btn" href="https://en.wikipedia.org/wiki/Special:Search?search=${q}" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                Wikipedia
              </a>
              <a class="card-btn card-btn-google" href="https://www.google.com/search?q=${q}" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
              </a>
            </div>
            <button class="word-delete" aria-label="Remove saved word">Remove</button>
          </div>
        </div>
      </div>
    `;
  }

  function render(words) {
    const query = searchEl.value.trim().toLowerCase();
    const filtered = query
      ? words.filter((w) => w.text.toLowerCase().includes(query))
      : words;

    countEl.textContent = words.length > 0 ? `${words.length} word${words.length !== 1 ? 's' : ''}` : '';

    if (words.length === 0) {
      listEl.innerHTML = '';
      emptyEl.style.display = '';
      noResultsEl.style.display = 'none';
      return;
    }

    emptyEl.style.display = 'none';

    if (filtered.length === 0) {
      listEl.innerHTML = '';
      noResultsEl.style.display = '';
      return;
    }

    noResultsEl.style.display = 'none';
    listEl.innerHTML = filtered.map(buildCard).join('');
  }

  function loadWords() {
    chrome.runtime.sendMessage({ type: 'GET_SAVED_WORDS' }, (res) => {
      allWords = res?.words || [];
      render(allWords);
    });
  }

  // ── Events ──

  listEl.addEventListener('click', (e) => {
    // Delete button
    const deleteBtn = e.target.closest('.word-delete');
    if (deleteBtn) {
      e.stopPropagation();
      const card = deleteBtn.closest('.word-card');
      const text = card.dataset.text;
      chrome.runtime.sendMessage({ type: 'UNSAVE_WORD', text }, () => {
        allWords = allWords.filter((w) => w.text !== text);
        render(allWords);
      });
      return;
    }

    // Toggle expand
    const header = e.target.closest('.word-card-header');
    if (header) {
      const card = header.closest('.word-card');
      card.classList.toggle('expanded');
    }
  });

  searchEl.addEventListener('input', () => {
    render(allWords);
  });

  // ── Export / Import ──

  function setStatus(text, kind) {
    toolbarStatus.textContent = text;
    toolbarStatus.className = 'toolbar-status' + (kind ? ' ' + kind : '');
    if (text) {
      clearTimeout(setStatus._t);
      setStatus._t = setTimeout(() => {
        toolbarStatus.textContent = '';
        toolbarStatus.className = 'toolbar-status';
      }, 4000);
    }
  }

  function exportWords() {
    if (!allWords.length) {
      setStatus('Nothing to export', 'err');
      return;
    }
    const payload = {
      app: 'tap-search',
      version: 1,
      exportedAt: new Date().toISOString(),
      words: allWords
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tap-search-words-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus(`Exported ${allWords.length} word${allWords.length !== 1 ? 's' : ''}`, 'ok');
  }

  function importFromFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => setStatus('Could not read file', 'err');
    reader.onload = () => {
      let parsed;
      try {
        parsed = JSON.parse(reader.result);
      } catch (e) {
        setStatus('File is not valid JSON', 'err');
        return;
      }
      // Accept either { words: [...] } (Tap Search export) or a bare array.
      const words = Array.isArray(parsed) ? parsed : parsed?.words;
      if (!Array.isArray(words)) {
        setStatus('Unrecognized file format', 'err');
        return;
      }

      const mode = confirm(
        `Import ${words.length} word${words.length !== 1 ? 's' : ''}?\n\n` +
        `OK = merge with your existing list (newer entries replace older).\n` +
        `Cancel = stop. (To replace everything, clear your list first, then import.)`
      ) ? 'merge' : null;

      if (!mode) {
        setStatus('Import cancelled', '');
        return;
      }

      chrome.runtime.sendMessage({ type: 'IMPORT_WORDS', words, mode }, (res) => {
        if (!res || res.error) {
          setStatus(res?.error || 'Import failed', 'err');
          return;
        }
        const parts = [];
        if (res.added) parts.push(`${res.added} added`);
        if (res.updated) parts.push(`${res.updated} updated`);
        if (res.skipped) parts.push(`${res.skipped} skipped`);
        setStatus(parts.length ? parts.join(', ') : 'No changes', 'ok');
        loadWords();
      });
    };
    reader.readAsText(file);
  }

  exportBtn.addEventListener('click', exportWords);
  importBtn.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    importFromFile(file);
    e.target.value = ''; // allow re-importing the same filename
  });

  // ── Drive sync (only shown when service worker reports it as available) ──

  function setDriveBusy(busy) {
    driveBackupBtn.disabled = busy;
    driveRestoreBtn.disabled = busy;
  }

  function driveBackup() {
    setDriveBusy(true);
    setStatus('Connecting to Google Drive…', '');
    chrome.runtime.sendMessage({ type: 'DRIVE_BACKUP' }, (res) => {
      setDriveBusy(false);
      if (!res || res.error) {
        setStatus(res?.error || 'Drive backup failed', 'err');
        return;
      }
      const action = res.action === 'updated' ? 'Updated' : 'Saved';
      setStatus(`${action} ${res.uploaded} word${res.uploaded !== 1 ? 's' : ''} to Drive`, 'ok');
    });
  }

  function driveRestore() {
    setDriveBusy(true);
    setStatus('Reading from Google Drive…', '');
    chrome.runtime.sendMessage({ type: 'DRIVE_RESTORE' }, (res) => {
      setDriveBusy(false);
      if (!res || res.error) {
        setStatus(res?.error || 'Drive restore failed', 'err');
        return;
      }
      const parts = [];
      if (res.added) parts.push(`${res.added} added`);
      if (res.updated) parts.push(`${res.updated} updated`);
      if (res.skipped) parts.push(`${res.skipped} skipped`);
      setStatus(parts.length ? `From Drive: ${parts.join(', ')}` : 'Drive backup matches local list', 'ok');
      loadWords();
    });
  }

  driveBackupBtn.addEventListener('click', driveBackup);
  driveRestoreBtn.addEventListener('click', driveRestore);

  // Probe whether Drive sync is enabled in this build, and reveal the buttons
  // only if it is.
  chrome.runtime.sendMessage({ type: 'DRIVE_SYNC_AVAILABLE' }, (res) => {
    if (res?.available) {
      driveDivider.hidden = false;
      driveBackupBtn.hidden = false;
      driveRestoreBtn.hidden = false;
    }
  });

  // ── Init ──

  loadWords();
})();
