const { contextBridge, ipcRenderer } = require('electron');

// Securely expose Nisab API to the React Renderer process
contextBridge.exposeInMainWorld('nisabAPI', {
  /**
   * Safely loads JSON data from the local /Resources directory
   * @param {string} relativePath - Path relative to Resources (e.g. 'Quran/sura.json')
   */
  readJson: (relativePath) => ipcRenderer.invoke('resource:readJson', relativePath),

  /**
   * Searches the Holy Quran using worker threads and diacritic normalization
   */
  searchQuran: (query, options = {}) => ipcRenderer.invoke('search:quran', { query, options }),

  /**
   * Searches massive Hadith collections on a background worker thread
   */
  searchHadith: (query, options = {}) => ipcRenderer.invoke('search:hadith', { query, options }),

  /**
   * Retrieves Tafseer text for a specific Ayah
   */
  getTafseer: (surahNumber, ayahNumber) => ipcRenderer.invoke('quran:getTafseer', { surahNumber, ayahNumber }),

  /**
   * Loads reciters list
   */
  getReciters: () => ipcRenderer.invoke('audio:getReciters'),

  /**
   * Resolves safe local URI for offline audio (azan.mp3, reminder.mp3)
   */
  getOfflineAudio: (soundName) => ipcRenderer.invoke('audio:getOfflineAudio', soundName),

  /**
   * Triggers system print dialogue
   */
  print: () => ipcRenderer.invoke('app:print'),

  /**
   * Native Windows Notifications (displayed outside the app window)
   */
  showNativeNotification: (data) => ipcRenderer.invoke('notification:showNative', data),
  restoreMainWindow: () => ipcRenderer.invoke('app:restoreMain'),

  /**
   * Hadith Pen Writer Highlights Disk Persistence
   */
  getHadithHighlights: (hadithKey) => ipcRenderer.invoke('highlights:get', hadithKey),
  saveHadithHighlights: (hadithKey, highlights) => ipcRenderer.invoke('highlights:save', { hadithKey, highlights }),
  deleteHadithHighlights: (hadithKey) => ipcRenderer.invoke('highlights:delete', hadithKey),

  /**
   * Application Startup / Boot configuration
   */
  getAutoStart: () => ipcRenderer.invoke('app:getAutoStart'),
  setAutoStart: (enable) => ipcRenderer.invoke('app:setAutoStart', enable),
});

