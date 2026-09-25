import { describe, expect, it } from 'vitest';
import { TIMEZONE_IST, formatCurrentClockIST, formatIST } from '../utils/time';

describe('IST Time Utility Suite', () => {
  it('uses authoritative IANA timezone Asia/Kolkata', () => {
    expect(TIMEZONE_IST).toBe('Asia/Kolkata');
  });

  describe('formatCurrentClockIST', () => {
    it('formats a date ending with IST indicator', () => {
      const date = new Date('2026-09-25T03:53:05Z'); // 03:53:05 UTC -> 09:23:05 IST
      const formatted = formatCurrentClockIST(date);
      expect(formatted).toBe('Fri, 25 Sep 2026 09:23:05 IST');
    });

    it('formats current time without throwing', () => {
      const formatted = formatCurrentClockIST();
      expect(formatted).toMatch(/^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} IST$/);
    });
  });

  describe('formatIST', () => {
    it('converts UTC ISO timestamp string to IST format', () => {
      const isoUtc = '2026-09-08T10:00:00Z'; // 10:00 UTC -> 15:30 IST
      expect(formatIST(isoUtc)).toBe('2026-09-08 15:30:00 IST');
    });

    it('converts Date object to IST format', () => {
      const date = new Date('2026-09-08T10:00:00Z');
      expect(formatIST(date)).toBe('2026-09-08 15:30:00 IST');
    });

    it('handles null and undefined gracefully', () => {
      expect(formatIST(null)).toBe('N/A');
      expect(formatIST(undefined)).toBe('N/A');
      expect(formatIST('')).toBe('N/A');
    });

    it('returns raw string if input is not a valid date', () => {
      expect(formatIST('not-a-date')).toBe('not-a-date');
    });
  });
});
