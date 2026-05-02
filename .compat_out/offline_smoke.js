const fs = require('fs');
const path = require('path');
const file = 'tools/svg42/svg42_compiler_builder.html';
const html = fs.readFileSync(file, 'utf8');
const stat = fs.statSync(file);

const fail = [];
const ok = [];

function check(name, cond) { (cond ? ok : fail).push(name); }

// 1. No external network references in static markup (head + body, excluding the runtime exporter strings)
const headBlock = (html.match(/<head[\s\S]*?<\/head>/) || [''])[0];
const bodyBlock = (html.match(/<body[\s\S]*?<\/body>/) || [''])[0];

const externalHttp = (headBlock + bodyBlock.split('<script')[0]).match(/https?:\/\/[a-z0-9.-]+/gi) || [];
const onlyXmlNs = externalHttp.every((u) => /^https?:\/\/(www\.w3\.org|www\.opengis|tools\.ietf\.org)/i.test(u));
check('no external HTTP links in head/markup (XML namespaces allowed)', onlyXmlNs);

// 2. No googleapis / gstatic anywhere in head
check('no googleapis link in <head>', !/googleapis|gstatic/i.test(headBlock));

// 3. Inline favicon (data URI)
check('inline favicon present', /<link\s+rel="icon"[^>]*href="data:/i.test(headBlock));
check('apple-touch-icon present', /apple-touch-icon[\s\S]*data:image\/svg\+xml/i.test(headBlock));

// 4. Inline manifest (data URI)
check('inline web manifest present', /<link\s+rel="manifest"\s+href=['"]data:application\/manifest\+json/i.test(headBlock));

// 5. Theme-color meta
check('theme-color meta present', /<meta\s+name="theme-color"[^>]*content="#0a061a"/i.test(headBlock));

// 6. Color-scheme meta
check('color-scheme meta present', /<meta\s+name="color-scheme"/i.test(headBlock));

// 7. Referrer no-referrer (privacy posture)
check('referrer no-referrer meta present', /name="referrer"[^>]*no-referrer/i.test(headBlock));

// 8. Orbitron stack expanded with offline fallbacks
check('font stack uses Bahnschrift fallback', /Bahnschrift/.test(html));
check('font stack uses Impact fallback', /"Impact"/.test(html));
check('font stack uses Arial Narrow fallback', /Arial Narrow/.test(html));

// 9. ps-net indicator wiring
check('pageStrapNet element present', /id="pageStrapNet"/.test(html));
check('ps-net dot CSS present', /\.ps-net-dot/.test(html));
check('initNetIndicator function defined', /function initNetIndicator/.test(html));
check('navigator.onLine consulted', /navigator\.onLine/.test(html));
check('window online listener registered', /addEventListener\("online"/.test(html));
check('window offline listener registered', /addEventListener\("offline"/.test(html));

// 10. Audit function and self-test extension
check('auditExternalRefs defined', /function auditExternalRefs/.test(html));
check('selftest checks zeroExternalRefs', /zeroExternalRefs/.test(html));
check('selftest checks webManifest', /\["webManifest"/.test(html));
check('selftest checks faviconInline', /\["faviconInline"/.test(html));
check('selftest checks themeColorMeta', /\["themeColorMeta"/.test(html));
check('selftest checks netIndicatorBound', /\["netIndicatorBound"/.test(html));

// 11. data-offline-ready attribute is set
check('body data-offline-ready attribute set', /setAttribute\("data-offline-ready"/.test(html));

// 12. Console reports offline-ready on success
check('console reports offline-ready', /offline-ready/.test(html));

// 13. Runtime exporter still self-contained (no external font in emitted output)
const runtimeBlock = (html.match(/function emitRuntimeHtml\([\s\S]*?return `[\s\S]*?<\/html>`/) || [''])[0];
check('runtime export has no external font links', !/googleapis|gstatic|fonts\./i.test(runtimeBlock));

// 14. Frame export still self-contained
const frameBlock = (html.match(/function exportFrameSequenceHtml\([\s\S]*?download_/) || [''])[0];
check('frame export has no external font links', !/googleapis|gstatic|fonts\./i.test(frameBlock));

// 15. The audit function correctly classifies XML namespace URIs as non-external
check('audit isExternal logic recognizes data: schemes', /lower\.startsWith\("data:"\)/.test(html));
check('audit checks link script img iframe', /link\[href\][\s\S]*script\[src\][\s\S]*img\[src\][\s\S]*iframe\[src\]/.test(html));

const total = ok.length + fail.length;
console.log('PASS ' + ok.length + '/' + total);
if (fail.length) {
  console.log('FAIL:');
  fail.forEach((n) => console.log('  - ' + n));
  process.exit(1);
}
console.log('FILE_BYTES=' + stat.size);
console.log('FILE_LINES=' + html.split('\n').length);
