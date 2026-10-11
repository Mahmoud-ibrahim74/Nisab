const { Notification, ipcMain } = require('electron');

let currentMainWindow = null;
let currentAppIconPath = null;

/**
 * Initializes and registers native Windows notification IPC handler
 * @param {BrowserWindow} mainWindow - Reference to Nisab main window
 * @param {string} appIconPath - Absolute path to app icon (.ico or .png)
 */
function setupNativeNotifier(mainWindow, appIconPath) {
  currentMainWindow = mainWindow;
  currentAppIconPath = appIconPath;

  // IPC: Show native Windows notification outside application
  ipcMain.handle('notification:showNative', (event, data = {}) => {
    try {
      if (!Notification.isSupported()) {
        console.warn('Native notifications are not supported on this platform');
        return false;
      }

      const { title, message, silent = false } = data;

      const notification = new Notification({
        title: title || 'Nisab | نِصاب',
        body: message || '',
        icon: currentAppIconPath,
        silent: Boolean(silent)
      });

      // When user clicks the Windows toast notification, bring the app to front
      notification.on('click', () => {
        if (currentMainWindow && !currentMainWindow.isDestroyed()) {
          if (currentMainWindow.isMinimized()) {
            currentMainWindow.restore();
          }
          currentMainWindow.show();
          currentMainWindow.focus();
        }
      });

      notification.show();
      return true;
    } catch (err) {
      console.error('Error displaying native Windows notification:', err);
      return false;
    }
  });

  // IPC: Restore & focus main window
  ipcMain.handle('app:restoreMain', () => {
    if (currentMainWindow && !currentMainWindow.isDestroyed()) {
      if (currentMainWindow.isMinimized()) {
        currentMainWindow.restore();
      }
      currentMainWindow.show();
      currentMainWindow.focus();
      return true;
    }
    return false;
  });
}

module.exports = { setupNativeNotifier };
