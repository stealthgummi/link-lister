// Post-purchase page. Stripe redirects here with ?session_id={CHECKOUT_SESSION_ID};
// the session ID is the buyer's license key for the extension.
const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

module.exports = (req, res) => {
  const id = String((req.query && req.query.session_id) || '');
  const valid = /^cs_(live|test)_[A-Za-z0-9]+$/.test(id);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Link Lister Pro: your license key</title>
<style>
:root{--bg:#f8fafc;--card:#fff;--text:#0f172a;--muted:#64748b;--accent:#2563eb;--border:#e2e8f0}
@media (prefers-color-scheme:dark){:root{--bg:#0b1220;--card:#111a2e;--text:#e5e7eb;--muted:#94a3b8;--border:#1f2a44}}
body{margin:0;font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:var(--bg);color:var(--text);display:grid;place-items:center;min-height:100vh;padding:16px;box-sizing:border-box}
.card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:28px;max-width:520px;width:100%}
h1{font-size:22px;margin:0 0 8px} p{color:var(--muted);line-height:1.5}
.key{display:flex;gap:8px;margin:18px 0}
input{flex:1;min-width:0;font:14px ui-monospace,monospace;padding:10px;border:1px solid var(--border);border-radius:8px;background:var(--bg);color:var(--text)}
button{background:var(--accent);color:#fff;border:0;border-radius:8px;padding:10px 16px;font-weight:600;cursor:pointer}
ol{color:var(--muted);padding-left:20px;line-height:1.7}
</style></head><body><main class="card">
${valid ? `<h1>Thanks! Link Lister Pro is yours.</h1>
<p>This is your license key. Save it somewhere safe, since you'll need it if you reinstall.</p>
<div class="key"><input id="k" readonly value="${esc(id)}" aria-label="License key"><button id="c">Copy</button></div>
<ol><li>Click the Link Lister icon in Chrome.</li><li>Paste the key into <b>Enter License Key</b>.</li><li>Click <b>Unlock</b>. Unlimited links, forever.</li></ol>
<script>document.getElementById('c').onclick=async()=>{const k=document.getElementById('k');try{await navigator.clipboard.writeText(k.value)}catch(e){k.select();document.execCommand('copy')}document.getElementById('c').textContent='Copied!'}</script>`
: `<h1>No purchase found</h1><p>This page shows your license key right after you buy Link Lister Pro. If you paid and don't see a key, reply to your Stripe receipt email and we'll send it.</p>`}
</main></body></html>`);
};
