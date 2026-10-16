// Reproducible offline build. No package download or obfuscation is needed.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'dev.html'), 'utf8');
const block = html.match(/<!-- scripts:begin -->[\s\S]*?<!-- scripts:end -->/);
if (!block) throw new Error('Missing source script markers');
const files = [...block[0].matchAll(/src="(js\/[^\"]+\.js)"/g)].map(m => m[1]);
const bundle = '/* PokéSurvivor Chinese local edition. See LICENSE and CREDITS.md. */\n' + files.map(f => '\n/* ' + f + ' */\n' + fs.readFileSync(path.join(root, f), 'utf8')).join('\n;\n');
const output = '(() => {\n' + bundle.replace('window.G = window.G || {};', 'var G = {};') + '\n})();\n';
new (require('node:vm').Script)(output);
fs.writeFileSync(path.join(root, 'js/app.min.js'), output);
const hash = crypto.createHash('sha1').update(output).digest('hex').slice(0, 10);
html = html.replace(block[0], `<script defer src="js/app.min.js?v=${hash}"></script>`)
  .replace(/<!-- seo:begin -->[\s\S]*?<!-- seo:end -->/g, '')
  .replace(/<!-- dev.html: página fuente[^>]*-->/, '<!-- Generated from dev.html by tools/build-local.js. -->');
fs.writeFileSync(path.join(root, 'index.html'), html);
fs.writeFileSync(path.join(root, 'version.json'), JSON.stringify({ v: hash }) + '\n');
console.log(`中文版构建完成：${files.length} 个模块，${Math.round(Buffer.byteLength(output) / 1024)} KB`);
