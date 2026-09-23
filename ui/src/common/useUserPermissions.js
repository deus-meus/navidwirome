import { usePermissions } from 'react-admin'

export const useUserPermissions = () => {
  const { permissions } = usePermissions()
  const isAdmin =
    permissions === 'admin' || localStorage.getItem('role') === 'admin'
  const canUpload = isAdmin || localStorage.getItem('canUpload') === 'true'
  const canEditTags = isAdmin || localStorage.getItem('canEditTags') === 'true'

  return { isAdmin, canUpload, canEditTags }
}
