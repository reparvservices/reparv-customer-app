import {addDaysIso, stayClashes, toIso, rupees} from '../src/utils/venueApi';

describe('venueApi helpers', () => {
  test('toIso and addDaysIso use plain calendar days', () => {
    expect(toIso(new Date(2026, 11, 3))).toBe('2026-12-03');
    expect(addDaysIso('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysIso('2026-03-01', -1)).toBe('2026-02-28');
  });

  test('stays clash only when dates and slots overlap (end is exclusive)', () => {
    const taken = {start: '2026-12-10', end: '2026-12-13', slot: 'full'};
    expect(stayClashes({start: '2026-12-13', end: '2026-12-15', slot: 'full'}, taken)).toBe(false);
    expect(stayClashes({start: '2026-12-12', end: '2026-12-14', slot: 'full'}, taken)).toBe(true);
    const morning = {start: '2026-12-10', end: '2026-12-11', slot: 'morning'};
    expect(stayClashes({start: '2026-12-10', end: '2026-12-11', slot: 'evening'}, morning)).toBe(false);
    expect(stayClashes({start: '2026-12-10', end: '2026-12-11', slot: 'full'}, morning)).toBe(true);
  });

  test('rupees formats Indian grouping', () => {
    expect(rupees(1234567)).toBe('₹12,34,567');
    expect(rupees(null)).toBe('₹0');
  });
});
