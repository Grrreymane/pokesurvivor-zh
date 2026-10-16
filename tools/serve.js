// Dependency-free local server, bound to this computer only.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.ico': 'image/x-icon', '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
Object.assign(mime, { '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' });
const server = http.createServer((req, res) => {
  let target;
  try { target = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname)); }
  catch { res.writeHead(400).end(); return; }
  const relative = path.relative(root, target);
  if (relative.startsWith('..') || path.isAbsolute(relative) || relative.split(path.sep).some(p => p.startsWith('.'))) { res.writeHead(403).end(); return; }
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
  fs.stat(target, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    if (req.method === 'HEAD') res.end(); else fs.createReadStream(target).pipe(res);
  });
});
const port = Number(process.env.PORT || 4173);
server.on('error', e => { console.error(e.code === 'EADDRINUSE' ? `端口 ${port} 已占用，请打开 http://127.0.0.1:${port}/ 或设置 PORT 后重试。` : e.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${port}/`;
  console.log(`宝可梦幸存者中文版：${url}`);
  if (process.argv.includes('--open') && process.platform === 'win32') {
    const child = require('node:child_process').spawn('explorer.exe', [url], { windowsHide: true, stdio: 'ignore' });
    child.on('error', () => console.log('请在浏览器中打开上述地址。'));
  }
});
