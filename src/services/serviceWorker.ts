/**
 * Service Worker Registration
 * Handles registration and updates of the service worker
 */

export interface ServiceWorkerRegistrationOptions {
  onUpdateAvailable?: () => void
  onUpdateInstalled?: () => void
  onError?: (error: Error) => void
}

/**
 * Register the service worker
 */
export const registerServiceWorker = async (
  options?: ServiceWorkerRegistrationOptions
): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('[SW] Service workers are not supported in this browser')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })

    console.log('[SW] Service worker registered:', registration.scope)

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (!newWorker) return

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New service worker available
            console.log('[SW] New service worker available')
            options?.onUpdateAvailable?.()
          } else {
            // Service worker installed for the first time
            console.log('[SW] Service worker installed')
            options?.onUpdateInstalled?.()
          }
        }
      })
    })

    // Handle controller change (service worker updated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] Service worker controller changed')
      window.location.reload()
    })

    return registration
  } catch (error) {
    console.error('[SW] Service worker registration failed:', error)
    options?.onError?.(error as Error)
    return null
  }
}

/**
 * Unregister the service worker
 */
export const unregisterServiceWorker = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const result = await registration.unregister()
    console.log('[SW] Service worker unregistered:', result)
    return result
  } catch (error) {
    console.error('[SW] Service worker unregistration failed:', error)
    return false
  }
}

/**
 * Clear all caches
 */
export const clearServiceWorkerCaches = async (): Promise<void> => {
  if (!('caches' in window)) {
    return
  }

  try {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map(name => caches.delete(name)))
    console.log('[SW] All caches cleared')
  } catch (error) {
    console.error('[SW] Failed to clear caches:', error)
  }
}
