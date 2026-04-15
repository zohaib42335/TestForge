import { PrismaService } from '../../prisma/prisma.service';

/**
 * Generate next test case ID for a project
 * Queries existing IDs and increments
 */
export async function generateTestCaseId(
  prisma: PrismaService,
  projectId: string,
): Promise<string> {
  const cases = await prisma.testCase.findMany({
    where: { projectId },
    select: { testCaseId: true },
  });

  const nums = cases
    .map((c) => parseInt(c.testCaseId.replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n));

  const max = nums.length > 0 ? Math.max(...nums) : 0;

  return `TC-${String(max + 1).padStart(3, '0')}`;
}
