const {
  app,
  BrowserWindow,
  dialog,
  shell,
  ipcMain,
  protocol,
} = require("electron");
const path = require("path");
const fs = require("fs");
const Store = require("electron-store");
const store = new Store();

let mainWindow;

app.whenReady().then(() => {
  // protocol.handle("local", async (request) => {
  //   const filePath = request.url.replace("local://", "");
  //   try {
  //     return net.fetch(`file://${filePath}`);
  //   } catch (error) {
  //     console.error("Failed to load local file:", error);
  //     return null;
  //   }
  // });
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"), // Make sure preload is properly configured
      webSecurity: false,
    },
  });

  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
  } else {
    mainWindow.loadFile(path.join(__dirname, "frontend", "build", "index.html"));
  }

  mainWindow.webContents.once("did-finish-load", () => {
    const lastFolderPath = store.get("lastFolderPath", null);
    if (lastFolderPath) {
      mainWindow.webContents.send("load-last-folder", lastFolderPath);
    }
  });
});

ipcMain.handle("get-cover-image", async (event, folderPath) => {
  if (!folderPath) return null;

  const coverPath = path.join(folderPath, "cover.jpg");

  if (fs.existsSync(coverPath)) {
    return `local://${coverPath}`; // ✅ Use "local://" protocol
  } else {
    return null;
  }
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
    const folderPath = result.filePaths[0];
    store.set("lastFolderPath", folderPath); // Save the path
    return folderPath;
  }
  return null;
});

// Handle Fetching Last Folder Path
ipcMain.handle("get-last-folder", async () => {
  return store.get("lastFolderPath", null); // Retrieves the stored folder path
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
    const files = fs
      .readdirSync(folderPath)
      .filter((file) => file.endsWith(".mp3") || file.endsWith(".flac"))
      .filter((name) => !name.startsWith("._"))
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
