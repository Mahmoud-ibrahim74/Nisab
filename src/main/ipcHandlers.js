const { app, ipcMain, BrowserWindow, shell } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const { Worker } = require('node:worker_threads');

// Cache in Main process for high-speed repeated reads
const jsonMemoryCache = new Map();

/**
 * Initializes and registers all IPC handlers
 * @param {string} resourcesDir - Absolute path to the /Resources directory
 */
function registerIpcHandlers(resourcesDir) {
  // Initialize dedicated background Worker Thread for heavy searches
  const workerPath = path.join(__dirname, 'workers', 'searchWorker.js');
  let searchWorker = new Worker(workerPath);
  let pendingRequests = new Map();
  let nextRequestId = 1;

  searchWorker.on('message', ({ id, success, results, error }) => {
    const handler = pendingRequests.get(id);
    if (handler) {
      pendingRequests.delete(id);
      if (success) {
        handler.resolve(results);
      } else {
        handler.reject(new Error(error));
      }
    }
  });

  searchWorker.on('error', (err) => {
    console.error('Search Worker Thread error:', err);
    // Restart worker if it crashed
    searchWorker = new Worker(workerPath);
  });

  function dispatchWorkerTask(action, query, options = {}) {
    return new Promise((resolve, reject) => {
      const id = nextRequestId++;
      pendingRequests.set(id, { resolve, reject });
      searchWorker.postMessage({
        id,
        action,
        resourcesDir,
        query,
        options
      });
    });
  }

  // Helper to ensure safe path within resources
  function safeResolveResourcePath(relativePath) {
    const resolved = path.resolve(resourcesDir, relativePath);
    if (!resolved.startsWith(resourcesDir)) {
      throw new Error('Access denied: path traversal detected');
    }
    return resolved;
  }

  // 1. Safe JSON Reader with caching
  ipcMain.handle('resource:readJson', async (event, relativePath) => {
    try {
      if (jsonMemoryCache.has(relativePath)) {
        return jsonMemoryCache.get(relativePath);
      }
      const fullPath = safeResolveResourcePath(relativePath);
      const data = await fs.readFile(fullPath, 'utf8');
      const parsed = JSON.parse(data);
      // Cache files smaller than 10MB in main memory
      if (data.length < 10 * 1024 * 1024) {
        jsonMemoryCache.set(relativePath, parsed);
      }
      return parsed;
    } catch (err) {
      console.error(`Failed to read JSON: ${relativePath}`, err);
      throw err;
    }
  });

  // 2. Offloaded Quran Search
  ipcMain.handle('search:quran', async (event, { query, options }) => {
    return dispatchWorkerTask('searchQuran', query, options);
  });

  // 3. Offloaded Hadith Search
  ipcMain.handle('search:hadith', async (event, { query, options }) => {
    return dispatchWorkerTask('searchHadith', query, options);
  });

  // 4. Tafseer lookup helper (surahNumber & ayahNumber)
  ipcMain.handle('quran:getTafseer', async (event, { surahNumber, ayahNumber }) => {
    const tafseerPath = 'Quran/tafseer.json';
    let tafseerList = jsonMemoryCache.get(tafseerPath);
    if (!tafseerList) {
      const fullPath = safeResolveResourcePath(tafseerPath);
      const data = await fs.readFile(fullPath, 'utf8');
      tafseerList = JSON.parse(data);
      jsonMemoryCache.set(tafseerPath, tafseerList);
    }

    const sNumStr = String(surahNumber);
    const aNumStr = String(ayahNumber);
    const item = tafseerList.find(t => t.number === sNumStr && t.aya === aNumStr);
    return item ? item.text : null;
  });

  // 5. Reciters list
  ipcMain.handle('audio:getReciters', async () => {
    const fullPath = safeResolveResourcePath('reciters.json');
    const data = await fs.readFile(fullPath, 'utf8');
    return JSON.parse(data);
  });

  // 6. Get offline audio path (azan.mp3, reminder.mp3, rattil.mp3)
  ipcMain.handle('audio:getOfflineAudio', async (event, soundName) => {
    const allowed = ['azan.mp3', 'reminder.mp3', 'rattil.mp3'];
    if (!allowed.includes(soundName)) {
      throw new Error('Invalid sound file requested');
    }
    const fullPath = safeResolveResourcePath(soundName);
    return `file://${fullPath.replace(/\\/g, '/')}`;
  });

  // 7. System Print dialog handler
  ipcMain.handle('app:print', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.webContents.print({ silent: false, printBackground: true });
      return true;
    }
    return false;
  });

  // 8. Disk storage for Hadith Highlights (Pen Writer)
  const getHighlightsFilePath = () => path.join(app.getPath('userData'), 'hadith_highlights.json');

  ipcMain.handle('highlights:get', async (event, hadithKey) => {
    try {
      const filePath = getHighlightsFilePath();
      const content = await fs.readFile(filePath, 'utf8');
      const all = JSON.parse(content);
      return hadithKey ? (all[hadithKey] || []) : all;
    } catch (e) {
      return hadithKey ? [] : {};
    }
  });

  ipcMain.handle('highlights:save', async (event, { hadithKey, highlights }) => {
    try {
      const filePath = getHighlightsFilePath();
      let all = {};
      try {
        const content = await fs.readFile(filePath, 'utf8');
        all = JSON.parse(content);
      } catch (e) {
        all = {};
      }
      all[hadithKey] = highlights;
      await fs.writeFile(filePath, JSON.stringify(all, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error('Error saving hadith highlights to disk:', err);
      return false;
    }
  });

  ipcMain.handle('highlights:delete', async (event, hadithKey) => {
    try {
      const filePath = getHighlightsFilePath();
      const content = await fs.readFile(filePath, 'utf8');
      const all = JSON.parse(content);
      delete all[hadithKey];
      await fs.writeFile(filePath, JSON.stringify(all, null, 2), 'utf8');
      return true;
    } catch (e) {
      return false;
    }
  });

  // 9. Windows / System Auto-start on boot (openAtLogin)
  ipcMain.handle('app:getAutoStart', async () => {
    try {
      const loginSettings = app.getLoginItemSettings();
      return Boolean(loginSettings.openAtLogin);
    } catch (err) {
      console.error('Error fetching login item settings:', err);
      return false;
    }
  });

  ipcMain.handle('app:setAutoStart', async (event, enable) => {
    try {
      app.setLoginItemSettings({
        openAtLogin: Boolean(enable),
        openAsHidden: false
      });
      const loginSettings = app.getLoginItemSettings();
      return Boolean(loginSettings.openAtLogin);
    } catch (err) {
      console.error('Error setting login item settings:', err);
      return false;
    }
  });

  // 10. Disk storage for Quran Khatmah Tracker State
  const getKhatmahFilePath = () => path.join(app.getPath('userData'), 'khatmah_data.json');

  ipcMain.handle('khatmah:get', async () => {
    try {
      const filePath = getKhatmahFilePath();
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      return null;
    }
  });

  ipcMain.handle('khatmah:save', async (event, data) => {
    try {
      const filePath = getKhatmahFilePath();
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error('Error saving Khatmah data to disk:', err);
      return false;
    }
  });

  // 11. Open External URL in default system browser
  ipcMain.handle('app:openExternal', async (event, url) => {
    try {
      if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
        await shell.openExternal(url);
        return true;
      }
    } catch (err) {
      console.error('Failed to open external url:', err);
    }
    return false;
  });
}

module.exports = { registerIpcHandlers };
