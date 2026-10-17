import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ContactPage } from './ContactPage';
import { ThemeProvider } from '../context/ThemeContext';
import { ContactService } from '../services/endpoints';

vi.mock('../services/endpoints', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../services/endpoints')>();
    return {
        ...actual,
        ContactService: {
            sendMessage: vi.fn(),
        }
    };
});

const renderContactPage = () => {
    return render(
        <ThemeProvider>
            <MemoryRouter initialEntries={['/contact']}>
                <ContactPage />
            </MemoryRouter>
        </ThemeProvider>
    );
};

describe('ContactPage Functionality & Details', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders contact details including email, phone, and headquarters', () => {
        renderContactPage();

        // Email checks
        const emailElements = screen.getAllByText('varun.kush3@gmail.com');
        expect(emailElements.length).toBeGreaterThanOrEqual(1);

        const emailLink = screen.getAllByRole('link', { name: /Email Us/i })[0];
        expect(emailLink.getAttribute('href')).toBe('mailto:varun.kush3@gmail.com');

        // Phone checks
        const phoneElements = screen.getAllByText('+91 82185 68519');
        expect(phoneElements.length).toBeGreaterThanOrEqual(1);

        const phoneLink = screen.getAllByRole('link', { name: /Call Us/i })[0];
        expect(phoneLink.getAttribute('href')).toBe('tel:+918218568519');

        // Headquarters checks
        const hqElements = screen.getAllByText('KIET, Ghaziabad, India');
        expect(hqElements.length).toBeGreaterThanOrEqual(1);
    });

    it('populates subject line when clicking a quick topic suggestion chip', () => {
        renderContactPage();

        const subjectInput = screen.getByLabelText(/Subject/i) as HTMLInputElement;
        expect(subjectInput.value).toBe('');

        const supportChip = screen.getByRole('button', { name: 'Technical Support' });
        fireEvent.click(supportChip);

        expect(subjectInput.value).toBe('Technical Support');
    });

    it('validates form fields and displays error banner when invalid', async () => {
        renderContactPage();

        const submitBtn = screen.getByRole('button', { name: /Send Message/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText(/Please provide your full name/i)).toBeTruthy();
        });

        // Fill invalid email
        fireEvent.change(screen.getByLabelText(/Your Name/i), { target: { value: 'Alice' } });
        fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'invalid-email' } });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText(/Please enter a valid email address/i)).toBeTruthy();
        });
    });

    it('successfully submits the contact form and shows confirmation screen', async () => {
        vi.mocked(ContactService.sendMessage).mockResolvedValueOnce({
            data: { message: 'Success' }
        } as never);

        renderContactPage();

        fireEvent.change(screen.getByLabelText(/Your Name/i), { target: { value: 'Jane Mentor' } });
        fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'jane@bootcamp.edu' } });
        fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '9876543210' } });
        fireEvent.change(screen.getByLabelText(/Subject/i), { target: { value: 'Classroom Onboarding' } });
        fireEvent.change(screen.getByLabelText(/Message/i), {
            target: { value: 'We would love to onboard 50 students into MentorSync.' }
        });

        const submitBtn = screen.getByRole('button', { name: /Send Message/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(ContactService.sendMessage).toHaveBeenCalledWith({
                name: 'Jane Mentor',
                email: 'jane@bootcamp.edu',
                phone: '9876543210',
                subject: 'Classroom Onboarding',
                message: 'We would love to onboard 50 students into MentorSync.'
            });
        });

        await waitFor(() => {
            expect(screen.getByText('Message Received!')).toBeTruthy();
            expect(screen.getByText(/We will reach back out to/i)).toBeTruthy();
        });

        // Test "Send another message" reset
        const resetBtn = screen.getByRole('button', { name: /Send another message/i });
        fireEvent.click(resetBtn);

        expect(screen.getByLabelText(/Your Name/i)).toBeTruthy();
        expect((screen.getByLabelText(/Your Name/i) as HTMLInputElement).value).toBe('');
    });
});
