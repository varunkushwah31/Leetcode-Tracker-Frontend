import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthPage } from './AuthPage';
import { ThemeProvider } from '../context/ThemeContext';
import * as authHook from '../hooks/useAuth';
import { AuthService } from '../services/endpoints';

vi.mock('../hooks/useAuth');
vi.mock('../services/endpoints', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../services/endpoints')>();
    return {
        ...actual,
        AuthService: {
            ...actual.AuthService,
            sendStudentRegistrationOtp: vi.fn(),
            forgotPassword: vi.fn(),
            verifyOtp: vi.fn(),
            resetPassword: vi.fn(),
        }
    };
});

const renderAuthPage = (initialRoute: string) => {
    return render(
        <ThemeProvider>
            <MemoryRouter initialEntries={[initialRoute]}>
                <Routes>
                    <Route path="/login" element={<AuthPage />} />
                    <Route path="/register" element={<AuthPage />} />
                </Routes>
            </MemoryRouter>
        </ThemeProvider>
    );
};

describe('AuthPage Error Rendering & Form Retention', () => {
    const mockLogin = vi.fn();
    const mockRegisterMentor = vi.fn();
    const mockRegisterStudent = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(AuthService.sendStudentRegistrationOtp).mockResolvedValue({
            data: { message: 'OTP sent' }
        } as never);
        vi.mocked(authHook.useAuth).mockReturnValue({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            login: mockLogin,
            registerMentor: mockRegisterMentor,
            registerStudent: mockRegisterStudent,
            loginWithToken: vi.fn(),
            logout: vi.fn(),
        });
    });

    it('renders login form by default on /login and keeps form data on invalid credentials', async () => {
        mockLogin.mockRejectedValue(new Error('Invalid email or password.'));

        renderAuthPage('/login');

        expect(screen.getByRole('heading', { name: /welcome back/i })).toBeTruthy();

        const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
        const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        fireEvent.change(emailInput, { target: { value: 'student@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

        fireEvent.click(submitButton);

        // Verify error banner is shown with the exact server error message
        await waitFor(() => {
            const errorAlert = screen.getByRole('alert');
            expect(errorAlert).toBeTruthy();
            expect(errorAlert.textContent).toContain('Invalid email or password.');
        });

        // Crucial: Form input values MUST be preserved, not wiped by a reload/rerender
        expect(emailInput.value).toBe('student@example.com');
        expect(passwordInput.value).toBe('wrongpassword');
    });

    it('renders signup form when route is /register and displays error banner without wiping fields', async () => {
        vi.mocked(AuthService.sendStudentRegistrationOtp).mockRejectedValue(new Error('Student with email already exists'));

        renderAuthPage('/register');

        expect(screen.getByRole('heading', { name: /create an account/i })).toBeTruthy();

        const nameInput = screen.getByPlaceholderText('John Doe') as HTMLInputElement;
        const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
        const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
        const lcInput = screen.getByPlaceholderText('username or profile URL') as HTMLInputElement;
        const submitButton = screen.getByRole('button', { name: /create account/i });

        fireEvent.change(nameInput, { target: { value: 'Alex Smith' } });
        fireEvent.change(emailInput, { target: { value: 'alex@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'securePass123' } });
        fireEvent.change(lcInput, { target: { value: 'alexsmith' } });

        fireEvent.click(submitButton);

        await waitFor(() => {
            const errorAlert = screen.getByRole('alert');
            expect(errorAlert).toBeTruthy();
            expect(errorAlert.textContent).toContain('Student with email already exists');
        });

        // Form state must be retained
        expect(nameInput.value).toBe('Alex Smith');
        expect(emailInput.value).toBe('alex@example.com');
        expect(passwordInput.value).toBe('securePass123');
        expect(lcInput.value).toBe('alexsmith');
    });

    it('shows error if student registration has neither LeetCode nor Codeforces handle', async () => {
        renderAuthPage('/register');

        const nameInput = screen.getByPlaceholderText('John Doe');
        const emailInput = screen.getByPlaceholderText('you@example.com');
        const passwordInput = screen.getByPlaceholderText('••••••••');
        const submitButton = screen.getByRole('button', { name: /create account/i });

        fireEvent.change(nameInput, { target: { value: 'Alex Smith' } });
        fireEvent.change(emailInput, { target: { value: 'alex@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'securePass123' } });

        fireEvent.click(submitButton);

        await waitFor(() => {
            const errorAlert = screen.getByRole('alert');
            expect(errorAlert).toBeTruthy();
            expect(errorAlert.textContent).toContain('Please provide at least one platform username');
        });

        expect(mockRegisterStudent).not.toHaveBeenCalled();
    });

    it('opens email verification modal when student details are valid and completes registration when OTP is provided', async () => {
        vi.mocked(AuthService.sendStudentRegistrationOtp).mockResolvedValue({
            data: { message: 'OTP sent' }
        } as never);
        mockRegisterStudent.mockResolvedValue(undefined);

        renderAuthPage('/register');

        const nameInput = screen.getByPlaceholderText('John Doe');
        const emailInput = screen.getByPlaceholderText('you@example.com');
        const passwordInput = screen.getByPlaceholderText('••••••••');
        const lcInput = screen.getByPlaceholderText('username or profile URL');
        const submitButton = screen.getByRole('button', { name: /create account/i });

        fireEvent.change(nameInput, { target: { value: 'Alex Smith' } });
        fireEvent.change(emailInput, { target: { value: 'alex@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'securePass123' } });
        fireEvent.change(lcInput, { target: { value: 'alexsmith' } });

        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(AuthService.sendStudentRegistrationOtp).toHaveBeenCalledWith({
                email: 'alex@example.com',
                name: 'Alex Smith'
            });
            expect(screen.getByText(/verify your email address/i)).toBeTruthy();
        });

        // Enter OTP in modal
        const otpInput = screen.getByPlaceholderText('123456');
        fireEvent.change(otpInput, { target: { value: '123456' } });

        const verifyButton = screen.getByRole('button', { name: /verify & complete registration/i });
        fireEvent.click(verifyButton);

        await waitFor(() => {
            expect(mockRegisterStudent).toHaveBeenCalledWith(expect.objectContaining({
                name: 'Alex Smith',
                email: 'alex@example.com',
                leetcodeUsername: 'alexsmith',
                otp: '123456'
            }));
        });
    });
});
