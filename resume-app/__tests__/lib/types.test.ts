import { describe, it, expect } from 'vitest';
import { 
  STYLE_OPTIONS, 
  STATUS_OPTIONS, 
  StyleOption, 
  ApplicationStatus 
} from '@/lib/types';

describe('types', () => {
  describe('STYLE_OPTIONS', () => {
    it('should have 2 style options', () => {
      expect(STYLE_OPTIONS).toHaveLength(2);
    });

    it('should have modern as first option (default)', () => {
      expect(STYLE_OPTIONS[0].value).toBe('modern');
    });

    it('should have all required properties for each option', () => {
      STYLE_OPTIONS.forEach(option => {
        expect(option).toHaveProperty('value');
        expect(option).toHaveProperty('label');
        expect(option).toHaveProperty('font');
      });
    });

    it('should include serif style option', () => {
      const serif = STYLE_OPTIONS.find(o => o.value === 'serif');
      expect(serif).toBeDefined();
      expect(serif?.font).toBe('Crimson Pro');
    });
  });

  describe('STATUS_OPTIONS', () => {
    it('should have 6 status options', () => {
      expect(STATUS_OPTIONS).toHaveLength(6);
    });

    it('should include all expected statuses', () => {
      const values = STATUS_OPTIONS.map(s => s.value);
      expect(values).toContain('draft');
      expect(values).toContain('closed');
      expect(values).toContain('submitted');
      expect(values).toContain('interviewing');
      expect(values).toContain('rejected');
      expect(values).toContain('offer');
    });

    it('should have color classes for each status', () => {
      STATUS_OPTIONS.forEach(option => {
        expect(option.color).toMatch(/^bg-\w+-\d+$/);
      });
    });
  });

  describe('type safety', () => {
    it('should accept valid StyleOption values', () => {
      const validStyles: StyleOption[] = [
        'modern',
        'serif',
      ];
      expect(validStyles).toHaveLength(2);
    });

    it('should accept valid ApplicationStatus values', () => {
      const validStatuses: ApplicationStatus[] = [
        'draft',
        'closed',
        'submitted',
        'interviewing',
        'rejected',
        'offer',
      ];
      expect(validStatuses).toHaveLength(6);
    });
  });
});
