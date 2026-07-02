import type { Announcement } from '@/announcements/types';

export function expectAnnouncement(
  result: Announcement,
  priority: 'polite' | 'assertive',
): void {
  expect(typeof result.text).toBe('string');
  expect(result.priority).toBe(priority);
}

export const expectAssertive = (result: Announcement) =>
  expectAnnouncement(result, 'assertive');

export const expectPolite = (result: Announcement) =>
  expectAnnouncement(result, 'polite');

export function expectTCalledWith(
  mockT: jest.Mock,
  key: string,
  params?: Record<string, unknown>,
): void {
  if (params) {
    expect(mockT).toHaveBeenCalledWith(key, params);
  } else {
    expect(mockT).toHaveBeenCalledWith(key);
  }
}
