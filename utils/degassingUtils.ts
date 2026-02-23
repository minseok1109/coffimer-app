export type DegassingStatus = 'degassing' | 'completed';

export interface DegassingInfo {
  status: DegassingStatus;
  remainingDays: number;
  daysFromRoast: number;
}

function getDaysFromRoast(roastDate: string): number {
  const roast = new Date(roastDate);
  const now = new Date();
  const diffMs = now.getTime() - roast.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function calculateDegassingStatus(
  roastDate: string | null,
  degassingDays: number | null,
): DegassingInfo | null {
  if (!roastDate || degassingDays === null || degassingDays <= 0) return null;

  const daysFromRoast = getDaysFromRoast(roastDate);
  const remainingDays = degassingDays - daysFromRoast;

  return {
    status: remainingDays > 0 ? 'degassing' : 'completed',
    remainingDays: Math.max(remainingDays, 0),
    daysFromRoast,
  };
}
