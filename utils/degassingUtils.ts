export type DegassingStatus = 'degassing' | 'completed';

export interface DegassingInfo {
  status: DegassingStatus;
  remainingDays: number;
  daysFromRoast: number;
}

export const DEGASSING_NOTIFICATION_HOUR = 9;

/**
 * Parse a YYYY-MM-DD string to a Date at local midnight.
 * Returns null for invalid format, impossible dates, or null input.
 */
export function parseLocalDate(dateString: string | null): Date | null {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  // Check exact format YYYY-MM-DD
  const formatRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!formatRegex.test(dateString)) {
    return null;
  }

  const parts = dateString.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  // Basic range checks
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  // Construct at local midnight (not UTC) so calendar day matches the device timezone
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);

  // Validate by round-tripping: if the constructed date doesn't match the input,
  // it means the date was impossible (e.g., Feb 30)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
}

/**
 * Calculate the completion date and time for degassing notification.
 * Returns Date at local 09:00 on completion day, or null if inputs are invalid.
 */
export function getDegassingCompletionAt(
  roastDate: string | null,
  degassingDays: number | null,
): Date | null {
  // Validate roastDate
  if (roastDate === null) {
    return null;
  }

  const roastDateParsed = parseLocalDate(roastDate);
  if (!roastDateParsed) {
    return null;
  }

  // Validate degassingDays
  if (degassingDays === null) {
    return null;
  }

  // Must be integer
  if (!Number.isInteger(degassingDays)) {
    return null;
  }

  // Must be > 0 and <= 365
  if (degassingDays <= 0 || degassingDays > 365) {
    return null;
  }

  // Calculate completion date by adding degassingDays to roastDate
  const completionDate = new Date(roastDateParsed);
  completionDate.setDate(completionDate.getDate() + degassingDays);

  // Set time to 09:00:00.000 local
  completionDate.setHours(DEGASSING_NOTIFICATION_HOUR, 0, 0, 0);

  return completionDate;
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
