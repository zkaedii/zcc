const fs = require('fs');
const file = 'tools/svg42/svg42_compiler_builder.html';
const html = fs.readFileSync(file, 'utf8');
const stat = fs.statSync(file);

const pass = [];
const fail = [];
function check(name, cond) { (cond ? pass : fail).push(name); }

// Toolbar buttons
check('toolbar Ctrl/Cmd+K button present', /id="btnCommandPalette"/.test(html));
check('toolbar Examples button present', /id="btnExamples"/.test(html));

// Palette modal markup
check('palette overlay element exists', /id="commandPaletteOverlay"/.test(html));
check('palette dialog element exists', /id="commandPalette"[^>]*role="dialog"/.test(html));
check('palette input exists', /id="paletteInput"/.test(html));
check('palette results listbox exists', /id="paletteResults"[^>]*role="listbox"/.test(html));
check('palette result counter exists', /id="paletteCount"/.test(html));
check('palette has aria-modal', /aria-modal="true"/.test(html));

// CSS
check('CSS for .palette-overlay present', /\.palette-overlay\s*\{/.test(html));
check('CSS for .palette-results present', /\.palette-results\s*\{/.test(html));
check('CSS for .palette-item active state present', /\.palette-results .palette-item\.active/.test(html));
check('CSS keyframe paletteIn defined', /@keyframes paletteIn/.test(html));

// JS module
check('EXAMPLE_SCENES array defined', /const EXAMPLE_SCENES = \[/.test(html));
check('ACTION_REGISTRY array defined', /const ACTION_REGISTRY = \[\]/.test(html));
check('registerAction function defined', /function registerAction/.test(html));
check('buildActionRegistry function defined', /function buildActionRegistry/.test(html));
check('applyExampleScene function defined', /function applyExampleScene/.test(html));
check('fuzzyScore function defined', /function fuzzyScore/.test(html));
check('highlightMatch function defined', /function highlightMatch/.test(html));
check('openCommandPalette function defined', /function openCommandPalette/.test(html));
check('closeCommandPalette function defined', /function closeCommandPalette/.test(html));
check('handlePaletteKey function defined', /function handlePaletteKey/.test(html));
check('renderPaletteResults function defined', /function renderPaletteResults/.test(html));
check('refreshPaletteResults function defined', /function refreshPaletteResults/.test(html));
check('runAction function defined', /function runAction/.test(html));
check('palette-init withErr block exists', /withErr\("palette-init"/.test(html));

// Hotkey
check('Ctrl/Cmd+K hotkey wired', /\(ev\.metaKey \|\| ev\.ctrlKey\) && \(k === "k" \|\| k === "K"\)/.test(html));
check('hotkey uses capture phase', /addEventListener\("keydown",[\s\S]*?}, true\);/.test(html));

// Action registry contents
check('registers page actions', /id: "page:" \+ p/.test(html));
check('registers theme actions', /"Switch theme: synthwave/.test(html));
check('registers compile action', /id: "compile",/.test(html));
check('registers compile.regen-matrix', /"compile.regen-matrix"/.test(html));
check('registers stage.reset-view', /"stage.reset-view"/.test(html));
check('registers stage.png', /"stage.png"/.test(html));
check('registers snapshot.save', /"snapshot.save"/.test(html));
check('registers help.palette', /"help.palette"/.test(html));
check('registers help.offline', /"help.offline"/.test(html));
check('registers per-example actions', /id: "example:" \+ ex\.id/.test(html));

// Recents persistence
check('recent commands LS key', /LS_PALETTE_RECENT/.test(html));
check('pushPaletteRecent function', /function pushPaletteRecent/.test(html));
check('getPaletteRecents function', /function getPaletteRecents/.test(html));

// Examples count >= 8
const exMatches = (html.match(/^\s+id: "(default-swarm|mandala-bloom|glitch-grid|nebula-drift|constellation-map|crystal-lattice|rainfall|ember-ash)"/gm) || []).length;
check('at least 8 example scenes registered', exMatches >= 8);

// Examples reference real macros
['macro neon-drift','macro pixel-grid','macro vapor','macro constellation','macro ice-shard','macro crystalize','macro rainfall','macro ember'].forEach((m) => {
  check('example uses ' + m, html.indexOf(m) !== -1);
});

// Self-test extension
check('selftest covers commandPalette', /\["commandPalette",/.test(html));
check('selftest covers actionRegistry', /\["actionRegistry",/.test(html));
check('selftest covers examplesGallery', /\["examplesGallery",/.test(html));
check('selftest covers fuzzyScoreFn', /\["fuzzyScoreFn",/.test(html));

// ui object contains new handles
check('ui.btnCommandPalette wired', /btnCommandPalette: document\.getElementById/.test(html));
check('ui.paletteInput wired', /paletteInput: document\.getElementById/.test(html));
check('ui.paletteResults wired', /paletteResults: document\.getElementById/.test(html));
check('ui.commandPaletteOverlay wired', /commandPaletteOverlay: document\.getElementById/.test(html));

// Existing offline-readiness still intact
check('still no external HTTP in head', !/googleapis|gstatic|fonts\.google/i.test((html.match(/<head[\s\S]*?<\/head>/) || [''])[0]));
check('still has inline favicon', /<link\s+rel="icon"[^>]*href="data:/i.test(html));
check('still has inline manifest', /<link\s+rel="manifest"\s+href=['"]data:application\/manifest\+json/i.test(html));

// File size
const total = pass.length + fail.length;
console.log('PASS ' + pass.length + '/' + total);
if (fail.length) {
  console.log('FAIL:'); fail.forEach(n => console.log('  - ' + n));
  process.exit(1);
}
console.log('FILE_BYTES=' + stat.size);
console.log('FILE_LINES=' + html.split('\n').length);
