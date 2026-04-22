import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getTestCase } from '../api/testCases.api.js'
import TestCaseDetailPanel from '../components/TestCaseDetailPanel.jsx'

/**
 * Route wrapper for test case detail panel.
 *
 * @returns {import('react').ReactNode}
 */
export default function TestCaseDetailPage() {
  const navigate = useNavigate()
  const { projectId, id } = useParams()
  const [testCase, setTestCase] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!projectId || !id) return
    setLoading(true)
    setError('')
    void getTestCase(projectId, id)
      .then((data) => setTestCase(data || null))
      .catch((err) => setError(err?.response?.data?.error?.message || 'Failed to load test case.'))
      .finally(() => setLoading(false))
  }, [projectId, id])

  if (loading) return <div className="mx-auto mt-6 h-32 w-full max-w-5xl animate-pulse rounded-xl bg-[#D6E0F5]" />
  if (error) return <p className="mx-auto mt-6 w-full max-w-5xl rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>

  return (
    <TestCaseDetailPanel
      testCase={testCase}
      onClose={() => navigate(`/projects/${projectId}/test-cases`)}
      onCommentPosted={() => {}}
    />
  )
}
