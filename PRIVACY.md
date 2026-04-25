# Tap Search — Privacy Policy

_Last updated: 2026-04-25_

Tap Search is a Chrome extension that shows AI-powered summaries and dictionary definitions when you double-click a word on any webpage. This policy explains what the extension does and does not do with your data.

## What we collect

**Nothing is sent to us.** Tap Search has no backend server operated by the developer. We do not collect, log, transmit, or store any of your data on any server we control.

## What stays on your device

The extension uses Chrome's built-in `chrome.storage.sync` API to store the following on your device (and, if you are signed in to Chrome, sync them across your own Chrome profiles via Google):

- Your chosen AI provider (Gemini, Claude, or dictionary-only)
- Your API key, if you entered one
- Whether the extension is enabled
- Words you have explicitly saved using the "save" button in the tooltip

This data is accessible only to the Tap Search extension on your own Chrome profile. It is not transmitted to the developer.

## What gets sent to third-party APIs

When you double-click a word (or use the right-click context menu), the extension sends **only the selected word** to the API provider you have configured:

- **Free Dictionary API** (`api.dictionaryapi.dev`) — always queried; no API key needed
- **Google Gemini API** (`generativelanguage.googleapis.com`) — only if you select Gemini and provide a key
- **Anthropic Claude API** (`api.anthropic.com`) — only if you select Claude and provide a key

These requests are made directly from your browser to the provider you chose, using the API key you supplied. Each provider's privacy policy governs how they handle the request:

- [Google Gemini API Terms](https://ai.google.dev/terms)
- [Anthropic Privacy Policy](https://www.anthropic.com/legal/privacy)
- [Free Dictionary API](https://dictionaryapi.dev/)

The extension does not send the URL of the page you are on, the surrounding text, your browsing history, or any other identifying information — only the single word you double-clicked.

## Permissions explained

- **`storage`** — to save your settings and saved-words list locally
- **`contextMenus`** — to add the right-click "Tap Search" menu item
- **Host permissions** for `generativelanguage.googleapis.com`, `api.anthropic.com`, and `api.dictionaryapi.dev` — to fetch lookup results from the AI/dictionary providers
- **Content scripts on `<all_urls>`** — so you can double-click words on any webpage; the script runs locally and does not send page content anywhere

## What we do not do

- No analytics, telemetry, or tracking
- No remote code execution
- No advertising or third-party trackers
- No selling or sharing of any data
- No collection of your browsing history or page content

## Open source

Tap Search is open source. You can review the full source code at [github.com/byebrianwong/tap-search](https://github.com/byebrianwong/tap-search).

## Contact

For questions about this policy, open an issue at [github.com/byebrianwong/tap-search/issues](https://github.com/byebrianwong/tap-search/issues).
