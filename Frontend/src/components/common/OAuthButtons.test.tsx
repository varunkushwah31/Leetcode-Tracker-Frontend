import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OAuthButtons } from './OAuthButtons';
import * as oauthLib from '@/lib/oauth';

vi.mock('@/lib/oauth', () => ({
  initiateOAuth2Login: vi.fn(),
  getOAuth2AuthorizationUrl: vi.fn((provider: string) => `/oauth2/authorization/${provider}`),
}));

describe('OAuthButtons Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Google and GitHub social login buttons', () => {
    render(<OAuthButtons />);

    expect(screen.getByRole('button', { name: /continue with google/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /continue with github/i })).toBeTruthy();
  });

  it('triggers initiateOAuth2Login with google when Google button is clicked', () => {
    render(<OAuthButtons />);

    const googleBtn = screen.getByRole('button', { name: /continue with google/i });
    fireEvent.click(googleBtn);

    expect(oauthLib.initiateOAuth2Login).toHaveBeenCalledWith('google');
  });

  it('triggers initiateOAuth2Login with github when GitHub button is clicked', () => {
    render(<OAuthButtons />);

    const githubBtn = screen.getByRole('button', { name: /continue with github/i });
    fireEvent.click(githubBtn);

    expect(oauthLib.initiateOAuth2Login).toHaveBeenCalledWith('github');
  });

  it('disables both buttons when disabled prop is true', () => {
    render(<OAuthButtons disabled={true} />);

    const googleBtn = screen.getByRole('button', { name: /continue with google/i }) as HTMLButtonElement;
    const githubBtn = screen.getByRole('button', { name: /continue with github/i }) as HTMLButtonElement;

    expect(googleBtn.disabled).toBe(true);
    expect(githubBtn.disabled).toBe(true);

    fireEvent.click(googleBtn);
    expect(oauthLib.initiateOAuth2Login).not.toHaveBeenCalled();
  });
});
