import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { AuthService } from '@/services/endpoints';

vi.mock('@/services/endpoints', () => ({
    AuthService: {
        forgotPassword: vi.fn(),
        verifyOtp: vi.fn(),
        resetPassword: vi.fn(),
    },
}));

describe('ForgotPasswordModal Component Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders Step 1 (Email) by default when open', () => {
        render(<ForgotPasswordModal open={true} defaultEmail="test@example.com" />);

        expect(screen.getByRole('heading', { name: /reset password/i })).toBeTruthy();
        const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
        expect(emailInput.value).toBe('test@example.com');
        expect(screen.getByRole('button', { name: /send otp/i })).toBeTruthy();
    });

    it('submits email and transitions to Step 2 (OTP)', async () => {
        vi.mocked(AuthService.forgotPassword).mockResolvedValue({
            data: { message: 'A 6-digit verification code has been sent to your email.' }
        } as never);

        render(<ForgotPasswordModal open={true} defaultEmail="test@example.com" />);

        const sendOtpBtn = screen.getByRole('button', { name: /send otp/i });
        fireEvent.click(sendOtpBtn);

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /verify email otp/i })).toBeTruthy();
            expect(screen.getByPlaceholderText('••••••')).toBeTruthy();
        });

        expect(AuthService.forgotPassword).toHaveBeenCalledWith('test@example.com');
    });

    it('verifies 6-digit OTP and transitions to Step 3 (New Password)', async () => {
        vi.mocked(AuthService.forgotPassword).mockResolvedValue({
            data: { message: 'OTP sent' }
        } as never);

        vi.mocked(AuthService.verifyOtp).mockResolvedValue({
            data: { message: 'Code verified successfully', resetToken: 'fake-token-123' }
        } as never);

        render(<ForgotPasswordModal open={true} defaultEmail="test@example.com" />);

        // Step 1: Send OTP
        fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /verify email otp/i })).toBeTruthy();
        });

        // Step 2: Enter OTP
        const otpInput = screen.getByPlaceholderText('••••••') as HTMLInputElement;
        fireEvent.change(otpInput, { target: { value: '123456' } });

        const verifyBtn = screen.getByRole('button', { name: /verify code/i });
        fireEvent.click(verifyBtn);

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /create new password/i })).toBeTruthy();
        });

        expect(AuthService.verifyOtp).toHaveBeenCalledWith('test@example.com', '123456');
    });

    it('submits new password and shows Success Step', async () => {
        vi.mocked(AuthService.forgotPassword).mockResolvedValue({ data: { message: 'OTP sent' } } as never);
        vi.mocked(AuthService.verifyOtp).mockResolvedValue({
            data: { message: 'Code verified', resetToken: 'fake-token-123' }
        } as never);
        vi.mocked(AuthService.resetPassword).mockResolvedValue({
            data: { message: 'Password reset successfully!' }
        } as never);

        render(<ForgotPasswordModal open={true} defaultEmail="test@example.com" />);

        // Step 1
        fireEvent.click(screen.getByRole('button', { name: /send otp/i }));
        await waitFor(() => expect(screen.getByPlaceholderText('••••••')).toBeTruthy());

        // Step 2
        fireEvent.change(screen.getByPlaceholderText('••••••'), { target: { value: '654321' } });
        fireEvent.click(screen.getByRole('button', { name: /verify code/i }));
        await waitFor(() => expect(screen.getByRole('heading', { name: /create new password/i })).toBeTruthy());

        // Step 3
        const passwordInputs = screen.getAllByPlaceholderText('••••••••') as HTMLInputElement[];
        fireEvent.change(passwordInputs[0], { target: { value: 'brandNewPassword123' } });
        fireEvent.change(passwordInputs[1], { target: { value: 'brandNewPassword123' } });

        const resetBtn = screen.getByRole('button', { name: /reset password/i });
        fireEvent.click(resetBtn);

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /password updated!/i })).toBeTruthy();
            expect(screen.getByRole('button', { name: /proceed to sign in/i })).toBeTruthy();
        });

        expect(AuthService.resetPassword).toHaveBeenCalledWith({
            email: 'test@example.com',
            resetToken: 'fake-token-123',
            otp: '654321',
            newPassword: 'brandNewPassword123',
            confirmPassword: 'brandNewPassword123'
        });
    });
});
