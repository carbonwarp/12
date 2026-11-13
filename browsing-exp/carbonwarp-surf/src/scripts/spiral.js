import { $ } from './helpers.js';

/* Two arms that draw inward, then curl away. */
function spiralPath({ turns = 2.6, outer = 46, inner = 3, steps = 150 } = {}) {
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const k = i / steps, a = k * turns * 2 * Math.PI, r = outer - (outer - inner) * k;
    d += `${i ? 'L' : 'M'}${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)} `;
  }
  return d.trim();
}

const ARM = 'animate-curl fill-none stroke-3 [stroke-dasharray:1_1] [stroke-linecap:round] motion-reduce:animate-none motion-reduce:[stroke-dashoffset:0]';

export function renderSpiral() {
  const d = spiralPath();
  $('spiral').innerHTML = `
    <svg viewBox="0 0 100 100" focusable="false">
      <defs>
        <linearGradient id="sgA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0b79f"/><stop offset="1" stop-color="#d97757"/></linearGradient>
        <linearGradient id="sgB" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eeeae2"/><stop offset="1" stop-color="#9a958b"/></linearGradient>
      </defs>
      <g class="origin-[50px_50px] animate-spin-slow motion-reduce:animate-none">
        <path class="${ARM}" pathLength="1" d="${d}" stroke="url(#sgA)"/>
        <path class="${ARM}" style="animation-delay:-1.9s" pathLength="1" d="${d}" stroke="url(#sgB)" transform="rotate(180 50 50)"/>
      </g>
      <circle class="origin-[50px_50px] animate-pulse-core fill-accent-soft motion-reduce:animate-none" cx="50" cy="50" r="2.2"/>
    </svg>`;
}
