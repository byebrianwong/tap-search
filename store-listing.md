# Chrome Web Store listing — Tap Search

Copy/paste these fields into the Chrome Web Store Developer Console.

---

## Item name
```
Tap Search
```

## Summary (short description, max 132 chars)
```
Double-click any word for instant AI summaries, dictionary definitions, and quick links to Wikipedia and Google.
```

## Detailed description
```
Tap Search turns every word on the web into a one-click lookup. Double-click any word on any page and a tooltip appears with a concise AI summary, dictionary definitions, and quick-action buttons for Wikipedia and Google Search — without leaving the page you are reading.

FEATURES
• Double-click any word for an instant tooltip
• AI-powered summaries via Google Gemini or Anthropic Claude (bring your own API key)
• Dictionary definitions from the Free Dictionary API — works out of the box, no key required
• One-click follow-up search on Wikipedia or Google
• Save interesting words to a personal list and revisit them later
• Right-click context-menu lookup for selected text
• Dark mode that follows your system theme
• Tooltip dismisses on click outside, Escape, or scroll

PRIVACY
Tap Search has no backend server. Your settings and saved words are stored locally in Chrome (chrome.storage.sync). When you look up a word, only the word itself is sent — directly from your browser to the API provider you chose. We collect nothing.

REQUIRES
• An API key for AI summaries (free tiers available from Google AI Studio or pay-per-use from Anthropic)
• Or use it in dictionary-only mode with no key required

OPEN SOURCE
Source code: https://github.com/byebrianwong/tap-search
```

## Category
```
Productivity
```

## Language
```
English
```

---

## Privacy practices tab

### Single purpose
```
Show AI summaries and dictionary definitions for words you double-click on any webpage.
```

### Permission justifications

**`storage`**
```
Used to save the user's settings (chosen AI provider, API key, enabled state) and the user's saved-words list. All data is stored locally in chrome.storage.sync and never sent to a developer-operated server.
```

**`contextMenus`**
```
Used to add a right-click "Tap Search: <selected text>" menu item, giving the user a second way to trigger a lookup besides double-clicking.
```

**Host permission: `https://generativelanguage.googleapis.com/*`**
```
Used to call the Google Gemini API for AI-generated summaries when the user chooses Gemini as their provider and supplies their own API key. Only the looked-up word is sent.
```

**Host permission: `https://api.anthropic.com/*`**
```
Used to call the Anthropic Claude API for AI-generated summaries when the user chooses Claude as their provider and supplies their own API key. Only the looked-up word is sent.
```

**Host permission: `https://api.dictionaryapi.dev/*`**
```
Used to fetch dictionary definitions from the Free Dictionary API. Only the looked-up word is sent. No API key required.
```

**Content script on `<all_urls>`**
```
The content script must run on every page so the user can double-click any word anywhere on the web. The script only listens for double-click events and renders a tooltip — it never reads or transmits page content, URLs, or browsing history.
```

### Data collection disclosures
- Personally identifiable information: **No**
- Health information: **No**
- Financial and payment information: **No**
- Authentication information: **Yes — API keys** (stored locally only)
- Personal communications: **No**
- Location: **No**
- Web history: **No**
- User activity: **No** (we do not log clicks, words looked up, or page views)
- Website content: **No** (only the single word the user double-clicks is sent to the chosen API)

### Certifications (must check all three)
- ☑ I do not sell or transfer user data to third parties outside of the approved use cases
- ☑ I do not use or transfer user data for purposes unrelated to the item's single purpose
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes

### Privacy policy URL
```
https://github.com/byebrianwong/tap-search/blob/main/PRIVACY.md
```

---

## Distribution
- **Visibility:** Unlisted
- **Regions:** All regions (or restrict as preferred)
- **Pricing:** Free

---

## Assets checklist (must produce before submitting)

- [ ] **Icon 128×128** — already in repo: `icons/icon128.png` ✓
- [ ] **Small promo tile 440×280** (required) — needs to be created
- [ ] **Screenshot(s) 1280×800 or 640×400** — at least 1, up to 5
  - Suggested shots:
    1. Tooltip open over a Wikipedia article showing AI summary + definitions
    2. Tooltip showing dictionary-only mode (no API key)
    3. Settings popup with provider picker
    4. Saved-words page
    5. Right-click context menu showing "Tap Search: ..."
- [ ] **(Optional) Marquee promo tile 1400×560** — only needed if featured

---

## Pre-submit checks

- [ ] `manifest.json` version bumped if resubmitting
- [ ] Zip excludes `.git`, `.DS_Store`, `.gitignore`
- [ ] PRIVACY.md is pushed to `main` so the URL above resolves
- [ ] Tested fresh install via "Load unpacked" — double-click + context menu + saved words all work
