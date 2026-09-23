// sportis Service Worker – Web Push Notifications

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'sportis', body: event.data.text() }
  }

  const {
    title = 'sportis',
    body = '',
    url = '/',
    icon = '/favicon.ico',
    badge = '/favicon.ico',
  } = payload

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      data: { url },
      vibrate: [100, 50, 100],
      requireInteraction: false,
    })
  )
})

function resolveNotificationUrl(rawUrl) {
  try {
    const url = new URL(rawUrl || '/', self.location.origin)
    if (url.origin !== self.location.origin) return `${self.location.origin}/`
    return url.href
  } catch {
    return `${self.location.origin}/`
  }
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const absoluteUrl = resolveNotificationUrl(event.notification.data?.url)

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          let clientUrl
          try {
            clientUrl = new URL(client.url)
          } catch {
            continue
          }

          if (clientUrl.origin === self.location.origin && 'focus' in client) {
            client.navigate(absoluteUrl)
            return client.focus()
          }
        }
        if (clients.openWindow) return clients.openWindow(absoluteUrl)
      })
  )
})
