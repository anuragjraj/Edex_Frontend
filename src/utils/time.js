import { FREE_WINDOW } from '../config/config'

export function getSecondsRemaining(freeStartedAt) {
  if (!freeStartedAt) return FREE_WINDOW
  const elapsed = Math.floor((Date.now() - new Date(freeStartedAt)) / 1000)
  return Math.max(0, FREE_WINDOW - elapsed)
}

export const timeAgo = t => {
  const d = (Date.now() - new Date(t)) / 1000
  if (d < 60) return 'just now'
  if (d < 3600) return `${Math.floor(d / 60)}m ago`
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`
  return `${Math.floor(d / 86400)}d ago`
}
