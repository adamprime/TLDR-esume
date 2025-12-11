import { describe, it, expect } from 'vitest';
import { 
  STYLE_OPTIONS, 
  STATUS_OPTIONS, 
  StyleOption, 
  ApplicationStatus 
} from '@/lib/types';

describe('types', () => {
  describe('STYLE_OPTIONS', () => {
    it('should have 5 style options', () => {
      expect(STYLE_OPTIONS).toHaveLength(5);
    });

    it('should have ibm-plex-mono as first option (default)', () => {
      expect(STYLE_OPTIONS[0].value).toBe('ibm-plex-mono');
    });

    it('should have all required properties for each option', () => {
      STYLE_OPTIONS.forEach(option => {
        expect(option).toHaveProperty('value');
        expect(option).toHaveProperty('label');
        expect(option).toHaveProperty('font');
      });
    });

    it('should include modern style option', () => {
      const modern = STYLE_OPTIONS.find(o => o.value === 'modern');
      expect(modern).toBeDefined();
      expect(modern?.font).toBe('Inter');
    });
  });

  describe('STATUS_OPTIONS', () => {
    it('should have 5 status options', () => {
      expect(STATUS_OPTIONS).toHaveLength(5);
    });

    it('should include all expected statuses', () => {
      const values = STATUS_OPTIONS.map(s => s.value);
      expect(values).toContain('draft');
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
        'courier-new',
        'ibm-plex-mono',
        'courier-prime',
        'jetbrains-mono',
        'modern',
      ];
      expect(validStyles).toHaveLength(5);
    });

    it('should accept valid ApplicationStatus values', () => {
      const validStatuses: ApplicationStatus[] = [
        'draft',
        'submitted',
        'interviewing',
        'rejected',
        'offer',
      ];
      expect(validStatuses).toHaveLength(5);
    });
  });
});
