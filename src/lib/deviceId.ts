import { v4 as uuidv4 } from 'uuid'

/** Stable per-browser device id used by every login flow (password, Google) for refresh-token/device tracking. */
export function getDeviceId(): string {
  const key = 'dd-device-id'
  let id = localStorage.getItem(key)
  if (!id) { id = uuidv4(); localStorage.setItem(key, id) }
  return id
}
