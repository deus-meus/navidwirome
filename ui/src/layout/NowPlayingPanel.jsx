import React, { useState, useEffect, useCallback, useRef } from 'react'
import PropTypes from 'prop-types'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslate, Link, useNotify } from 'react-admin'
import {
  Popover,
  IconButton,
  makeStyles,
  Tooltip,
  List,
  ListItem,
  Avatar,
  Badge,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  useTheme,
  useMediaQuery,
} from '@material-ui/core'
import { FaRegCirclePlay, FaPause } from 'react-icons/fa6'
import clsx from 'clsx'
import subsonic from '../subsonic'
import { useInterval } from '../common'
import { nowPlayingCountSync, clearQueue, shuffleTracks } from '../actions'
import { formatDuration } from '../utils'
import config from '../config'

const useStyles = makeStyles((theme) => ({
  button: { color: 'inherit' },
  card: {
    padding: 0,
    borderRadius: 0,
    border: '2px solid #1c1b1b',
    boxShadow: '4px 4px 0px #1c1b1b',
    backgroundColor: '#fcf9f8',
    width: '28em',
    maxWidth: '95vw',
  },
  cardContent: {
    padding: `${theme.spacing(1.5)}px !important`,
  },
  setlistBanner: {
    backgroundColor: '#1c1b1b',
    color: '#fcf9f8',
    padding: '8px 10px',
    marginBottom: '8px',
    border: '1px solid #1c1b1b',
  },
  setlistTape: {
    display: 'inline-block',
    fontFamily: "'Space Mono', monospace",
    fontSize: '8px',
    fontWeight: 700,
    backgroundColor: 'rgba(244, 239, 230, 0.9)',
    color: '#1c1b1b',
    padding: '1px 6px',
    marginBottom: '4px',
    letterSpacing: '0.08em',
  },
  setlistTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: '15px',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    margin: 0,
    textTransform: 'uppercase',
  },
  setlistSubtitle: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '9px',
    color: '#fed01b',
    letterSpacing: '0.08em',
    margin: 0,
  },
  actionRow: {
    display: 'flex',
    gap: '8px',
    margin: '8px 0',
  },
  actionButton: {
    flex: 1,
    fontFamily: "'Space Mono', monospace",
    fontSize: '10px',
    fontWeight: 700,
    padding: '4px 8px',
    border: '2px solid #1c1b1b',
    boxShadow: '2px 2px 0px #1c1b1b',
    cursor: 'pointer',
    textTransform: 'uppercase',
    outline: 'none',
    '&:hover': {
      transform: 'translate(1px, 1px)',
      boxShadow: '1px 1px 0px #1c1b1b',
    },
  },
  clearBtn: {
    backgroundColor: '#ba1a1a',
    color: '#ffffff',
  },
  shuffleBtn: {
    backgroundColor: '#fed01b',
    color: '#1c1b1b',
  },
  nowBlastingCard: {
    backgroundColor: '#1d4ed8',
    color: '#fcf9f8',
    border: '2px solid #1c1b1b',
    boxShadow: '3px 3px 0px #1c1b1b',
    padding: '8px 10px',
    marginBottom: '8px',
  },
  nowBlastingHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },
  nowBlastingBadge: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '9px',
    fontWeight: 700,
    backgroundColor: '#fed01b',
    color: '#1c1b1b',
    padding: '1px 6px',
    letterSpacing: '0.05em',
  },
  equalizer: {
    display: 'flex',
    alignItems: 'flex-end',
    height: 18,
    gap: 2,
  },
  eqBar: {
    width: 3,
    backgroundColor: '#fed01b',
    display: 'inline-block',
    animation: '$eq 1s ease-in-out infinite alternate',
  },
  eqBar1: { animationDelay: '0.1s' },
  eqBar2: { animationDelay: '0.4s' },
  eqBar3: { animationDelay: '0.2s' },
  eqBar4: { animationDelay: '0.5s' },
  eqBar5: { animationDelay: '0.3s' },
  '@keyframes eq': {
    '0%': { height: 4 },
    '50%': { height: 18 },
    '100%': { height: 6 },
  },
  nowBlastingTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '13px',
    fontWeight: 700,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  nowBlastingArtist: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '10px',
    opacity: 0.9,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  queueContainer: {
    border: '1px solid #1c1b1b',
    backgroundColor: '#ffffff',
    padding: '6px',
    maxHeight: '120px',
    overflowY: 'auto',
    marginBottom: '8px',
  },
  queueHeader: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '9px',
    fontWeight: 700,
    color: '#3b4957',
    borderBottom: '1px solid #eee',
    paddingBottom: '3px',
    marginBottom: '4px',
    textTransform: 'uppercase',
  },
  queueRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontFamily: "'Space Mono', monospace",
    fontSize: '10px',
    padding: '2px 0',
    borderBottom: '1px dashed #e5e5e5',
  },
  queuePrefix: {
    fontWeight: 700,
    color: '#1d4ed8',
    marginRight: '6px',
  },
  queueName: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  queueDuration: {
    color: '#666',
    marginLeft: '6px',
  },
  emptyQueue: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '10px',
    color: '#888',
    textAlign: 'center',
    padding: '6px 0',
  },
  cacheStats: {
    backgroundColor: '#006577',
    color: '#fcf9f8',
    padding: '4px 8px',
    fontFamily: "'Space Mono', monospace",
    fontSize: '8px',
    border: '1px solid #1c1b1b',
    marginBottom: '8px',
  },
  cacheStatsLine: {
    display: 'flex',
    justifyContent: 'space-between',
    fontWeight: 700,
  },
  streamsDivider: {
    margin: '8px 0 6px 0',
    borderTop: '1px solid #1c1b1b',
  },
  streamsLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '9px',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#1c1b1b',
    marginBottom: '4px',
    display: 'block',
  },
  list: {
    width: '100%',
    maxHeight: (props) => {
      const entryHeight = 120
      const maxEntries = Math.min(props.entryCount || 0, 3)
      return maxEntries > 0 ? `${maxEntries * entryHeight}px` : '12em'
    },
    overflowY: 'auto',
    padding: 0,
  },
  listItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1),
  },
  avatarContainer: {
    position: 'relative',
    flexShrink: 0,
    width: theme.spacing(8),
    height: theme.spacing(8),
  },
  avatar: {
    width: '100%',
    height: '100%',
    cursor: 'pointer',
    borderRadius: theme.spacing(0.5),
    '&:hover': {
      opacity: 0.8,
    },
  },
  stateOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: theme.spacing(0.5),
    pointerEvents: 'none',
  },
  stateIcon: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 18,
  },
  entryContent: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.25),
  },
  trackTitle: {
    fontWeight: 600,
    fontSize: '0.875rem',
    lineHeight: 1.3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  trackDetail: {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  artistLink: {
    cursor: 'pointer',
    color: theme.palette.text.secondary,
    fontSize: '0.75rem',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  progressRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    marginTop: theme.spacing(0.5),
  },
  progressTime: {
    fontSize: '0.65rem',
    color: theme.palette.text.secondary,
    fontVariantNumeric: 'tabular-nums',
    flexShrink: 0,
  },
  progressBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.palette.action.disabledBackground,
    '& .MuiLinearProgress-bar': {
      borderRadius: 2,
    },
  },
  userInfo: {
    fontSize: '0.65rem',
    color: theme.palette.text.disabled,
    marginTop: theme.spacing(0.25),
  },
  badge: {
    '& .MuiBadge-badge': {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
    },
  },
}))

// NowPlayingButton component - handles the button with badge
const NowPlayingButton = React.memo(({ count, onClick }) => {
  const classes = useStyles()
  const translate = useTranslate()

  return (
    <Tooltip title={translate('nowPlaying.title')}>
      <IconButton
        className={classes.button}
        onClick={onClick}
        aria-label={translate('nowPlaying.title')}
        aria-haspopup="true"
      >
        <Badge
          badgeContent={count}
          color="primary"
          overlap="rectangular"
          className={classes.badge}
        >
          <FaRegCirclePlay size={20} />
        </Badge>
      </IconButton>
    </Tooltip>
  )
})

NowPlayingButton.displayName = 'NowPlayingButton'

NowPlayingButton.propTypes = {
  count: PropTypes.number.isRequired,
  onClick: PropTypes.func.isRequired,
}

const NowPlayingItem = React.memo(
  ({ nowPlayingEntry, onLinkClick, getArtistLink, now }) => {
    const classes = useStyles()
    const isPaused = nowPlayingEntry.state === 'paused'
    const isPlaying =
      nowPlayingEntry.state === 'playing' ||
      nowPlayingEntry.state === 'starting'
    const basePositionMs = nowPlayingEntry.positionMs || 0
    const rate = nowPlayingEntry.playbackRate || 1
    const elapsedSinceFetch = now - (nowPlayingEntry._fetchedAt || now)
    const interpolatedMs = isPlaying
      ? basePositionMs + elapsedSinceFetch * rate
      : basePositionMs
    const durationMs = (nowPlayingEntry.duration || 0) * 1000
    const clampedMs = Math.max(0, interpolatedMs)
    const positionMs =
      durationMs > 0 ? Math.min(clampedMs, durationMs) : clampedMs
    const positionSec = positionMs / 1000
    const durationSec = nowPlayingEntry.duration || 0
    const progress = durationSec > 0 ? (positionSec / durationSec) * 100 : 0
    const artistId = nowPlayingEntry.albumArtistId || nowPlayingEntry.artistId
    const artistName = nowPlayingEntry.albumArtist || nowPlayingEntry.artist

    return (
      <ListItem className={classes.listItem}>
        <div className={classes.avatarContainer}>
          <Link
            to={`/album/${nowPlayingEntry.albumId}/show`}
            onClick={onLinkClick}
          >
            <Avatar
              className={classes.avatar}
              src={subsonic.getCoverArtUrl(nowPlayingEntry, 80)}
              variant="square"
              alt={`${nowPlayingEntry.album} cover art`}
              loading="lazy"
            />
          </Link>
          {isPaused && (
            <div className={classes.stateOverlay}>
              <FaPause className={classes.stateIcon} />
            </div>
          )}
        </div>
        <div className={classes.entryContent}>
          <Typography
            className={classes.trackTitle}
            title={nowPlayingEntry.title}
          >
            {nowPlayingEntry.title}
          </Typography>
          {artistId ? (
            <Link
              to={getArtistLink(artistId)}
              className={classes.artistLink}
              onClick={onLinkClick}
            >
              {artistName}
            </Link>
          ) : (
            <Typography className={classes.trackDetail}>
              {artistName}
            </Typography>
          )}
          <Typography
            className={classes.trackDetail}
            title={nowPlayingEntry.album}
          >
            {nowPlayingEntry.album}
          </Typography>
          <div className={classes.progressRow}>
            <span className={classes.progressTime}>
              {formatDuration(positionSec)}
            </span>
            <LinearProgress
              className={classes.progressBar}
              variant="determinate"
              value={Math.min(progress, 100)}
            />
            <span className={classes.progressTime}>
              {formatDuration(durationSec)}
            </span>
          </div>
          <Typography className={classes.userInfo}>
            {nowPlayingEntry.username}
            {nowPlayingEntry.playerName
              ? ` (${nowPlayingEntry.playerName})`
              : ''}
          </Typography>
        </div>
      </ListItem>
    )
  },
)

NowPlayingItem.displayName = 'NowPlayingItem'

NowPlayingItem.propTypes = {
  nowPlayingEntry: PropTypes.shape({
    playerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    albumId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    albumArtistId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    artistId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    albumArtist: PropTypes.string,
    artist: PropTypes.string,
    title: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    playerName: PropTypes.string,
    album: PropTypes.string,
    state: PropTypes.string,
    positionMs: PropTypes.number,
    duration: PropTypes.number,
  }).isRequired,
  onLinkClick: PropTypes.func.isRequired,
  getArtistLink: PropTypes.func.isRequired,
  now: PropTypes.number.isRequired,
}

// NowPlayingList component - handles the popover content
const NowPlayingList = React.memo(
  ({ anchorEl, open, onClose, entries, onLinkClick, getArtistLink, now }) => {
    const classes = useStyles({ entryCount: entries.length })
    const translate = useTranslate()
    const dispatch = useDispatch()
    const queue = useSelector((state) => state.player?.queue || [])
    const currentTrack = useSelector((state) => state.player?.current || {})

    const handleClear = () => {
      dispatch(clearQueue())
    }

    const handleShuffle = () => {
      if (queue && queue.length > 0) {
        const queueObj = {}
        const ids = []
        queue.forEach((item, idx) => {
          const id = item.id || `track_${idx}`
          queueObj[id] = item
          ids.push(id)
        })
        dispatch(shuffleTracks(queueObj, ids))
      }
    }

    return (
      <Popover
        id="panel-nowplaying"
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={open}
        onClose={onClose}
        aria-labelledby="now-playing-title"
      >
        <Card className={classes.card}>
          <CardContent className={classes.cardContent}>
            <div className={classes.setlistBanner}>
              <span className={classes.setlistTape}>STAGE RIG // CHANNEL 1</span>
              <h3 className={classes.setlistTitle}>LIVE SETLIST // DECK QUEUE</h3>
              <p className={classes.setlistSubtitle}>
                SHOWBOX SEATTLE // OCT 23, 1993
              </p>
            </div>

            <div className={classes.nowBlastingCard}>
              <div className={classes.nowBlastingHeader}>
                <span className={classes.nowBlastingBadge}>NOW BLASTING</span>
                <div className={classes.equalizer}>
                  <span className={clsx(classes.eqBar, classes.eqBar1)} />
                  <span className={clsx(classes.eqBar, classes.eqBar2)} />
                  <span className={clsx(classes.eqBar, classes.eqBar3)} />
                  <span className={clsx(classes.eqBar, classes.eqBar4)} />
                  <span className={clsx(classes.eqBar, classes.eqBar5)} />
                </div>
              </div>
              <div className={classes.nowBlastingTitle}>
                {currentTrack?.name || currentTrack?.title || 'NO TRACK LOADED'}
              </div>
              <div className={classes.nowBlastingArtist}>
                {currentTrack?.artist || 'UNKNOWN ARTIST'}
              </div>
            </div>

            <div className={classes.actionRow}>
              <button
                type="button"
                className={clsx(classes.actionButton, classes.clearBtn)}
                onClick={handleClear}
              >
                CLEAR STASH
              </button>
              <button
                type="button"
                className={clsx(classes.actionButton, classes.shuffleBtn)}
                onClick={handleShuffle}
              >
                SHUFFLE REEL
              </button>
            </div>

            <div className={classes.queueContainer}>
              <div className={classes.queueHeader}>
                REEL QUEUE ({queue.length} CUTS)
              </div>
              {queue.length === 0 ? (
                <div className={classes.emptyQueue}>
                  SETLIST EMPTY // ADD CUTS FROM CRATE
                </div>
              ) : (
                queue.map((item, idx) => (
                  <div key={item.id || idx} className={classes.queueRow}>
                    <span className={classes.queuePrefix}>
                      {String(idx + 1).padStart(2, '0')}.
                    </span>
                    <span className={classes.queueName}>
                      {item.name || item.title || 'Untitled'} - {item.artist}
                    </span>
                    <span className={classes.queueDuration}>
                      {item.duration ? formatDuration(item.duration) : ''}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className={classes.cacheStats}>
              <div className={classes.cacheStatsLine}>
                <span>LOCAL CASSETTE CACHE</span>
                <span>48.2 GB / 120 GB (40% BUFFERED)</span>
              </div>
              <div className={classes.cacheStatsLine}>
                <span>BUFFER LATENCY: 12ms</span>
                <span>DIRECT FLAC STREAM</span>
              </div>
            </div>

            <div className={classes.streamsDivider} />
            <span className={classes.streamsLabel}>
              ACTIVE NETWORK STREAMS ({entries.length})
            </span>

            {entries.length === 0 ? (
              <Typography
                id="now-playing-title"
                style={{ fontSize: '11px', color: '#666' }}
              >
                {translate('nowPlaying.empty')}
              </Typography>
            ) : (
              <List
                className={classes.list}
                dense
                aria-label={translate('nowPlaying.title')}
              >
                {entries.map((nowPlayingEntry) => (
                  <NowPlayingItem
                    key={`${nowPlayingEntry.username}-${nowPlayingEntry.playerName}`}
                    nowPlayingEntry={nowPlayingEntry}
                    onLinkClick={onLinkClick}
                    getArtistLink={getArtistLink}
                    now={now}
                  />
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Popover>
    )
  },
)

NowPlayingList.displayName = 'NowPlayingList'

NowPlayingList.propTypes = {
  anchorEl: PropTypes.object,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  entries: PropTypes.arrayOf(PropTypes.object).isRequired,
  onLinkClick: PropTypes.func.isRequired,
  getArtistLink: PropTypes.func.isRequired,
  now: PropTypes.number.isRequired,
}

// Main NowPlayingPanel component
const NowPlayingPanel = ({ open: propOpen }) => {
  const dispatch = useDispatch()
  const count = useSelector((state) => state.activity.nowPlayingCount)
  const lastUpdate = useSelector((state) => state.activity.nowPlayingLastUpdate)
  const streamReconnected = useSelector(
    (state) => state.activity.streamReconnected,
  )
  const serverUp = useSelector(
    (state) => !!state.activity.serverStart.startTime,
  )
  const notify = useNotify()
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const [anchorEl, setAnchorEl] = useState(null)
  const buttonRef = useRef(null)
  const [entries, setEntries] = useState([])
  const [now, setNow] = useState(Date.now())
  const open = propOpen !== undefined ? propOpen : Boolean(anchorEl)

  const handleMenuOpen = useCallback((event) => {
    setAnchorEl(event.currentTarget)
  }, [])

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null)
  }, [])

  // Close panel when link is clicked on small screens
  const handleLinkClick = useCallback(() => {
    if (isSmallScreen) {
      handleMenuClose()
    }
  }, [isSmallScreen, handleMenuClose])

  const getArtistLink = useCallback((artistId) => {
    if (!artistId) return null
    return config.devShowArtistPage && artistId !== config.variousArtistsId
      ? `/artist/${artistId}/show`
      : `/album?filter={"artist_id":"${artistId}"}&order=ASC&sort=max_year&displayedFilters={"compilation":true}&perPage=15`
  }, [])

  const fetchTimerRef = useRef(null)
  const doFetchRef = useRef()
  doFetchRef.current = () =>
    subsonic
      .getNowPlaying()
      .then((resp) => resp.json['subsonic-response'])
      .then((data) => {
        if (data.status === 'ok') {
          const nowPlayingEntries = data.nowPlaying?.entry || []
          const fetchTime = Date.now()
          setEntries(
            nowPlayingEntries.map((e) => ({ ...e, _fetchedAt: fetchTime })),
          )
          dispatch(nowPlayingCountSync({ count: nowPlayingEntries.length }))
        } else {
          throw new Error(
            data.error?.message || 'Failed to fetch now playing data',
          )
        }
      })
      .catch((error) => {
        notify('ra.page.error', 'warning', {
          messageArgs: { error: error.message || 'Unknown error' },
        })
      })
  const fetchList = useCallback(() => {
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current)
    fetchTimerRef.current = setTimeout(() => {
      fetchTimerRef.current = null
      doFetchRef.current()
    }, 300)
  }, [])

  useEffect(() => {
    return () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current)
    }
  }, [])

  // Initialize count and entries on mount, and refresh on server/stream changes
  useEffect(() => {
    if (serverUp) fetchList()
  }, [fetchList, serverUp, streamReconnected])

  // Refresh when NowPlaying updates from SSE events (if panel is open)
  useEffect(() => {
    if (open && serverUp) fetchList()
  }, [lastUpdate, open, fetchList, serverUp])

  // Update current time every second when open to animate progress bars
  useInterval(() => setNow(Date.now()), open ? 1000 : null)

  // Periodic refresh when panel is open (10 seconds)
  useInterval(
    () => {
      if (open && serverUp) fetchList()
    },
    open ? 10000 : null,
  )

  // Periodic refresh when panel is closed (60 seconds) to keep badge accurate
  useInterval(
    () => {
      if (!open && serverUp) fetchList()
    },
    !open ? 60000 : null,
  )

  return (
    <div>
      <div ref={buttonRef} style={{ display: 'inline-block' }}>
        <NowPlayingButton count={count} onClick={handleMenuOpen} />
      </div>
      <NowPlayingList
        anchorEl={
          anchorEl ||
          buttonRef.current ||
          (typeof document !== 'undefined' ? document.body : null)
        }
        open={open}
        onClose={handleMenuClose}
        entries={entries}
        now={now}
        onLinkClick={handleLinkClick}
        getArtistLink={getArtistLink}
      />
    </div>
  )
}

NowPlayingPanel.propTypes = {}

export default NowPlayingPanel
