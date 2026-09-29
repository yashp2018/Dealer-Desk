import { useEffect, useRef, useState } from 'react'
import { googleLogin } from '../../api/auth'
import { getDeviceId } from '../../lib/deviceId'
import type { AuthData } from '../../api/types'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

// Google Identity Services doesn't ship types; this is the minimal surface
// this component actually calls.
interface GoogleCredentialResponse { credential: string }
interface GoogleIdApi {
  initialize(config: { client_id: string; callback: (resp: GoogleCredentialResponse) => void }): void
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void
}
declare global {
  interface Window { google?: { accounts: { id: GoogleIdApi } } }
}

let scriptLoadPromise: Promise<void> | null = null
function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (scriptLoadPromise) return scriptLoadPromise
  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Sign-In'))
    document.head.appendChild(script)
  })
  return scriptLoadPromise
}

interface Props {
  onSuccess: (data: AuthData) => void
  onError: (message: string) => void
}

/**
 * Renders nothing if VITE_GOOGLE_CLIENT_ID isn't set — this needs a real
 * OAuth Client ID from Google Cloud Console (APIs & Services > Credentials),
 * which only the project owner can create. Until then this is invisible
 * rather than a broken/fake button.
 */
export default function GoogleSignInButton({ onSuccess, onError }: Props) {
  const buttonRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!CLIENT_ID) return
    let cancelled = false

    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google || !buttonRef.current) return
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async (resp) => {
            try {
              const data = await googleLogin({
                credential: resp.credential,
                device_id: getDeviceId(),
                platform: 'web',
                app_version: '1.0.0',
                os_version: navigator.userAgent,
              })
              onSuccess(data)
            } catch (err) {
              onError(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.')
            }
          },
        })
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          width: 328,
          text: 'continue_with',
        })
        setReady(true)
      })
      .catch(() => onError('Could not load Google Sign-In. Check your connection and try again.'))

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!CLIENT_ID) return null

  return <div ref={buttonRef} className={ready ? '' : 'h-10'} />
}
