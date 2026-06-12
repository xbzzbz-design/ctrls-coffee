// CTRL+S Pocket — shared helpers, hooks, and brewing animation.

const { useState, useEffect, useMemo, useRef, useCallback, createContext, useContext } = React;

// Color → CSS var
const COLOR_TO_VAR = {
  mustard: 'var(--mustard)',
  pink: 'var(--pink)',
  terracotta: 'var(--terracotta)',
  sage: 'var(--sage)',
  charcoal: 'var(--charcoal)',
};
const COLOR_TO_SOFT = {
  mustard: 'var(--mustard-soft)',
  pink: 'var(--pink-soft)',
  terracotta: 'var(--terracotta-soft)',
  sage: 'var(--sage-soft)',
  charcoal: 'var(--beige-deep)',
};

function useStored(key, initial) {
  const [v, setV] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }, [key, v]);
  return [v, setV];
}

function formatBaht(n) { return Math.round(n).toLocaleString('en-US'); }
function pad2(n) { return n < 10 ? '0' + n : '' + n; }
function isoFromDate(d) {
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}
function shortDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return {
    dow: CTRLS.DOW_EN[d.getDay()].toUpperCase(),
    day: d.getDate(),
    mon: d.toLocaleString('en', { month: 'short' }).toUpperCase(),
    monLong: d.toLocaleString('en', { month: 'long' }),
    year: d.getFullYear(),
  };
}
function nextNDays(n, from) {
  const out = [];
  const base = from ? new Date(from + 'T00:00:00') : new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    out.push(isoFromDate(d));
  }
  return out;
}
function monthMatrix(year, month) {
  // month 0-indexed. Returns 6 rows × 7 cells of {iso, day, otherMonth}.
  const first = new Date(year, month, 1);
  const startDow = first.getDay();
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, 1 - startDow + i);
    cells.push({
      iso: isoFromDate(d),
      day: d.getDate(),
      otherMonth: d.getMonth() !== month,
    });
  }
  return cells;
}

// === Brewing paw animation ===
// Fires a transient SVG that flies from the source button toward the floating cart.
const animRoot = (() => {
  let el = null;
  return () => {
    if (!el) {
      el = document.createElement('div');
      el.id = 'brew-anim-root';
      el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:200;';
      document.body.appendChild(el);
    }
    return el;
  };
})();

function playBrewAnim(fromEl, color = 'terracotta') {
  if (!fromEl) return;
  const cart = document.querySelector('.floating-cart');
  const src = fromEl.getBoundingClientRect();
  const dst = cart ? cart.getBoundingClientRect() : null;
  const startX = src.left + src.width / 2 - 40;
  const startY = src.top + src.height / 2 - 40;
  const endX = dst ? dst.left + dst.width / 2 : startX;
  const endY = dst ? dst.top + dst.height / 2 : window.innerHeight - 40;
  const node = document.createElement('div');
  node.className = 'brew-anim';
  node.style.left = startX + 'px';
  node.style.top = startY + 'px';
  node.style.setProperty('--dx', (endX - startX) + 'px');
  node.style.setProperty('--dy', (endY - startY) + 'px');
  const fillVar = ({
    mustard: '#E8B958', pink: '#E7A2AC', terracotta: '#C97B5F', sage: '#8FA287', charcoal: '#2B2B2B',
  })[color] || '#C97B5F';
  node.innerHTML = `
    <svg class="paw-svg" width="80" height="80" viewBox="0 0 80 80">
      <!-- steam -->
      <g class="steam" opacity="0">
        <path d="M 38 8 q 2 -4 5 -2 q 3 2 0 6" stroke="#8B7E6B" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <path d="M 46 6 q 2 -3 4 -1 q 2 2 -1 5" stroke="#8B7E6B" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      </g>
      <!-- mug body -->
      <path d="M 26 26 L 26 56 Q 26 64 34 64 L 50 64 Q 58 64 58 56 L 58 26 Z" fill="${fillVar}" stroke="#2B2B2B" stroke-width="2" stroke-linejoin="round"/>
      <!-- mug handle -->
      <path d="M 58 32 Q 67 32 67 42 Q 67 50 58 50" fill="none" stroke="#2B2B2B" stroke-width="2" stroke-linejoin="round"/>
      <!-- coffee surface -->
      <ellipse cx="42" cy="28" rx="15" ry="3" fill="#5A3E2B"/>
      <!-- paw above -->
      <g transform="translate(48, 4) rotate(-12)">
        <ellipse cx="0" cy="8" rx="9" ry="7" fill="#EADFCB" stroke="#2B2B2B" stroke-width="1.5"/>
        <ellipse cx="-7" cy="2" rx="2.5" ry="3" fill="#EADFCB" stroke="#2B2B2B" stroke-width="1.2"/>
        <ellipse cx="-2" cy="-1" rx="2.5" ry="3" fill="#EADFCB" stroke="#2B2B2B" stroke-width="1.2"/>
        <ellipse cx="4" cy="-1" rx="2.5" ry="3" fill="#EADFCB" stroke="#2B2B2B" stroke-width="1.2"/>
        <ellipse cx="9" cy="2" rx="2.5" ry="3" fill="#EADFCB" stroke="#2B2B2B" stroke-width="1.2"/>
        <ellipse cx="-3" cy="9" rx="2" ry="1.5" fill="#E7A2AC"/>
      </g>
    </svg>`;
  // make the steam SVG visible after a tick
  const steamEl = node.querySelector('.steam');
  if (steamEl) {
    setTimeout(() => {
      steamEl.setAttribute('opacity', '1');
      steamEl.style.animation = 'steamPuff 700ms ease-out 80ms forwards';
    }, 50);
  }
  animRoot().appendChild(node);
  // Bump cart at landing.
  setTimeout(() => {
    if (cart) {
      cart.classList.remove('bump');
      void cart.offsetWidth;
      cart.classList.add('bump');
      setTimeout(() => cart.classList.remove('bump'), 360);
    }
    node.remove();
  }, 920);
}

// Copy-to-clipboard utility
async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    return true;
  } catch { return false; }
}

// Tiny segmented toggle
function SegToggle({ value, onChange, options }) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={o.value} className={value === o.value ? 'active' : ''} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

// === PromptPay QR generator (EMV QRCPS, CRC-16/CCITT-FALSE) ===
function _crc16(str) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
  }
  return crc & 0xFFFF;
}
function _emv(tag, val) { return tag + String(val.length).padStart(2, '0') + val; }

function buildPromptPayPayload(id, amount) {
  let norm = (id || '').replace(/[-\s]/g, '');
  if (/^0\d{9}$/.test(norm))  norm = '0066' + norm.slice(1);
  else if (/^\+66/.test(norm)) norm = '00' + norm.slice(1);
  const acct = _emv('00', 'A000000677010111') + _emv('01', norm);
  let p = _emv('00','01') + _emv('01','12') + _emv('29', acct)
        + _emv('52','0000') + _emv('53','764');
  if (amount > 0) p += _emv('54', amount.toFixed(2));
  p += _emv('58','TH') + _emv('59','CTRL S Coffee') + _emv('60','Bangkok') + '6304';
  return p + _crc16(p).toString(16).toUpperCase().padStart(4,'0');
}

function PromptPayQR({ promptPayId, amount, size = 200 }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    if (!promptPayId) return;
    let cancelled = false;
    function tryGenerate(retries) {
      if (cancelled) return;
      if (typeof QRCode === 'undefined' || !QRCode.toDataURL) {
        if (retries < 30) setTimeout(() => tryGenerate(retries + 1), 200);
        return;
      }
      const payload = buildPromptPayPayload(promptPayId, amount);
      QRCode.toDataURL(payload, { width: size, margin: 1, color: { dark: '#2B2B2B', light: '#F6F1E8' } })
        .then((url) => { if (!cancelled) setSrc(url); })
        .catch(() => {});
    }
    tryGenerate(0);
    return () => { cancelled = true; };
  }, [promptPayId, amount, size]);
  if (!src) return (
    <div style={{ width: size, height: size, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--beige)', borderRadius: 12, gap: 6 }}>
      <div style={{ fontSize: 24 }}>⏳</div>
      <span className="mono dim" style={{ fontSize: 10 }}>generating QR…</span>
    </div>
  );
  return <img src={src} width={size} height={size} alt="PromptPay QR" style={{ borderRadius: 12, imageRendering: 'pixelated' }} />;
}

// expose
Object.assign(window, {
  COLOR_TO_VAR, COLOR_TO_SOFT,
  useStored, formatBaht, isoFromDate, shortDate, nextNDays, monthMatrix,
  playBrewAnim, copyText, SegToggle,
  buildPromptPayPayload, PromptPayQR,
});
