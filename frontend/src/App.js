import { useState, useEffect } from "react";
import "./App.css";
import AlbumCover from "./AlbumCover";

function App() {
  const [folderPath, setFolderPath] = useState("");
  const [albums, setAlbums] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [prevFilter, setPrevFilter] = useState({ artist: "", label: "" });
  const [expandedAlbum, setExpandedAlbum] = useState(null);
  const [songs, setSongs] = useState({});

  useEffect(() => {
    const loadLastFolder = async () => {
      const lastPath = await window.electron.getLastFolder();
      if (lastPath) {
        setFolderPath(lastPath);
        scanFolder(lastPath);
      }
    };
    loadLastFolder();
  }, []);

  useEffect(() => {
    if (!selectedArtist && !selectedLabel) {
      const artistDropdown = document.getElementById("artistDropdown");
      const labelDropdown = document.getElementById("labelDropdown");
      const yearDropdown = document.getElementById("yearDropdown");

      if (artistDropdown) artistDropdown.selectedIndex = 0;
      if (labelDropdown) labelDropdown.selectedIndex = 0;
      if (yearDropdown) yearDropdown.selectedIndex = 0;
    }
  }, [selectedArtist, selectedLabel]);

  // Function to select a folder
  const selectFolder = async () => {
    const path = await window.electron.selectFolder();
    if (path) {
      setFolderPath(path);
      scanFolder(path);
    }
  };

  // Function to scan a folder
  const scanFolder = async (path) => {
    if (!path) return;
    const data = await window.electron.scanFolder(path);
    setAlbums(data);
  };

  // Function to rescan the last selected folder
  const rescanFolder = async () => {
    if (!folderPath) {
      alert("Please select a folder first!");
      return;
    }
    scanFolder(folderPath);
  };

  const filteredAlbums = albums
    .filter((album) => {
      return (
        (selectedArtist ? album.artist === selectedArtist : true) &&
        (selectedLabel ? album.labelName === selectedLabel : true) &&
        (selectedYear ? album.year === selectedYear : true)
      );
    })
    .sort((a, b) => {
      if (!sortColumn) return 0;
      const valueA = a[sortColumn].toString().toLowerCase();
      const valueB = b[sortColumn].toString().toLowerCase();

      if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
      if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleArtistClick = (artistName) => {
    setPrevFilter({ artist: selectedArtist, label: selectedLabel });
    setSelectedArtist(artistName);
    setSelectedLabel("");
  };

  const handleLabelClick = (labelName) => {
    setPrevFilter({ artist: selectedArtist, label: selectedLabel });
    setSelectedLabel(labelName);
    setSelectedArtist("");
  };

  const handleBack = () => {
    setPrevFilter({ artist: "", label: "" });
    setSelectedArtist("");
    setSelectedLabel("");
    setSelectedYear("");
  };

  const toggleAlbum = async (event, album) => {
    event.stopPropagation(); // Prevents the row click event from triggering
    if (expandedAlbum === album.folderPath) {
      setExpandedAlbum(null);
    } else {
      if (!songs[album.folderPath]) {
        const songList = await window.electron.getSongsInFolder(
          album.folderPath
        );
        setSongs((prevSongs) => ({
          ...prevSongs,
          [album.folderPath]: songList.sort((a, b) => a.localeCompare(b)), // Ensure correct order
        }));
      }
      setExpandedAlbum(album.folderPath);
    }
  };

  const playSong = async (filePath) => {
    await window.electron.openFile(filePath);
  };

  return (
    <div className="container">
      <div className="main-bar">
        <div className="back-button-div">
          {(selectedArtist || selectedLabel || selectedYear) && (
            <button className="back-button" onClick={handleBack}>
              ⬅ Back
            </button>
          )}
        </div>
        <div className="filters">
          <select
            id="artistDropdown"
            value={selectedArtist}
            onChange={(e) => setSelectedArtist(e.target.value)}
          >
            <option value="">Artists</option>
            {[...new Set(albums.map((a) => a.artist))]
              .sort((a, b) => a.localeCompare(b)) // Alphabetical order
              .map((artist) => (
                <option key={artist} value={artist}>
                  {artist}
                </option>
              ))}
          </select>

          <select
            id="labelDropdown"
            value={selectedLabel}
            onChange={(e) => setSelectedLabel(e.target.value)}
          >
            <option value="">Labels</option>
            {[...new Set(albums.map((a) => a.labelName))]
              .sort((a, b) => a.localeCompare(b)) // Alphabetical order
              .map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
          </select>

          <select
            id="yearDropdown"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="">Years</option>
            {[...new Set(albums.map((a) => a.year))]
              .sort((a, b) => b - a) // Sort in descending order (recent → old)
              .map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
          </select>
        </div>
        <div className="right-end-buttons">
          <button className="select-folder-button" onClick={selectFolder}>
            Select Folder
          </button>
          <button id="rescanBtn" onClick={rescanFolder}>
            Rescan
          </button>
        </div>
      </div>

      <div className="album-list-table">
        <table>
          <thead>
            <tr>
              <th></th>
              <th onClick={() => handleSort("artist")}>
                Artist{" "}
                {sortColumn === "artist"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th>Title</th>
              <th className="year-column" onClick={() => handleSort("year")}>
                Year{" "}
                {sortColumn === "year"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th onClick={() => handleSort("labelCode")}>
                Code{" "}
                {sortColumn === "labelCode"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th onClick={() => handleSort("labelName")}>
                Label{" "}
                {sortColumn === "labelName"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAlbums.map((album, index) => (
              <>
                <tr
                  key={index}
                  onClick={() => window.electron.openFolder(album.folderPath)}
                >
                  <td>
                    <button
                      className="toggle-album"
                      onClick={(e) => toggleAlbum(e, album)}
                    >
                      {expandedAlbum === album.folderPath ? "−" : "+"}
                    </button>
                  </td>
                  <td
                    className="album-list clickable"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleArtistClick(album.artist);
                    }}
                  >
                    {album.artist}
                  </td>
                  <td className="album-list">{album.title}</td>
                  <td className="album-list year-row">{album.year}</td>
                  <td className="album-list">{album.labelCode}</td>
                  <td
                    className="album-list clickable"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLabelClick(album.labelName);
                    }}
                  >
                    {album.labelName}
                  </td>
                </tr>
                {expandedAlbum === album.folderPath && (
                  <tr>
                    <td colSpan="3" className="expanded-album">
                      <div className="album-cover-wrapper">
                        <img
                          className="album-cover"
                          src={`file://${album.folderPath}/cover.jpg`}
                          alt={`${album.title} Cover`}
                        />
                      </div>
                    </td>
                    <td colSpan="4" className="expanded-album">
                      <div className="song-list">
                        {songs[album.folderPath]?.map((song, idx) => (
                          <p
                            key={idx}
                            onClick={() =>
                              playSong(`${album.folderPath}/${song}`)
                            }
                            className="clickable-song"
                          >
                            {song}
                          </p>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
