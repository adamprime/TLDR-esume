import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ApplicationCard from '@/components/ApplicationCard';
import { Application } from '@/lib/types';

const mockApplication: Application = {
  id: 'test-id-123',
  company: 'Stripe',
  role: 'Chief of Staff',
  jobUrl: 'https://stripe.com/jobs/123',
  jobDescription: 'Test job description',
  baseResume: 'resume.md',
  style: 'ibm-plex-mono',
  status: 'draft',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-15T00:00:00.000Z',
};

describe('ApplicationCard', () => {
  it('should render company name', () => {
    render(<ApplicationCard application={mockApplication} />);
    expect(screen.getByText('Stripe')).toBeInTheDocument();
  });

  it('should render role', () => {
    render(<ApplicationCard application={mockApplication} />);
    expect(screen.getByText('Chief of Staff')).toBeInTheDocument();
  });

  it('should render status badge', () => {
    render(<ApplicationCard application={mockApplication} />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('should render formatted date', () => {
    render(<ApplicationCard application={mockApplication} />);
    // Should show "Updated Jan 15, 2025" or similar
    expect(screen.getByText(/Updated/)).toBeInTheDocument();
  });

  it('should indicate when job has a link', () => {
    render(<ApplicationCard application={mockApplication} />);
    expect(screen.getByText('Has link')).toBeInTheDocument();
  });

  it('should not show link indicator when no jobUrl', () => {
    const appWithoutUrl = { ...mockApplication, jobUrl: '' };
    render(<ApplicationCard application={appWithoutUrl} />);
    expect(screen.queryByText('Has link')).not.toBeInTheDocument();
  });

  it('should link to application detail page', () => {
    render(<ApplicationCard application={mockApplication} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/application/test-id-123');
  });

  it('should render different status colors', () => {
    const submittedApp = { ...mockApplication, status: 'submitted' as const };
    render(<ApplicationCard application={submittedApp} />);
    expect(screen.getByText('Submitted')).toBeInTheDocument();
  });

  it('should render interviewing status', () => {
    const interviewingApp = { ...mockApplication, status: 'interviewing' as const };
    render(<ApplicationCard application={interviewingApp} />);
    expect(screen.getByText('Interviewing')).toBeInTheDocument();
  });

  it('should render offer status', () => {
    const offerApp = { ...mockApplication, status: 'offer' as const };
    render(<ApplicationCard application={offerApp} />);
    expect(screen.getByText('Offer')).toBeInTheDocument();
  });

  it('should render rejected status', () => {
    const rejectedApp = { ...mockApplication, status: 'rejected' as const };
    render(<ApplicationCard application={rejectedApp} />);
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });
});
