import {
  calculateDegassingStatus,
  getDegassingCompletionAt,
  parseLocalDate,
  DEGASSING_NOTIFICATION_HOUR,
} from '../degassingUtils';

describe('degassingUtils', () => {
  describe('parseLocalDate', () => {
    describe('Given invalid inputs', () => {
      it('When input is null, Then return null', () => {
        const result = parseLocalDate(null);
        expect(result).toBeNull();
      });

      it('When input format is invalid (not YYYY-MM-DD), Then return null', () => {
        expect(parseLocalDate('2026/01/01')).toBeNull();
        expect(parseLocalDate('01-01-2026')).toBeNull();
        expect(parseLocalDate('2026-1-1')).toBeNull();
        expect(parseLocalDate('2026-01')).toBeNull();
        expect(parseLocalDate('not-a-date')).toBeNull();
      });

      it('When date is impossible (e.g. 2026-02-30), Then return null', () => {
        expect(parseLocalDate('2026-02-30')).toBeNull();
        expect(parseLocalDate('2026-04-31')).toBeNull();
        expect(parseLocalDate('2025-02-29')).toBeNull(); // 2025 is not a leap year
      });
    });

    describe('Given valid YYYY-MM-DD date', () => {
      it('When parsing 2026-01-01, Then return Date at local midnight', () => {
        const result = parseLocalDate('2026-01-01');
        expect(result).not.toBeNull();
        expect(result!.getFullYear()).toBe(2026);
        expect(result!.getMonth()).toBe(0); // January = 0
        expect(result!.getDate()).toBe(1);
        expect(result!.getHours()).toBe(0);
        expect(result!.getMinutes()).toBe(0);
        expect(result!.getSeconds()).toBe(0);
        expect(result!.getMilliseconds()).toBe(0);
      });

      it('When parsing 2026-12-31, Then return Date at local midnight', () => {
        const result = parseLocalDate('2026-12-31');
        expect(result).not.toBeNull();
        expect(result!.getFullYear()).toBe(2026);
        expect(result!.getMonth()).toBe(11); // December = 11
        expect(result!.getDate()).toBe(31);
        // Load-bearing in UTC+ zones: UTC parsing lands on 2026-12-31T00:00Z,
        // which reads back as 09:00 local in KST.
        expect(result!.getHours()).toBe(0);
      });

      it('When parsing leap year date 2024-02-29, Then return valid Date', () => {
        const result = parseLocalDate('2024-02-29');
        expect(result).not.toBeNull();
        expect(result!.getFullYear()).toBe(2024);
        expect(result!.getMonth()).toBe(1);
        expect(result!.getDate()).toBe(29);
        expect(result!.getHours()).toBe(0);
      });
    });
  });

  describe('DEGASSING_NOTIFICATION_HOUR', () => {
    it('When imported, Then equals 9', () => {
      expect(DEGASSING_NOTIFICATION_HOUR).toBe(9);
    });
  });

  describe('getDegassingCompletionAt', () => {
    describe('Given null or invalid inputs', () => {
      it('When roastDate is null, Then return null', () => {
        const result = getDegassingCompletionAt(null, 14);
        expect(result).toBeNull();
      });

      it('When degassingDays is null, Then return null', () => {
        const result = getDegassingCompletionAt('2026-01-01', null);
        expect(result).toBeNull();
      });

      it('When roastDate is malformed, Then return null', () => {
        const result = getDegassingCompletionAt('2026/01/01', 14);
        expect(result).toBeNull();
      });

      it('When roastDate is impossible date, Then return null', () => {
        const result = getDegassingCompletionAt('2026-02-30', 14);
        expect(result).toBeNull();
      });

      it('When degassingDays is 0, Then return null', () => {
        const result = getDegassingCompletionAt('2026-01-01', 0);
        expect(result).toBeNull();
      });

      it('When degassingDays is negative, Then return null', () => {
        const result = getDegassingCompletionAt('2026-01-01', -1);
        expect(result).toBeNull();
      });

      it('When degassingDays is not an integer, Then return null', () => {
        const result = getDegassingCompletionAt('2026-01-01', 14.5);
        expect(result).toBeNull();
      });

      it('When degassingDays exceeds 365, Then return null', () => {
        const result = getDegassingCompletionAt('2026-01-01', 366);
        expect(result).toBeNull();
      });
    });

    describe('Given valid inputs', () => {
      it('When roastDate is 2026-01-01 and degassingDays is 14, Then return 2026-01-15 at 09:00:00.000 local', () => {
        const result = getDegassingCompletionAt('2026-01-01', 14);
        expect(result).not.toBeNull();
        expect(result!.getFullYear()).toBe(2026);
        expect(result!.getMonth()).toBe(0);
        expect(result!.getDate()).toBe(15);
        expect(result!.getHours()).toBe(9);
        expect(result!.getMinutes()).toBe(0);
        expect(result!.getSeconds()).toBe(0);
        expect(result!.getMilliseconds()).toBe(0);
      });

      it('When roastDate is 2026-01-01 and degassingDays is 1, Then return 2026-01-02 at 09:00:00.000 local', () => {
        const result = getDegassingCompletionAt('2026-01-01', 1);
        expect(result).not.toBeNull();
        expect(result!.getDate()).toBe(2);
        expect(result!.getHours()).toBe(9);
      });

      it('When adding days crosses month boundary, Then calculate correctly', () => {
        const result = getDegassingCompletionAt('2026-01-28', 5);
        expect(result).not.toBeNull();
        expect(result!.getFullYear()).toBe(2026);
        expect(result!.getMonth()).toBe(1); // February
        expect(result!.getDate()).toBe(2);
        expect(result!.getHours()).toBe(9);
      });

      it('When adding days crosses year boundary, Then calculate correctly', () => {
        const result = getDegassingCompletionAt('2025-12-28', 5);
        expect(result).not.toBeNull();
        expect(result!.getFullYear()).toBe(2026);
        expect(result!.getMonth()).toBe(0); // January
        expect(result!.getDate()).toBe(2);
        expect(result!.getHours()).toBe(9);
      });

      it('When degassingDays is 365 (max valid), Then calculate correctly', () => {
        const result = getDegassingCompletionAt('2026-01-01', 365);
        expect(result).not.toBeNull();
        expect(result!.getFullYear()).toBe(2027);
        expect(result!.getMonth()).toBe(0); // January
        expect(result!.getDate()).toBe(1);
        expect(result!.getHours()).toBe(9);
      });

      it('When degassingDays is 1 (min valid), Then calculate correctly', () => {
        const result = getDegassingCompletionAt('2026-01-01', 1);
        expect(result).not.toBeNull();
        expect(result!.getDate()).toBe(2);
      });
    });
  });

  describe('calculateDegassingStatus', () => {
    // Local wall-clock pin, built from local date components so it means
    // "local calendar 2026-01-02, 00:30" in whatever timezone the suite runs under.
    // Under TZ=Asia/Seoul this instant is exactly 2026-01-02T00:30:00+09:00 — the
    // boundary where UTC-midnight parsing reports the wrong elapsed day count.
    const PINNED_LOCAL_NOW = new Date(2026, 0, 2, 0, 30, 0, 0);

    beforeEach(() => {
      jest.useFakeTimers({ now: PINNED_LOCAL_NOW });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    describe('Given null or invalid inputs', () => {
      it('When roastDate is null, Then return null', () => {
        expect(calculateDegassingStatus(null, 5)).toBeNull();
      });

      it('When degassingDays is null, Then return null', () => {
        expect(calculateDegassingStatus('2026-01-01', null)).toBeNull();
      });

      it('When degassingDays is 0, Then return null', () => {
        expect(calculateDegassingStatus('2026-01-01', 0)).toBeNull();
      });

      it('When degassingDays is negative, Then return null', () => {
        expect(calculateDegassingStatus('2026-01-01', -1)).toBeNull();
      });

      it('When roastDate is an impossible date, Then return null instead of NaN', () => {
        expect(calculateDegassingStatus('2026-02-30', 5)).toBeNull();
      });

      it('When roastDate is malformed, Then return null instead of NaN', () => {
        expect(calculateDegassingStatus('2026/01/01', 5)).toBeNull();
      });
    });

    describe('Given the local calendar day just rolled over', () => {
      it('When roasted 2026-01-01 with 5 degassing days, Then 1 day elapsed and 4 remaining', () => {
        const result = calculateDegassingStatus('2026-01-01', 5);
        expect(result).not.toBeNull();
        expect(result!.daysFromRoast).toBe(1);
        expect(result!.remainingDays).toBe(4);
        expect(result!.status).toBe('degassing');
      });

      it('When roasted today, Then 0 days elapsed and the full period remains', () => {
        const result = calculateDegassingStatus('2026-01-02', 7);
        expect(result).not.toBeNull();
        expect(result!.daysFromRoast).toBe(0);
        expect(result!.remainingDays).toBe(7);
        expect(result!.status).toBe('degassing');
      });

      it('When today is the completion day, Then 0 remaining and status completed', () => {
        // 2025-12-28 + 5 days = 2026-01-02 (today)
        const result = calculateDegassingStatus('2025-12-28', 5);
        expect(result).not.toBeNull();
        expect(result!.daysFromRoast).toBe(5);
        expect(result!.remainingDays).toBe(0);
        expect(result!.status).toBe('completed');
      });

      it('When the completion day has passed, Then remaining clamps to 0 and status completed', () => {
        // 2025-12-01 -> 2026-01-02 is 32 calendar days
        const result = calculateDegassingStatus('2025-12-01', 5);
        expect(result).not.toBeNull();
        expect(result!.daysFromRoast).toBe(32);
        expect(result!.remainingDays).toBe(0);
        expect(result!.status).toBe('completed');
      });
    });

    describe('Given the period spans a DST spring-forward', () => {
      // 2026-03-08 is the US spring-forward date. Millisecond-floor math over local
      // midnights loses an hour there and under-counts by a day; calendar math must not.
      const DST_LOCAL_NOW = new Date(2026, 2, 10, 0, 30, 0, 0);

      beforeEach(() => {
        jest.useFakeTimers({ now: DST_LOCAL_NOW });
      });

      it('When roasted 2026-03-05 with 10 degassing days, Then 5 days elapsed and 5 remaining', () => {
        const result = calculateDegassingStatus('2026-03-05', 10);
        expect(result).not.toBeNull();
        expect(result!.daysFromRoast).toBe(5);
        expect(result!.remainingDays).toBe(5);
        expect(result!.status).toBe('degassing');
      });
    });
  });
});
