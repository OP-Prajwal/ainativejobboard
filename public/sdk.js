var b = Object.defineProperty;
var h = (t, n, e) => n in t ? b(t, n, { enumerable: !0, configurable: !0, writable: !0, value: e }) : t[n] = e;
var c = (t, n, e) => h(t, typeof n != "symbol" ? n + "" : n, e);
let s;
const y = new Uint8Array(16);
function I() {
  if (!s && (s = typeof crypto < "u" && crypto.getRandomValues && crypto.getRandomValues.bind(crypto), !s))
    throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
  return s(y);
}
const o = [];
for (let t = 0; t < 256; ++t)
  o.push((t + 256).toString(16).slice(1));
function w(t, n = 0) {
  return o[t[n + 0]] + o[t[n + 1]] + o[t[n + 2]] + o[t[n + 3]] + "-" + o[t[n + 4]] + o[t[n + 5]] + "-" + o[t[n + 6]] + o[t[n + 7]] + "-" + o[t[n + 8]] + o[t[n + 9]] + "-" + o[t[n + 10]] + o[t[n + 11]] + o[t[n + 12]] + o[t[n + 13]] + o[t[n + 14]] + o[t[n + 15]];
}
const x = typeof crypto < "u" && crypto.randomUUID && crypto.randomUUID.bind(crypto), u = {
  randomUUID: x
};
function g(t, n, e) {
  if (u.randomUUID && !t)
    return u.randomUUID();
  t = t || {};
  const a = t.random || (t.rng || I)();
  return a[6] = a[6] & 15 | 64, a[8] = a[8] & 63 | 128, w(a);
}
const p = "finalround_plugin_installation";
class f {
  static getOrCreateId() {
    try {
      const n = localStorage.getItem(p);
      if (n)
        return n;
      const e = g();
      return localStorage.setItem(p, e), e;
    } catch (n) {
      return console.warn("[FinalRoundPlugin] LocalStorage access failed:", n), g();
    }
  }
}
const l = "finalround_plugin_token";
class R {
  static async ensureToken(n) {
    try {
      const e = localStorage.getItem(l);
      if (e)
        return e;
      const a = "http://localhost:3000/api/v1";
      console.log("[FinalRoundPlugin] Registering installation...", { installationId: n, apiUrl: a });
      const i = await fetch(`${a}/installations/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          installation_id: n,
          domain: window.location.hostname
        })
      });
      if (!i.ok)
        throw new Error(`Registration failed: ${i.statusText}`);
      const d = (await i.json()).installation_token;
      return localStorage.setItem(l, d), d;
    } catch (e) {
      throw console.error("[FinalRoundPlugin] Token registration failed", e), e;
    }
  }
  static getToken() {
    return localStorage.getItem(l);
  }
}
class T {
  static mount(n) {
    const e = document.getElementById("plugin-container");
    if (!e) {
      console.warn("[FinalRoundPlugin] Container #plugin-container not found. Plugin execution skipped.");
      return;
    }
    if (e.shadowRoot)
      return;
    const a = e.attachShadow({ mode: "open" }), i = document.createElement("style");
    i.textContent = `
            :host {
                display: block;
                font-family: 'Inter', sans-serif;
                margin-top: 2rem;
                margin-bottom: 2rem;
            }
            .plugin-wrapper {
                background: linear-gradient(145deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.6));
                border: 1px solid rgba(139, 92, 246, 0.2);
                border-radius: 12px;
                padding: 1.5rem;
                color: #fff;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                backdrop-filter: blur(10px);
            }
            h2 {
                color: #a78bfa;
                margin-top: 0;
            }
            .status {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.875rem;
                color: #94a3b8;
            }
            .dot {
                width: 8px;
                height: 8px;
                background-color: #10b981;
                border-radius: 50%;
                box-shadow: 0 0 8px #10b981;
            }
        `, a.appendChild(i);
    const r = document.createElement("div");
    r.className = "plugin-wrapper", r.innerHTML = `
            <div class="header">
                 <h2>⚡ FinalRound AI Task Allocation</h2>
                 <div class="status">
                    <span class="dot"></span>
                    <span>Plugin Active | Session: ${n.jobId.substring(0, 8)}...</span>
                 </div>
                 <p style="margin-top: 1rem; color: #cbd5e1;">
                    This job includes an AI-assisted outcome assessment. 
                    <br/>
                    <strong>Context Loaded:</strong> ${n.jobTitle} at ${n.company}
                 </p>
                 <button style="margin-top: 1rem; padding: 0.5rem 1rem; background: #8b5cf6; border: none; border-radius: 6px; color: white; cursor: pointer; font-weight: bold;">
                    Start Outcome Assessment
                 </button>
            </div>
        `, a.appendChild(r), console.log("[FinalRoundPlugin] Mounted successfully in Shadow DOM");
  }
}
class m {
  static async init(n) {
    if (!this.isInitialized) {
      console.log("[FinalRoundPlugin] Initializing...", n);
      try {
        const e = f.getOrCreateId();
        console.log("[FinalRoundPlugin] Installation ID:", e), await R.ensureToken(e);
        const a = document.getElementById("plugin-container");
        if (a) {
          const i = {
            jobId: a.dataset.jobId || "",
            jobTitle: a.dataset.jobTitle || "",
            company: a.dataset.company || ""
          };
          i.jobId && T.mount(i);
        }
        this.isInitialized = !0;
      } catch (e) {
        console.error("[FinalRoundPlugin] Initialization failed:", e);
      }
    }
  }
}
c(m, "isInitialized", !1);
window.FinalRoundPlugin = m;
export {
  m as default
};
