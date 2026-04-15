import { useEffect, useState } from 'react'
import {
  deleteNotification,
  getNotifications,
  getUnreadCount,
  markAllRead,
  markRead,
} from '../api/notifications.api.js'

const POLL_MS = 60000

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(0)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const refreshCount = async () => {
    try {
      const data = await getUnreadCount()
      setCount(Number(data?.count || 0))
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    void refreshCount()
    const timer = setInterval(() => void refreshCount(), POLL_MS)
    return () => clearInterval(timer)
  }, [])

  const openPanel = async () => {
    setOpen((v) => !v)
    if (!open) {
      setLoading(true)
      try {
        const data = await getNotifications()
        setItems(Array.isArray(data) ? data : [])
      } finally {
        setLoading(false)
      }
    }
  }

  const onRead = async (id) => {
    await markRead(id)
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, isRead: true } : x)))
    await refreshCount()
  }

  const onReadAll = async () => {
    await markAllRead()
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })))
    await refreshCount()
  }

  const onDelete = async (id) => {
    await deleteNotification(id)
    setItems((prev) => prev.filter((x) => x.id !== id))
    await refreshCount()
  }

  return (
    <div className="relative">
      <button onClick={openPanel} className="relative rounded p-2 hover:bg-[#EEF2FB]" aria-label="Notifications">
        🔔
        {count > 0 ? <span className="absolute right-0 top-0 rounded-full bg-red-500 px-1 text-[10px] text-white">{count}</span> : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-96 rounded border bg-white p-2 shadow">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">Notifications</p>
            <button className="text-xs text-[#1A3263]" onClick={() => void onReadAll()}>Mark all read</button>
          </div>
          {loading ? <p className="p-2 text-xs text-[#5A6E9A]">Loading...</p> : null}
          {!loading && items.length === 0 ? <p className="p-2 text-xs text-[#5A6E9A]">No notifications.</p> : null}
          <div className="max-h-80 overflow-auto">
            {items.map((item) => (
              <div key={item.id} className="mb-1 rounded border p-2 text-xs">
                <p className="font-medium text-[#1A3263]">{item.title}</p>
                <p className="text-[#5A6E9A]">{item.message}</p>
                <div className="mt-1 space-x-2">
                  {!item.isRead ? <button onClick={() => void onRead(item.id)}>Read</button> : null}
                  <button className="text-red-600" onClick={() => void onDelete(item.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
