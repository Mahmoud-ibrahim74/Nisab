const { BrowserWindow, screen, ipcMain } = require('electron');
const path = require('node:path');

let overlayWindow = null;
let autoHideTimer = null;
let currentMainWindow = null;

/**
 * Initializes and registers overlay notification manager
 * @param {BrowserWindow} mainWindow - Reference to Nisab main window
 */
function setupOverlayManager(mainWindow) {
  currentMainWindow = mainWindow;

  // IPC: Show overlay notification (only if app is minimized/in background, unless forced)
  ipcMain.handle('overlay:show', (event, data) => {
    if (currentMainWindow && !currentMainWindow.isDestroyed()) {
      const isMinimized = currentMainWindow.isMinimized();
      const isVisible = currentMainWindow.isVisible();
      const isFocused = currentMainWindow.isFocused();

      // If user is actively using the app and it is not minimized, the in-app notification is already showing!
      if (!isMinimized && isVisible && isFocused && !data?.forceOverlay) {
        return false;
      }
    }
    showOverlay(data);
    return true;
  });

  // IPC: Close overlay notification
  ipcMain.handle('overlay:close', () => {
    hideOverlay();
    return true;
  });

  // IPC: Restore and focus main window when notification is clicked
  ipcMain.handle('overlay:restoreMain', () => {
    if (currentMainWindow) {
      if (currentMainWindow.isMinimized()) {
        currentMainWindow.restore();
      }
      currentMainWindow.show();
      currentMainWindow.focus();
    }
    hideOverlay();
    return true;
  });

  // IPC: Query if main window is minimized
  ipcMain.handle('overlay:isMinimized', () => {
    return currentMainWindow ? currentMainWindow.isMinimized() : false;
  });
}

function createOverlayWindow() {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    return overlayWindow;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { workArea } = primaryDisplay;
  const winWidth = 430;
  const winHeight = 150;
  const x = Math.round(workArea.x + workArea.width - winWidth - 24);
  const y = Math.round(workArea.y + workArea.height - winHeight - 24);

  overlayWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: true,
    focusable: true,
    show: false,
    hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  overlayWindow.setAlwaysOnTop(true, 'screen-saver');
  overlayWindow.setVisibleOnAllWorkspaces(true);

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });

  return overlayWindow;
}

function showOverlay(data) {
  if (!data) return;

  const win = createOverlayWindow();

  // Re-calculate position
  const primaryDisplay = screen.getPrimaryDisplay();
  const { workArea } = primaryDisplay;
  const winWidth = 430;
  const winHeight = 150;
  const x = Math.round(workArea.x + workArea.width - winWidth - 24);
  const y = Math.round(workArea.y + workArea.height - winHeight - 24);
  win.setPosition(x, y);

  if (autoHideTimer) {
    clearTimeout(autoHideTimer);
    autoHideTimer = null;
  }

  const duration = data?.duration || 8000;
  const overlayHtml = path.join(__dirname, '..', 'overlay.html');
  const safePath = `file://${overlayHtml.replace(/\\/g, '/')}`;
  const queryString = `?title=${encodeURIComponent(data.title || '')}&message=${encodeURIComponent(data.message || '')}&type=${encodeURIComponent(data.type || 'info')}&duration=${duration}`;

  win.loadURL(`${safePath}${queryString}`).then(() => {
    win.show();
    win.setAlwaysOnTop(true, 'screen-saver');
    win.webContents.send('overlay:update', data);

    if (duration > 0) {
      autoHideTimer = setTimeout(() => {
        hideOverlay();
      }, duration);
    }
  }).catch((err) => {
    console.error('Failed to load overlay URL:', err);
  });
}

function hideOverlay() {
  if (autoHideTimer) {
    clearTimeout(autoHideTimer);
    autoHideTimer = null;
  }
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.hide();
  }
}

module.exports = { setupOverlayManager, showOverlay, hideOverlay };
