import type { RoastLevel } from '@/types/bean';

export type DegassingStatus = 'degassing' | 'optimal' | 'past_prime';

export interface DegassingInfo {
  status: DegassingStatus;
  label: string;
  daysFromRoast: number;
  degassingEnd: number;
  optimalEnd: number;
  progress: number;
}

const DEGASSING_DEFAULTS: Record<RoastLevel, { degassingEnd: number; optimalEnd: number }> = {
  light: { degassingEnd: 14, optimalEnd: 45 },
  medium_light: { degassingEnd: 10, optimalEnd: 40 },
  medium: { degassingEnd: 8, optimalEnd: 35 },
  medium_dark: { degassingEnd: 7, optimalEnd: 30 },
  dark: { degassingEnd: 5, optimalEnd: 25 },
} as const;

function getDaysFromRoast(roastDate: string): number {
  const roast = new Date(roastDate);
  const now = new Date();
  const diffMs = now.getTime() - roast.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function calculateDegassingStatus(
  roastDate: string | null,
  degassingDays: number | null,
  roastLevel: RoastLevel | null,
): DegassingInfo | null {
  if (!roastDate) return null;

  let degassingEnd: number;
  let optimalEnd: number;

  if (degassingDays !== null) {
    if (degassingDays <= 0) return null;
    degassingEnd = degassingDays;
    optimalEnd = degassingDays * 3;
  } else if (roastLevel) {
    const defaults = DEGASSING_DEFAULTS[roastLevel];
    degassingEnd = defaults.degassingEnd;
    optimalEnd = defaults.optimalEnd;
  } else {
    return null;
  }

  if (optimalEnd <= 0) return null;

  const daysFromRoast = getDaysFromRoast(roastDate);

  let status: DegassingStatus;
  let label: string;

  if (daysFromRoast < degassingEnd) {
    status = 'degassing';
    label = '디게싱 중';
  } else if (daysFromRoast <= optimalEnd) {
    status = 'optimal';
    label = '최적기';
  } else {
    status = 'past_prime';
    label = '신선도↓';
  }

  const progress = Math.min(daysFromRoast / optimalEnd, 1.2);

  return {
    status,
    label,
    daysFromRoast,
    degassingEnd,
    optimalEnd,
    progress,
  };
}
