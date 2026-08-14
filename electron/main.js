const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    title: 'Elishen Agrivance — Sales & Inventory',
    icon: path.join(__dirname, 'build', 'icon.ico'),
    webPreferences: { contextIsolation: true },
  });
  win.removeMenu();
  // packaged: UI ships in resources\app (extraResources); dev: use ..\app from the repo
  const ui = app.isPackaged
    ? path.join(process.resourcesPath, 'app', 'index.html')
    : path.join(__dirname, '..', 'app', 'index.html');
  win.loadFile(ui);
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
 

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
