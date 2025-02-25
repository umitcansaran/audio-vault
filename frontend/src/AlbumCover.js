import { useState, useEffect } from "react";

function AlbumCover({ album }) {
  const [coverSrc, setCoverSrc] = useState(null);

  useEffect(() => {
    async function fetchCoverImage() {
      if (!album?.folderPath) return; // Prevent errors if album is undefined
      const imageData = await window.electron.getCoverImage(album.folderPath);
      if (imageData) {
        setCoverSrc(imageData);
      }
    }

    fetchCoverImage();
  }, [album?.folderPath]); // Depend on album.folderPath

  return (
    <img
      src={coverSrc ? coverSrc : "/placeholder.jpg"} // Now uses "local://" URLs
      alt={`${album.title} Cover`}
      style={{ width: "150px", height: "150px", objectFit: "cover" }}
    />
  );
}

export default AlbumCover;
