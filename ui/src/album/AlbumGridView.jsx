import React, { useRef } from 'react'
import {
  GridList,
  GridListTile,
  Typography,
  GridListTileBar,
  useMediaQuery,
} from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import withWidth from '@material-ui/core/withWidth'
import { Link } from 'react-router-dom'
import { linkToRecord, useListContext, Loading } from 'react-admin'
import { withContentRect } from 'react-measure'
import { useRollChanged } from './useRollChanged'
import { useDrag } from 'react-dnd'
import {
  AlbumContextMenu,
  PlayButton,
  ArtistLinkField,
  OverflowTooltip,
} from '../common'
import { DraggableTypes } from '../consts'
import clsx from 'clsx'
import { AlbumDatesField } from './AlbumDatesField.jsx'
import { Artwork } from '../common/Artwork'

const useStyles = makeStyles(
  () => ({
    root: {
      margin: '20px',
      display: 'grid',
    },
    gridListTile: {
      overflow: 'visible !important',
      '& > div': {
        overflow: 'visible !important',
      },
    },
    tileBar: {
      transition: 'all 150ms ease-out',
      opacity: 0,
      pointerEvents: 'none',
      textAlign: 'left',
      background:
        'linear-gradient(to top, rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.4) 70%,rgba(0,0,0,0) 100%)',
    },
    tileBarMobile: {
      textAlign: 'left',
      background:
        'linear-gradient(to top, rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.4) 70%,rgba(0,0,0,0) 100%)',
    },
    albumArtistName: {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      textAlign: 'left',
      fontSize: '1em',
    },
    albumName: {
      fontFamily: "'Space Grotesk', sans-serif",
      fontWeight: 700,
      fontSize: '13px',
      color: '#1c1b1b',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      marginTop: '2px',
    },
    missingAlbum: {
      opacity: 0.3,
    },
    albumVersion: {
      fontFamily: "'Space Mono', monospace",
      fontSize: '10px',
      color: '#555',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
    },
    albumSubtitle: {
      fontFamily: "'Space Mono', monospace",
      fontSize: '11px',
      color: '#49454f',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      display: 'block',
    },
    link: {
      position: 'relative',
      display: 'block',
      textDecoration: 'none',
      border: '1px solid #1c1b1b',
      '&:hover $tileBar, &:focus-within $tileBar': {
        opacity: 1,
        pointerEvents: 'auto',
      },
    },
    albumLink: {
      position: 'relative',
      display: 'block',
      textDecoration: 'none',
    },
    albumContainer: {
      position: 'relative',
      backgroundColor: '#ffffff',
      border: '2px solid #1c1b1b',
      boxShadow: '3px 3px 0px #1c1b1b',
      padding: '8px 8px 12px 8px',
      transition: 'transform 0.15s ease-out, box-shadow 0.15s ease-out',
      '&:hover': {
        transform: 'rotate(0deg) scale(1.02) !important',
        boxShadow: '6px 6px 0px #1c1b1b',
        zIndex: 10,
      },
    },
    maskingTape: {
      position: 'absolute',
      top: -9,
      left: '50%',
      transform: 'translateX(-50%) rotate(-1deg)',
      backgroundColor: 'rgba(244, 239, 230, 0.95)',
      border: '1px solid rgba(28, 27, 27, 0.25)',
      padding: '1px 8px',
      zIndex: 5,
      boxShadow: '1px 1px 2px rgba(0,0,0,0.1)',
      userSelect: 'none',
    },
    maskingTapeText: {
      fontFamily: "'Space Mono', monospace",
      fontSize: '8px',
      fontWeight: 700,
      letterSpacing: '0.08em',
      color: '#1c1b1b',
      textTransform: 'uppercase',
    },
    stampContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '4px',
      marginTop: '6px',
      marginBottom: '2px',
    },
    yearBadge: {
      fontFamily: "'Space Mono', monospace",
      fontSize: '9px',
      fontWeight: 700,
      backgroundColor: '#ba1a1a',
      color: '#ffffff',
      padding: '1px 4px',
      letterSpacing: '0.05em',
      border: '1px solid #1c1b1b',
    },
    cutsBadge: {
      fontFamily: "'Space Mono', monospace",
      fontSize: '9px',
      fontWeight: 700,
      backgroundColor: '#fed01b',
      color: '#1c1b1b',
      padding: '1px 4px',
      letterSpacing: '0.05em',
      border: '1px solid #1c1b1b',
    },
    polaroidMeta: {
      marginTop: '4px',
    },
    albumPlayButton: { color: 'white' },
  }),
  { name: 'NDAlbumGridView' },
)

const useCoverStyles = makeStyles({
  coverContainer: {
    width: '100%',
    aspectRatio: '1',
    overflow: 'hidden',
  },
  cover: {
    display: 'inline-block',
    width: '100%',
    objectFit: 'contain',
    // The image fills this box absolutely, so it lends no height: a remount that has not been
    // re-measured yet would collapse the tile and blank the cover for a frame.
    aspectRatio: '1',
    height: (props) => props.height,
    transition: 'opacity 0.3s ease-in-out',
  },
})

const getColsForWidth = (width) => {
  if (width === 'xs') return 2
  if (width === 'sm') return 3
  if (width === 'md') return 4
  if (width === 'lg') return 6
  return 9
}

const Cover = withContentRect('bounds')(({
  record,
  measureRef,
  contentRect,
}) => {
  // Force height to be the same as the width determined by the GridList
  // noinspection JSSuspiciousNameCombination
  const classes = useCoverStyles({ height: contentRect.bounds.width })
  const [, dragAlbumRef] = useDrag(
    () => ({
      type: DraggableTypes.ALBUM,
      item: { albumIds: [record.id] },
      options: { dropEffect: 'copy' },
    }),
    [record],
  )

  return (
    <div ref={measureRef} className={classes.coverContainer}>
      <div ref={dragAlbumRef}>
        <Artwork
          record={record}
          square
          className={classes.cover}
          title={record.name}
        />
      </div>
    </div>
  )
})

const getTilt = (id) => {
  if (!id) return 0
  let hash = 0
  const str = String(id)
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 100
  }
  const tilts = [-1.2, 0.8, -0.6, 1.2, -1.0, 1.4, -0.8]
  return tilts[Math.abs(hash) % tilts.length]
}

const AlbumGridTile = ({ showArtist, record, basePath }) => {
  const classes = useStyles()
  const isDesktop = useMediaQuery((theme) => theme.breakpoints.up('md'), {
    noSsr: true,
  })
  if (!record) {
    return null
  }
  const computedClasses = clsx(
    classes.albumContainer,
    record.missing && classes.missingAlbum,
  )
  const tilt = getTilt(record.id)
  const tapeLabel = `TAPE NO. ${String(record.id || '001').slice(0, 5)}`

  return (
    <div
      className={computedClasses}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <div className={classes.maskingTape} data-testid="masking-tape">
        <span className={classes.maskingTapeText}>{tapeLabel}</span>
      </div>
      <Link
        className={classes.link}
        to={linkToRecord(basePath, record.id, 'show')}
      >
        <Cover record={record} />
        <GridListTileBar
          className={isDesktop ? classes.tileBar : classes.tileBarMobile}
          subtitle={
            !record.missing && (
              <PlayButton
                className={classes.albumPlayButton}
                record={record}
                size="small"
              />
            )
          }
          actionIcon={<AlbumContextMenu record={record} color={'white'} />}
        />
      </Link>
      <div className={classes.stampContainer}>
        <span className={classes.yearBadge}>{record.year || '199X'}</span>
        <span className={classes.cutsBadge}>
          {record.songCount ? `${record.songCount} CUTS` : 'LP / STEREO'}
        </span>
      </div>
      <div className={classes.polaroidMeta}>
        <Link
          className={classes.albumLink}
          to={linkToRecord(basePath, record.id, 'show')}
        >
          <span>
            <OverflowTooltip title={record.name}>
              <Typography className={classes.albumName}>{record.name}</Typography>
            </OverflowTooltip>
            {record.tags && record.tags['albumversion'] && (
              <Typography className={classes.albumVersion}>
                {record.tags['albumversion']}
              </Typography>
            )}
          </span>
        </Link>
        {showArtist ? (
          <ArtistLinkField record={record} className={classes.albumSubtitle} />
        ) : (
          <AlbumDatesField record={record} className={classes.albumSubtitle} />
        )}
      </div>
    </div>
  )
}

const LoadedAlbumGrid = ({ ids, data, basePath, width }) => {
  const classes = useStyles()
  const { filterValues } = useListContext()
  const isArtistView = !!(filterValues && filterValues.artist_id)
  return (
    <div className={classes.root}>
      <GridList
        component={'div'}
        cellHeight={'auto'}
        cols={getColsForWidth(width)}
        spacing={20}
      >
        {ids.map((id) => (
          <GridListTile className={classes.gridListTile} key={id}>
            <AlbumGridTile
              record={data[id]}
              basePath={basePath}
              showArtist={!isArtistView}
            />
          </GridListTile>
        ))}
      </GridList>
    </div>
  )
}

const AlbumGridView = ({
  albumListType,
  loaded,
  loading,
  seed,
  shownSeed,
  ...props
}) => {
  // ArtistShow renders this grid too, with no roll to track, so own a ref when none is passed.
  const ownSeed = useRef(null)
  // A re-roll replaces every album, so the previous roll must not linger while it loads.
  const rerolling =
    useRollChanged(shownSeed ?? ownSeed, seed, loading) &&
    albumListType === 'random'
  const hide = rerolling || !props.data || !props.ids
  return hide ? <Loading /> : <LoadedAlbumGrid {...props} />
}

const AlbumGridViewWithWidth = withWidth()(AlbumGridView)

export { AlbumGridTile, AlbumGridView }
export default AlbumGridViewWithWidth
