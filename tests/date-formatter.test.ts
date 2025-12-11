/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('Date Formatter', () => {
  // Load the date formatter script content
  let formatDate: (date: string | Date, format?: string) => string;
  let refreshDateFormatting: () => void;

  beforeEach(() => {
    // Clear the DOM
    document.body.innerHTML = '';

    // Load and execute the date formatter script
    const scriptPath = path.join(__dirname, '../public/js/date-formatter.js');
    const scriptContent = fs.readFileSync(scriptPath, 'utf-8');
    
    // Execute the script in the current context
    eval(scriptContent);

    // Get the global functions
    formatDate = (window as any).formatDate;
    refreshDateFormatting = (window as any).refreshDateFormatting;
  });

  describe('formatDate function', () => {
    it('should format date in short format', () => {
      const date = '2025-12-11T18:00:00.000Z';
      const result = formatDate(date, 'date');

      // Result will vary by timezone, but should be a valid date string
      expect(result).toBeTruthy();
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should format date in long format', () => {
      const date = '2025-12-11T18:00:00.000Z';
      const result = formatDate(date, 'long-date');

      // Should contain month name
      expect(result).toBeTruthy();
      expect(result).toMatch(/(January|February|March|April|May|June|July|August|September|October|November|December)/);
      expect(result).toContain('2025');
    });

    it('should format datetime with time', () => {
      const date = '2025-12-11T18:00:00.000Z';
      const result = formatDate(date, 'datetime');

      // Should contain date and time
      expect(result).toBeTruthy();
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('should format relative dates correctly', () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      const result = formatDate(twoHoursAgo, 'relative');
      expect(result).toContain('hour');
      expect(result).toContain('ago');
    });

    it('should format time only', () => {
      const date = '2025-12-11T18:30:00.000Z';
      const result = formatDate(date, 'time');

      // Should contain time but format varies by locale
      expect(result).toBeTruthy();
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('should handle invalid dates gracefully', () => {
      const invalidDate = 'not-a-date';
      const result = formatDate(invalidDate, 'date');

      // Should return the original string
      expect(result).toBe(invalidDate);
    });

    it('should handle empty input', () => {
      const result = formatDate('', 'date');
      expect(result).toBe('');
    });

    it('should default to date format when no format specified', () => {
      const date = '2025-12-11T18:00:00.000Z';
      const result = formatDate(date);

      expect(result).toBeTruthy();
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });
  });

  describe('Relative date formatting', () => {
    it('should show "just now" for recent dates', () => {
      const justNow = new Date(Date.now() - 30 * 1000); // 30 seconds ago
      const result = formatDate(justNow, 'relative');
      expect(result).toBe('just now');
    });

    it('should show minutes ago', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const result = formatDate(fiveMinutesAgo, 'relative');
      expect(result).toMatch(/\d+ minutes? ago/);
    });

    it('should show hours ago', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
      const result = formatDate(threeHoursAgo, 'relative');
      expect(result).toMatch(/\d+ hours? ago/);
    });

    it('should show days ago', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const result = formatDate(twoDaysAgo, 'relative');
      expect(result).toMatch(/\d+ days? ago/);
    });

    it('should show months ago', () => {
      const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      const result = formatDate(twoMonthsAgo, 'relative');
      expect(result).toMatch(/\d+ months? ago/);
    });

    it('should show years ago', () => {
      const twoYearsAgo = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000);
      const result = formatDate(twoYearsAgo, 'relative');
      expect(result).toMatch(/\d+ years? ago/);
    });

    it('should use singular for 1 unit', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const result = formatDate(oneHourAgo, 'relative');
      expect(result).toBe('1 hour ago');
    });
  });

  describe('DOM processing', () => {
    it('should process elements with data-format-date attribute', () => {
      // Create test element
      const testDate = '2025-12-11T18:00:00.000Z';
      document.body.innerHTML = `
        <span data-format-date="${testDate}" data-format="date">${testDate}</span>
      `;

      refreshDateFormatting();

      const element = document.querySelector('[data-format-date]');
      expect(element).toBeTruthy();
      
      // Content should be formatted, not the raw ISO string
      expect(element?.textContent).not.toBe(testDate);
      expect(element?.textContent).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should add title attribute for accessibility', () => {
      const testDate = '2025-12-11T18:00:00.000Z';
      document.body.innerHTML = `
        <span data-format-date="${testDate}" data-format="date">${testDate}</span>
      `;

      refreshDateFormatting();

      const element = document.querySelector('[data-format-date]') as HTMLElement;
      expect(element?.getAttribute('title')).toBeTruthy();
      expect(element?.getAttribute('title')).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should not add title for datetime format', () => {
      const testDate = '2025-12-11T18:00:00.000Z';
      document.body.innerHTML = `
        <span data-format-date="${testDate}" data-format="datetime">${testDate}</span>
      `;

      refreshDateFormatting();

      const element = document.querySelector('[data-format-date]') as HTMLElement;
      // datetime format should not add a title since it already shows full info
      expect(element?.hasAttribute('title')).toBe(false);
    });

    it('should process multiple date elements', () => {
      const date1 = '2025-12-11T18:00:00.000Z';
      const date2 = '2025-12-10T12:00:00.000Z';
      
      document.body.innerHTML = `
        <span data-format-date="${date1}" data-format="date">${date1}</span>
        <span data-format-date="${date2}" data-format="long-date">${date2}</span>
      `;

      refreshDateFormatting();

      const elements = document.querySelectorAll('[data-format-date]');
      expect(elements.length).toBe(2);
      
      // Both should be formatted
      elements.forEach((el) => {
        expect(el.textContent).not.toContain('T');
        expect(el.textContent).not.toContain('Z');
      });
    });

    it('should handle elements without format attribute (default to date)', () => {
      const testDate = '2025-12-11T18:00:00.000Z';
      document.body.innerHTML = `
        <span data-format-date="${testDate}">${testDate}</span>
      `;

      refreshDateFormatting();

      const element = document.querySelector('[data-format-date]');
      expect(element?.textContent).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should gracefully handle missing date value', () => {
      document.body.innerHTML = `
        <span data-format-date="" data-format="date">Placeholder</span>
      `;

      // Should not throw error
      expect(() => refreshDateFormatting()).not.toThrow();
    });

    it('should gracefully handle invalid date in DOM', () => {
      document.body.innerHTML = `
        <span data-format-date="invalid-date" data-format="date">invalid-date</span>
      `;

      // Should not throw error
      expect(() => refreshDateFormatting()).not.toThrow();
      
      const element = document.querySelector('[data-format-date]');
      // Should leave original content as fallback
      expect(element?.textContent).toBe('invalid-date');
    });
  });

  describe('Date object handling', () => {
    it('should accept Date objects', () => {
      const dateObj = new Date('2025-12-11T18:00:00.000Z');
      const result = formatDate(dateObj, 'date');

      expect(result).toBeTruthy();
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should handle Date objects in relative format', () => {
      const dateObj = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const result = formatDate(dateObj, 'relative');

      expect(result).toContain('hour');
      expect(result).toContain('ago');
    });
  });
});
