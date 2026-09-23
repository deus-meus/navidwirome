import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Divider, makeStyles } from '@material-ui/core'
import clsx from 'clsx'
import { useTranslate, MenuItemLink, getResources } from 'react-admin'
import ViewListIcon from '@material-ui/icons/ViewList'
import AlbumIcon from '@material-ui/icons/Album'
import SubMenu from './SubMenu'
import { humanize, pluralize } from 'inflection'
import albumLists from '../album/albumLists'
import PlaylistsSubMenu from './PlaylistsSubMenu'
import LibrarySelector from '../common/LibrarySelector'
import config from '../config'

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    paddingBottom: (props) => (props.addPadding ? '80px' : '20px'),
  },
  open: {
    width: 240,
  },
  closed: {
    width: 55,
  },
  active: {
    color: theme.palette.text.primary,
    fontWeight: 'bold',
  },
  zineBanner: {
    backgroundColor: '#121212',
    color: '#fcf9f8',
    padding: '8px',
    margin: '8px 8px 4px 8px',
    transform: 'rotate(-1deg)',
    boxShadow: '3px 3px 0px #1d4ed8',
    userSelect: 'none',
  },
  zineBannerTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '4px',
  },
  undergroundBadge: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '9px',
    textTransform: 'uppercase',
    backgroundColor: '#fed01b',
    color: '#1c1b1b',
    padding: '1px 4px',
    fontWeight: 700,
  },
  recBadge: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '9px',
    color: '#93c5fd',
    fontWeight: 700,
  },
  zineTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: '15px',
    textTransform: 'uppercase',
    fontWeight: 800,
    margin: 0,
    letterSpacing: '-0.02em',
  },
  zineSubtitle: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '9px',
    opacity: 0.7,
    letterSpacing: '0.1em',
    margin: 0,
  },
  runIdBox: {
    backgroundColor: '#ffffff',
    padding: '4px 8px',
    margin: '0 8px 8px 8px',
    border: '2px solid #1c1b1b',
    boxShadow: '2px 2px 0px #1c1b1b',
    transform: 'rotate(0.5deg)',
    userSelect: 'none',
  },
  runIdLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '8px',
    textTransform: 'uppercase',
    color: '#3b4957',
    display: 'block',
    fontWeight: 700,
  },
  runIdText: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '10px',
    color: '#1d4ed8',
    fontWeight: 700,
    margin: 0,
  },
  statusWrapper: {
    padding: '8px',
    marginTop: 'auto',
    userSelect: 'none',
  },
  statusBox: {
    backgroundColor: '#006577',
    color: '#fcf9f8',
    padding: '6px',
    border: '2px solid #1c1b1b',
    boxShadow: '2px 2px 0px #1c1b1b',
    transform: 'rotate(1deg)',
    marginBottom: '6px',
  },
  statusLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '8px',
    textTransform: 'uppercase',
    display: 'block',
    fontWeight: 700,
  },
  statusVal: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '11px',
    fontWeight: 700,
  },
  warningBox: {
    backgroundColor: '#fcf9f8',
    padding: '4px 6px',
    color: '#3b4957',
    fontFamily: "'Space Mono', monospace",
    fontSize: '8px',
    border: '1px solid #1c1b1b',
  },
}))

const ZINE_RESOURCE_NAMES = {
  album: 'DISCOVER / VAULT',
  playlist: 'MIXTAPES & CASSETTES',
  artist: 'BANDS & ARTISTS',
  song: 'VINYL / CD CRATES',
  radio: 'LOCAL RADIO FM',
}

const translatedResourceName = (resource, translate) => {
  if (ZINE_RESOURCE_NAMES[resource.name]) {
    return ZINE_RESOURCE_NAMES[resource.name]
  }
  return translate(`resources.${resource.name}.name`, {
    smart_count: 2,
    _:
      resource.options && resource.options.label
        ? translate(resource.options.label, {
            smart_count: 2,
            _: resource.options.label,
          })
        : humanize(pluralize(resource.name)),
  })
}

const Menu = ({ dense = false }) => {
  const open = useSelector((state) => state.admin.ui.sidebarOpen)
  const translate = useTranslate()
  const queue = useSelector((state) => state.player?.queue)
  const classes = useStyles({ addPadding: queue.length > 0 })
  const resources = useSelector(getResources)

  // TODO State is not persisted in mobile when you close the sidebar menu. Move to redux?
  const [state, setState] = useState({
    menuAlbumList: true,
    menuPlaylists: true,
    menuSharedPlaylists: true,
  })

  const handleToggle = (menu) => {
    setState((state) => ({ ...state, [menu]: !state[menu] }))
  }

  const renderResourceMenuItemLink = (resource) => (
    <MenuItemLink
      key={resource.name}
      to={`/${resource.name}`}
      activeClassName={classes.active}
      primaryText={translatedResourceName(resource, translate)}
      leftIcon={resource.icon || <ViewListIcon />}
      sidebarIsOpen={open}
      dense={dense}
    />
  )

  const renderAlbumMenuItemLink = (type, al) => {
    const resource = resources.find((r) => r.name === 'album')
    if (!resource) {
      return null
    }

    const albumListAddress = `/album/${type}`

    const name = translate(`resources.album.lists.${type || 'default'}`, {
      _: translatedResourceName(resource, translate),
    })

    return (
      <MenuItemLink
        key={albumListAddress}
        to={albumListAddress}
        activeClassName={classes.active}
        primaryText={name}
        leftIcon={al.icon || <ViewListIcon />}
        sidebarIsOpen={open}
        dense={dense}
        exact
      />
    )
  }

  const subItems = (subMenu) => (resource) =>
    resource.hasList && resource.options && resource.options.subMenu === subMenu

  return (
    <div
      className={clsx(classes.root, {
        [classes.open]: open,
        [classes.closed]: !open,
      })}
    >
      {open && (
        <div className={classes.zineBanner}>
          <div className={classes.zineBannerTop}>
            <span className={classes.undergroundBadge}>UNDERGROUND AUDIO</span>
            <span className={classes.recBadge}>REC ●</span>
          </div>
          <h2 className={classes.zineTitle}>NAVIDROME // V.94</h2>
          <p className={classes.zineSubtitle}>AUDIOZINE RIOT CRATE</p>
        </div>
      )}
      {open && (
        <div className={classes.runIdBox}>
          <span className={classes.runIdLabel}>XEROX RUN IDENTIFIER:</span>
          <p className={classes.runIdText}>CASSETTE-STREAM-DECK #882</p>
        </div>
      )}
      {open && <LibrarySelector />}
      <SubMenu
        handleToggle={() => handleToggle('menuAlbumList')}
        isOpen={state.menuAlbumList}
        sidebarIsOpen={open}
        name={open ? 'DISCOVER / VAULT' : 'menu.albumList'}
        icon={<AlbumIcon />}
        dense={dense}
      >
        {Object.keys(albumLists).map((type) =>
          renderAlbumMenuItemLink(type, albumLists[type]),
        )}
      </SubMenu>
      {resources.filter(subItems(undefined)).map(renderResourceMenuItemLink)}
      {config.devSidebarPlaylists && open ? (
        <>
          <Divider />
          <PlaylistsSubMenu
            state={state}
            setState={setState}
            sidebarIsOpen={open}
            dense={dense}
          />
        </>
      ) : (
        resources.filter(subItems('playlist')).map(renderResourceMenuItemLink)
      )}
      {open && (
        <div className={classes.statusWrapper}>
          <div className={classes.statusBox}>
            <span className={classes.statusLabel}>SERVER STATUS // SUBSONIC</span>
            <span className={classes.statusVal}>ONLINE 99.4% CHUNKED</span>
          </div>
          <div className={classes.warningBox}>
            PULL TAPE BEFORE EJECTING. DO NOT DUPLICATE COMMERCIALLY.
          </div>
        </div>
      )}
    </div>
  )
}

export default Menu
