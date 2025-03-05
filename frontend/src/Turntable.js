import React from "react";
import tonearm from "./rx04wx_large.png";

const Turntable = ({ isPlaying, albumCover }) => {
  return (
    <div className="turntable">
      {/* Vinyl Disc */}
      <div className={`vinyl ${isPlaying ? "spinning" : ""}`}>
        <div className="vinyl-texture"></div>
        <img src={albumCover} alt="Album Cover" className="album-art" />
        <div className="center-label"></div>
      </div>

      {/* Tonearm */}
      <div className={`tonearm ${isPlaying ? "playing-arm" : ""}`}>
        <img src={tonearm} alt="Turntable Arm" className="tonearm-pic" />
      </div>
    </div>
  );
};

export default Turntable;
