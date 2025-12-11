import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StatusSelector from '@/components/StatusSelector';
import { STATUS_OPTIONS } from '@/lib/types';

describe('StatusSelector', () => {
  it('should render a select element', () => {
    const onChange = vi.fn();
    render(<StatusSelector value="draft" onChange={onChange} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('should display all status options', () => {
    const onChange = vi.fn();
    render(<StatusSelector value="draft" onChange={onChange} />);
    
    STATUS_OPTIONS.forEach(option => {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    });
  });

  it('should show selected value', () => {
    const onChange = vi.fn();
    render(<StatusSelector value="interviewing" onChange={onChange} />);
    
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('interviewing');
  });

  it('should call onChange when selection changes', () => {
    const onChange = vi.fn();
    render(<StatusSelector value="draft" onChange={onChange} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'submitted' } });
    
    expect(onChange).toHaveBeenCalledWith('submitted');
  });

  it('should apply custom className', () => {
    const onChange = vi.fn();
    render(
      <StatusSelector 
        value="draft" 
        onChange={onChange} 
        className="my-custom-class" 
      />
    );
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('my-custom-class');
  });
});
