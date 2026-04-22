import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { getCompanyUsers } from '../api/users.api.js'
import { getSuites } from '../api/testSuites.api.js'
import { createTestCase, getTestCase, updateTestCase } from '../api/testCases.api.js'
import TestCaseForm from '../components/TestCaseForm.jsx'
import usePermissions from '../hooks/usePermissions.js'

/**
 * Route page for creating and editing test cases.
 *
 * @returns {import('react').ReactNode}
 */
export default function TestCaseFormPage() {
  const navigate = useNavigate()
  const { projectId, id } = useParams()
  const { can } = usePermissions()
  const mode = id ? 'edit' : 'create'
  const permission = id ? 'editTestCase' : 'createTestCase'

  const [initialValues, setInitialValues] = useState({})
  const [suites, setSuites] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(Boolean(id))
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!projectId) return
    void getSuites(projectId).then((data) => setSuites(Array.isArray(data) ? data : []))
    void getCompanyUsers().then((data) => setMembers(Array.isArray(data) ? data : []))
  }, [projectId])

  useEffect(() => {
    if (!projectId || !id) return
    setLoading(true)
    void getTestCase(projectId, id)
      .then((data) => {
        setInitialValues({
          ...data,
          suiteId: data?.suiteId || '',
          assignedToId: data?.assignedToId || '',
          testSteps: Array.isArray(data?.testSteps)
            ? data.testSteps.map((row) => ({
                step: row.action || row.step || '',
                expected: row.expectedResult || row.expected || '',
              }))
            : [{ step: '', expected: '' }],
        })
      })
      .finally(() => setLoading(false))
  }, [projectId, id])

  if (!can(permission)) return <Navigate to="/403" replace />

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      {loading ? (
        <div className="h-32 animate-pulse rounded-xl bg-[#D6E0F5]" />
      ) : (
        <TestCaseForm
          mode={mode}
          initialValues={initialValues}
          suites={suites}
          members={members}
          isSubmitting={busy}
          onCancel={() => navigate(`/projects/${projectId}/test-cases`)}
          onSubmit={async (payload) => {
            setBusy(true)
            try {
              if (mode === 'edit') {
                await updateTestCase(projectId, id, payload)
              } else {
                await createTestCase(projectId, payload)
              }
              navigate(`/projects/${projectId}/test-cases`)
            } finally {
              setBusy(false)
            }
          }}
        />
      )}
    </div>
  )
}
