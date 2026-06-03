/*!
 * tolltop v3.0.1
 * Tiny edge-aware tooltips with smart positioning. One attribute, one config call.
 * MIT License · https://github.com/panphora/tolltop
 */
(() => {
  'use strict';
  if (window.__tolltop) return;
  window.__tolltop = true;

  const VEDGE = 8;
  const TIP_ID = 'tolltop-tip';

  // Baseline styles, injected only if tolltop.css isn't already on the page.
  // Generated from tolltop.css by build.js; do not edit by hand. Run `npm run build`.
  const CSS = `.tolltop{--tt-bg:#18181b;--tt-color:#e4e4e7;--tt-radius:6px;--tt-font-size:12px;--tt-padding:6px 9px;--tt-arrow:6px;--tt-arrow-x:50%;position:fixed;top:0;left:0;z-index:2147483647;box-sizing:border-box;margin:0;width:max-content;max-width:240px;padding:var(--tt-padding);border-radius:var(--tt-radius);background:var(--tt-bg);color:var(--tt-color);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:var(--tt-font-size);font-weight:500;line-height:1.4;text-align:center;white-space:normal;overflow-wrap:break-word;pointer-events:none;box-shadow:0 2px 12px rgba(0,0,0,0.3);opacity:0;visibility:hidden;}.tolltop[data-show]{opacity:1;visibility:visible;}.tolltop::after{content:"";position:absolute;left:var(--tt-arrow-x);transform:translateX(-50%);width:0;height:0;border:var(--tt-arrow) solid transparent;}.tolltop[data-placement="top"]::after{top:100%;border-bottom-width:0;border-top-color:var(--tt-bg);}.tolltop[data-placement="bottom"]::after{bottom:100%;border-top-width:0;border-bottom-color:var(--tt-bg);}`;

  const cfg = {
    bg: null,
    color: null,
    radius: null,
    fontSize: null,
    padding: null,
    maxWidth: 240,
    placement: 'auto',
    gap: 10,
    edge: 24,
  };

  let tip = null;
  let active = null;
  let activePrevAria = null;

  const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);
  const isNumStr = (v) => /^-?\d*\.?\d+$/.test(String(v).trim());
  const toLen = (v) =>
    v == null || v === '' ? null : typeof v === 'number' ? v + 'px' : isNumStr(v) ? v.trim() + 'px' : v.trim();
  const numOr = (v, fallback) => (isFinite(Number(v)) ? Number(v) : fallback);

  function setVar(name, value) {
    if (value == null || value === '') tip.style.removeProperty(name);
    else tip.style.setProperty(name, value);
  }

  function applyConfig() {
    if (!tip) return;
    setVar('--tt-bg', cfg.bg);
    setVar('--tt-color', cfg.color);
    setVar('--tt-radius', toLen(cfg.radius));
    setVar('--tt-font-size', toLen(cfg.fontSize));
    setVar('--tt-padding', cfg.padding);
  }

  function ensureTip() {
    if (tip) return tip;
    tip = document.createElement('div');
    tip.className = 'tolltop';
    tip.id = TIP_ID;
    tip.setAttribute('role', 'tooltip');
    document.body.appendChild(tip);
    if (getComputedStyle(tip).position !== 'fixed') {
      const style = document.createElement('style');
      style.setAttribute('data-tolltop', '');
      style.textContent = CSS;
      document.head.insertBefore(style, document.head.firstChild);
    }
    applyConfig();
    return tip;
  }

  function position(el) {
    const rect = el.getBoundingClientRect();
    // clientWidth/Height exclude the scrollbar; innerWidth would not.
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const gap = Math.max(0, numOr(cfg.gap, 10));
    const edge = Math.max(0, numOr(cfg.edge, 24));

    const maxW = Math.min(numOr(cfg.maxWidth, 240), vw - edge * 2);
    tip.style.maxWidth = maxW + 'px';

    const t = tip.getBoundingClientRect();

    const pref = cfg.placement;
    const topY = rect.top - t.height - gap;
    const botY = rect.bottom + gap;
    const topFits = topY >= VEDGE;
    const botFits = botY + t.height <= vh - VEDGE;
    let placement;
    if (pref === 'bottom') placement = botFits || !topFits ? 'bottom' : 'top';
    else if (pref === 'top') placement = topFits || !botFits ? 'top' : 'bottom';
    else placement = topFits ? 'top' : 'bottom';
    // When the tip is taller than the viewport, pin to the top edge so its top stays visible.
    const y =
      t.height >= vh - VEDGE * 2 ? VEDGE : clamp(placement === 'top' ? topY : botY, VEDGE, vh - t.height - VEDGE);

    const centerX = rect.left + rect.width / 2;
    const x = clamp(centerX - t.width / 2, edge, vw - t.width - edge);

    const radius = parseFloat(getComputedStyle(tip).borderTopLeftRadius) || 6;
    const arrow = parseFloat(getComputedStyle(tip).getPropertyValue('--tt-arrow')) || 6;
    const arrowX = clamp(centerX - x, radius + arrow, t.width - radius - arrow);

    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
    tip.style.setProperty('--tt-arrow-x', arrowX + 'px');
    tip.setAttribute('data-placement', placement);
    tip.setAttribute('data-show', '');
  }

  function restoreAria() {
    if (!active) return;
    if (activePrevAria == null) active.removeAttribute('aria-describedby');
    else active.setAttribute('aria-describedby', activePrevAria);
    activePrevAria = null;
  }

  function show(el) {
    const text = el.getAttribute('data-tooltip');
    if (!text) return;
    ensureTip();
    if (active !== el) {
      if (active) restoreAria();
      active = el;
      activePrevAria = el.getAttribute('aria-describedby');
      const ids = activePrevAria ? activePrevAria.split(/\s+/) : [];
      if (ids.indexOf(TIP_ID) === -1) ids.push(TIP_ID);
      el.setAttribute('aria-describedby', ids.join(' '));
    }
    tip.textContent = text;
    position(el);
  }

  function hide() {
    if (!active) return;
    restoreAria();
    active = null;
    if (tip) tip.removeAttribute('data-show');
  }

  // True when a scrollable/overflow ancestor fully clips the element out of its box.
  function clippedOut(el) {
    const pos = getComputedStyle(el).position;
    if (pos === 'fixed') return false; // viewport-positioned, not clipped by scroll ancestors
    const r = el.getBoundingClientRect();
    // An absolute element isn't clipped by overflow ancestors below its containing block.
    const cb = pos === 'absolute' ? el.offsetParent : null;
    let node = el.parentElement;
    let clips = !cb;
    while (node && node !== document.documentElement) {
      if (!clips && node === cb) clips = true;
      // Skip non-rendered/zero-box ancestors (e.g. display:contents) that don't actually clip.
      if (clips && (node.clientWidth || node.clientHeight)) {
        const o = getComputedStyle(node);
        if (/auto|scroll|hidden|clip/.test(o.overflow + o.overflowX + o.overflowY)) {
          const c = node.getBoundingClientRect();
          const left = c.left + node.clientLeft; // padding box: where overflow actually clips
          const top = c.top + node.clientTop;
          if (r.bottom <= top || r.top >= top + node.clientHeight || r.right <= left || r.left >= left + node.clientWidth) return true;
        }
      }
      node = node.parentElement;
    }
    return false;
  }

  function reposition() {
    if (!active) return;
    // A fixed tip isn't clipped by an ancestor's overflow, so hide it ourselves when the
    // trigger is removed, scrolled out of the viewport, or clipped out of a scroll container.
    if (!active.isConnected) {
      hide();
      return;
    }
    const r = active.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw || clippedOut(active)) {
      hide();
      return;
    }
    position(active);
  }

  function trigger(node) {
    return node && node.closest ? node.closest('[data-tooltip]') : null;
  }

  document.addEventListener('pointerover', (e) => {
    const el = trigger(e.target);
    if (el && el !== active) show(el);
  });
  document.addEventListener('pointerout', (e) => {
    if (active && (!e.relatedTarget || !active.contains(e.relatedTarget))) hide();
  });
  document.addEventListener('focusin', (e) => {
    const el = trigger(e.target);
    if (el) show(el);
  });
  document.addEventListener('focusout', hide);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hide();
  });
  window.addEventListener('scroll', reposition, true);
  window.addEventListener('resize', reposition);

  window.tolltop = function (opts) {
    if (opts && typeof opts === 'object') {
      for (const k in opts) {
        if (Object.prototype.hasOwnProperty.call(cfg, k)) cfg[k] = opts[k];
      }
      applyConfig();
      if (active) position(active);
    }
    const out = {};
    for (const k in cfg) out[k] = cfg[k];
    return out;
  };
})();
