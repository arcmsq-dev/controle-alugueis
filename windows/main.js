const { app, BrowserWindow, protocol, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }
]);

const WWW = path.join(__dirname, 'www');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.ico': 'image/x-icon', '.svg': 'image/svg+xml' };

if (!app.requestSingleInstanceLock()) { app.quit(); }
let win = null;

function criarJanela() {
  Menu.setApplicationMenu(null);
  win = new BrowserWindow({
    width: 1280, height: 860, minWidth: 380, minHeight: 560,
    title: 'Controle de Aluguéis', backgroundColor: '#EDF0F5',
    icon: path.join(WWW, 'icon-512.png'),
    webPreferences: { contextIsolation: true, sandbox: true, spellcheck: false }
  });
  win.loadURL('app://local/index.html');
  const fora = (url) => { if (/^https?:\/\//i.test(url)) shell.openExternal(url); };
  win.webContents.setWindowOpenHandler(({ url }) => { fora(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('app://')) { e.preventDefault(); fora(url); } });
  win.on('closed', () => { win = null; });
}

app.whenReady().then(() => {
  protocol.handle('app', (req) => {
    let p = decodeURIComponent(new URL(req.url).pathname);
    if (p === '/' || p === '') p = '/index.html';
    const f = path.normalize(path.join(WWW, p));
    if (!f.startsWith(WWW)) return new Response('proibido', { status: 403 });
    try {
      const body = fs.readFileSync(f);
      return new Response(body, { headers: { 'content-type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' } });
    } catch (e) {
      return new Response('não encontrado', { status: 404 });
    }
  });
  criarJanela();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) criarJanela(); });
});
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.on('window-all-closed', () => { app.quit(); });
