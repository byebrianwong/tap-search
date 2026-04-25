# Tap Search

A Chrome extension that shows AI-powered summaries and dictionary definitions when you double-click any word on any webpage.

## Features

- **Double-click any word** to see a tooltip with results
- **AI summaries** via Gemini or Claude (optional, requires API key)
- **Dictionary definitions** from the Free Dictionary API (works out of the box, no key needed)
- **Wikipedia and Google Search** buttons for quick follow-up
- **Dark mode** support (follows your system theme)
- Tooltip dismisses on click outside, Escape key, or scrolling

## Install (developer mode)

Since this extension isn't on the Chrome Web Store yet, you'll need to load it manually:

1. **Clone the repo**

   ```
   git clone https://github.com/byebrianwong/tap-search.git
   ```

2. **Open Chrome's extension page**

   Navigate to `chrome://extensions` in your browser.

3. **Enable Developer mode**

   Toggle the "Developer mode" switch in the top-right corner.

4. **Load the extension**

   Click **"Load unpacked"** and select the `tap-search` folder you just cloned.

5. **Pin it (optional)**

   Click the puzzle-piece icon in Chrome's toolbar and pin **Tap Search** for easy access to settings.

## Setup

The extension works immediately with **dictionary-only mode** (no API key required).

To enable AI summaries, click the extension icon and configure a provider:

| Provider | How to get a key | Cost |
| --- | --- | --- |
| **Gemini** | [Google AI Studio](https://aistudio.google.com/apikey) | Free tier available |
| **Claude** | [Anthropic Console](https://console.anthropic.com/) | Pay-per-use |

1. Click the Tap Search icon in the toolbar.
2. Select **Gemini** or **Claude**.
3. Paste your API key and click **Save Settings**.

## Usage

1. Double-click any word on any webpage.
2. A tooltip appears with:
   - An AI-generated summary (if an AI provider is configured)
   - Dictionary definitions with parts of speech and examples
   - Quick-action buttons for Wikipedia and Google Search
3. Click outside the tooltip, press **Escape**, or scroll to dismiss it.

## Project structure

```
tap-search/
  manifest.json            # Chrome extension manifest (MV3)
  background/
    service-worker.js      # API calls to Gemini, Claude, and Dictionary
  content/
    content.js             # Double-click listener and tooltip UI
  popup/
    popup.html             # Settings popup
    popup.css
    popup.js
  icons/
    icon16.png
    icon32.png
    icon48.png
    icon128.png
```

## Architecture notes (for agents / contributors)

This is a Chrome Manifest V3 extension with no build step — all source files are plain JavaScript loaded directly by the browser.

### Message flow

1. `content/content.js` runs on every page. On double-click it extracts the selected word and sends a `{ type: 'TAP_SEARCH_LOOKUP', word }` message to the background service worker via `chrome.runtime.sendMessage`.
2. `background/service-worker.js` receives the message, fires AI and dictionary lookups **in parallel** (`Promise.all`), and returns the combined result.
3. The content script renders the result into a Shadow DOM tooltip (`<tap-search-tooltip>`) so styles are fully isolated from the host page.

### Settings / storage

User settings (provider choice, API keys, enabled state) are stored in `chrome.storage.sync` with these keys:

| Key | Type | Default |
| --- | --- | --- |
| `provider` | `"gemini"` \| `"claude"` \| `"dictionary"` | `"dictionary"` |
| `geminiApiKey` | string | `""` |
| `claudeApiKey` | string | `""` |
| `enabled` | boolean | `true` |

The popup reads/writes settings via messages (`GET_SETTINGS` / `SAVE_SETTINGS`) to the service worker, which owns `chrome.storage`.

### API details

- **Gemini**: Tries models in order (`gemini-2.5-flash-lite` → `gemini-2.5-flash` → `gemini-2.0-flash`), falling through on 404 or 429 only. The API key is passed as a URL query parameter.
- **Claude**: Uses `claude-haiku-4-5-20251001` with `max_tokens: 200`. Requires the `anthropic-dangerous-direct-browser-access` header for CORS from a browser extension.
- **Dictionary**: Free Dictionary API (`api.dictionaryapi.dev`), no key required.

### Key conventions

- **No build step, no dependencies.** Everything is vanilla JS. No npm, no bundler.
- **Shadow DOM isolation.** The tooltip uses a closed Shadow DOM so host-page CSS cannot leak in.
- **Content script is an IIFE** to avoid polluting the page's global scope.
- The tooltip custom element tag is `<tap-search-tooltip>`.
- Word validation uses the regex `/^[\p{L}'-]+$/u` — letters, apostrophes, and hyphens only, 2–50 chars.

### Making changes

After editing any file, go to `chrome://extensions` and click the reload button on the Tap Search card (or press Ctrl+R on the extensions page). Content script changes require a page refresh on the target tab as well.

## License

MIT
