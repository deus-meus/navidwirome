import stylesheet from './riotXerox.css.js'

const colors = {
  paper: '#fcf9f8',
  black: '#1c1b1b',
  blue: '#1d4ed8',
  yellow: '#fed01b',
  cyan: '#006577',
  red: '#ba1a1a',
  white: '#ffffff',
}

export default {
  themeName: 'Riot Xerox',
  typography: {
    fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
    h1: { fontFamily: "'Syne', sans-serif", fontWeight: 800 },
    h2: { fontFamily: "'Syne', sans-serif", fontWeight: 800 },
    h3: { fontFamily: "'Syne', sans-serif", fontWeight: 700 },
    h4: { fontFamily: "'Syne', sans-serif", fontWeight: 700 },
    h5: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 },
    h6: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 },
    body1: { fontFamily: "'Space Grotesk', sans-serif" },
    body2: { fontFamily: "'Space Grotesk', sans-serif" },
    button: { fontFamily: "'Space Mono', monospace", fontWeight: 700 },
    caption: { fontFamily: "'Space Mono', monospace" },
  },
  palette: {
    primary: {
      main: colors.blue,
      contrastText: colors.white,
    },
    secondary: {
      main: colors.yellow,
      contrastText: colors.black,
    },
    background: {
      default: colors.paper,
      paper: colors.paper,
    },
    text: {
      primary: colors.black,
      secondary: '#3b4957',
    },
    type: 'light',
  },
  overrides: {
    MuiButton: {
      root: {
        borderRadius: 0,
        textTransform: 'uppercase',
        border: `2px solid ${colors.black}`,
        boxShadow: `3px 3px 0px ${colors.black}`,
        fontWeight: 'bold',
        '&:hover': {
          transform: 'translate(-1px, -1px)',
          boxShadow: `4px 4px 0px ${colors.black}`,
        },
      },
      containedPrimary: {
        backgroundColor: colors.blue,
        color: colors.white,
        '&:hover': {
          backgroundColor: '#1e40af',
        },
      },
    },
    MuiCard: {
      root: {
        borderRadius: 0,
        border: `2px solid ${colors.black}`,
        boxShadow: `3px 3px 0px ${colors.black}`,
        backgroundColor: colors.paper,
      },
    },
    MuiPaper: {
      rounded: {
        borderRadius: 0,
      },
      elevation1: {
        boxShadow: `3px 3px 0px ${colors.black}`,
        border: `2px solid ${colors.black}`,
      },
    },
    MuiInputBase: {
      root: {
        borderRadius: 0,
        border: `2px solid ${colors.black}`,
        backgroundColor: colors.white,
        fontFamily: "'Space Mono', monospace",
      },
    },
  },
  player: {
    theme: 'dark',
    stylesheet,
  },
}
