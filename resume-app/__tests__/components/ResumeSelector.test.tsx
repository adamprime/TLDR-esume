import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ResumeSelector from '@/components/ResumeSelector';
import { BaseResume } from '@/lib/types';

const mockResumes: BaseResume[] = [
  { filename: 'resume.md', name: 'General Resume', path: '/path/resume.md' },
  { filename: 'resume_corporate.md', name: 'Corporate Resume', path: '/path/resume_corporate.md' },
  { filename: 'resume-onepager.md', name: 'One Pager', path: '/path/resume-onepager.md' },
];

describe('ResumeSelector', () => {
  it('should render a select element', () => {
    const onChange = vi.fn();
    render(
      <ResumeSelector 
        resumes={mockResumes} 
        value="" 
        onChange={onChange} 
      />
    );
    
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('should show placeholder option when no value selected', () => {
    const onChange = vi.fn();
    render(
      <ResumeSelector 
        resumes={mockResumes} 
        value="" 
        onChange={onChange} 
      />
    );
    
    expect(screen.getByText('Select a base resume...')).toBeInTheDocument();
  });

  it('should display all resume options', () => {
    const onChange = vi.fn();
    render(
      <ResumeSelector 
        resumes={mockResumes} 
        value="" 
        onChange={onChange} 
      />
    );
    
    mockResumes.forEach(resume => {
      expect(screen.getByText(resume.name)).toBeInTheDocument();
    });
  });

  it('should show selected value', () => {
    const onChange = vi.fn();
    render(
      <ResumeSelector 
        resumes={mockResumes} 
        value="resume_corporate.md" 
        onChange={onChange} 
      />
    );
    
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('resume_corporate.md');
  });

  it('should call onChange when selection changes', () => {
    const onChange = vi.fn();
    render(
      <ResumeSelector 
        resumes={mockResumes} 
        value="" 
        onChange={onChange} 
      />
    );
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'resume.md' } });
    
    expect(onChange).toHaveBeenCalledWith('resume.md');
  });

  it('should handle empty resumes array', () => {
    const onChange = vi.fn();
    render(
      <ResumeSelector 
        resumes={[]} 
        value="" 
        onChange={onChange} 
      />
    );
    
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    // Only the placeholder option should exist
    expect(screen.getAllByRole('option')).toHaveLength(1);
  });

  it('should apply custom className', () => {
    const onChange = vi.fn();
    render(
      <ResumeSelector 
        resumes={mockResumes} 
        value="" 
        onChange={onChange} 
        className="test-class"
      />
    );
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('test-class');
  });
});
