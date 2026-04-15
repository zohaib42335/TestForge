export const PLAN_LIMITS = {
  FREE: {
    maxProjects: 1,
    maxUsers: 3,
    maxTestCasesPerProject: 50,
  },
  STARTER: {
    maxProjects: 5,
    maxUsers: 10,
    maxTestCasesPerProject: 500,
  },
  PROFESSIONAL: {
    maxProjects: 20,
    maxUsers: 50,
    maxTestCasesPerProject: 999999,
  },
  ENTERPRISE: {
    maxProjects: 999999,
    maxUsers: 999999,
    maxTestCasesPerProject: 999999,
  },
} as const;
