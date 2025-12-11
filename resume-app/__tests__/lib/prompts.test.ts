import { describe, it, expect } from 'vitest';
import { 
  RESUME_PROMPT, 
  COVER_LETTER_PROMPT, 
  QUESTION_ANSWER_PROMPT 
} from '@/lib/prompts';

describe('prompts', () => {
  describe('RESUME_PROMPT', () => {
    it('should contain placeholder for baseResume', () => {
      expect(RESUME_PROMPT).toContain('{baseResume}');
    });

    it('should contain placeholder for jobDescription', () => {
      expect(RESUME_PROMPT).toContain('{jobDescription}');
    });

    it('should contain placeholder for company', () => {
      expect(RESUME_PROMPT).toContain('{company}');
    });

    it('should contain placeholder for role', () => {
      expect(RESUME_PROMPT).toContain('{role}');
    });

    it('should include instructions about markdown output', () => {
      expect(RESUME_PROMPT.toLowerCase()).toContain('markdown');
    });

    it('should include instructions about YAML frontmatter', () => {
      expect(RESUME_PROMPT.toLowerCase()).toContain('yaml');
    });

    it('should warn against fabricating experience', () => {
      expect(RESUME_PROMPT.toLowerCase()).toContain('fabricate');
    });
  });

  describe('COVER_LETTER_PROMPT', () => {
    it('should contain placeholder for resume', () => {
      expect(COVER_LETTER_PROMPT).toContain('{resume}');
    });

    it('should contain placeholder for jobDescription', () => {
      expect(COVER_LETTER_PROMPT).toContain('{jobDescription}');
    });

    it('should contain placeholder for company', () => {
      expect(COVER_LETTER_PROMPT).toContain('{company}');
    });

    it('should contain placeholder for role', () => {
      expect(COVER_LETTER_PROMPT).toContain('{role}');
    });

    it('should contain placeholder for jobUrl', () => {
      expect(COVER_LETTER_PROMPT).toContain('{jobUrl}');
    });

    it('should specify word limit', () => {
      expect(COVER_LETTER_PROMPT).toContain('350 words');
    });

    it('should mention avoiding cliches', () => {
      expect(COVER_LETTER_PROMPT.toLowerCase()).toContain('cliché');
    });
  });

  describe('QUESTION_ANSWER_PROMPT', () => {
    it('should contain placeholder for resume', () => {
      expect(QUESTION_ANSWER_PROMPT).toContain('{resume}');
    });

    it('should contain placeholder for question', () => {
      expect(QUESTION_ANSWER_PROMPT).toContain('{question}');
    });

    it('should contain placeholder for company', () => {
      expect(QUESTION_ANSWER_PROMPT).toContain('{company}');
    });

    it('should contain placeholder for role', () => {
      expect(QUESTION_ANSWER_PROMPT).toContain('{role}');
    });

    it('should contain placeholder for jobDescription', () => {
      expect(QUESTION_ANSWER_PROMPT).toContain('{jobDescription}');
    });

    it('should mention word count guidance', () => {
      expect(QUESTION_ANSWER_PROMPT).toMatch(/\d+-\d+ words/);
    });
  });

  describe('prompt interpolation', () => {
    function interpolate(template: string, vars: Record<string, string>): string {
      return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || '');
    }

    it('should correctly interpolate RESUME_PROMPT', () => {
      const result = interpolate(RESUME_PROMPT, {
        baseResume: 'My Resume Content',
        jobDescription: 'Job Description Here',
        company: 'TestCo',
        role: 'Engineer',
      });
      
      expect(result).toContain('My Resume Content');
      expect(result).toContain('Job Description Here');
      expect(result).toContain('TestCo');
      expect(result).toContain('Engineer');
      expect(result).not.toContain('{baseResume}');
    });

    it('should correctly interpolate COVER_LETTER_PROMPT', () => {
      const result = interpolate(COVER_LETTER_PROMPT, {
        resume: 'Resume Content',
        jobDescription: 'JD Content',
        company: 'Acme',
        role: 'Manager',
        jobUrl: 'https://example.com/job',
      });
      
      expect(result).toContain('Resume Content');
      expect(result).toContain('https://example.com/job');
      expect(result).not.toContain('{resume}');
    });
  });
});
