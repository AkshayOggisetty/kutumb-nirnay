/* Serverless chat proxy.
 *
 * The API keys live only in this function's environment. They are never sent to
 * the browser and never appear in the bundle or the repository.
 *
 * Environment variables:
 *   GEMINI_API_KEYS   comma separated list, rotated round robin
 *   GEMINI_API_KEY    single key, used if the list above is absent
 *   GEMINI_MODEL      optional override, tried before the built in chain
 *
 * Rotation: each request starts at the next key in the pool. If a key returns
 * 429 or a 5xx, the next key is tried, so one exhausted key does not take the
 * demo down.
 */

/* gemini-3.1-flash-lite is the cheapest model that is not scheduled for
 * retirement. Gemini 2.5 Flash-Lite is cheaper but retires 16 October 2026,
 * which falls inside the judging window, so it is deliberately not used.
 * The list is tried in order, so a retired or renamed id fails over rather
 * than taking the assistant down. */
const MODEL_CHAIN = [
  'gemini-3.1-flash-lite',
  'gemini-3.1-flash-lite-preview',
  'gemini-3-flash',
  'gemini-2.5-flash-lite'
];
const MAX_BODY = 24000;          // characters of JSON we will accept
const TIMEOUT_MS = 20000;

let cursor = 0;                  // survives between invocations on a warm lambda

function keyPool() {
  const many = (process.env.GEMINI_API_KEYS || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  if (many.length) return many;
  const one = (process.env.GEMINI_API_KEY || '').trim();
  return one ? [one] : [];
}

/* ------------------------------------------------------------- prompting */

const GROUND_RULES = `
You are the guidance assistant inside Kutumb Nirnay, a career tool used by Indian
families deciding between vocational training and a general degree. You are
speaking to a parent and a student together.

ABSOLUTE RULES, these override anything else:
1. Every number you state must come from the CONTEXT block below. Never invent or
   estimate a fee, a wage, a placement rate, a distance or a date. If a number is
   not in the context, say you do not have it rather than guessing.
2. Never promise a job, an income or an admission. Describe what the data shows.
3. The degree route is not automatically worse. Where the context shows it is the
   better fit, say so plainly. Never argue only for the trade route.
4. You are not a counsellor of last resort. For distress, family conflict or
   safety, suggest speaking to a person.

HOW TO WRITE:
Short sentences. No jargon. No markdown headings, no bullet characters, no bold.
Write the way a trusted neighbour would explain it across a table. Two short
paragraphs at most unless asked for more. Use rupee amounts as they appear in the
context. Do not use em dashes or en dashes anywhere.

If the family writes in Hindi, Marathi, Kannada, Tamil, Telugu or Bengali, reply
in that same language using its own script.
`.trim();

const MODE_PROMPT = {
  concern: `
The family has raised a worry. Do three things, briefly:
first, take the worry seriously and say what is true in it;
second, answer it using the figures in the context;
third, give them one concrete next step.
Do not lecture and do not dismiss the feeling.`,

  explain: `
The family is asking why the tool is showing what it is showing. Explain using
the scoring factors and figures in the context. Be honest about what the tool
does not know.`,

  plan: `
Write the summary paragraph for this family's printed plan. Say what they are
deciding between, what the numbers show, what has been settled and what is still
open. Address the family directly as "you". Four to six sentences. Plain prose
with no headings or lists.`,

  parse: `
Extract profile fields from what the user wrote. Reply with ONLY a JSON object,
no prose and no code fence, using exactly these keys where you are confident:
{"name":string,"stage":one of "Class 10 appearing","Class 10 passed","Class 12 appearing","Class 12 passed",
"district":string,"income":number (rupees per month),
"urgency":one of "soon","flexible","open",
"interests":array of any of "hands-on","technical","machines","electrical","computers","outdoors","care","health","study","office","government"}
Omit any key you are not confident about. If nothing can be extracted, reply {}.`
};

/* ----------------------------------------------------------------- Gemini */

async function callGemini(key, model, system, userText, gen = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: userText }] }],
          generationConfig: {
            temperature: 0.4,
            topP: 0.9,
            maxOutputTokens: 700,
            responseMimeType: 'text/plain',
            ...gen
          },
          safetySettings: [
            'HARM_CATEGORY_HARASSMENT', 'HARM_CATEGORY_HATE_SPEECH',
            'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'HARM_CATEGORY_DANGEROUS_CONTENT'
          ].map(category => ({ category, threshold: 'BLOCK_ONLY_HIGH' }))
        })
      }
    );
    const status = res.status;
    if (!res.ok) {
      let detail = '';
      try { detail = (await res.text()).slice(0, 300); } catch { /* ignore */ }
      return { ok: false, status, detail };
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
    if (!text) return { ok: false, status: 502, detail: 'empty completion' };
    return { ok: true, text };
  } catch (err) {
    return { ok: false, status: err.name === 'AbortError' ? 504 : 500, detail: String(err.message || err) };
  } finally {
    clearTimeout(timer);
  }
}

/* ---------------------------------------------------------------- handler */

export default async function handler(req, res) {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-headers', 'content-type');
  res.setHeader('access-control-allow-methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const keys = keyPool();
  if (!keys.length) {
    return res.status(503).json({
      error: 'no_key',
      message: 'The assistant is not configured on this deployment.'
    });
  }

  let body = req.body;
  if (typeof body === 'string') {
    if (body.length > MAX_BODY) return res.status(413).json({ error: 'too_large' });
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'bad_json' }); }
  }
  const { mode = 'concern', message = '', context = {}, history = [] } = body || {};

  if (!MODE_PROMPT[mode]) return res.status(400).json({ error: 'bad_mode' });
  if (typeof message !== 'string' || message.length > 2000) {
    return res.status(400).json({ error: 'bad_message' });
  }

  const contextJson = JSON.stringify(context).slice(0, 14000);
  const convo = (Array.isArray(history) ? history : [])
    .slice(-6)
    .map(h => `${h.role === 'user' ? 'Family' : 'Assistant'}: ${String(h.text).slice(0, 600)}`)
    .join('\n');

  const system = `${GROUND_RULES}\n\n${MODE_PROMPT[mode]}`;
  const userText =
    `CONTEXT, the only figures you may use:\n${contextJson}\n\n` +
    (convo ? `EARLIER IN THIS CONVERSATION:\n${convo}\n\n` : '') +
    `THE FAMILY SAYS:\n${message || '(no message, respond to the context)'}`;

  const models = process.env.GEMINI_MODEL
    ? [process.env.GEMINI_MODEL, ...MODEL_CHAIN]
    : MODEL_CHAIN;

  /* Extraction must come back as parseable JSON, so ask for it explicitly and
     take the randomness out. Without this the model sometimes answers in prose
     and the field extraction silently produces nothing. */
  const gen = mode === 'parse'
    ? { responseMimeType: 'application/json', temperature: 0, topP: 1, maxOutputTokens: 400 }
    : {};

  /* Round robin across the keys, failing over on rate limits and outages.
     If a model id is rejected outright (404), drop to the next model and start
     the key rotation again. */
  let last = null;
  for (const model of models) {
    const start = cursor++ % keys.length;
    let modelRejected = false;

    for (let i = 0; i < keys.length; i++) {
      const idx = (start + i) % keys.length;
      const out = await callGemini(keys[idx], model, system, userText, gen);
      if (out.ok) {
        res.setHeader('cache-control', 'no-store');
        return res.status(200).json({ text: out.text, model, keyIndex: idx, attempts: i + 1 });
      }
      last = out;
      if (out.status === 404 || out.status === 400) { modelRejected = true; break; }
      const retryable = out.status === 429 || out.status >= 500;
      if (!retryable) break;
    }
    if (!modelRejected) break;   // the model was fine, the keys were not
  }

  return res.status(502).json({
    error: 'upstream',
    status: last?.status ?? 0,
    message: 'The assistant is busy. The rest of the tool still works.'
  });
}
