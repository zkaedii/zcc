const fs = require('fs');
const html = fs.readFileSync('tools/svg42/svg42_compiler_builder.html', 'utf8');
const re = /<script[^>]*>([\s\S]*?)<\/script>/g;
let combined = '';
let m;
let count = 0;
while ((m = re.exec(html)) !== null) {
  combined += m[1] + '\n;\n';
  count++;
}
fs.writeFileSync('.compat_out/svg42_combined.js', combined);
console.log('blocks=' + count, 'jsBytes=' + combined.length);
