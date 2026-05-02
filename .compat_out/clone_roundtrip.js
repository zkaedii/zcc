// clone_roundtrip.js
//
// Simulate the export -> reimport bootstate cycle without a browser.
// Verifies the </script> + <!-- / --> escape contract for the inline JSON
// bootstate, plus field-level fidelity for every key in the bundle.
//
// Reporter contract: emits `N/N checks passed` on success so the suite
// summary can detect "actually ran" rather than reading 0/0 as silently
// skipped (the previous reporter emitted only a single PASS line which
// reduced to 0/0 in the standard tally and created a reporting blind spot
// in a green suite).
'use strict';
const fs = require('fs');
const vm = require('vm');

let pass = 0, fail = 0;
function check(label, cond, detail) {
  if (cond) { pass++; console.log("  ✓  " + label + (detail ? "  (" + detail + ")" : "")); }
  else      { fail++; console.log("  ✗  " + label + (detail ? "  (" + detail + ")" : "")); }
}

const html = fs.readFileSync('tools/svg42/svg42_compiler_builder.html', 'utf8');

// 1. Pull the _safeScriptJson + _stripBootstateNodes definitions out of the
//    main file by evaluating the relevant chunks in a sandboxed scope.
const ctx = { console };
vm.createContext(ctx);

const safeMatch = html.match(/function _safeScriptJson\(obj\)[\s\S]*?\n    \}/);
const stripMatch = html.match(/function _stripBootstateNodes\(html\)[\s\S]*?\n    \}/);
check("located _safeScriptJson in builder source", !!safeMatch);
check("located _stripBootstateNodes in builder source", !!stripMatch);

if (!safeMatch || !stripMatch) {
  console.log("");
  console.log("  " + pass + "/" + (pass + fail) + " checks passed");
  process.exit(1);
}
vm.runInContext(safeMatch[0] + '\n' + stripMatch[0], ctx);

// 2. Round-trip a payload that contains all the dangerous sequences.
const payload = {
  v: 1,
  builderDsl: '1 x -500 500 linear\n2 y -500 500 linear',
  matrixText: '0,1,2,3',
  phase2: '# Phase 2\nset hue 180',
  phase3: '# Phase 3\n</script><!--evil-->macro cinematic',
  seed: 42,
  entityCount: 120,
  profile: 'swarm',
  page: 'lab',
  theme: 'synthwave',
};

const json = ctx._safeScriptJson(payload);
const tag = '<script type="application/json" id="svg42-bootstate">' + json + '<' + '/script>';
const synthDoc = '<!doctype html><html><body><h1>hi</h1>' + tag + '</body></html>';

// 3. Verify </script> sequence is escaped (won't terminate the surrounding tag).
check("</script> sequence is escaped in inline JSON",
  !/<\/script>/i.test(json));
check("escaped <\\/script> form is present in inline JSON",
  json.indexOf('<\\/script>') >= 0);

// 4. Verify <!-- and --> are escaped (HTML comment injection blocked).
const reOpen = new RegExp('<' + '!' + '--');
const reClose = new RegExp('--' + '>');
check("HTML <!-- comment opener is escaped in JSON payload",
  !reOpen.test(json));
check("HTML --> comment closer is escaped in JSON payload",
  !reClose.test(json));

// 5. _stripBootstateNodes removes the bootstate tag from a document.
const stripped = ctx._stripBootstateNodes(synthDoc);
check("_stripBootstateNodes removes the svg42-bootstate tag",
  !/svg42-bootstate/.test(stripped));

// 6. Re-parse the JSON (after un-escaping the </script>) and verify field-level fidelity.
const unescaped = json.replace(/<\\\/script/g, '</script')
                      .replace(/<\\!--/g, '<!--')
                      .replace(/--\\>/g, '-->')
                      .replace(/\\u2028/g, '\u2028')
                      .replace(/\\u2029/g, '\u2029');

let decoded = null;
try {
  decoded = JSON.parse(unescaped);
  check("JSON.parse succeeds on un-escaped bootstate", true);
} catch (e) {
  check("JSON.parse succeeds on un-escaped bootstate", false, e.message);
}

if (decoded) {
  const fields = ['v','builderDsl','matrixText','phase2','phase3','seed','entityCount','profile','page','theme'];
  for (const f of fields) {
    check("roundtrip preserves field: " + f,
      JSON.stringify(decoded[f]) === JSON.stringify(payload[f]),
      `expected=${JSON.stringify(payload[f])} got=${JSON.stringify(decoded[f])}`);
  }
}

// ── report ──
console.log("");
console.log("  " + pass + "/" + (pass + fail) + " checks passed");
if (fail > 0) process.exit(1);
