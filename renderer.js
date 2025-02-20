const { ipcRenderer } = require("electron");

let lastSelectedFolder = null; // Store last selected folder path

// Handle folder selection
document
  .getElementById("selectFolderBtn")
  .addEventListener("click", async () => {
    const result = await ipcRenderer.invoke("open-folder-dialog");

    if (result) {
      lastSelectedFolder = result; // Save the folder path
      document.getElementById("musicPath").value = result;
      scanFolder(result); // Scan immediately after selection
    }
  });

// Handle initial scan and rescanning
document.getElementById("rescanBtn").addEventListener("click", async () => {
  if (!lastSelectedFolder) {
    alert("Please select a folder first!");
    return;
  }
  scanFolder(lastSelectedFolder);
});

// Function to scan a folder
async function scanFolder(folderPath) {
  console.log("Scanning folder:", folderPath); // Debug log

  if (!folderPath) {
    alert("Please select a folder first!");
    return;
  }

  try {
    const albums = await ipcRenderer.invoke("scan-folders", folderPath);
    console.log("Albums found:", albums);
    displayAlbums(albums);
  } catch (error) {
    console.error("Error scanning folders:", error);
  }
}

// Function to display albums
function displayAlbums(albums) {
  const tableBody = document.getElementById("albumList");
  tableBody.innerHTML = "";

  albums.forEach((album) => {
    const row = document.createElement("tr");

    row.innerHTML = `
            <td>${album.artist}</td>
            <td>${album.title}</td>
            <td>${album.year}</td>
            <td data-label="${album.labelName}" class="clickable">${album.labelName}</td>
        `;

    row.querySelector(".clickable").addEventListener("click", () => {
      filterByLabel(album.labelCode, albums);
    });

    row.addEventListener("dblclick", () => {
      ipcRenderer.send("open-folder", album.folderPath);
    });

    tableBody.appendChild(row);
  });
}
