/**
 * Preload Script - Al-Qaswaa POS
 * Safely exposes Electron APIs to the renderer process
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose safe Electron APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
    // Window controls
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

    // File dialogs for backup/restore
    showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
    showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),

    // Platform and Security
    platform: process.platform,
    isElectron: true,
    getMachineId: () => ipcRenderer.invoke('get-machine-id'),
});
