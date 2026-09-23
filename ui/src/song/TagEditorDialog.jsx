import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useNotify, useTranslate } from 'react-admin'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  makeStyles,
} from '@material-ui/core'
import SearchIcon from '@material-ui/icons/Search'

const useStyles = makeStyles((theme) => ({
  content: {
    paddingTop: theme.spacing(1),
  },
  autoDetectBtn: {
    marginBottom: theme.spacing(2),
  },
  formField: {
    marginBottom: theme.spacing(2),
  },
}))

export const TagEditorDialog = ({ open, record, onClose }) => {
  const classes = useStyles()
  const translate = useTranslate()
  const notify = useNotify()

  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    album: '',
    albumArtist: '',
    trackNumber: '',
    year: '',
    genre: '',
  })
  const [detecting, setDetecting] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (record) {
      setFormData({
        title: record.title || '',
        artist: record.artist || '',
        album: record.album || '',
        albumArtist: record.albumArtist || '',
        trackNumber: record.trackNumber != null ? String(record.trackNumber) : '',
        year: record.year != null ? String(record.year) : '',
        genre: record.genre || '',
      })
    }
  }, [record])

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleAutoDetect = async () => {
    setDetecting(true)
    const token = localStorage.getItem('token') || ''
    const trackId = record.mediaFileId || record.id

    try {
      const response = await fetch(
        `/api/music/identify?id=${encodeURIComponent(trackId)}&path=${encodeURIComponent(record.path || '')}`,
        {
          headers: {
            'x-nd-authorization': `Bearer ${token}`,
          },
        },
      )

      if (response.ok) {
        const metadata = await response.json()
        setFormData((prev) => ({
          ...prev,
          title: metadata.title || prev.title,
          artist: metadata.artist || prev.artist,
          album: metadata.album || prev.album,
          albumArtist: metadata.albumArtist || prev.albumArtist,
          trackNumber:
            metadata.trackNumber != null
              ? String(metadata.trackNumber)
              : prev.trackNumber,
          year: metadata.year != null ? String(metadata.year) : prev.year,
          genre: metadata.genre || prev.genre,
        }))
        notify('resources.song.tagEditor.autoDetectSuccess', 'info')
      } else {
        notify('resources.song.tagEditor.autoDetectError', 'warning')
      }
    } catch (err) {
      notify('resources.song.tagEditor.autoDetectError', 'warning')
    } finally {
      setDetecting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const token = localStorage.getItem('token') || ''
    const trackId = record.mediaFileId || record.id

    const payload = {
      title: formData.title,
      artist: formData.artist,
      album: formData.album,
      albumArtist: formData.albumArtist,
      trackNumber: formData.trackNumber ? parseInt(formData.trackNumber, 10) : 0,
      year: formData.year ? parseInt(formData.year, 10) : 0,
      genre: formData.genre,
    }

    try {
      const response = await fetch(`/api/music/track/${trackId}/tags`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-nd-authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        notify('resources.song.notifications.tagsUpdated', 'info')
        onClose()
      } else {
        notify('resources.song.notifications.tagsUpdateError', 'warning')
      }
    } catch (err) {
      notify('resources.song.notifications.tagsUpdateError', 'warning')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>{translate('resources.song.tagEditor.title')}</DialogTitle>
      <DialogContent className={classes.content}>
        <Button
          data-testid="auto-detect-button"
          variant="outlined"
          color="primary"
          startIcon={
            detecting ? <CircularProgress size={18} /> : <SearchIcon />
          }
          onClick={handleAutoDetect}
          disabled={detecting || saving}
          className={classes.autoDetectBtn}
        >
          {translate('resources.song.tagEditor.autoDetect')}
        </Button>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label={translate('resources.song.fields.title')}
              value={formData.title}
              onChange={handleChange('title')}
              fullWidth
              variant="outlined"
              disabled={saving}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label={translate('resources.song.fields.artist')}
              value={formData.artist}
              onChange={handleChange('artist')}
              fullWidth
              variant="outlined"
              disabled={saving}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label={translate('resources.song.fields.albumArtist')}
              value={formData.albumArtist}
              onChange={handleChange('albumArtist')}
              fullWidth
              variant="outlined"
              disabled={saving}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label={translate('resources.song.fields.album')}
              value={formData.album}
              onChange={handleChange('album')}
              fullWidth
              variant="outlined"
              disabled={saving}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label={translate('resources.song.fields.trackNumber')}
              value={formData.trackNumber}
              onChange={handleChange('trackNumber')}
              type="number"
              fullWidth
              variant="outlined"
              disabled={saving}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label={translate('resources.song.fields.year')}
              value={formData.year}
              onChange={handleChange('year')}
              type="number"
              fullWidth
              variant="outlined"
              disabled={saving}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label={translate('resources.song.fields.genre')}
              value={formData.genre}
              onChange={handleChange('genre')}
              fullWidth
              variant="outlined"
              disabled={saving}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          {translate('ra.action.cancel')}
        </Button>
        <Button
          data-testid="save-tags-button"
          onClick={handleSave}
          color="primary"
          variant="contained"
          disabled={saving}
        >
          {saving ? (
            <CircularProgress size={24} />
          ) : (
            translate('resources.song.tagEditor.save')
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

TagEditorDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  record: PropTypes.object,
  onClose: PropTypes.func.isRequired,
}

export default TagEditorDialog
