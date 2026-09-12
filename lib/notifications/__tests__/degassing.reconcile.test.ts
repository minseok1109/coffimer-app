import { Platform } from 'react-native';
import { reconcileDegassing } from '../degassing';
import {
  cancelMock,
  cancelledIdentifiers,
  createBean,
  getAllScheduledMock,
  PINNED_LOCAL_NOW,
  SCHEDULED_ID,
  scheduleMock,
  scheduledIdentifiers,
  scheduledRequest,
  setPermission,
} from './degassingFixtures';

/** Completion 2026-01-15T09:00 local — after the pin, so it still deserves one. */
const FUTURE_BEAN = { roast_date: '2026-01-01', degassing_days: 14 } as const;
/** Completion 2025-12-06T09:00 local — before the pin, so it must be dropped. */
const ELAPSED_BEAN = { roast_date: '2025-12-01', degassing_days: 5 } as const;

describe('lib/notifications/degassing reconcileDegassing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ now: PINNED_LOCAL_NOW });
    scheduleMock.mockResolvedValue(SCHEDULED_ID);
    cancelMock.mockResolvedValue(undefined);
    getAllScheduledMock.mockResolvedValue([]);
    setPermission('granted');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Given the bean list is empty but degassing notifications are scheduled', () => {
    beforeEach(() => {
      getAllScheduledMock.mockResolvedValue([
        scheduledRequest('degassing-A'),
        scheduledRequest('degassing-B'),
        scheduledRequest('unrelated-timer'),
      ]);
    });

    it('When reconciling, Then every orphaned degassing notification is cancelled', async () => {
      await reconcileDegassing([]);

      expect(cancelledIdentifiers()).toEqual(['degassing-A', 'degassing-B']);
    });

    it('When reconciling, Then notifications outside the degassing prefix are never touched', async () => {
      await reconcileDegassing([]);

      expect(cancelledIdentifiers()).not.toContain('unrelated-timer');
      expect(cancelMock).toHaveBeenCalledTimes(2);
    });

    it('When reconciling, Then nothing is scheduled', async () => {
      await reconcileDegassing([]);

      expect(scheduleMock).not.toHaveBeenCalled();
    });
  });

  describe('Given an active bean whose notification is missing from the OS', () => {
    it('When reconciling, Then it is scheduled exactly once and nothing is cancelled', async () => {
      const bean = createBean({ id: 'A', ...FUTURE_BEAN });

      await reconcileDegassing([bean]);

      expect(scheduledIdentifiers()).toEqual(['degassing-A']);
      expect(cancelMock).not.toHaveBeenCalled();
    });
  });

  describe('Given an active bean that is already scheduled', () => {
    beforeEach(() => {
      getAllScheduledMock.mockResolvedValue([scheduledRequest('degassing-A')]);
    });

    it('When reconciling, Then neither scheduling nor cancelling happens', async () => {
      const bean = createBean({ id: 'A', ...FUTURE_BEAN });

      await reconcileDegassing([bean]);

      expect(scheduleMock).not.toHaveBeenCalled();
      expect(cancelMock).not.toHaveBeenCalled();
    });

    it('When reconciling twice, Then the second pass is still a no-op', async () => {
      const bean = createBean({ id: 'A', ...FUTURE_BEAN });

      await reconcileDegassing([bean]);
      await reconcileDegassing([bean]);

      expect(scheduleMock).not.toHaveBeenCalled();
      expect(cancelMock).not.toHaveBeenCalled();
    });
  });

  describe('Given a bean that is still owned but whose completion time has passed', () => {
    beforeEach(() => {
      getAllScheduledMock.mockResolvedValue([scheduledRequest('degassing-A')]);
    });

    it('When reconciling, Then its stale notification is cancelled rather than kept alive', async () => {
      const bean = createBean({ id: 'A', ...ELAPSED_BEAN });

      await reconcileDegassing([bean]);

      expect(cancelledIdentifiers()).toEqual(['degassing-A']);
      expect(scheduleMock).not.toHaveBeenCalled();
    });
  });

  describe('Given beans that can never carry a notification', () => {
    const UNSCHEDULABLE = [
      { label: 'degassing_days is 0', overrides: { degassing_days: 0 } },
      { label: 'degassing_days is null', overrides: { degassing_days: null } },
      { label: 'roast_date is null', overrides: { roast_date: null } },
      {
        label: 'roast_date is an impossible calendar date',
        overrides: { roast_date: '2026-02-30' },
      },
      {
        label: 'roast_date is malformed',
        overrides: { roast_date: '2026/01/01' },
      },
    ];

    it.each(UNSCHEDULABLE)(
      'When $label, Then it is never scheduled',
      async ({ overrides }) => {
        const bean = createBean({ id: 'A', ...FUTURE_BEAN, ...overrides });

        await reconcileDegassing([bean]);

        expect(scheduleMock).not.toHaveBeenCalled();
      }
    );

    it.each(UNSCHEDULABLE)(
      'When $label and a stale notification exists, Then that notification is cancelled',
      async ({ overrides }) => {
        getAllScheduledMock.mockResolvedValue([scheduledRequest('degassing-A')]);
        const bean = createBean({ id: 'A', ...FUTURE_BEAN, ...overrides });

        await reconcileDegassing([bean]);

        expect(cancelledIdentifiers()).toEqual(['degassing-A']);
      }
    );
  });

  describe('Given one bean needs scheduling while another is orphaned', () => {
    beforeEach(() => {
      getAllScheduledMock.mockResolvedValue([
        scheduledRequest('degassing-B'),
        scheduledRequest('unrelated-timer'),
      ]);
    });

    it('When reconciling, Then a single pass both schedules and cancels', async () => {
      const bean = createBean({ id: 'A', ...FUTURE_BEAN });

      await reconcileDegassing([bean]);

      expect(scheduledIdentifiers()).toEqual(['degassing-A']);
      expect(cancelledIdentifiers()).toEqual(['degassing-B']);
    });
  });

  describe('Given the app runs on web', () => {
    let platformReplacement: ReturnType<typeof jest.replaceProperty> | null =
      null;

    beforeEach(() => {
      platformReplacement = jest.replaceProperty(Platform, 'OS', 'web');
    });

    afterEach(() => {
      platformReplacement?.restore();
      platformReplacement = null;
    });

    it('When reconciling, Then the OS schedule is never even read', async () => {
      await reconcileDegassing([createBean({ id: 'A', ...FUTURE_BEAN })]);

      expect(getAllScheduledMock).not.toHaveBeenCalled();
      expect(scheduleMock).not.toHaveBeenCalled();
      expect(cancelMock).not.toHaveBeenCalled();
    });
  });
});
