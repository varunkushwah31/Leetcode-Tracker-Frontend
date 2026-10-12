import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StudentEmailVerificationModal } from './StudentEmailVerificationModal';

describe('StudentEmailVerificationModal Component', () => {
    const mockVerifyAndRegister = vi.fn();
    const mockResendOtp = vi.fn();
    const mockOpenChange = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders modal when open with email, header, and input', () => {
        render(
            <StudentEmailVerificationModal
                open={true}
                onOpenChange={mockOpenChange}
                email="student@university.edu"
                studentName="Emma"
                onVerifyAndRegister={mockVerifyAndRegister}
                onResendOtp={mockResendOtp}
            />
        );

        expect(screen.getByRole('heading', { name: /verify your email address/i })).toBeTruthy();
        expect(screen.getAllByText(/student@university.edu/i).length).toBeGreaterThan(0);
        expect(screen.getByPlaceholderText('123456')).toBeTruthy();
        expect(screen.getByRole('button', { name: /verify & complete registration/i })).toBeTruthy();
    });

    it('formats input allowing digits only up to 6 characters and enables submit', () => {
        render(
            <StudentEmailVerificationModal
                open={true}
                onOpenChange={mockOpenChange}
                email="student@university.edu"
                onVerifyAndRegister={mockVerifyAndRegister}
                onResendOtp={mockResendOtp}
            />
        );

        const input = screen.getByPlaceholderText('123456') as HTMLInputElement;
        const submitBtn = screen.getByRole('button', { name: /verify & complete registration/i }) as HTMLButtonElement;

        expect(submitBtn.disabled).toBe(true);

        fireEvent.change(input, { target: { value: 'abc12x3456extra' } });
        expect(input.value).toBe('123456');
        expect(submitBtn.disabled).toBe(false);
    });

    it('calls onVerifyAndRegister with entered OTP on submit', async () => {
        mockVerifyAndRegister.mockResolvedValue(undefined);

        render(
            <StudentEmailVerificationModal
                open={true}
                onOpenChange={mockOpenChange}
                email="student@university.edu"
                onVerifyAndRegister={mockVerifyAndRegister}
                onResendOtp={mockResendOtp}
            />
        );

        const input = screen.getByPlaceholderText('123456');
        fireEvent.change(input, { target: { value: '987654' } });

        const submitBtn = screen.getByRole('button', { name: /verify & complete registration/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockVerifyAndRegister).toHaveBeenCalledWith('987654');
        });
    });

    it('displays error banner if onVerifyAndRegister rejects', async () => {
        mockVerifyAndRegister.mockRejectedValue(new Error('Invalid verification code'));

        render(
            <StudentEmailVerificationModal
                open={true}
                onOpenChange={mockOpenChange}
                email="student@university.edu"
                onVerifyAndRegister={mockVerifyAndRegister}
                onResendOtp={mockResendOtp}
            />
        );

        const input = screen.getByPlaceholderText('123456');
        fireEvent.change(input, { target: { value: '111222' } });

        const submitBtn = screen.getByRole('button', { name: /verify & complete registration/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            const alert = screen.getByRole('alert');
            expect(alert).toBeTruthy();
            expect(alert.textContent).toContain('Invalid verification code');
        });
    });

    it('allows changing email by calling onOpenChange(false)', () => {
        render(
            <StudentEmailVerificationModal
                open={true}
                onOpenChange={mockOpenChange}
                email="student@university.edu"
                onVerifyAndRegister={mockVerifyAndRegister}
                onResendOtp={mockResendOtp}
            />
        );

        const changeEmailBtn = screen.getByRole('button', { name: /change email address/i });
        fireEvent.click(changeEmailBtn);

        expect(mockOpenChange).toHaveBeenCalledWith(false);
    });
});
