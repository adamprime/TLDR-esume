import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StyleSelector from '@/components/StyleSelector';
import { STYLE_OPTIONS } from '@/lib/types';

describe('StyleSelector', () => {
  it('should render a select element', () => {
    const onChange = vi.fn();
    render(<StyleSelector value="modern" onChange={onChange} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('should display all style options', () => {
    const onChange = vi.fn();
    render(<StyleSelector value="modern" onChange={onChange} />);
    
    STYLE_OPTIONS.forEach(option => {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    });
  });

  it('should show selected value', () => {
    const onChange = vi.fn();
    render(<StyleSelector value="modern" onChange={onChange} />);
    
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('modern');
  });

  it('should call onChange when selection changes', () => {
    const onChange = vi.fn();
    render(<StyleSelector value="modern" onChange={onChange} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'serif' } });
    
    expect(onChange).toHaveBeenCalledWith('serif');
  });

  it('should apply custom className', () => {
    const onChange = vi.fn();
    render(
      <StyleSelector 
        value="modern" 
        onChange={onChange} 
        className="custom-class" 
      />
    );
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('custom-class');
  });
});
