// Ensure Electron doesn't run in Node mode if environment variable is set
delete process.env.ELECTRON_RUN_AS_NODE;

const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const { execSync } = require('child_process');

function getMachineId() {
    try {
        if (process.platform === 'win32') {
            return execSync('wmic csproduct get uuid').toString().split('\n')[1].trim();
        } else if (process.platform === 'darwin') {
            return execSync("ioreg -rd1 -c IOPlatformExpertDevice | grep -E '(UUID)'").toString().split('"')[3];
        } else {
            return execSync('cat /etc/machine-id').toString().trim();
        }
    } catch (e) {
        return 'UNKNOWN-HWID-' + process.arch;
    }
}

// Security bypass for local files and printing
app.commandLine.appendSwitch('allow-file-access-from-files');
app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('disable-features', 'BlockInsecurePrivateNetworkRequests,IsolateOrigins,site-per-process');
app.commandLine.appendSwitch('disable-web-security');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        frame: false, // Custom frameless window
        backgroundColor: '#f6f9ff',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false, 
            allowRunningInsecureContent: true,
            preload: path.join(__dirname, 'preload.js'),
            partition: 'persist:alqaswaa' // Persist localStorage
        },
        show: false,
        center: true,
        title: "القصواء - نظام المبيعات",
        icon: path.join(__dirname, 'assets', 'icon.png')
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.maximize();
    });

    // Open links in default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    Menu.setApplicationMenu(null);
}

// App lifecycle
app.whenReady().then(() => {
    // Window control handlers
    ipcMain.on('window-minimize', () => { if (mainWindow) mainWindow.minimize(); });
    ipcMain.on('window-maximize', () => {
        if (mainWindow) {
            if (mainWindow.isMaximized()) mainWindow.unmaximize();
            else mainWindow.maximize();
        }
    });
    ipcMain.on('window-close', () => { if (mainWindow) mainWindow.close(); });
    ipcMain.handle('window-is-maximized', () => mainWindow ? mainWindow.isMaximized() : false);

    // Dialog handlers for Backup/Restore
    ipcMain.handle('show-save-dialog', async (event, options) => {
        return await dialog.showSaveDialog(mainWindow, options);
    });
    ipcMain.handle('show-open-dialog', async (event, options) => {
        return await dialog.showOpenDialog(mainWindow, options);
    });

    ipcMain.handle('get-machine-id', () => {
        return getMachineId();
    });

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
