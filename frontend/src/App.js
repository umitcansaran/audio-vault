import { useState, useEffect } from "react";
import "./App.css";
import AudioPlayer from "./AudioPlayer";

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
  const [labelImages, setLabelImages] = useState({});
  const [currentSong, setCurrentSong] = useState(null); // Track the currently playing song
  const [searchTerm, setSearchTerm] = useState("");

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
    .filter(
      (album) =>
        (selectedArtist ? album.artist === selectedArtist : true) &&
        (selectedLabel ? album.labelName === selectedLabel : true) &&
        (selectedYear ? album.year === selectedYear : true) &&
        (album.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
          album.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          album.labelCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          album.labelName.toLowerCase().includes(searchTerm.toLowerCase()))
    )
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

  const fetchLabelImageFromFolder = async (album) => {
    const apiKey = process.env.REACT_APP_DISCOGS_API_KEY; // Correct way to access the environment variable

    // Regular Expression to Extract Details
    // const folderRegex = /^(.+?) - (.+?) \((\d{4})\) \[(.+?) - (.+?)\]$/;
    // const match = folderName.match(folderRegex);

    // if (!match) {
    //   console.error("Folder name format does not match expected pattern.");
    //   return null;
    // }

    // const artist = match[1].trim();
    // const album = match[2].trim();
    // const label = match[5].trim();

    // console.log(`Extracted: Artist=${artist}, Album=${album}, Label=${label}`);

    // API Call to Discogs to Get Label Image
    // const url = `https://api.discogs.com/database/search?release_title=${encodeURIComponent(album.title)}&artist=${encodeURIComponent(album.artist)}&label=${encodeURIComponent(album.labelName)}&type=release&token=${apiKey}`;
    const url = `https://api.discogs.com/database/search?catno=${encodeURIComponent(
      album.labelCode
    )}&type=release&token=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.results.length > 0) {
        const result = data.results[0].cover_image; // First matching label image
        return result;
      }
    } catch (error) {
      console.error("Error fetching label image:", error);
    }

    return null;
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

      // Reset the image to show "Loading..." before fetching new one
      setLabelImages((prev) => ({ ...prev, [album.folderPath]: null }));

      const imageUrl = await fetchLabelImageFromFolder(album);
      setLabelImages((prev) => ({ ...prev, [album.folderPath]: imageUrl }));
    }
  };

  const playSong = async (albumFolderPath, songName) => {
    const filePath = `${albumFolderPath}/${songName}`; // Construct the full file path
    setCurrentSong(filePath); // Set the song path to the currently playing song
    // await window.electron.openFile(filePath); // Trigger Electron to open the file
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
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
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
            {filteredAlbums.map(
              (album, index) => (
                console.log(album),
                (
                  <>
                    <tr
                      key={index}
                      onClick={() =>
                        window.electron.openFolder(album.folderPath)
                      }
                      className={index % 2 === 0 ? "row-dark" : "row-light"}
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
                        className={`album-list clickable ${
                          expandedAlbum === album.folderPath
                            ? "expanded-cell"
                            : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArtistClick(album.artist);
                        }}
                      >
                        {album.artist}
                      </td>
                      <td
                        className={`album-list ${
                          expandedAlbum === album.folderPath
                            ? "expanded-cell"
                            : ""
                        }`}
                      >
                        {album.title}
                      </td>
                      <td
                        className={`album-list year-row ${
                          expandedAlbum === album.folderPath
                            ? "expanded-cell"
                            : ""
                        }`}
                      >
                        {album.year}
                      </td>
                      <td
                        className={`album-list ${
                          expandedAlbum === album.folderPath
                            ? "expanded-cell"
                            : ""
                        }`}
                      >
                        {album.labelCode}
                      </td>
                      <td
                        className={`album-list clickable ${
                          expandedAlbum === album.folderPath
                            ? "expanded-cell"
                            : ""
                        }`}
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
                        <td className="expanded-album"></td>
                        <td colSpan="2" className="expanded-album">
                          {/* <div className="album-cover-wrapper">
                        {labelImages[album.folderPath] === null ? (
                          <p style={{ color: "grey" }}>Loading...</p>
                        ) : labelImages[album.folderPath] ? (
                          <img
                            className="album-cover"
                            src={labelImages[album.folderPath]}
                            alt={`${album.title} Cover`}
                          />
                        ) : (
                          <p>No label image available</p>
                        )}
                      </div> */}
                          <div className="album-cover-wrapper">
                            <img
                              className="album-cover"
                              src={`file://${album.folderPath}/cover.jpg`}
                              alt={`${album.title} Cover`}
                            />
                          </div>
                        </td>
                        <td colSpan="4" className="expanded-album">
                          <AudioPlayer
                            album={album}
                            currentSong={currentSong}
                          />
                        </td>
                      </tr>
                    )}
                  </>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
