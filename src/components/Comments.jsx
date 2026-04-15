import { useEffect, useMemo, useState } from 'react'
import { addComment, deleteComment, editComment, getComments } from '../api/comments.api.js'
import { useToast } from './Toast.jsx'

const POLL_MS = 30000

export default function Comments({ testCaseId, onPosted, hideHeader = false, onThreadSizeChange }) {
  const showToast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState('')
  const [draft, setDraft] = useState('')
  const [postType, setPostType] = useState('COMMENT')
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')

  const refetch = async () => {
    if (!testCaseId) return
    setLoading(true)
    try {
      const data = await getComments(testCaseId, type || undefined)
      const next = Array.isArray(data) ? data : []
      setItems(next)
      onThreadSizeChange?.(next.length)
    } catch (err) {
      showToast(err?.response?.data?.error?.message || err?.message || 'Failed to load comments.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refetch()
    const timer = setInterval(() => void refetch(), POLL_MS)
    return () => clearInterval(timer)
  }, [testCaseId, type])

  const submit = async () => {
    if (!draft.trim()) return
    try {
      await addComment(testCaseId, { text: draft.trim(), type: postType })
      setDraft('')
      await refetch()
      onPosted?.()
    } catch (err) {
      showToast(err?.response?.data?.error?.message || err?.message || 'Failed to add comment.', 'error')
    }
  }

  const saveEdit = async () => {
    if (!editingId || !editingText.trim()) return
    try {
      await editComment(editingId, editingText.trim())
      setEditingId(null)
      setEditingText('')
      await refetch()
      onPosted?.()
    } catch (err) {
      showToast(err?.response?.data?.error?.message || err?.message || 'Failed to edit comment.', 'error')
    }
  }

  const remove = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return
    try {
      await deleteComment(commentId)
      await refetch()
      onPosted?.()
    } catch (err) {
      showToast(err?.response?.data?.error?.message || err?.message || 'Failed to delete comment.', 'error')
    }
  }

  const count = useMemo(() => items.length, [items])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {!hideHeader ? <h3 className="text-sm font-semibold text-[#1A3263]">Comments ({count})</h3> : null}
      <div className="flex gap-2">
        <select className="rounded border px-2 py-1 text-xs" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All</option>
          <option value="COMMENT">Comments</option>
          <option value="NOTE">Notes</option>
          <option value="FAILURE">Failures</option>
          <option value="QUESTION">Questions</option>
        </select>
        <select className="rounded border px-2 py-1 text-xs" value={postType} onChange={(e) => setPostType(e.target.value)}>
          <option value="COMMENT">Comment</option>
          <option value="NOTE">Note</option>
          <option value="FAILURE">Failure</option>
          <option value="QUESTION">Question</option>
        </select>
      </div>
      <div className="min-h-[120px] flex-1 space-y-2 overflow-y-auto rounded border border-[#B0C0E0] bg-white p-2">
        {loading ? <p className="text-xs text-[#5A6E9A]">Loading...</p> : null}
        {!loading && items.length === 0 ? <p className="text-xs text-[#5A6E9A]">No comments.</p> : null}
        {items.map((item) => (
          <div key={item.id} className="rounded border p-2">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-[#1A3263]">{item.authorDisplayName || 'Unknown'}</span>
              <span className="text-[#5A6E9A]">{item.type}</span>
            </div>
            {editingId === item.id ? (
              <div className="space-y-2">
                <textarea className="w-full rounded border p-1 text-xs" value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                <div className="space-x-2 text-xs">
                  <button onClick={saveEdit}>Save</button>
                  <button onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-[#1A3263]">{item.text}</p>
                <div className="mt-1 space-x-2 text-xs">
                  <button onClick={() => { setEditingId(item.id); setEditingText(item.text || '') }}>Edit</button>
                  <button className="text-red-600" onClick={() => remove(item.id)}>Delete</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      <textarea
        className="w-full rounded border p-2 text-xs"
        rows={3}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Write a comment..."
      />
      <div className="flex justify-end">
        <button onClick={submit} className="rounded bg-[#1A3263] px-3 py-1 text-xs text-white">Post Comment</button>
      </div>
    </div>
  )
}
