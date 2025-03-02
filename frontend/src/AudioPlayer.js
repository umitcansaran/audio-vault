import React, { useState, useRef, useEffect } from "react";
import WaveSurfer from "wavesurfer.js";

const AudioPlayer = ({ album, currentSong }) => {
  const [tracks, setTracks] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);

  useEffect(() => {
    if (!waveformRef.current) return;

    // Initialize WaveSurfer
    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "#666", // Default waveform color
      progressColor: "#e91e63", // Progress bar color
      cursorColor: "#fff", // Cursor line
      barWidth: 2, // Bar thickness
      responsive: true,
      height: 50, // Waveform height
    });

    return () => wavesurfer.current.destroy();
  }, []);

  useEffect(() => {
    if (currentSong && wavesurfer.current) {
      wavesurfer.current.load(currentSong);
    }
  }, [currentSong]);

  const togglePlay = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    const fetchTracks = async () => {
      if (window.electron && album.folderPath) {
        const songList = await window.electron.getSongs(album.folderPath);
        const formattedTracks = songList
          .filter((name) => !name.startsWith("._"))
          .map((song) => ({
            title: song,
            path: `file://${album.folderPath}/${song}`,
          }));
        setTracks(formattedTracks);
      }
    };
    fetchTracks();
  }, [album.folderPath]);

  useEffect(() => {
    if (currentSong) {
      const index = tracks.findIndex((track) => track.path === currentSong);
      if (index !== -1) {
        setCurrentTrackIndex(index);
      }
    }
  }, [currentSong, tracks]);

  useEffect(() => {
    if (currentTrackIndex !== null && tracks.length > 0) {
      const track = tracks[currentTrackIndex];
      audioRef.current.src = track.path;
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [currentTrackIndex]);

  const playPauseHandler = () => {
    if (currentTrackIndex === null && tracks.length > 0) {
      setCurrentTrackIndex(0); // Start playing the first track if none is selected
    } else if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setProgress((audioRef.current.currentTime / duration) * 100);
    }
  };

  const onLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
  };

  const nextTrack = () => {
    if (currentTrackIndex < tracks.length - 1) {
      setCurrentTrackIndex((prevIndex) => prevIndex + 1);
    }
  };

  const prevTrack = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex((prevIndex) => prevIndex - 1);
    }
  };

  return (
    <div className="audio-player">
      <p className="expanded-album-info">
        {album.artist} - {album.title}
      </p>
      <p className="expanded-album-label">
        &copy; {album.year} {album.labelName}
      </p>
      <audio
        ref={audioRef}
        onEnded={nextTrack}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
      ></audio>

      {tracks.length > 0 && currentTrackIndex !== null ? (
        <div className="song-duration">
          {new Date(currentTime * 1000).toISOString().substr(14, 5)} /
          {new Date(duration * 1000).toISOString().substr(14, 5)}
        </div>
      ) : null}
      <button className="playBtn" onClick={playPauseHandler}>
        {isPlaying ? "⏸" : "▶"}
      </button>
      <input
        className="audioInput"
        type="range"
        min="0"
        max="100"
        value={progress}
        onChange={(e) => {
          const newTime = (e.target.value / 100) * duration;
          audioRef.current.currentTime = newTime;
          setProgress(e.target.value);
        }}
      />
      <button
        className="prevBtn"
        onClick={prevTrack}
        disabled={currentTrackIndex === 0}
      >
        ◀◀
      </button>
      <button
        className="nextBtn"
        onClick={nextTrack}
        disabled={currentTrackIndex === tracks.length - 1}
      >
        ▶▶
      </button>
      <div className="song-list">
        {tracks?.map((track, index) => (
          <p
            key={index}
            onClick={() => setCurrentTrackIndex(index)}
            className={`clickable-song ${
              index === currentTrackIndex ? "playing" : ""
            }`}
          >
            {track.title.replace(/\.flac$/gi, "")}
          </p>
        ))}
      </div>
    </div>
  );
};

export default AudioPlayer;
