import React, { createElement, forwardRef, Fragment } from 'react'
import {
  AppBar as RAAppBar,
  MenuItemLink,
  useTranslate,
  usePermissions,
  getResources,
} from 'react-admin'
import {
  MdInfo,
  MdPerson,
  MdPhonelink,
  MdSupervisorAccount,
  MdCloudUpload,
} from 'react-icons/md'
import { useSelector } from 'react-redux'
import { makeStyles, MenuItem, ListItemIcon, Divider } from '@material-ui/core'
import ViewListIcon from '@material-ui/icons/ViewList'
import { Dialogs } from '../dialogs/Dialogs'
import { AboutDialog, QuickConnectDialog } from '../dialogs'
import { UploaderDialog } from '../upload/UploaderDialog'
import { useUserPermissions } from '../common/useUserPermissions'
import PersonalMenu from './PersonalMenu'
import ActivityPanel from './ActivityPanel'
import NowPlayingPanel from './NowPlayingPanel'
import UserMenu from './UserMenu'
import config from '../config'

const useStyles = makeStyles(
  (theme) => ({
    root: {
      color: theme.palette.text.secondary,
    },
    active: {
      color: theme.palette.text.primary,
    },
    icon: { minWidth: theme.spacing(5) },
  }),
  {
    name: 'NDAppBar',
  },
)

const DialogMenuItem = forwardRef(
  ({ onClick, label, icon, dialog, ...rest }, ref) => {
    const classes = useStyles(rest)
    const [open, setOpen] = React.useState(false)

    const handleClose = () => {
      onClick && onClick()
      setOpen(false)
    }
    return (
      <>
        <MenuItem
          ref={ref}
          onClick={() => setOpen(true)}
          className={classes.root}
        >
          <ListItemIcon className={classes.icon}>
            {createElement(icon, { title: label, size: 24 })}
          </ListItemIcon>
          {label}
        </MenuItem>
        {createElement(dialog, { onClose: handleClose, open })}
      </>
    )
  },
)

DialogMenuItem.displayName = 'DialogMenuItem'

const settingsResources = (resource) =>
  resource.name !== 'user' &&
  resource.hasList &&
  resource.options &&
  resource.options.subMenu === 'settings'

const CustomUserMenu = ({ onClick, ...rest }) => {
  const translate = useTranslate()
  const resources = useSelector(getResources)
  const classes = useStyles(rest)
  const { permissions } = usePermissions()
  const { canUpload } = useUserPermissions()

  const resourceDefinition = (resourceName) =>
    resources.find((r) => r?.name === resourceName)

  const renderUserMenuItemLink = () => {
    const userResource = resourceDefinition('user')
    if (!userResource) {
      return null
    }
    if (permissions !== 'admin') {
      if (!config.enableUserEditing) {
        return null
      }
      userResource.icon = MdPerson
    } else {
      userResource.icon = MdSupervisorAccount
    }
    return renderSettingsMenuItemLink(
      userResource,
      permissions !== 'admin' ? localStorage.getItem('userId') : null,
    )
  }

  const renderSettingsMenuItemLink = (resource, id) => {
    const label = translate(`resources.${resource.name}.name`, {
      smart_count: id ? 1 : 2,
    })
    const link = id ? `/${resource.name}/${id}` : `/${resource.name}`
    return (
      <MenuItemLink
        className={classes.root}
        activeClassName={classes.active}
        key={resource.name}
        to={link}
        primaryText={label}
        leftIcon={
          (resource.icon && createElement(resource.icon, { size: 24 })) || (
            <ViewListIcon />
          )
        }
        onClick={onClick}
        sidebarIsOpen={true}
      />
    )
  }

  return (
    <>
      {config.devActivityPanel &&
        permissions === 'admin' &&
        config.enableNowPlaying && <NowPlayingPanel />}
      {config.devActivityPanel && permissions === 'admin' && <ActivityPanel />}
      <UserMenu {...rest}>
        <PersonalMenu sidebarIsOpen={true} onClick={onClick} />
        {canUpload && (
          <DialogMenuItem
            label={translate('menu.upload')}
            icon={MdCloudUpload}
            dialog={UploaderDialog}
          />
        )}
        {config.enableQuickConnect && (
          <DialogMenuItem
            label={translate('menu.quickConnect.name')}
            icon={MdPhonelink}
            dialog={QuickConnectDialog}
          />
        )}
        <Divider />
        {renderUserMenuItemLink()}
        {resources
          .filter(settingsResources)
          .map((r) => renderSettingsMenuItemLink(r))}
        <Divider />
        <DialogMenuItem
          label={translate('menu.about')}
          icon={MdInfo}
          dialog={AboutDialog}
        />
      </UserMenu>
      <Dialogs />
    </>
  )
}

const useHeaderStyles = makeStyles(
  (theme) => ({
    headerContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      padding: '0 8px',
    },
    finderWrapper: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      flex: 1,
      maxWidth: 420,
    },
    finderBadge: {
      backgroundColor: '#1c1b1b',
      color: '#fcf9f8',
      fontFamily: "'Space Mono', monospace",
      fontSize: '11px',
      fontWeight: 700,
      padding: '3px 6px',
      whiteSpace: 'nowrap',
      letterSpacing: '0.05em',
      userSelect: 'none',
    },
    finderInputBox: {
      display: 'flex',
      alignItems: 'center',
      flex: 1,
      backgroundColor: '#ffffff',
      border: '2px solid #1c1b1b',
      boxShadow: '2px 2px 0px #1c1b1b',
      padding: '2px 8px',
    },
    finderPrompt: {
      fontFamily: "'Space Mono', monospace",
      fontSize: '12px',
      fontWeight: 700,
      color: '#006577',
      marginRight: '6px',
      userSelect: 'none',
    },
    finderInput: {
      border: 'none',
      outline: 'none',
      width: '100%',
      fontFamily: "'Space Mono', monospace",
      fontSize: '12px',
      backgroundColor: 'transparent',
      color: '#1c1b1b',
      '&::placeholder': {
        color: '#8b7079',
        opacity: 0.8,
      },
    },
    streamingBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      backgroundColor: '#ffe083',
      color: '#231b00',
      border: '1px solid #1c1b1b',
      padding: '2px 8px',
      fontFamily: "'Space Mono', monospace",
      fontSize: '11px',
      fontWeight: 700,
      letterSpacing: '0.05em',
      transform: 'rotate(-1deg)',
      userSelect: 'none',
      [theme.breakpoints.down('xs')]: {
        display: 'none',
      },
    },
    recDot: {
      width: 8,
      height: 8,
      backgroundColor: '#ba1a1a',
      borderRadius: '50%',
      display: 'inline-block',
      animation: '$pulse 1.5s infinite',
    },
    '@keyframes pulse': {
      '0%': { opacity: 1 },
      '50%': { opacity: 0.3 },
      '100%': { opacity: 1 },
    },
  }),
  { name: 'NDTypewriterHeader' },
)

const TypewriterFinder = () => {
  const classes = useHeaderStyles()
  return (
    <div className={classes.headerContainer}>
      <div className={classes.finderWrapper}>
        <span className={classes.finderBadge}>TYPEWRITER FINDER:</span>
        <div className={classes.finderInputBox}>
          <span className={classes.finderPrompt}>&gt;&gt;</span>
          <input
            type="text"
            className={classes.finderInput}
            placeholder="SEARCH ARTISTS, TAPES, BOOTLEGS..."
            aria-label="Typewriter Finder"
          />
        </div>
      </div>
      <div className={classes.streamingBadge}>
        <span className={classes.recDot} />
        <span>STREAMING FLAC DIRECT</span>
      </div>
    </div>
  )
}

const AppBar = (props) => (
  <RAAppBar {...props} container={Fragment} userMenu={<CustomUserMenu />}>
    <TypewriterFinder />
  </RAAppBar>
)

export default AppBar
