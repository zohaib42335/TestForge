/**
 * @fileoverview Form validation for test case objects.
 */

import {
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  SEVERITY_OPTIONS,
  TEST_TYPE_OPTIONS,
} from '../constants/testCaseFields.js'

/**
 * @param {unknown} value
 * @returns {string}
 */
function asTrimmedString(value) {
  if (value == null) return ''
  return String(value).trim()
}

/**
 * Returns true if `s` is a non-empty `YYYY-MM-DD` string that matches a real calendar date.
 * @param {string} s
 * @returns {boolean}
 */
function isValidIsoDateString(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return false
  return true
}

/**
 * Validates a test case form object.
 * @param {Object} formData
 * @returns {{ isValid: boolean, errors: Object<string, string> }}
 */
export function validateTestCase(formData) {
  /** @type {Object<string, string>} */
  const errors = {}

  if (!formData || typeof formData !== 'object') {
    return { isValid: false, errors: { _form: 'Invalid form data.' } }
  }

  const title = asTrimmedString(formData.title)
  if (!title) {
    errors.title = 'Title is required.'
  } else if (title.length < 5) {
    errors.title = 'Title must be at least 5 characters.'
  } else if (title.length > 200) {
    errors.title = 'Title must be at most 200 characters.'
  }

  const module = asTrimmedString(formData.module)
  if (!module) {
    errors.module = 'Module is required.'
  }

  const createdBy = asTrimmedString(formData.createdBy)
  if (!createdBy) {
    errors.createdBy = 'Created by is required.'
  }

  const testSteps = asTrimmedString(formData.testSteps)
  if (!testSteps) {
    errors.testSteps = 'Test steps are required.'
  } else if (testSteps.length < 10) {
    errors.testSteps = 'Test steps must be at least 10 characters.'
  }

  const expectedResult = asTrimmedString(formData.expectedResult)
  if (!expectedResult) {
    errors.expectedResult = 'Expected result is required.'
  } else if (expectedResult.length < 5) {
    errors.expectedResult = 'Expected result must be at least 5 characters.'
  }

  const priority = asTrimmedString(formData.priority)
  if (!PRIORITY_OPTIONS.includes(priority)) {
    errors.priority = `Priority must be one of: ${PRIORITY_OPTIONS.join(', ')}.`
  }

  const status = asTrimmedString(formData.status)
  if (!STATUS_OPTIONS.includes(status)) {
    errors.status = `Status must be one of: ${STATUS_OPTIONS.join(', ')}.`
  }

  const severity = asTrimmedString(formData.severity)
  if (!SEVERITY_OPTIONS.includes(severity)) {
    errors.severity = `Severity must be one of: ${SEVERITY_OPTIONS.join(', ')}.`
  }

  const testType = asTrimmedString(formData.testType)
  if (!TEST_TYPE_OPTIONS.includes(testType)) {
    errors.testType = `Test type must be one of: ${TEST_TYPE_OPTIONS.join(', ')}.`
  }

  const createdDate = asTrimmedString(formData.createdDate)
  if (!createdDate) {
    errors.createdDate = 'Created date is required.'
  } else if (!isValidIsoDateString(createdDate)) {
    errors.createdDate = 'Created date must be a valid date in YYYY-MM-DD format.'
  }

  const executionDateRaw = formData.executionDate
  const executionDate =
    executionDateRaw == null ? '' : String(executionDateRaw).trim()
  if (executionDate && !isValidIsoDateString(executionDate)) {
    errors.executionDate =
      'Execution date must be empty or a valid date in YYYY-MM-DD format.'
  }

  const isValid = Object.keys(errors).length === 0
  return { isValid, errors }
}
