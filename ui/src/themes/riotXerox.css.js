const stylesheet = `
/* Riot Xerox Underground Mechanical Audio Player */
.react-jinke-music-player-main {
  font-family: 'Space Mono', monospace !important;
}

.react-jinke-music-player-main .music-player-panel {
  background-color: #121212 !important;
  color: #fcf9f8 !important;
  border-top: 4px solid #1c1b1b !important;
  box-shadow: 0 -4px 0px #1c1b1b !important;
}

.react-jinke-music-player-main .music-player-panel .panel-content .rc-slider-track {
  background-color: #1d4ed8 !important;
}

.react-jinke-music-player-main .music-player-panel .panel-content .rc-slider-handle {
  background-color: #fed01b !important;
  border: 2px solid #1c1b1b !important;
  border-radius: 0px !important;
  width: 14px !important;
  height: 18px !important;
}

.react-jinke-music-player-main .play-btn {
  background-color: #1d4ed8 !important;
  box-shadow: 2px 2px 0px #fed01b !important;
  border: 2px solid #fcf9f8 !important;
  border-radius: 0px !important;
}

.react-jinke-music-player-main .play-btn svg {
  color: #ffffff !important;
}

.react-jinke-music-player-main svg:hover {
  color: #fed01b !important;
}

/* Mechanical hard borders and focus rings */
*:focus-visible {
  outline: 3px solid #fed01b !important;
  outline-offset: 1px !important;
}
`

export default stylesheet
