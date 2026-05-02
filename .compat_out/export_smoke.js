// Smoke test for SVG42 "save a copy of the page" feature.
//
// IMPORTANT: This is *not* compiler-grade self-hosting. There is no fixpoint
// (zcc1 -> zcc2 -> zcc3 byte-identical chain) here; the page just snapshots
// its own outerHTML into a Blob and offers it as a download, with optional
// state baked into a <script type="application/json" id="svg42-bootstate">
// tag for boot-time hydration.
const fs = require('fs');
const file = 'tools/svg42/svg42_compiler_builder.html';
const html = fs.readFileSync(file, 'utf8');
const stat = fs.statSync(file);

const pass = [];
const fail = [];
function check(name, cond) { (cond ? pass : fail).push(name); }

// Toolbar wiring (renamed from "Save self" → "Save copy")
check('toolbar Save copy button present', /id="btnSaveCopy"/.test(html));
check('ui.btnSaveCopy handle wired', /btnSaveCopy: document\.getElementById/.test(html));
check('btnSaveCopy click handler bound', /btnSaveCopy\.addEventListener\("click"/.test(html));
check('toolbar button label is "Save copy"', />Save copy</.test(html));
check('toolbar button title disclaims marketing self-host', /standalone copy of this app/.test(html));

// No leftover compiler-self-hosting marketing copy
check('no toolbar btnSelfHost remnants', !/btnSelfHost/.test(html));
check('no "Save self" label remnants', !/>Save self</.test(html));

// Module functions (renamed)
check('exportStandaloneCopy defined', /function exportStandaloneCopy\(opts\)/.test(html));
check('tryApplyEmbeddedBootstate defined', /function tryApplyEmbeddedBootstate\(\)/.test(html));
check('getRuntimeInfo defined', /function getRuntimeInfo\(\)/.test(html));
check('buildRuntimeReport defined', /function buildRuntimeReport\(\)/.test(html));
check('buildIframeSnippet defined', /function buildIframeSnippet/.test(html));
check('copyIframeSnippet defined', /function copyIframeSnippet/.test(html));
check('_safeScriptJson defined', /function _safeScriptJson/.test(html));
check('_stripBootstateNodes defined', /function _stripBootstateNodes/.test(html));
check('_copyToClipboard defined', /function _copyToClipboard/.test(html));
check('LOCAL_SERVE_CMDS array defined', /const LOCAL_SERVE_CMDS = \[/.test(html));
check('registerExportAndServeActions defined', /function registerExportAndServeActions/.test(html));

// No old names linger
check('no exportSelfClone remnants', !/exportSelfClone/.test(html));
check('no getSelfHostInfo remnants', !/getSelfHostInfo/.test(html));
check('no buildSelfHostReport remnants', !/buildSelfHostReport/.test(html));
check('no SELF_HOST_CMDS remnants', !/SELF_HOST_CMDS/.test(html));
check('no registerSelfHostActions remnants', !/registerSelfHostActions/.test(html));
check('no _bootedFromClone remnants', !/_bootedFromClone\b/.test(html));

// PWA install hooks
check('beforeinstallprompt listener', /addEventListener\("beforeinstallprompt"/.test(html));
check('appinstalled listener', /addEventListener\("appinstalled"/.test(html));
check('_deferredInstallPrompt variable', /let _deferredInstallPrompt = null/.test(html));

// Renamed actions registered
check('action export.with-state registered', /id: "export\.with-state"/.test(html));
check('action export.blank registered', /id: "export\.blank"/.test(html));
check('action app.runtime-info registered', /id: "app\.runtime-info"/.test(html));
check('action app.install-pwa registered', /id: "app\.install-pwa"/.test(html));
check('action app.copy-embed-snippet registered', /id: "app\.copy-embed-snippet"/.test(html));
check('action app.copy-url registered', /id: "app\.copy-url"/.test(html));

// No old action ids linger
check('no self.export-clone action remnant', !/id: "self\.export-clone"/.test(html));
check('no self.export-blank action remnant', !/id: "self\.export-blank"/.test(html));
check('no self.report action remnant', !/id: "self\.report"/.test(html));
check('no self.install action remnant', !/id: "self\.install"/.test(html));
check('no self.embed action remnant', !/id: "self\.embed"/.test(html));
check('no self.copy-url action remnant', !/id: "self\.copy-url"/.test(html));
check('no self.serve.* prefix in code', !/id: "self\.serve\./.test(html));

// New action group names in use
check("'export' group is referenced", /group: "export"/.test(html));
check("'app' group is referenced", /group: "app"/.test(html));
check("'serve' group is referenced", /group: "serve"/.test(html));

// 'self-host' group label is gone (except in the naming-distinction comment)
const selfHostGroupHits = (html.match(/group: "self-host"/g) || []).length;
check("no group: 'self-host' string anywhere", selfHostGroupHits === 0);

// Server one-liners present (these are the actual one-liner ids; they live inside LOCAL_SERVE_CMDS)
['python','node','php','ruby','busybox','caddy','deno'].forEach((id) => {
  check('local-serve one-liner: ' + id, new RegExp('id: "' + id + '"').test(html));
});

// Server commands look right
check('python3 -m http.server in cmds', /python3 -m http\.server 8042/.test(html));
check('npx serve in cmds', /npx --yes serve -l 8042/.test(html));
check('php -S in cmds', /php -S 0\.0\.0\.0:8042/.test(html));
check('caddy file-server in cmds', /caddy file-server --listen :8042/.test(html));

// Bootstate hydration in boot sequence
check('boot calls tryApplyEmbeddedBootstate', /tryApplyEmbeddedBootstate\(\)/.test(html));
check('boot priority comment present', /Boot priority: embedded bootstate/.test(html));
check('_bootedFromBootstate variable', /const _bootedFromBootstate = tryApplyEmbeddedBootstate\(\)/.test(html));

// Safe script JSON escaping
check('_safeScriptJson escapes </script', /reCloseTag.*\\\\\/script/.test(html));
check('_safeScriptJson escapes html comment open', /reHtmlOpenComment/.test(html));
check('_safeScriptJson escapes html comment close', /reHtmlCloseComment/.test(html));
check('_safeScriptJson escapes U+2028', /\\u2028/.test(html));

// Examples palette prefill (stayed the same)
check('Examples btn opens palette with example prefill', /openCommandPalette\("example "\)/.test(html));

// Self-test extended (renamed keys)
check('selftest covers exportFn', /\["exportFn",/.test(html));
check('selftest covers bootstateFn', /\["bootstateFn",/.test(html));
check('selftest covers runtimeInfoFn', /\["runtimeInfoFn",/.test(html));
check('selftest covers serveCmds', /\["serveCmds",/.test(html));
check('selftest covers exportActions', /\["exportActions",/.test(html));

// No old self-test keys linger
check('no selfExportFn key remnant', !/\["selfExportFn",/.test(html));
check('no selfHostInfoFn key remnant', !/\["selfHostInfoFn",/.test(html));
check('no selfHostCmds key remnant', !/\["selfHostCmds",/.test(html));
check('no selfHostActions key remnant', !/\["selfHostActions",/.test(html));
check('no selfBootstateFn key remnant', !/\["selfBootstateFn",/.test(html));

// Iframe snippet has reasonable defaults
check('iframe snippet sandbox attributes', /allow-scripts allow-same-origin allow-downloads/.test(html));
check('iframe snippet referrerpolicy no-referrer', /referrerpolicy="no-referrer"/.test(html));

// Standalone-copy export download attribute pattern (renamed from svg42_clone_)
check('download stamp uses svg42_app_ prefix', /svg42_app_/.test(html));
check('no svg42_clone_ remnant', !/svg42_clone_/.test(html));
check('export uses Blob with text/html', /new Blob\(\[doc\], \{ type: "text\/html;charset=utf-8" \}\)/.test(html));
check('export revokes object URL', /URL\.revokeObjectURL\(url\)/.test(html));

// The naming-distinction comment is preserved (this is intentional)
check('naming-distinction note still present', /This is \*not\* "self-hosting" in the compiler sense/.test(html));
check('naming-distinction explains fixpoint requirement', /byte-identical/.test(html));

// No new external network refs introduced
const head = (html.match(/<head[\s\S]*?<\/head>/) || [''])[0];
check('still no googleapis/gstatic in head', !/googleapis|gstatic|fonts\.google/i.test(head));

const total = pass.length + fail.length;
console.log('PASS ' + pass.length + '/' + total);
if (fail.length) {
  console.log('FAIL:'); fail.forEach(n => console.log('  - ' + n));
  process.exit(1);
}
console.log('FILE_BYTES=' + stat.size);
console.log('FILE_LINES=' + html.split('\n').length);
