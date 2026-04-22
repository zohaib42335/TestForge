import { useCallback, useEffect, useMemo, useState } from 'react'
import InviteModal from '../components/InviteModal.jsx'
import {
  cancelInvitation,
  deactivateUser,
  getCompanyUsers,
  getPendingInvitations,
  resendInvitation,
  updateUserRole,
} from '../api/users.api.js'
import { useAuth } from '../context/AuthContext.jsx'
import usePlanLimits from '../hooks/usePlanLimits.js'
import PlanLimitModal from '../components/PlanLimitModal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'

const ROLE_BADGE = {
  ADMIN: 'bg-[#EEF2FB] text-[#1A3263]',
  QA_MANAGER: 'bg-green-100 text-green-700',
  TESTER: 'bg-blue-100 text-blue-700',
  VIEWER: 'bg-gray-100 text-gray-700',
}

export default function TeamPage() {
  const { currentUser, isAdmin } = useAuth()
  const { isAtLimit, usage } = usePlanLimits()
  const [members, setMembers] = useState([])
  const [pendingInvitations, setPendingInvitations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [removeUserId, setRemoveUserId] = useState('')
  const [cancelInviteId, setCancelInviteId] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [users, invites] = await Promise.all([
        getCompanyUsers(),
        getPendingInvitations(),
      ])
      setMembers(Array.isArray(users) ? users : [])
      setPendingInvitations(Array.isArray(invites) ? invites : [])
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Could not load team data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const memberRows = useMemo(() => members, [members])
  const pendingRows = useMemo(() => pendingInvitations, [pendingInvitations])
  const pendingInviteByEmail = useMemo(
    () => new Map(pendingInvitations.map((invite) => [String(invite.email || '').toLowerCase(), invite])),
    [pendingInvitations],
  )

  const handleRoleChange = async (userId, role) => {
    try {
      await updateUserRole(userId, role)
      await loadData()
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Could not update role.')
    }
  }

  const handleRemove = async (userId) => {
    try {
      await deactivateUser(userId)
      await loadData()
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Could not remove user.')
    }
  }

  const handleResend = async (invitationId) => {
    try {
      await resendInvitation(invitationId)
      await loadData()
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Could not resend invitation.')
    }
  }

  const handleCancelInvite = async (invitationId) => {
    try {
      await cancelInvitation(invitationId)
      await loadData()
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Could not cancel invitation.')
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#1A3263]">Team Management</h1>
        {isAdmin ? (
          <button
            type="button"
            onClick={() => {
              if (isAtLimit.users) {
                setShowLimitModal(true)
              } else {
                setInviteOpen(true)
              }
            }}
            className="rounded-lg bg-[#1A3263] px-4 py-2 text-sm font-semibold text-white hover:bg-[#122247]"
          >
            Invite Member
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <p>{error}</p>
          <button type="button" onClick={() => void loadData()} className="mt-2 underline">Try Again</button>
        </div>
      ) : null}
      {loading ? <div className="mb-4 h-16 animate-pulse rounded-xl bg-[#D6E0F5]" /> : null}

      <div className="rounded-xl border border-[#D7E2F5] bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-[#1A3263]">Team Members</h2>
        <div className="overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[#53698F]">
              <tr>
                <th className="py-2 pr-3">Avatar</th>
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Role</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Joined</th>
                <th className="py-2 pr-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {memberRows.map((member) => {
                const isMe = member.id === currentUser?.id
                const inviteForMember = pendingInviteByEmail.get(String(member.email || '').toLowerCase())
                return (
                  <tr key={member.id} className={isMe ? 'bg-[#EEF2FB]' : 'border-t border-[#EEF2FB]'}>
                    <td className="py-2 pr-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1A3263] text-xs font-semibold text-white">
                        {(member.displayName || member.email || '?').charAt(0).toUpperCase()}
                      </div>
                    </td>
                    <td className="py-2 pr-3">{member.displayName}</td>
                    <td className="py-2 pr-3">{member.email}</td>
                    <td className="py-2 pr-3">
                      {isAdmin ? (
                        <select
                          value={member.role}
                          onChange={(event) => void handleRoleChange(member.id, event.target.value)}
                          disabled={isMe}
                          className="rounded-md border border-[#C8D7F1] px-2 py-1 disabled:opacity-70"
                        >
                          <option value="ADMIN">Admin</option>
                          <option value="QA_MANAGER">QA Manager</option>
                          <option value="TESTER">Tester</option>
                          <option value="VIEWER">Viewer</option>
                        </select>
                      ) : (
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${ROLE_BADGE[member.role] || 'bg-[#EEF2FB] text-[#1A3263]'}`}>
                          {member.role}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-3">{member.isActive ? 'Active' : 'Pending'}</td>
                    <td className="py-2 pr-3">
                      {new Date(member.createdAt).toLocaleDateString()}
                      {isMe ? <span className="ml-2 text-xs text-[#5A6E9A]">(You)</span> : null}
                    </td>
                    <td className="py-2 pr-3">
                      {isAdmin && !isMe ? (
                        <div className="flex gap-3">
                          {!member.isActive && inviteForMember ? (
                            <button
                              type="button"
                              onClick={() => void handleResend(inviteForMember.id)}
                              className="text-sm font-medium text-[#1A3263] hover:underline"
                            >
                              Resend Invite
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setRemoveUserId(member.id)}
                            className="text-sm font-medium text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-[#D7E2F5] bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-[#1A3263]">Pending Invitations</h2>
        <div className="overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[#53698F]">
              <tr>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Role</th>
                <th className="py-2 pr-3">Invited by</th>
                <th className="py-2 pr-3">Expires</th>
                <th className="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingRows.map((invite) => (
                <tr key={invite.id} className="border-t border-[#EEF2FB]">
                  <td className="py-2 pr-3">{invite.email}</td>
                  <td className="py-2 pr-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${ROLE_BADGE[invite.role] || 'bg-[#EEF2FB] text-[#1A3263]'}`}>
                      {invite.role}
                    </span>
                  </td>
                  <td className="py-2 pr-3">{invite.invitedBy?.displayName || 'Unknown'}</td>
                  <td className="py-2 pr-3">{new Date(invite.expiresAt).toLocaleString()}</td>
                  <td className="py-2 pr-3">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => void handleResend(invite.id)}
                        className="text-[#1A3263] hover:underline"
                      >
                        Resend
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancelInviteId(invite.id)}
                        className="text-red-600 hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={loadData}
      />
      <PlanLimitModal
        open={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        limitType="users"
        used={usage.users.used}
        max={usage.users.max}
      />
      <ConfirmDialog
        open={Boolean(removeUserId)}
        title="Are you sure?"
        description="This user will be removed from your company."
        confirmLabel="Remove User"
        confirmVariant="danger"
        onCancel={() => setRemoveUserId('')}
        onConfirm={async () => {
          if (!removeUserId) return
          await handleRemove(removeUserId)
          setRemoveUserId('')
        }}
      />
      <ConfirmDialog
        open={Boolean(cancelInviteId)}
        title="Are you sure?"
        description="This pending invitation will be cancelled."
        confirmLabel="Cancel Invitation"
        confirmVariant="primary"
        onCancel={() => setCancelInviteId('')}
        onConfirm={async () => {
          if (!cancelInviteId) return
          await handleCancelInvite(cancelInviteId)
          setCancelInviteId('')
        }}
      />
    </div>
  )
}
