// WITNESS NET — docs/rigor/CHEATSHEET.html structural + id + syntax checks
const fs = require("fs");

const file = "docs/rigor/CHEATSHEET.html";
const html = fs.readFileSync(file, "utf8");
const stat = fs.statSync(file);

const pass = [];
const fail = [];
function check(name, cond, detail) { (cond ? pass : fail).push(detail ? name + " :: " + detail : name); }

function tagCount(re) { return (html.match(re) || []).length; }

check("one <html>",   tagCount(/<html\b/gi) === 1 && tagCount(/<\/html>/gi) === 1);
check("one <head>",   tagCount(/<head\b/gi) === 1 && tagCount(/<\/head>/gi) === 1);
check("one <body>",   tagCount(/<body\b/gi) === 1 && tagCount(/<\/body>/gi) === 1);
check("one <script>", tagCount(/<script\b/gi) === 1 && tagCount(/<\/script>/gi) === 1);
check("one <style>",  tagCount(/<style\b/gi) === 1 && tagCount(/<\/style>/gi) === 1);

const m = html.match(/<script>([\s\S]*?)<\/script>/);
check("script extracted", !!m);
const js = m ? m[1] : "";
const jsPath = ".compat_out/cheatsheet_extracted.js";
fs.writeFileSync(jsPath, js, "utf8");

const cp = require("child_process").spawnSync(process.execPath, ["--check", jsPath], { encoding: "utf8" });
check("node --check passes", cp.status === 0, (cp.stderr || cp.stdout || "").trim());

const idRefs = new Set();
const reGetById = /getElementById\(["']([\w-]+)["']\)/g;
let mm;
while ((mm = reGetById.exec(js))) idRefs.add(mm[1]);
const missing = [];
for (const id of idRefs) {
  const re = new RegExp('\\bid=["\']' + id.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&") + '["\']');
  if (!re.test(html)) missing.push(id);
}
check("all getElementById ids exist in HTML", missing.length === 0, missing.length ? "missing: " + missing.join(", ") : "");

check("no fetch() in cheatsheet", !/\bfetch\s*\(/.test(js));
check("no XMLHttpRequest in cheatsheet", !/XMLHttpRequest/.test(js));
check("no remote <link href", !/<link[^>]+href=["']https?:/i.test(html));

const total = pass.length + fail.length;
console.log("PASS " + pass.length + "/" + total);
if (fail.length) {
  console.log("FAIL:");
  fail.forEach((n) => console.log("  - " + n));
  process.exit(1);
}
console.log("FILE_BYTES=" + stat.size);
console.log("FILE_LINES=" + html.split("\n").length);
console.log("JS_BYTES=" + js.length);
