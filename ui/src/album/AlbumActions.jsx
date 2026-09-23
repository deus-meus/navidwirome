import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import {
  Button,
  sanitizeListRestProps,
  TopToolbar,
  useRecordContext,
  useTranslate,
  useNotify,
  useRedirect,
  Confirm,
} from 'react-admin'
import { useMediaQuery, makeStyles } from '@material-ui/core'
import PlayArrowIcon from '@material-ui/icons/PlayArrow'
import ShuffleIcon from '@material-ui/icons/Shuffle'
import CloudDownloadOutlinedIcon from '@material-ui/icons/CloudDownloadOutlined'
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline'
import { RiPlayListAddFill, RiPlayList2Fill } from 'react-icons/ri'
import PlaylistAddIcon from '@material-ui/icons/PlaylistAdd'
import ShareIcon from '@material-ui/icons/Share'
import {
  playNext,
  addTracks,
  playTracks,
  shuffleTracks,
  openAddToPlaylist,
  openDownloadMenu,
  DOWNLOAD_MENU_ALBUM,
  openShareMenu,
} from '../actions'
import { formatBytes } from '../utils'
import config from '../config'
import { RefreshMetadataButton, ToggleFieldsMenu } from '../common'
import { useUserPermissions } from '../common/useUserPermissions'

const useStyles = makeStyles({
  toolbar: { display: 'flex', justifyContent: 'space-between', width: '100%' },
})

const AlbumButton = ({ children, disabled, ...rest }) => {
  const record = useRecordContext(rest) || {}
  return (
    <Button
      {...rest}
      disabled={disabled !== undefined ? disabled : record.missing}
    >
      {children}
    </Button>
  )
}

const AlbumActions = ({
  className,
  ids,
  data,
  record,
  permanentFilter,
  ...rest
}) => {
  const dispatch = useDispatch()
  const translate = useTranslate()
  const notify = useNotify()
  const redirect = useRedirect()
  const classes = useStyles()
  const isDesktop = useMediaQuery((theme) => theme.breakpoints.up('md'))
  const isNotSmall = useMediaQuery((theme) => theme.breakpoints.up('sm'))
  const { isAdmin } = useUserPermissions()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteAlbum = async () => {
    setDeleting(true)
    const token = localStorage.getItem('token') || ''
    try {
      const response = await fetch(`/api/music/album/${record.id}`, {
        method: 'DELETE',
        headers: {
          'x-nd-authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        notify('resources.album.notifications.albumDeleted', { type: 'info' })
        setDeleteConfirmOpen(false)
        redirect('/album')
      } else {
        notify('resources.album.notifications.deleteError', { type: 'warning' })
      }
    } catch (err) {
      notify('resources.album.notifications.deleteError', { type: 'warning' })
    } finally {
      setDeleting(false)
    }
  }

  const handlePlay = React.useCallback(() => {
    dispatch(playTracks(data, ids))
  }, [dispatch, data, ids])

  const handlePlayNext = React.useCallback(() => {
    dispatch(playNext(data, ids))
  }, [dispatch, data, ids])

  const handlePlayLater = React.useCallback(() => {
    dispatch(addTracks(data, ids))
  }, [dispatch, data, ids])

  const handleShuffle = React.useCallback(() => {
    dispatch(shuffleTracks(data, ids))
  }, [dispatch, data, ids])

  const handleAddToPlaylist = React.useCallback(() => {
    const selectedIds = ids.filter((id) => !data[id].missing)
    dispatch(openAddToPlaylist({ selectedIds }))
  }, [dispatch, data, ids])

  const handleShare = React.useCallback(() => {
    dispatch(openShareMenu([record.id], 'album', record.name))
  }, [dispatch, record])

  const handleDownload = React.useCallback(() => {
    dispatch(openDownloadMenu(record, DOWNLOAD_MENU_ALBUM))
  }, [dispatch, record])

  return (
    <TopToolbar className={className} {...sanitizeListRestProps(rest)}>
      <div className={classes.toolbar}>
        <div>
          <AlbumButton
            onClick={handlePlay}
            label={translate('resources.album.actions.playAll')}
          >
            <PlayArrowIcon />
          </AlbumButton>
          <AlbumButton
            onClick={handleShuffle}
            label={translate('resources.album.actions.shuffle')}
          >
            <ShuffleIcon />
          </AlbumButton>
          <AlbumButton
            onClick={handlePlayNext}
            label={translate('resources.album.actions.playNext')}
          >
            <RiPlayList2Fill />
          </AlbumButton>
          <AlbumButton
            onClick={handlePlayLater}
            label={translate('resources.album.actions.addToQueue')}
          >
            <RiPlayListAddFill />
          </AlbumButton>
          <AlbumButton
            onClick={handleAddToPlaylist}
            label={translate('resources.album.actions.addToPlaylist')}
          >
            <PlaylistAddIcon />
          </AlbumButton>
          {config.enableSharing && (
            <AlbumButton
              onClick={handleShare}
              label={translate('ra.action.share')}
            >
              <ShareIcon />
            </AlbumButton>
          )}
          {config.enableDownloads && (
            <AlbumButton
              onClick={handleDownload}
              label={
                translate('ra.action.download') +
                (isDesktop ? ` (${formatBytes(record.size)})` : '')
              }
            >
              <CloudDownloadOutlinedIcon />
            </AlbumButton>
          )}
          <RefreshMetadataButton
            resource="album"
            record={record}
            size="small"
          />
          {isAdmin && (
            <AlbumButton
              disabled={false}
              onClick={() => setDeleteConfirmOpen(true)}
              label={translate('resources.album.actions.deleteAlbum')}
              style={{ color: '#e53935' }}
            >
              <DeleteOutlineIcon style={{ color: '#e53935' }} />
            </AlbumButton>
          )}
        </div>
        <div>{isNotSmall && <ToggleFieldsMenu resource="albumSong" />}</div>
      </div>
      {deleteConfirmOpen && (
        <Confirm
          isOpen={deleteConfirmOpen}
          loading={deleting}
          title={'resources.album.dialog.deleteAlbumTitle'}
          content={'resources.album.dialog.deleteAlbumConfirm'}
          onConfirm={handleDeleteAlbum}
          onClose={() => setDeleteConfirmOpen(false)}
        />
      )}
    </TopToolbar>
  )
}

AlbumActions.propTypes = {
  record: PropTypes.object.isRequired,
  selectedIds: PropTypes.arrayOf(PropTypes.number),
}

AlbumActions.defaultProps = {
  record: {},
  selectedIds: [],
}

export default AlbumActions
