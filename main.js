const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 850,
        minWidth: 1024,
        minHeight: 720,
        title: "MedVitals - Hospital Management System SQL Lab",
        backgroundColor: '#070a13',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // Load the index.html of the app.
    mainWindow.loadFile('index.html');

    // Remove the default browser menu bar for a clean dashboard presentation
    Menu.setApplicationMenu(null);

    // Optional: Open developer tools during development if needed
    // mainWindow.webContents.openDevTools();
}

// Initialize Electron window when ready
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
