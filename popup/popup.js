const enabledEl = document.getElementById('enabled');
const providerEls = document.querySelectorAll('input[name="provider"]');
const geminiKeyEl = document.getElementById('gemini-key');
const claudeKeyEl = document.getElementById('claude-key');
const geminiSection = document.getElementById('gemini-section');
const claudeSection = document.getElementById('claude-section');
const saveBtn = document.getElementById('save');
const statusEl = document.getElementById('status');

// Show/hide API key sections based on selected provider
function updateVisibility() {
  const provider = document.querySelector('input[name="provider"]:checked')?.value;
  geminiSection.classList.toggle('visible', provider === 'gemini');
  claudeSection.classList.toggle('visible', provider === 'claude');
}

providerEls.forEach((el) => el.addEventListener('change', updateVisibility));

// Toggle password visibility
document.getElementById('gemini-toggle').addEventListener('click', () => {
  geminiKeyEl.type = geminiKeyEl.type === 'password' ? 'text' : 'password';
});

document.getElementById('claude-toggle').addEventListener('click', () => {
  claudeKeyEl.type = claudeKeyEl.type === 'password' ? 'text' : 'password';
});

// Load settings
chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (settings) => {
  if (!settings) return;

  enabledEl.checked = settings.enabled !== false;

  const providerRadio = document.querySelector(`input[name="provider"][value="${settings.provider || 'dictionary'}"]`);
  if (providerRadio) providerRadio.checked = true;

  geminiKeyEl.value = settings.geminiApiKey || '';
  claudeKeyEl.value = settings.claudeApiKey || '';

  updateVisibility();
});

// Save settings
saveBtn.addEventListener('click', () => {
  const provider = document.querySelector('input[name="provider"]:checked')?.value || 'dictionary';

  const settings = {
    enabled: enabledEl.checked,
    provider,
    geminiApiKey: geminiKeyEl.value.trim(),
    claudeApiKey: claudeKeyEl.value.trim()
  };

  // Warn if AI provider selected but no key
  if (provider === 'gemini' && !settings.geminiApiKey) {
    showStatus('Please enter a Gemini API key', '#d93025');
    return;
  }
  if (provider === 'claude' && !settings.claudeApiKey) {
    showStatus('Please enter a Claude API key', '#d93025');
    return;
  }

  chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', settings }, () => {
    showStatus('Settings saved!', '#34a853');
  });
});

function showStatus(message, color) {
  statusEl.textContent = message;
  statusEl.style.color = color;
  statusEl.classList.add('show');
  setTimeout(() => statusEl.classList.remove('show'), 2000);
}
