/**
 * @fileoverview Central definitions for test case field options and default form values
 * used by forms, validation, export, and Google Sheets sync.
 */

/**
 * Allowed priority values for a test case.
 * @type {readonly string[]}
 */
export const PRIORITY_OPTIONS = ['High', 'Medium', 'Low']

/**
 * Allowed execution status values for a test case.
 * @type {readonly string[]}
 */
export const STATUS_OPTIONS = ['Not Executed', 'Pass', 'Fail', 'Blocked']

/**
 * Allowed severity values for a test case.
 * @type {readonly string[]}
 */
export const SEVERITY_OPTIONS = ['Critical', 'Major', 'Minor', 'Trivial']

/**
 * Allowed test type / category values.
 * @type {readonly string[]}
 */
export const TEST_TYPE_OPTIONS = [
  'Functional',
  'Regression',
  'Smoke',
  'Sanity',
  'Integration',
  'UI',
  'Performance',
  'Security',
  'Exploratory',
]

/**
 * Allowed environment values.
 * @type {readonly string[]}
 */
export const ENVIRONMENT_OPTIONS = ['Development', 'Staging', 'UAT', 'Production']

/**
 * Returns today's calendar date in ISO `YYYY-MM-DD` format (local timezone).
 * @returns {string}
 */
function getTodayIsoDate() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Default / empty shape for the test case form. Used when creating a new test case
 * or resetting the form. `testCaseId` is left empty and filled by the app when saving.
 * `createdDate` defaults to today (`YYYY-MM-DD`) at module evaluation time.
 *
 * @type {Readonly<{
 *   testCaseId: string,
 *   module: string,
 *   title: string,
 *   description: string,
 *   preconditions: string,
 *   testSteps: string,
 *   expectedResult: string,
 *   actualResult: string,
 *   status: string,
 *   priority: string,
 *   severity: string,
 *   testType: string,
 *   environment: string,
 *   assignedTo: string,
 *   createdBy: string,
 *   createdDate: string,
 *   executionDate: string,
 *   comments: string,
 *   automationStatus: string,
 *   bugId: string
 * }>}
 */
export const DEFAULT_FORM_VALUES = Object.freeze({
  testCaseId: '',
  module: '',
  title: '',
  description: '',
  preconditions: '',
  testSteps: '',
  expectedResult: '',
  actualResult: '',
  status: 'Not Executed',
  priority: 'Medium',
  severity: 'Minor',
  testType: 'Functional',
  environment: 'Staging',
  assignedTo: '',
  createdBy: '',
  createdDate: getTodayIsoDate(),
  executionDate: '',
  comments: '',
  automationStatus: 'Manual',
  bugId: '',
})
