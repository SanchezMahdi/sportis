import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

const isSupported =
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  !!VAPID_PUBLIC_KEY

export function usePushNotifications(user) {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  )
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isSupported) return
    navigator.serviceWorker.register('/sw.js').catch((err) =>
      console.warn('SW registration failed:', err)
    )
  }, [])

  useEffect(() => {
    if (!user || !isSupported) return
    checkSubscription()
  }, [user])

  const checkSubscription = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      if (!existing) { setSubscribed(false); return }
      const { data } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('endpoint', existing.endpoint)
        .maybeSingle()
      setSubscribed(!!data)
    } catch {
      setSubscribed(false)
    }
  }, [user])

  // Returns 'ok' | 'denied' | 'default' | 'error'
  const subscribe = useCallback(async () => {
    if (!isSupported || !user) return 'error'
    setLoading(true)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)

      if (perm === 'denied') return 'denied'
      if (perm !== 'granted') return 'default' // Chrome quiet mode: dialog suppressed

      let reg
      try {
        reg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('SW ready timeout')), 8000)
          ),
        ])
      } catch (err) {
        console.error('Service Worker not ready:', err)
        return 'error'
      }

      let sub
      try {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })
      } catch (err) {
        console.error('PushManager.subscribe failed:', err)
        return 'error'
      }

      const json = sub.toJSON()
      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          user_id: user.id,
          endpoint: json.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
        },
        { onConflict: 'user_id,endpoint' }
      )
      if (error) {
        console.error('Push subscription DB save failed:', error)
        await sub.unsubscribe().catch(() => {})
        return 'error'
      }

      setSubscribed(true)
      return 'ok'
    } catch (err) {
      console.error('Push subscribe unexpected error:', err)
      return 'error'
    } finally {
      setLoading(false)
    }
  }, [user])

  const unsubscribe = useCallback(async () => {
    if (!isSupported || !user) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', sub.endpoint)
        await sub.unsubscribe()
      }
      setSubscribed(false)
    } catch (err) {
      console.error('Push unsubscribe error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  return { supported: isSupported, permission, subscribed, loading, subscribe, unsubscribe }
}
