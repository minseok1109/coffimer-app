import { getDegassingCompletionAt, parseLocalDate, DEGASSING_NOTIFICATION_HOUR } from '../degassingUtils';

describe('degassingUtils', () => {
  describe('parseLocalDate', () => {
    describe('Given invalid inputs', () => {
      it('When input is null, Then return null', () => {
        const result = parseLocalDate(null as any);
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
      });

      it('When parsing leap year date 2024-02-29, Then return valid Date', () => {
        const result = parseLocalDate('2024-02-29');
        expect(result).not.toBeNull();
        expect(result!.getFullYear()).toBe(2024);
        expect(result!.getMonth()).toBe(1);
        expect(result!.getDate()).toBe(29);
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
});
