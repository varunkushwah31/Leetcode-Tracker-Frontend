import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChangePasswordModal } from './ChangePasswordModal';
import { AuthService } from '@/services/endpoints';

vi.mock('@/services/endpoints', () => ({
    AuthService: {
        changePassword: vi.fn(),
    },
}));

describe('ChangePasswordModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders form inputs when open', () => {
        render(<ChangePasswordModal open={true} />);

        expect(screen.getByText('Change Password')).toBeDefined();
        expect(screen.getByPlaceholderText('Enter current password')).toBeDefined();
        expect(screen.getByPlaceholderText('At least 6 characters')).toBeDefined();
        expect(screen.getByPlaceholderText('Re-enter new password')).toBeDefined();
    });

    it('validates minimum length for new password', async () => {
        render(<ChangePasswordModal open={true} />);

        fireEvent.change(screen.getByPlaceholderText('Enter current password'), {
            target: { value: 'current123' },
        });
        fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), {
            target: { value: '123' },
        });
        fireEvent.change(screen.getByPlaceholderText('Re-enter new password'), {
            target: { value: '123' },
        });

        fireEvent.click(screen.getByRole('button', { name: /update password/i }));

        await waitFor(() => {
            expect(screen.getByText('New password must be at least 6 characters long.')).toBeDefined();
        });
        expect(AuthService.changePassword).not.toHaveBeenCalled();
    });

    it('validates that new password cannot be the same as current password', async () => {
        render(<ChangePasswordModal open={true} />);

        fireEvent.change(screen.getByPlaceholderText('Enter current password'), {
            target: { value: 'samePassword123' },
        });
        fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), {
            target: { value: 'samePassword123' },
        });
        fireEvent.change(screen.getByPlaceholderText('Re-enter new password'), {
            target: { value: 'samePassword123' },
        });

        fireEvent.click(screen.getByRole('button', { name: /update password/i }));

        await waitFor(() => {
            expect(screen.getByText('New password cannot be the same as your current password.')).toBeDefined();
        });
        expect(AuthService.changePassword).not.toHaveBeenCalled();
    });

    it('validates password confirmation match', async () => {
        render(<ChangePasswordModal open={true} />);

        fireEvent.change(screen.getByPlaceholderText('Enter current password'), {
            target: { value: 'current123' },
        });
        fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), {
            target: { value: 'newPass456' },
        });
        fireEvent.change(screen.getByPlaceholderText('Re-enter new password'), {
            target: { value: 'differentPass' },
        });

        fireEvent.click(screen.getByRole('button', { name: /update password/i }));

        await waitFor(() => {
            expect(screen.getByText('New password and confirmation do not match.')).toBeDefined();
        });
        expect(AuthService.changePassword).not.toHaveBeenCalled();
    });

    it('submits successfully and shows success message', async () => {
        vi.mocked(AuthService.changePassword).mockResolvedValueOnce({
            data: { message: 'Password updated successfully!' },
        } as never);

        render(<ChangePasswordModal open={true} />);

        fireEvent.change(screen.getByPlaceholderText('Enter current password'), {
            target: { value: 'currentPass123' },
        });
        fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), {
            target: { value: 'brandNewPass456' },
        });
        fireEvent.change(screen.getByPlaceholderText('Re-enter new password'), {
            target: { value: 'brandNewPass456' },
        });

        fireEvent.click(screen.getByRole('button', { name: /update password/i }));

        await waitFor(() => {
            expect(AuthService.changePassword).toHaveBeenCalledWith({
                currentPassword: 'currentPass123',
                newPassword: 'brandNewPass456',
                confirmPassword: 'brandNewPass456',
            });
            expect(screen.getByText('Password updated successfully!')).toBeDefined();
        });
    });

    it('displays server error message when API rejects current password', async () => {
        vi.mocked(AuthService.changePassword).mockRejectedValueOnce({
            response: {
                data: { message: 'Current password is incorrect.' },
            },
        });

        render(<ChangePasswordModal open={true} />);

        fireEvent.change(screen.getByPlaceholderText('Enter current password'), {
            target: { value: 'wrongCurrentPass' },
        });
        fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), {
            target: { value: 'brandNewPass456' },
        });
        fireEvent.change(screen.getByPlaceholderText('Re-enter new password'), {
            target: { value: 'brandNewPass456' },
        });

        fireEvent.click(screen.getByRole('button', { name: /update password/i }));

        await waitFor(() => {
            expect(screen.getByText('Current password is incorrect.')).toBeDefined();
        });
    });
});
