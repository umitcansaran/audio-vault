import React, { useState, useRef, useEffect } from "react";

const AudioPlayer = ({
  album,
  currentSong,
  index,
  handleArtistClick,
  handleLabelClick,
}) => {
  const [tracks, setTracks] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // useEffect(() => {
  //   if (!audioRef.current) return;

  //   const audio = audioRef.current;
  //   const canvas = canvasRef.current;
  //   const ctx = canvas.getContext("2d");

  //   // Créer le contexte audio une seule fois
  //   if (!audioContextRef.current) {
  //     audioContextRef.current = new (window.AudioContext ||
  //       window.webkitAudioContext)();
  //   }

  //   const audioContext = audioContextRef.current;

  //   if (!sourceRef.current) {
  //     sourceRef.current = audioContext.createMediaElementSource(audio);
  //     sourceRef.current.connect(audioContext.destination);
  //   }

  //   const analyser = audioContext.createAnalyser();
  //   sourceRef.current.connect(analyser);
  //   analyser.fftSize = 64;

  //   const bufferLength = analyser.frequencyBinCount;
  //   const dataArray = new Uint8Array(bufferLength);
  //   analyserRef.current = analyser;
  //   dataArrayRef.current = dataArray;

  //   const draw = () => {
  //     if (!canvas || !ctx || !analyserRef.current) return;
  //     analyserRef.current.getByteFrequencyData(dataArrayRef.current);

  //     analyser.minDecibels = -130; // Lower the floor to capture soft sounds
  //     analyser.maxDecibels = -10; // Prevents over-amplification of strong signals

  //     ctx.clearRect(0, 0, canvas.width, canvas.height);
  //     const barWidth = canvas.width / bufferLength;
  //     let x = 0;

  //     dataArrayRef.current.forEach((value) => {
  //       const barHeight = (value / 255) * canvas.height;
  //       ctx.fillStyle = `rgb(127, 127, 127)`;
  //       ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
  //       x += barWidth;
  //     });

  //     animationFrameRef.current = requestAnimationFrame(draw);
  //   };

  //   draw();

  //   return () => {
  //     cancelAnimationFrame(animationFrameRef.current);
  //   };
  // }, [currentTrackIndex]);

  useEffect(() => {
    const fetchTracks = async () => {
      if (window.electron && album.folderPath) {
        const songList = await window.electron.getSongs(album.folderPath);
        const formattedTracks = await Promise.all(
          songList
            .filter((name) => !name.startsWith("._")) // Filter unwanted files
            .map(async (song) => {
              const audio = new Audio(`file://${album.folderPath}/${song}`);
              await new Promise((resolve) => {
                audio.addEventListener("loadedmetadata", resolve, {
                  once: true,
                });
              });

              return {
                title: song,
                path: `file://${album.folderPath}/${song}`,
                duration: formatDuration(audio.duration), // Format duration
              };
            })
        );

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
      {/* <div
        style={{
          display: "flex",
          flexDirection: "column",
        }}
        className="audio-equalizer"
      >
        <canvas
          ref={canvasRef}
          width={300}
          height={95}
          style={{
            background: index % 2 === 0 ? "#222" : "#333", // Dynamic background
            marginTop: 0,
          }}
        />
      </div> */}
      <p className="expanded-album-info">
        <span
          className="clickable-artist"
          onClick={(e) => {
            e.stopPropagation();
            handleArtistClick(album.artist);
          }}
        >
          {album.artist}
        </span>
        <span> </span>- {album.title}
      </p>
      <span>&copy; {album.year + " "}</span>
      <span
        className="clickable-label"
        onClick={(e) => {
          e.stopPropagation();
          handleLabelClick(album.labelName);
        }}
      >
        {album.labelName}
      </span>
      <audio
        ref={audioRef}
        onEnded={nextTrack}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
      ></audio>
      {/* <Turntable
        isPlaying={isPlaying}
        albumCover={`file://${album.folderPath}/cover.jpg`}
      /> */}
      {tracks.length > 0 && currentTrackIndex !== null ? (
        <div className="song-duration">
          {new Date(currentTime * 1000).toISOString().substr(14, 5)} /{" "}
          {new Date(duration * 1000).toISOString().substr(14, 5)}
        </div>
      ) : (
        <div> 00:00 / 00:00 </div>
      )}
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
            {" (" + track.duration + ")"}
          </p>
        ))}
      </div>
    </div>
  );
};

export default AudioPlayer;
