const { app, BrowserWindow, Menu, MenuItem, nativeTheme, nativeImage, session } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { registerIpcHandlers } = require('./main/ipcHandlers');
const { setupNativeNotifier } = require('./main/nativeNotifier');

// Enforce consistent Dark Theme across all Windows versions (Win 10 & Win 11)
nativeTheme.themeSource = 'dark';

// Set application name and Application User Model ID for Windows Taskbar, Notifications, and Task Manager
const APP_ID = 'Nisab';
app.name = 'Nisab';
if (process.platform === 'win32') {
  app.setAppUserModelId(APP_ID);
}

// Allow YouTube videos to autoplay seamlessly without requiring click gestures
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const resourcesDir = path.join(__dirname, 'Resources');

// Resolve high-resolution Windows .ico or fallback .png
const iconIco = path.join(__dirname, 'assets', 'icon.ico');
const iconPng = path.join(__dirname, 'assets', 'icon.png');
const appIconPath = (process.platform === 'win32' && fs.existsSync(iconIco)) ? iconIco : iconPng;
const appIcon = nativeImage.createFromPath(appIconPath);

let localServer = null;
let appPort = null;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

// Micro local HTTP server serving built dist files over 127.0.0.1
// This provides a first-class HTTP web origin so YouTube iframes load without Error 152/153
function startLocalDistServer(distDir) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      try {
        const parsedUrl = new URL(req.url, 'http://127.0.0.1');
        let relativePath = decodeURIComponent(parsedUrl.pathname);
        if (relativePath === '/' || relativePath === '') {
          relativePath = '/index.html';
        }

        let fullPath = path.normalize(path.join(distDir, relativePath));
        if (!fullPath.startsWith(distDir)) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }

        if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
          fullPath = path.join(distDir, 'index.html');
        }

        const ext = path.extname(fullPath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        const content = fs.readFileSync(fullPath);

        res.writeHead(200, {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*'
        });
        res.end(content);
      } catch (err) {
        res.writeHead(500);
        res.end('Server Error');
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({ server, port });
    });
  });
}

const createWindow = () => {
  // Create the browser window with modern dimensions & dark emerald background
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 720,
    minHeight: 520,
    backgroundColor: '#031713',
    title: 'Nisab | نِصاب',
    icon: appIcon.isEmpty() ? appIconPath : appIcon,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Worker threads communication
      backgroundThrottling: false // Keep prayer intervals and audio playback running smoothly in background
    },
  });

  // Explicitly apply window and taskbar icon on Windows
  if (mainWindow.setIcon && !appIcon.isEmpty()) {
    mainWindow.setIcon(appIcon);
  }

  // Setup native Windows notification manager
  setupNativeNotifier(mainWindow, appIconPath);

  // Completely remove the default menu bar (File, Edit, View, Window)
  mainWindow.setMenu(null);
  Menu.setApplicationMenu(null);

  const distDir = path.join(__dirname, '..', 'dist');
  const distHtml = path.join(distDir, 'index.html');
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else if (appPort) {
    mainWindow.loadURL(`http://127.0.0.1:${appPort}/index.html`);
  } else if (fs.existsSync(distHtml)) {
    mainWindow.loadFile(distHtml);
  } else {
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
  }

  mainWindow.webContents.on('context-menu', (event, params) => {
    const menu = new Menu();

    if (params.selectionText && params.selectionText.trim().length > 0) {
      menu.append(new MenuItem({
        label: 'نسخ (Copy)',
        role: 'copy',
        accelerator: 'CmdOrCtrl+C'
      }));
      menu.append(new MenuItem({ type: 'separator' }));
      menu.append(new MenuItem({
        label: 'تحديد الكل (Select All)',
        role: 'selectAll',
        accelerator: 'CmdOrCtrl+A'
      }));
      menu.popup({ window: mainWindow });
    } else if (params.isEditable) {
      menu.append(new MenuItem({ label: 'قص (Cut)', role: 'cut' }));
      menu.append(new MenuItem({ label: 'نسخ (Copy)', role: 'copy' }));
      menu.append(new MenuItem({ label: 'لصق (Paste)', role: 'paste' }));
      menu.append(new MenuItem({ type: 'separator' }));
      menu.append(new MenuItem({ label: 'تحديد الكل (Select All)', role: 'selectAll' }));
      menu.popup({ window: mainWindow });
    }
  });

  // mainWindow.webContents.openDevTools();
};

app.whenReady().then(async () => {
  // Remove globally on application level
  Menu.setApplicationMenu(null);

  // Start local HTTP server for dist if available
  const distDir = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(path.join(distDir, 'index.html'))) {
    try {
      const started = await startLocalDistServer(distDir);
      localServer = started.server;
      appPort = started.port;
    } catch (err) {
      console.warn('Could not start local HTTP server, falling back to loadFile:', err);
    }
  }

  // Register IPC handlers before creating window
  registerIpcHandlers(resourcesDir);

  // Fix YouTube Embed Errors (153 & 152-4) in Electron:
  // 1. YouTube requires a valid Referer header (fixes 153)
  // 2. YouTube blocks embeds if User-Agent contains "Electron" (fixes 152-4)
  // 3. Do not force Origin header on media chunks (*.googlevideo.com) as it triggers CORS rejection
  session.defaultSession.webRequest.onBeforeSendHeaders(
    {
      urls: [
        '*://*.youtube.com/*',
        '*://*.youtube-nocookie.com/*',
        '*://*.googlevideo.com/*'
      ]
    },
    (details, callback) => {
      if (!details.requestHeaders['Referer'] || details.requestHeaders['Referer'].startsWith('file:')) {
        details.requestHeaders['Referer'] = appPort ? `http://127.0.0.1:${appPort}/` : 'http://localhost/';
      }

      if (details.requestHeaders['User-Agent']) {
        details.requestHeaders['User-Agent'] = details.requestHeaders['User-Agent']
          .replace(/Electron\/[^\s]+\s?/g, '')
          .replace(/Nisab\/[^\s]+\s?/g, '');
      }

      callback({ cancel: false, requestHeaders: details.requestHeaders });
    }
  );

  // On Windows, register Start Menu shortcut with Nisab AppUserModelID so Windows toast displays "Nisab" instead of "Electron"
  if (process.platform === 'win32') {
    try {
      const { shell } = require('electron');
      const programsDir = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs');
      const shortcutPath = path.join(programsDir, 'Nisab.lnk');
      shell.writeShortcutLink(shortcutPath, 'create', {
        target: process.execPath,
        appUserModelId: APP_ID,
        description: 'Nisab | نِصاب',
        icon: appIconPath,
        iconIndex: 0
      });
    } catch (err) {
      console.warn('Could not register Start Menu shortcut for Windows notifications:', err);
    }
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  if (localServer) {
    try {
      localServer.close();
    } catch (e) {}
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
