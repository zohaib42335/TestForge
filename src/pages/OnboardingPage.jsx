import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createProject } from '../api/projects.api.js'
import { inviteUser } from '../api/users.api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useProject } from '../hooks/useProject.js'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { refetchProjects } = useProject()
  const [step, setStep] = useState(1)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('TESTER')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const createFirstProject = async () => {
    setLoading(true)
    setError('')
    try {
      await createProject({
        name: projectName.trim(),
        description: projectDescription.trim() || undefined,
      })
      await refetchProjects()
      setStep(2)
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Could not create project.')
    } finally {
      setLoading(false)
    }
  }

  const sendInvite = async () => {
    if (!inviteEmail.trim()) {
      setStep(3)
      return
    }

    setLoading(true)
    setError('')
    try {
      await inviteUser({ email: inviteEmail.trim(), role: inviteRole })
      setStep(3)
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Could not send invitation.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#EEF2FB] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl border border-[#D5E0F3] bg-white p-8 shadow-sm">
        {step === 1 ? (
          <>
            <h1 className="text-3xl font-semibold text-[#1A3263]">
              Welcome to TestForge, {currentUser?.displayName || 'there'}!
            </h1>
            <p className="mt-2 text-sm text-[#4D628C]">Create your first project to get started.</p>
            <div className="mt-5 space-y-4">
              <input
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="Project name"
                className="w-full rounded-lg border border-[#C8D7F1] px-3 py-2 outline-none focus:border-[#1A3263]"
              />
              <textarea
                value={projectDescription}
                onChange={(event) => setProjectDescription(event.target.value)}
                placeholder="Description (optional)"
                className="h-28 w-full rounded-lg border border-[#C8D7F1] px-3 py-2 outline-none focus:border-[#1A3263]"
              />
            </div>
            {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
            <button
              type="button"
              disabled={!projectName.trim() || loading}
              onClick={() => void createFirstProject()}
              className="mt-5 rounded-lg bg-[#1A3263] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#122247] disabled:opacity-70"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h2 className="text-2xl font-semibold text-[#1A3263]">Invite your team</h2>
            <p className="mt-2 text-sm text-[#4D628C]">This is optional. You can skip this step.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <input
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="Email"
                className="sm:col-span-2 rounded-lg border border-[#C8D7F1] px-3 py-2 outline-none focus:border-[#1A3263]"
              />
              <select
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value)}
                className="rounded-lg border border-[#C8D7F1] bg-white px-3 py-2 outline-none focus:border-[#1A3263]"
              >
                <option value="QA_MANAGER">QA Manager</option>
                <option value="TESTER">Tester</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>
            {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => void sendInvite()}
                disabled={loading}
                className="rounded-lg bg-[#1A3263] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#122247] disabled:opacity-70"
              >
                {loading ? 'Processing...' : 'Continue'}
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="rounded-lg border border-[#C8D7F1] px-4 py-2.5 text-sm font-semibold text-[#1A3263]"
              >
                Skip
              </button>
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <h2 className="text-2xl font-semibold text-[#1A3263]">You're ready!</h2>
            <p className="mt-2 text-sm text-[#4D628C]">
              Your workspace is set up. You can now manage projects, test cases, and your team.
            </p>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="mt-6 rounded-lg bg-[#1A3263] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#122247]"
            >
              Go to Dashboard
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}
