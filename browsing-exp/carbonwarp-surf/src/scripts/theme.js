/* Page background strings, shared by Base.astro (build time) and settings.js (runtime). */
export const backgroundCss = bg =>
  `radial-gradient(ellipse at 72% 15%,#d977571a,transparent 38%),linear-gradient(135deg,${bg.colors.join(',')})`;

export const imageCss = url => `linear-gradient(#0009,#0009),url("${url}")`;
