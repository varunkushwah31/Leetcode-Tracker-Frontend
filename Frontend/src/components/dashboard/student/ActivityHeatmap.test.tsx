import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ActivityHeatmap } from './ActivityHeatmap';
import type { ProgressRecord } from '@/types';

describe('ActivityHeatmap', () => {
    const today = new Date();
    const formatDateKey = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const dateToday = formatDateKey(today);
    const dateYesterday = formatDateKey(new Date(today.getTime() - 86400000));
    const dateTwoDaysAgo = formatDateKey(new Date(today.getTime() - 2 * 86400000));

    const mockProgress: ProgressRecord[] = [
        { date: dateToday, questionSolved: 5 },
        { date: dateYesterday, questionSolved: 3 },
        { date: dateTwoDaysAgo, questionSolved: 2 },
    ];

    it('renders 1-year activity heatmap by default', () => {
        render(<ActivityHeatmap progressHistory={mockProgress} />);

        expect(screen.getByText('Activity Heatmap')).toBeTruthy();
        expect(screen.getByText(/submissions in the past one year/i)).toBeTruthy();
        expect(screen.getByText('10')).toBeTruthy(); // 5 + 3 + 2 = 10
        expect(screen.getByRole('button', { name: /12 Weeks/i })).toBeTruthy();
        expect(screen.getByRole('button', { name: /6 Months/i })).toBeTruthy();
        expect(screen.getByRole('button', { name: /1 Year/i })).toBeTruthy();
    });

    it('switches time ranges when clicking buttons', () => {
        render(<ActivityHeatmap progressHistory={mockProgress} />);

        // Switch to 6 Months
        fireEvent.click(screen.getByRole('button', { name: /6 Months/i }));
        expect(screen.getByText('Activity Heatmap')).toBeTruthy();
        expect(screen.getByText(/submissions in the past 6 months/i)).toBeTruthy();

        // Switch to 12 Weeks
        fireEvent.click(screen.getByRole('button', { name: /12 Weeks/i }));
        expect(screen.getByText('Activity Heatmap')).toBeTruthy();
        expect(screen.getByText(/submissions in the past 12 weeks/i)).toBeTruthy();

        // Switch back to 1 Year
        fireEvent.click(screen.getByRole('button', { name: /1 Year/i }));
        expect(screen.getByText(/submissions in the past one year/i)).toBeTruthy();
    });

    it('calculates streaks correctly even if consistencyStreak is 0', () => {
        render(<ActivityHeatmap progressHistory={mockProgress} consistencyStreak={0} />);

        // Streak should be 3 days (today, yesterday, 2 days ago)
        expect(screen.getAllByText('3d').length).toBeGreaterThanOrEqual(1);
    });

    it('uses consistencyStreak if it is larger than calculated max streak', () => {
        render(<ActivityHeatmap progressHistory={mockProgress} consistencyStreak={15} />);

        expect(screen.getByText('15d')).toBeTruthy();
    });

    it('renders weekday labels and activity legend', () => {
        render(<ActivityHeatmap progressHistory={mockProgress} />);

        expect(screen.getByText('Mon')).toBeTruthy();
        expect(screen.getByText('Wed')).toBeTruthy();
        expect(screen.getByText('Fri')).toBeTruthy();
        expect(screen.getByText('Less')).toBeTruthy();
        expect(screen.getByText('More')).toBeTruthy();
        expect(screen.getByText(/Synchronized daily submissions activity/i)).toBeTruthy();
    });
});
