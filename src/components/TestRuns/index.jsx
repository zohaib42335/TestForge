/**
 * @fileoverview TestRuns — main controller component.
 * Switches between RunsList and ExecutionMode based on whether a run is being executed.
 */

import { useState } from 'react'
import { useProjectContext } from '../../context/ProjectContext.jsx'
import ExecutionMode from './ExecutionMode.jsx'
import RunsList from './RunsList.jsx'

/**
 * @param {Object} props
 * @param {Array<Record<string, unknown>>} props.testCases
 * @param {boolean} props.testCasesLoading
 */
export default function TestRuns({ testCases, testCasesLoading }) {
  const { activeProject } = useProjectContext()
  const [activeRunId, setActiveRunId] = useState(/** @type {string|null} */ (null))
  const projectId = activeProject?.id || null

  if (activeRunId) {
    return (
      <ExecutionMode projectId={projectId} runId={activeRunId} onExit={() => setActiveRunId(null)} />
    )
  }

  return (
    <RunsList
      testCases={testCases}
      testCasesLoading={testCasesLoading}
      projectId={projectId}
      onExecute={(runId) => setActiveRunId(runId)}
    />
  )
}
