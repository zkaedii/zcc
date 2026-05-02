const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#5eead4"/><stop offset="50%" stop-color="#22d3ee"/><stop offset="100%" stop-color="#f472b6"/></linearGradient></defs><rect width="64" height="64" rx="12" fill="#0a061a"/><rect x="3" y="3" width="58" height="58" rx="10" fill="none" stroke="url(#g)" stroke-width="1.4" opacity="0.55"/><text x="32" y="44" text-anchor="middle" fill="url(#g)" font-family="Impact,Arial Black,sans-serif" font-weight="900" font-size="30">42</text></svg>';
const manifest = JSON.stringify({
  name: 'SVG42 Compiler Builder',
  short_name: 'SVG42',
  description: 'Numeric scene compiler & generator with a minty neon synthwave aesthetic.',
  start_url: '.',
  scope: '.',
  display: 'standalone',
  background_color: '#0a061a',
  theme_color: '#5eead4',
  orientation: 'any',
  icons: [{ src: 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64'), sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
});
console.log('SVG_B64=' + Buffer.from(svg).toString('base64'));
console.log('MANIFEST_B64=' + Buffer.from(manifest).toString('base64'));
console.log('SVG_LEN=' + svg.length);
console.log('MANIFEST_LEN=' + manifest.length);
