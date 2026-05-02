// ── Context menu ────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'tap-search-lookup',
    title: 'Tap Search: "%s"',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'tap-search-lookup' && info.selectionText && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'TAP_SEARCH_CONTEXT_MENU',
      text: info.selectionText.trim()
    });
  }
});

// ── Settings & lookup ───────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  provider: 'dictionary',
  geminiApiKey: '',
  claudeApiKey: '',
  enabled: true
};

const AI_PROMPT = (word) =>
  `Give a brief, informative 2-3 sentence summary about the word or concept "${word}". Include what it means, its significance, and any key context. Be concise and factual, like a Google AI Overview.`;

// Models to try in order — flash-lite is cheapest/fastest with highest free-tier limits
const GEMINI_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash'
];

const FRIENDLY_ERRORS = {
  429: 'Quota exceeded — your free Gemini API tier may be used up. Check your usage at ai.google.dev or wait a minute and try again.',
  401: 'Invalid API key. Double-check your Gemini key in extension settings.',
  403: 'API key not authorized. Make sure the Generative Language API is enabled in your Google Cloud project.',
  404: 'Model not found. This is a bug — please report it.',
  500: 'Gemini server error. Try again in a moment.',
  503: 'Gemini is temporarily unavailable. Try again shortly.'
};

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, resolve);
  });
}

async function callGemini(word, apiKey, model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: AI_PROMPT(word) }] }]
    })
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    console.error(`Gemini (${model}) error:`, res.status, errorBody);
    const err = new Error(FRIENDLY_ERRORS[res.status] || `Gemini API error (${res.status})`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error('Gemini response missing content:', JSON.stringify(data).slice(0, 500));
    throw new Error('Gemini returned an empty response. Try again.');
  }

  return { source: 'gemini', summary: text.trim() };
}

async function lookupGemini(word, apiKey) {
  // Try each model in order; only fall through on 404 (model not found) or 429 (quota)
  let lastError = null;
  for (const model of GEMINI_MODELS) {
    try {
      return await callGemini(word, apiKey, model);
    } catch (e) {
      lastError = e;
      // Only try next model on 404 or 429; other errors won't be fixed by switching models
      if (e.status !== 404 && e.status !== 429) throw e;
      console.warn(`Model ${model} failed (${e.status}), trying next...`);
    }
  }
  throw lastError;
}

async function lookupClaude(word, apiKey) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: AI_PROMPT(word) }]
    })
  });

  if (!res.ok) {
    const status = res.status;
    if (status === 429) throw new Error('Claude rate limit exceeded. Wait a moment and try again.');
    if (status === 401) throw new Error('Invalid Claude API key. Check your key in extension settings.');
    throw new Error(`Claude API error (${status})`);
  }

  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error('Claude returned an empty response.');

  return { source: 'claude', summary: text.trim() };
}

async function lookupDictionary(word) {
  const res = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
  );

  if (!res.ok) throw new Error('Word not found');

  const data = await res.json();
  const entry = data[0];

  const meanings = [];
  for (const meaning of entry?.meanings || []) {
    const defs = [];
    for (const def of meaning.definitions || []) {
      defs.push({
        definition: def.definition,
        example: def.example || null
      });
    }
    if (defs.length > 0) {
      meanings.push({
        partOfSpeech: meaning.partOfSpeech || '',
        definitions: defs
      });
    }
  }

  return {
    phonetic: entry?.phonetic || entry?.phonetics?.find(p => p.text)?.text || '',
    meanings
  };
}

async function handleLookup(word) {
  const settings = await getSettings();

  if (!settings.enabled) {
    return { success: false, error: 'disabled' };
  }

  const aiProvider = settings.provider;
  const hasAiKey =
    (aiProvider === 'gemini' && settings.geminiApiKey) ||
    (aiProvider === 'claude' && settings.claudeApiKey);

  let aiError = null;
  const aiPromise = hasAiKey
    ? (aiProvider === 'gemini'
        ? lookupGemini(word, settings.geminiApiKey)
        : lookupClaude(word, settings.claudeApiKey)
      ).catch((e) => {
        console.error(`${aiProvider} lookup failed:`, e.message);
        aiError = e.message;
        return null;
      })
    : Promise.resolve(null);

  const dictPromise = lookupDictionary(word).catch((e) => {
    console.warn('Dictionary lookup failed:', e.message);
    return null;
  });

  const [aiResult, dictResult] = await Promise.all([aiPromise, dictPromise]);

  if (!aiResult && !dictResult) {
    return { success: false, error: aiError || 'all_failed' };
  }

  return {
    success: true,
    ai: aiResult || null,
    aiError: aiError || null,
    dictionary: dictResult || null
  };
}

// ── Saved words (chrome.storage.local) ──────────────────────────────────────

async function getSavedWords() {
  return new Promise((resolve) => {
    chrome.storage.local.get({ savedWords: [] }, (r) => resolve(r.savedWords));
  });
}

async function saveWord(entry) {
  const saved = await getSavedWords();
  // Replace if same text already saved
  const idx = saved.findIndex((w) => w.text === entry.text);
  if (idx !== -1) saved.splice(idx, 1);
  saved.unshift(entry);
  return new Promise((resolve) => {
    chrome.storage.local.set({ savedWords: saved }, () => resolve({ success: true }));
  });
}

async function unsaveWord(text) {
  const saved = await getSavedWords();
  const filtered = saved.filter((w) => w.text !== text);
  return new Promise((resolve) => {
    chrome.storage.local.set({ savedWords: filtered }, () => resolve({ success: true }));
  });
}

async function isWordSaved(text) {
  const saved = await getSavedWords();
  return saved.some((w) => w.text === text);
}

// Bulk import: validates incoming entries and merges/replaces.
// Returns { added, updated, skipped, total }.
async function importWords(incoming, mode = 'merge') {
  if (!Array.isArray(incoming)) {
    return { error: 'Invalid file: expected an array of words.' };
  }

  // Sanitize & validate. Only `text` (string, 1-100 chars) is required.
  const clean = [];
  let skipped = 0;
  for (const w of incoming) {
    if (!w || typeof w.text !== 'string') { skipped++; continue; }
    const text = w.text.trim();
    if (!text || text.length > 100) { skipped++; continue; }
    clean.push({
      text,
      savedAt: typeof w.savedAt === 'number' ? w.savedAt : Date.now(),
      ai: w.ai && typeof w.ai === 'object' ? w.ai : null,
      dictionary: w.dictionary && typeof w.dictionary === 'object' ? w.dictionary : null
    });
  }

  let merged;
  let added = 0;
  let updated = 0;

  if (mode === 'replace') {
    // Dedup within incoming (newer savedAt wins) and replace storage entirely.
    const map = new Map();
    for (const w of clean) {
      const prev = map.get(w.text);
      if (!prev || (w.savedAt || 0) > (prev.savedAt || 0)) map.set(w.text, w);
    }
    merged = Array.from(map.values()).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
    added = merged.length;
  } else {
    // Merge with existing — incoming with newer savedAt wins per text.
    const existing = await getSavedWords();
    const map = new Map(existing.map((w) => [w.text, w]));
    for (const w of clean) {
      const prev = map.get(w.text);
      if (!prev) {
        map.set(w.text, w);
        added++;
      } else if ((w.savedAt || 0) > (prev.savedAt || 0)) {
        map.set(w.text, w);
        updated++;
      }
    }
    merged = Array.from(map.values()).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
  }

  await new Promise((resolve) => {
    chrome.storage.local.set({ savedWords: merged }, resolve);
  });

  return { success: true, added, updated, skipped, total: merged.length };
}

// ── Message router ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TAP_SEARCH_LOOKUP') {
    handleLookup(message.word).then(sendResponse);
    return true;
  }

  if (message.type === 'GET_SETTINGS') {
    getSettings().then(sendResponse);
    return true;
  }

  if (message.type === 'SAVE_SETTINGS') {
    chrome.storage.sync.set(message.settings, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'SAVE_WORD') {
    saveWord(message.entry).then(sendResponse);
    return true;
  }

  if (message.type === 'UNSAVE_WORD') {
    unsaveWord(message.text).then(sendResponse);
    return true;
  }

  if (message.type === 'IS_SAVED') {
    isWordSaved(message.text).then((saved) => sendResponse({ saved }));
    return true;
  }

  if (message.type === 'GET_SAVED_WORDS') {
    getSavedWords().then((words) => sendResponse({ words }));
    return true;
  }

  if (message.type === 'IMPORT_WORDS') {
    importWords(message.words, message.mode).then(sendResponse);
    return true;
  }

  if (message.type === 'OPEN_SAVED_PAGE') {
    chrome.tabs.create({ url: chrome.runtime.getURL('saved/saved.html') });
    return false;
  }
});
