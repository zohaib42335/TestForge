/**
 * @fileoverview Built-in QA test case templates (partial field presets).
 * Applied fields: module, title, description, preconditions, testSteps, expectedResult,
 * priority, severity, testType. Status, assignedTo, createdBy, dates, etc. stay user-driven.
 */

/**
 * @typedef {Object} TestCaseTemplate
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {Record<string, string>} defaults
 */

/**
 * @type {readonly TestCaseTemplate[]}
 */
export const BUILT_IN_TEMPLATES = Object.freeze([
  {
    id: 'builtin-login',
    name: 'Login Functionality',
    description:
      'Covers successful login, invalid credentials, lockout, and session handling.',
    defaults: {
      module: 'Authentication',
      title: 'User login with valid and invalid credentials',
      description:
        'Validate authentication flows including password policy and error messaging.',
      preconditions:
        'Valid user account exists; application is reachable; browser cache cleared.',
      testSteps:
        '1. Navigate to login page.\n2. Enter valid username and password → Submit.\n3. Verify redirect to dashboard and session cookie/token issued.\n4. Log out.\n5. Enter valid username with wrong password → Submit.\n6. Verify error message and no session created.',
      expectedResult:
        'Valid credentials grant access; invalid credentials are rejected with a clear, non-leaking error; session terminates on logout.',
      priority: 'High',
      severity: 'Major',
      testType: 'Functional',
      environment: 'Staging',
    },
  },
  {
    id: 'builtin-form-validation',
    name: 'Form Validation',
    description:
      'Required fields, format rules, inline errors, and submit blocking for a data entry form.',
    defaults: {
      module: 'UI / Forms',
      title: 'Form field validation and submission rules',
      description:
        'Ensure client-side and server-visible validation behave consistently.',
      preconditions:
        'User has access to the form; test data sets for valid/invalid values prepared.',
      testSteps:
        '1. Open the target form.\n2. Submit empty form → verify required field errors.\n3. Enter invalid email/phone/format per spec → verify inline errors.\n4. Correct all fields → submit.\n5. Verify success state and persisted data (or API 2xx).',
      expectedResult:
        'Invalid data cannot be submitted; messages match spec; valid submission succeeds.',
      priority: 'Medium',
      severity: 'Major',
      testType: 'UI',
      environment: 'Staging',
    },
  },
  {
    id: 'builtin-api-response',
    name: 'API Response Handling',
    description:
      'REST/JSON contracts: status codes, headers, body schema, and error payloads.',
    defaults: {
      module: 'API',
      title: 'API endpoint response and error contract validation',
      description:
        'Verify happy path and representative error responses against API specification.',
      preconditions:
        'API base URL and auth token or key available; Postman/cURL or app UI access.',
      testSteps:
        '1. Call endpoint with valid request → assert HTTP status, required headers, JSON schema.\n2. Call with missing auth → assert 401/403 per spec.\n3. Call with invalid payload → assert 4xx and error body shape.\n4. Call with idempotent token if applicable → assert duplicate behavior.',
      expectedResult:
        'Responses match documented codes and bodies; no stack traces or sensitive data in errors.',
      priority: 'High',
      severity: 'Critical',
      testType: 'Integration',
      environment: 'Staging',
    },
  },
  {
    id: 'builtin-search-filter',
    name: 'Search & Filter',
    description:
      'List views: keyword search, filters, sorting, empty states, and pagination.',
    defaults: {
      module: 'Search',
      title: 'Search and filter results accuracy',
      description:
        'Validate that search terms and filters return correct subsets and performance is acceptable.',
      preconditions:
        'Dataset with known records; user permissions to view list.',
      testSteps:
        '1. Open list view without filters → note total count.\n2. Apply single filter → results ⊆ expected set.\n3. Combine filters + free-text search → results match criteria.\n4. Clear filters → full list restored.\n5. Trigger pagination or infinite scroll → no duplicates; ordering stable.',
      expectedResult:
        'Only matching rows shown; counts consistent; empty state when no matches; no client errors.',
      priority: 'Medium',
      severity: 'Minor',
      testType: 'Functional',
      environment: 'Staging',
    },
  },
  {
    id: 'builtin-regression-smoke',
    name: 'Release Smoke / Regression',
    description:
      'High-level sanity pass after deploy: critical paths still work end-to-end.',
    defaults: {
      module: 'Release',
      title: 'Post-deploy smoke regression on critical journeys',
      description:
        'Fast checklist to catch blocking defects before wider rollout.',
      preconditions:
        'New build deployed to target environment; known good test accounts.',
      testSteps:
        '1. Health check / app loads.\n2. Login journey.\n3. Core transaction or primary workflow (happy path).\n4. Logout.\n5. Spot-check one secondary feature from release notes.',
      expectedResult:
        'No blocking defects; critical paths complete without errors or data corruption.',
      priority: 'High',
      severity: 'Critical',
      testType: 'Smoke',
      environment: 'Staging',
    },
  },
])
