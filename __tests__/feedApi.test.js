import {isVideoUrl, timeAgo, toMediaUrl} from '../src/utils/feedApi';

describe('feedApi helpers', () => {
  test('toMediaUrl keeps absolute urls and prefixes relative ones', () => {
    expect(toMediaUrl('https://x.com/a.jpg')).toBe('https://x.com/a.jpg');
    expect(toMediaUrl('/uploads/a.jpg')).toMatch(/amazonaws\.com\/uploads\/a\.jpg$/);
    expect(toMediaUrl(null)).toBeNull();
  });

  test('isVideoUrl ignores query strings', () => {
    expect(isVideoUrl('https://x.com/v.MP4?sig=1')).toBe(true);
    expect(isVideoUrl('https://x.com/a.jpg')).toBe(false);
    expect(isVideoUrl(null)).toBe(false);
  });

  test('timeAgo buckets', () => {
    const now = new Date('2026-11-16T12:00:00Z').getTime();
    expect(timeAgo('2026-11-16T11:59:30Z', now)).toBe('just now');
    expect(timeAgo('2026-11-16T11:55:00Z', now)).toBe('5m');
    expect(timeAgo('2026-11-16T09:00:00Z', now)).toBe('3h');
    expect(timeAgo('2026-11-14T12:00:00Z', now)).toBe('2d');
    expect(timeAgo('garbage', now)).toBe('');
  });
});
