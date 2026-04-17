import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from './badge';

describe('Badge Component', () => {
  it('renders correctly with default variant', () => {
    render(<Badge>Test Badge</Badge>);
    const badge = screen.getByText('Test Badge');
    expect(badge).toBeDefined();
    expect(badge.getAttribute('data-variant')).toBe('default');
  });

  it('renders with secondary variant', () => {
    render(<Badge variant="secondary">Secondary</Badge>);
    const badge = screen.getByText('Secondary');
    expect(badge.getAttribute('data-variant')).toBe('secondary');
  });

  it('renders with destructive variant', () => {
    render(<Badge variant="destructive">Destructive</Badge>);
    const badge = screen.getByText('Destructive');
    expect(badge.getAttribute('data-variant')).toBe('destructive');
  });
});
