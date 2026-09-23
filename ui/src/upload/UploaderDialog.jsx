import { useState, useRef } from 'react'
import PropTypes from 'prop-types'
import { useNotify, useTranslate } from 'react-admin'
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Typography,
  makeStyles,
} from '@material-ui/core'
import CloudUploadIcon from '@material-ui/icons/CloudUpload'

const useStyles = makeStyles((theme) => ({
  dropzone: {
    border: `2px dashed ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(3),
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: theme.palette.background.default,
    marginBottom: theme.spacing(2),
    transition: 'border-color 0.2s ease',
  },
  dropzoneActive: {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
  fileList: {
    maxHeight: 180,
    overflowY: 'auto',
    marginBottom: theme.spacing(2),
  },
  progress: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
}))

export const UploaderDialog = ({ open, onClose }) => {
  const classes = useStyles()
  const translate = useTranslate()
  const notify = useNotify()
  const fileInputRef = useRef(null)

  const [files, setFiles] = useState([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [autoIdentify, setAutoIdentify] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleReset = () => {
    setFiles([])
    setIsDragOver(false)
    setUploading(false)
    setProgress(0)
  }

  const handleClose = (_, reason) => {
    if (uploading && reason === 'backdropClick') return
    if (uploading) return
    handleReset()
    onClose()
  }

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files)])
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)])
    }
  }

  const handleUpload = async () => {
    if (files.length === 0 || uploading) return

    setUploading(true)
    setProgress(10)

    const token = localStorage.getItem('token') || ''
    let successCount = 0
    let failedCount = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await fetch(
          `/api/music/upload?auto_identify=${autoIdentify}`,
          {
            method: 'POST',
            headers: {
              'x-nd-authorization': `Bearer ${token}`,
            },
            body: formData,
          },
        )

        if (response.ok) {
          successCount++
        } else {
          failedCount++
        }
      } catch (err) {
        failedCount++
      }

      setProgress(Math.round(((i + 1) / files.length) * 100))
    }

    setUploading(false)

    if (failedCount === 0) {
      notify('resources.upload.notifications.success', 'info')
      handleReset()
      onClose()
    } else {
      notify('resources.upload.notifications.error', 'warning')
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>{translate('resources.upload.title')}</DialogTitle>
      <DialogContent>
        <div
          data-testid="uploader-dropzone"
          className={`${classes.dropzone} ${isDragOver ? classes.dropzoneActive : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <CloudUploadIcon
            color="primary"
            style={{ fontSize: 48, marginBottom: 8 }}
          />
          <Typography variant="body1">
            {translate('resources.upload.dragDropMessage')}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {translate('resources.upload.supportedFormats')}
          </Typography>
          <input
            data-testid="file-input"
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*,.mp3,.flac,.m4a,.ogg,.opus,.wav"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        {files.length > 0 && (
          <List className={classes.fileList} dense>
            {files.map((file, idx) => (
              <ListItem key={`${file.name}-${idx}`}>
                <ListItemText
                  primary={file.name}
                  secondary={`${(file.size / (1024 * 1024)).toFixed(2)} MB`}
                />
              </ListItem>
            ))}
          </List>
        )}

        {uploading && (
          <LinearProgress
            variant="determinate"
            value={progress}
            className={classes.progress}
          />
        )}

        <FormControlLabel
          control={
            <Checkbox
              data-testid="auto-identify-checkbox"
              checked={autoIdentify}
              onChange={(e) => setAutoIdentify(e.target.checked)}
              color="primary"
              disabled={uploading}
            />
          }
          label={translate('resources.upload.autoIdentify')}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          {translate('ra.action.cancel')}
        </Button>
        <Button
          data-testid="upload-submit-button"
          onClick={handleUpload}
          color="primary"
          variant="contained"
          disabled={files.length === 0 || uploading}
        >
          {translate('resources.upload.uploadAction')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

UploaderDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
}

export default UploaderDialog
