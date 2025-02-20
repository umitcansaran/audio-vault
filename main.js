const { app, BrowserWindow, dialog, shell, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
  } else {
    mainWindow.loadFile(
      path.join(__dirname, "frontend", "build", "index.html")
    );
  }

  // Remove or comment out this block if not needed:
  // mainWindow.webContents.on("will-navigate", (event, url) => {
  //   event.preventDefault();
  //   mainWindow.loadFile(path.join(__dirname, "frontend", "build", "index.html"));
  // });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Handle Folder Selection
ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });

  if (!result.canceled) {
    return result.filePaths[0]; // Return selected folder
  }
  return null;
});

// Handle Scanning Music Folder
ipcMain.handle("scan-folder", async (_, folderPath) => {
  if (!folderPath) return [];

  const files = fs.readdirSync(folderPath);
  const albums = files
    .filter(
      (name) => !name.startsWith("._") && name.match(/.*\(\d{4}\) \[.*\]/)
    )
    .map((name) => {
      const match = name.match(/^(.*?) - (.*?) \((\d{4})\) \[(.*?) - (.*?)\]$/);
      return match
        ? {
            artist: match[1],
            title: match[2],
            year: match[3],
            labelCode: match[4],
            labelName: match[5],
            folderPath: path.join(folderPath, name),
          }
        : null;
    })
    .filter(Boolean);

  return albums;
});

// Handle Getting Songs In Music Folder
ipcMain.handle("getSongsInFolder", async (event, folderPath) => {
  try {
    const files = fs.readdirSync(folderPath)
      .filter(file => file.endsWith(".mp3") || file.endsWith(".flac")) 
      .filter(name => !name.startsWith("._"))
      .sort((a, b) => a.localeCompare(b));
    return files;
  } catch (error) {
    console.error("Error reading folder:", error);
    return [];
  }
});

// Handle Opening Music Folder
ipcMain.handle("open-folder", async (_, folderPath) => {
  await shell.openPath(folderPath);
});

ipcMain.handle("open-file", async (event, filePath) => {
  try {
    await shell.openPath(filePath); // Open with default player
  } catch (error) {
    console.error("Error opening file:", error);
  }
});