/* The assistant drawer.
 *
 * Opens on any screen, knows which screen it was opened from, and answers only
 * from figures the engine has already computed. If the service is unreachable
 * it says so plainly and the rest of the tool carries on.
 */

import { ask } from '../core/ai.js';

const SUGGESTIONS = {
  start: [
    'What does this actually do?',
    'We cannot decide between ITI and a degree'
  ],
  profile: [
    'My son finished class 10, we earn about twenty thousand, he likes fixing bikes',
    'Why do you need our income?'
  ],
  explore: [
    'Why is this one ranked first for us?',
    'Which of these is cheapest to start?'
  ],
  compare: [
    'Explain this chart to my father',
    'When does our family start getting money back?'
  ],
  centres: [
    'Which of these can he reach by bus?',
    'What will the travel cost us every month?'
  ],
  concerns: [
    'My relatives say ITI is for children who could not study',
    'Is a degree not safer?'
  ],
  plan: [
    'Summarise this for our family',
    'What should we do in the next two weeks?'
  ]
};

export class Assistant {
  constructor({ getProfile, getScreen }) {
    this.getProfile = getProfile;
    this.getScreen = getScreen;
    this.history = [];
    this.open = false;
    this.busy = false;
    this.el = null;
    this.recog = null;
  }

  mount() {
    if (this.el) return;
    const wrap = document.createElement('div');
    wrap.id = 'assistant';
    wrap.innerHTML = `
      <button class="as-fab" id="as-fab" aria-label="Ask the guidance assistant">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.3-.6L3 21l1.8-5.2A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z"/>
        </svg>
        <span>Ask</span>
      </button>
      <section class="as-panel" id="as-panel" hidden aria-label="Guidance assistant">
        <header class="as-head">
          <div>
            <strong>Guidance assistant</strong>
            <p id="as-sub">Answers from your own numbers</p>
          </div>
          <button class="as-x" id="as-close" aria-label="Close">&times;</button>
        </header>
        <div class="as-log" id="as-log"></div>
        <div class="as-sugg" id="as-sugg"></div>
        <form class="as-form" id="as-form">
          <button type="button" class="as-mic" id="as-mic" aria-label="Speak" hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="1.9" stroke-linecap="round">
              <rect x="9" y="2.5" width="6" height="11" rx="3"/>
              <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>
            </svg>
          </button>
          <input id="as-input" type="text" autocomplete="off"
                 placeholder="Ask anything about these options" maxlength="500">
          <button class="as-send" id="as-send" aria-label="Send">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 12h15M13 6l6 6-6 6"/>
            </svg>
          </button>
        </form>
      </section>`;
    document.body.appendChild(wrap);
    this.el = wrap;
    this.wire();
    this.setupVoice();
  }

  wire() {
    const q = s => this.el.querySelector(s);
    q('#as-fab').addEventListener('click', () => this.toggle());
    q('#as-close').addEventListener('click', () => this.toggle(false));
    q('#as-form').addEventListener('submit', e => {
      e.preventDefault();
      const input = q('#as-input');
      const text = input.value.trim();
      if (!text || this.busy) return;
      input.value = '';
      this.send(text);
    });
    this.el.addEventListener('click', e => {
      const s = e.target.closest('[data-sugg]');
      if (s && !this.busy) this.send(s.dataset.sugg);
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.open) this.toggle(false);
    });
  }

  setupVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const mic = this.el.querySelector('#as-mic');
    mic.hidden = false;
    this.recog = new SR();
    this.recog.lang = 'en-IN';
    this.recog.interimResults = false;
    this.recog.maxAlternatives = 1;
    this.recog.addEventListener('result', e => {
      const text = e.results?.[0]?.[0]?.transcript?.trim();
      mic.classList.remove('on');
      if (text) this.send(text);
    });
    this.recog.addEventListener('end', () => mic.classList.remove('on'));
    this.recog.addEventListener('error', () => mic.classList.remove('on'));
    mic.addEventListener('click', () => {
      if (mic.classList.contains('on')) { try { this.recog.stop(); } catch {} return; }
      mic.classList.add('on');
      try { this.recog.start(); } catch { mic.classList.remove('on'); }
    });
  }

  toggle(force) {
    this.open = force === undefined ? !this.open : force;
    this.el.querySelector('#as-panel').hidden = !this.open;
    this.el.querySelector('#as-fab').classList.toggle('on', this.open);
    if (this.open) {
      this.paintSuggestions();
      if (!this.history.length) this.greet();
      setTimeout(() => this.el.querySelector('#as-input')?.focus(), 60);
    }
  }

  greet() {
    const screen = this.getScreen();
    const where = {
      start: 'getting started',
      profile: 'your details',
      explore: 'the options list',
      compare: 'the comparison',
      centres: 'the centres map',
      concerns: 'family concerns',
      plan: 'your plan'
    }[screen] || 'this screen';
    this.push('bot',
      `Ask me anything about ${where}. I can only use the figures already on your ` +
      `screen, so I will tell you when I do not know something.`);
  }

  paintSuggestions() {
    const screen = this.getScreen();
    const list = SUGGESTIONS[screen] || SUGGESTIONS.start;
    this.el.querySelector('#as-sugg').innerHTML = this.busy ? '' :
      list.map(s => `<button type="button" data-sugg="${s.replace(/"/g, '&quot;')}">${s}</button>`).join('');
    this.el.querySelector('#as-sub').textContent =
      `Answers from your own numbers on ${screen === 'start' ? 'this page' : 'this screen'}`;
  }

  push(role, text) {
    this.history.push({ role: role === 'bot' ? 'model' : 'user', text });
    const log = this.el.querySelector('#as-log');
    const div = document.createElement('div');
    div.className = 'as-msg ' + role;
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    return div;
  }

  async send(text) {
    this.push('user', text);
    this.busy = true;
    this.paintSuggestions();
    const thinking = this.push('bot', 'Thinking');
    thinking.classList.add('wait');

    const screen = this.getScreen();
    const mode = screen === 'concerns' ? 'concern'
               : screen === 'plan' ? 'plan'
               : 'explain';

    try {
      const reply = await ask({
        mode,
        message: text,
        profile: this.getProfile(),
        history: this.history.slice(0, -1),
        extra: { screenTheFamilyIsLookingAt: screen }
      });
      thinking.classList.remove('wait');
      thinking.textContent = reply;
      this.history[this.history.length - 1].text = reply;
    } catch (err) {
      thinking.classList.remove('wait');
      thinking.classList.add('err');
      thinking.textContent =
        err.code === 'no_key'
          ? 'The assistant is not switched on for this deployment. Everything else on the page still works.'
          : 'The assistant could not be reached just now. Everything else on the page still works.';
      this.history.pop();
    } finally {
      this.busy = false;
      this.paintSuggestions();
      const log = this.el.querySelector('#as-log');
      log.scrollTop = log.scrollHeight;
    }
  }
}
