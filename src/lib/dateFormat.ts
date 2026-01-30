import { format } from 'date-fns';

/**
 * Centralized date/time formatting utilities
 * Uses dd-MMM-yyyy and 24-hour time format across the application
 */

// Date format: dd-MMM-yyyy (e.g., 30-Jan-2026)
export const DATE_FORMAT = 'dd-MMM-yyyy';

// Time format: 24-hour (e.g., 14:30:00)
export const TIME_FORMAT = 'HH:mm:ss';

// Short time format without seconds
export const TIME_FORMAT_SHORT = 'HH:mm';

// Combined date and time format
export const DATETIME_FORMAT = 'dd-MMM-yyyy HH:mm:ss';

// Short datetime format
export const DATETIME_FORMAT_SHORT = 'dd-MMM-yyyy HH:mm';

/**
 * Format a date to dd-MMM-yyyy format
 */
export function formatDate(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return format(d, DATE_FORMAT);
}

/**
 * Format a time to 24-hour format (HH:mm:ss)
 */
export function formatTime(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return format(d, TIME_FORMAT);
}

/**
 * Format a time to short 24-hour format (HH:mm)
 */
export function formatTimeShort(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return format(d, TIME_FORMAT_SHORT);
}

/**
 * Format a full datetime to dd-MMM-yyyy HH:mm:ss
 */
export function formatDateTime(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return format(d, DATETIME_FORMAT);
}

/**
 * Format a short datetime to dd-MMM-yyyy HH:mm
 */
export function formatDateTimeShort(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return format(d, DATETIME_FORMAT_SHORT);
}

/**
 * Format date for display in header (24-hour time with short date)
 */
export function formatHeaderDateTime(date: Date): { time: string; date: string } {
  return {
    time: format(date, TIME_FORMAT),
    date: format(date, 'EEE, dd-MMM-yyyy'),
  };
}
