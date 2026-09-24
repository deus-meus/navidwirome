export function getAuthHeaders() {
  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['x-nd-authorization'] = `Bearer ${token}`
  }
  return headers
}

export const nativeUserApi = {
  async getUsers() {
    const res = await fetch('/api/user', {
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      throw new Error(`Failed to fetch users: HTTP ${res.status}`)
    }
    return res.json()
  },

  async createUser(userData) {
    const res = await fetch('/api/user', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || `Failed to create user: HTTP ${res.status}`)
    }
    return res.json()
  },

  async updateUser(id, userData) {
    const res = await fetch(`/api/user/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || `Failed to update user: HTTP ${res.status}`)
    }
    return res.json()
  },

  async deleteUser(id) {
    const res = await fetch(`/api/user/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || `Failed to delete user: HTTP ${res.status}`)
    }
    return true
  },
}
