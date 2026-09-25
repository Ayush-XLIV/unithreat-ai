/**
 * Indian Standard Time (IST) Date and Time Formatting Utilities
 *
 * Uses authoritative IANA timezone identifier 'Asia/Kolkata' to display
 * timestamps consistently across the NETRA AI SOC Console.
 */

export const TIMEZONE_IST = 'Asia/Kolkata';

/**
 * Formats a Date instance as the live header clock in IST.
 * Output format: "Fri, 25 Sep 2026 09:30:00 IST"
 */
export function formatCurrentClockIST(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE_IST,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const m = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${m.weekday}, ${m.day} ${m.month} ${m.year} ${m.hour}:${m.minute}:${m.second} IST`;
}

/**
 * Formats an ISO timestamp or Date into an IST representation.
 * Output format: "2026-09-08 15:30:00 IST"
 */
export function formatIST(timestamp?: string | number | Date | null): string {
  if (!timestamp) {
    return 'N/A';
  }

  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (isNaN(date.getTime())) {
    return String(timestamp);
  }

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE_IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const m = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${m.year}-${m.month}-${m.day} ${m.hour}:${m.minute}:${m.second} IST`;
}
