const { app, BrowserWindow, Menu, MenuItem } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
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

  const distHtml = path.join(__dirname, '..', 'dist', 'index.html');
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
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

app.whenReady().then(() => {
  // Remove globally on application level
  Menu.setApplicationMenu(null);

  // Register IPC handlers before creating window
  registerIpcHandlers(resourcesDir);

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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
