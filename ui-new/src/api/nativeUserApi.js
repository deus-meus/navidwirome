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
  async checkInitialSetup() {
    try {
      const res = await fetch('/auth/initialSetup')
      if (!res.ok) return { firstTime: false }
      return await res.json()
    } catch {
      return { firstTime: false }
    }
  },

  async createAdmin(username, password) {
    const res = await fetch('/auth/createAdmin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) {
      const text = await res.text()
      let msg = text
      try {
        const json = JSON.parse(text)
        msg = json.error || json.message || text
      } catch {}
      throw new Error(msg || 'Failed to create initial admin')
    }
    return res.json()
  },

  async register(username, password) {
    const res = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) {
      const text = await res.text()
      let msg = text
      try {
        const json = JSON.parse(text)
        msg = json.error || json.message || text
      } catch {}
      throw new Error(msg || 'Registration failed')
    }
    return res.json()
  },

  async getCurrentUser() {
    const res = await fetch('/api/me', {
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      throw new Error(`Failed to fetch current user: HTTP ${res.status}`)
    }
    return res.json()
  },

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
