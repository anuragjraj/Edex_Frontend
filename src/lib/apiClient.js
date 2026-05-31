import { API_URL } from '../config/config'

// ══════════════════════════════════════════════════════════════
//  API CLIENT
// ══════════════════════════════════════════════════════════════
export const api = {
  headers() {
    const h = { 'Content-Type': 'application/json' }
    const t = localStorage.getItem('bs_token')
    const s = localStorage.getItem('bs_session')
    if (t) h['Authorization'] = `Bearer ${t}`
    if (s) h['x-session-token'] = s
    return h
  },
  async get(path) {
    const r = await fetch(`${API_URL}${path}`, { headers: this.headers() })
    const data = await r.json()
    if (!r.ok) throw Object.assign(new Error(data.error || 'Request failed'), { code: data.code, status: r.status })
    return data
  },
  async post(path, body) {
    const r = await fetch(`${API_URL}${path}`, { method: 'POST', headers: this.headers(), body: JSON.stringify(body) })
    const data = await r.json()
    if (!r.ok) throw Object.assign(new Error(data.error || 'Request failed'), { code: data.code, status: r.status })
    return data
  },
  async put(path, body) {
    const r = await fetch(`${API_URL}${path}`, { method: 'PUT', headers: this.headers(), body: JSON.stringify(body) })
    const data = await r.json()
    if (!r.ok) throw Object.assign(new Error(data.error || 'Request failed'), { code: data.code, status: r.status })
    return data
  },
  async del(path) {
    const r = await fetch(`${API_URL}${path}`, { method: 'DELETE', headers: this.headers() })
    const data = await r.json()
    if (!r.ok) throw Object.assign(new Error(data.error || 'Request failed'), { code: data.code, status: r.status })
    return data
  },
  async patch(path, body = {}) {
    const r = await fetch(`${API_URL}${path}`, { method: 'PATCH', headers: this.headers(), body: JSON.stringify(body) })
    const data = await r.json()
    if (!r.ok) throw Object.assign(new Error(data.error || 'Request failed'), { code: data.code, status: r.status })
    return data
  },
}
