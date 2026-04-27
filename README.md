# TestForge

QA test case manager with projects, suites, cases, runs, reports, and team management.

## Google Sign-In setup (invite-only)

This repo supports **Sign in with Google** using **Google Identity Services**.  
Google sign-in is **restricted to existing users or invited emails**.

### 1) Create Google OAuth client

In Google Cloud Console:
- Create an OAuth 2.0 Client ID (Web application)
- Add **Authorized JavaScript origins**:
  - `http://localhost:5173`
  - Your deployed frontend origin (matches backend `FRONTEND_URL`)

### 2) Configure environment variables

Frontend (Vite):
- `VITE_GOOGLE_CLIENT_ID` = your Google OAuth client id

Backend:
- `GOOGLE_CLIENT_ID` = the same Google OAuth client id

### 3) Behavior

- If the email already exists in your company, Google sign-in logs the user in.
- If the email has a pending invitation, Google sign-in creates the user in the invited company and marks the invitation accepted.
- If the email is neither an existing user nor invited, the login is rejected.
