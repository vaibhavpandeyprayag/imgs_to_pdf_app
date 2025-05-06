// electron.js

const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "src/assets/app-logo.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: true,
    },
  });

  // win.loadURL("http://localhost:5173"); // Point to Vite's dev server
  win.loadFile(path.join(__dirname, "dist/index.html")); // Adjust path as needed
}

app.whenReady().then(() => {
  console.log("app is ready...");
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
