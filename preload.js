const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  scanFolder: (path) => ipcRenderer.invoke("scan-folder", path),
  openFolder: (path) => ipcRenderer.invoke("open-folder", path),
  openFile: (filePath) => ipcRenderer.invoke("open-file", filePath),
  getSongsInFolder: (folderPath) => ipcRenderer.invoke("getSongsInFolder", folderPath)
});