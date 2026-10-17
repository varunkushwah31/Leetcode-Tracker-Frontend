import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { OAuth2RedirectHandler } from './OAuth2RedirectHandler';
import * as authHook from '../hooks/useAuth';

vi.mock('../hooks/useAuth');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('OAuth2RedirectHandler', () => {
  const mockLoginWithToken = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      registerMentor: vi.fn(),
      registerStudent: vi.fn(),
      loginWithToken: mockLoginWithToken,
      logout: vi.fn(),
    });
  });

  const renderHandler = (searchQuery: string) => {
    return render(
      <MemoryRouter initialEntries={[`/oauth2/redirect${searchQuery}`]}>
        <Routes>
          <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('successfully extracts token and navigates to /dashboard', () => {
    renderHandler('?token=valid.jwt.token&userId=u123&role=STUDENT&name=Alice%20Smith');

    expect(mockLoginWithToken).toHaveBeenCalledWith('valid.jwt.token', {
      id: 'u123',
      name: 'Alice Smith',
      role: 'STUDENT',
    });
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('redirects to /login with error message when error query parameter is present', () => {
    renderHandler('?error=User%20denied%20access');

    expect(mockLoginWithToken).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      replace: true,
      state: { error: 'User denied access' },
    });
  });

  it('redirects to /login when no token or error is present in query parameters', () => {
    renderHandler('');

    expect(mockLoginWithToken).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      replace: true,
      state: { error: 'No authentication token received from social login.' },
    });
  });

  it('redirects to /login when loginWithToken throws an error', () => {
    mockLoginWithToken.mockImplementation(() => {
      throw new Error('Token signature invalid');
    });

    renderHandler('?token=corrupt.token');

    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      replace: true,
      state: { error: 'Token signature invalid' },
    });
  });

  it('renders authenticating status screen before redirect finishes', () => {
    renderHandler('?token=valid.jwt.token');

    expect(screen.getByText('Authenticating')).toBeTruthy();
    expect(screen.getByText(/Encrypted OAuth 2.0 handshake/i)).toBeTruthy();
  });
});
