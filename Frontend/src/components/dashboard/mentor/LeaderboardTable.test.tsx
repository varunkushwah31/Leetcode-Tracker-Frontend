import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LeaderboardTable } from './LeaderboardTable';
import type { StudentSummaryDTO } from '@/types';

describe('LeaderboardTable Sorting Functionality', () => {
    const mockStudents: StudentSummaryDTO[] = [
        {
            id: '1',
            name: 'Charlie Brown',
            role: 'STUDENT',
            leetcodeUsername: 'charlie_lc',
            codeforcesHandle: 'charlie_cf',
            totalSolved: 150,
            leetcodeSolvedCount: 100,
            codeforcesSolvedCount: 50,
            consistencyStreak: 5,
            currentContestRating: 1600,
            codeforcesRating: 1400,
            completedAssignments: 2,
            pendingAssignments: 3,
        },
        {
            id: '2',
            name: 'Alice Smith',
            role: 'STUDENT',
            leetcodeUsername: 'alice_lc',
            codeforcesHandle: 'alice_cf',
            totalSolved: 300,
            leetcodeSolvedCount: 200,
            codeforcesSolvedCount: 100,
            consistencyStreak: 12,
            currentContestRating: 1400,
            codeforcesRating: 1900, // Highest CF rating
            completedAssignments: 5,
            pendingAssignments: 0,
        },
        {
            id: '3',
            name: 'Bob Jones',
            role: 'STUDENT',
            leetcodeUsername: 'bob_lc',
            codeforcesHandle: undefined,
            totalSolved: 50,
            leetcodeSolvedCount: 50,
            codeforcesSolvedCount: 0,
            consistencyStreak: 20, // Highest streak
            currentContestRating: 1750, // Highest LC rating
            codeforcesRating: undefined,
            completedAssignments: 1,
            pendingAssignments: 5,
        },
    ];

    it('renders students and sorts by totalSolved descending by default', () => {
        render(
            <LeaderboardTable
                students={mockStudents}
                sortBy="solved"
                onSortChange={vi.fn()}
                onExportCSV={vi.fn()}
                onStudentClick={vi.fn()}
            />
        );

        // All 3 students are rendered
        expect(screen.getByText('Alice Smith')).toBeTruthy();
        expect(screen.getByText('Charlie Brown')).toBeTruthy();
        expect(screen.getByText('Bob Jones')).toBeTruthy();

        // Check rows order: Alice (300) first, Charlie (150) second, Bob (50) third
        const rows = screen.getAllByRole('row');
        // row 0 is the header
        expect(rows[1].textContent).toContain('Alice Smith');
        expect(rows[2].textContent).toContain('Charlie Brown');
        expect(rows[3].textContent).toContain('Bob Jones');
    });

    it('toggles direction when clicking the sort direction button', () => {
        const onSortChange = vi.fn();
        render(
            <LeaderboardTable
                students={mockStudents}
                sortBy="solved"
                onSortChange={onSortChange}
                onExportCSV={vi.fn()}
                onStudentClick={vi.fn()}
            />
        );

        const toggleBtn = screen.getByRole('button', { name: /toggle sort direction/i });
        fireEvent.click(toggleBtn);

        // Should call onSortChange with solved_asc
        expect(onSortChange).toHaveBeenCalledWith('solved_asc');

        // Rows should reorder ascending: Bob (50), Charlie (150), Alice (300)
        const rows = screen.getAllByRole('row');
        expect(rows[1].textContent).toContain('Bob Jones');
        expect(rows[2].textContent).toContain('Charlie Brown');
        expect(rows[3].textContent).toContain('Alice Smith');
    });

    it('sorts by Student name alphabetically when clicking the Student column header', () => {
        const onSortChange = vi.fn();
        render(
            <LeaderboardTable
                students={mockStudents}
                sortBy="solved"
                onSortChange={onSortChange}
                onExportCSV={vi.fn()}
                onStudentClick={vi.fn()}
            />
        );

        const studentHeader = screen.getByText('Student');
        fireEvent.click(studentHeader);

        expect(onSortChange).toHaveBeenCalledWith('name_asc');

        // Alphabetical A-Z: Alice, Bob, Charlie
        const rows = screen.getAllByRole('row');
        expect(rows[1].textContent).toContain('Alice Smith');
        expect(rows[2].textContent).toContain('Bob Jones');
        expect(rows[3].textContent).toContain('Charlie Brown');

        // Clicking again toggles to descending Z-A
        fireEvent.click(studentHeader);
        expect(onSortChange).toHaveBeenCalledWith('name_desc');

        const rowsDesc = screen.getAllByRole('row');
        expect(rowsDesc[1].textContent).toContain('Charlie Brown');
        expect(rowsDesc[2].textContent).toContain('Bob Jones');
        expect(rowsDesc[3].textContent).toContain('Alice Smith');
    });

    it('sorts by Streak when clicking the Streak header', () => {
        const onSortChange = vi.fn();
        render(
            <LeaderboardTable
                students={mockStudents}
                sortBy="solved"
                onSortChange={onSortChange}
                onExportCSV={vi.fn()}
                onStudentClick={vi.fn()}
            />
        );

        const streakHeader = screen.getByText('Streak');
        fireEvent.click(streakHeader);

        expect(onSortChange).toHaveBeenCalledWith('consistency_desc');

        // Highest streak first: Bob (20), Alice (12), Charlie (5)
        const rows = screen.getAllByRole('row');
        expect(rows[1].textContent).toContain('Bob Jones');
        expect(rows[2].textContent).toContain('Alice Smith');
        expect(rows[3].textContent).toContain('Charlie Brown');
    });

    it('sorts by Rating taking the highest between LC and CF ratings', () => {
        const onSortChange = vi.fn();
        render(
            <LeaderboardTable
                students={mockStudents}
                sortBy="solved"
                onSortChange={onSortChange}
                onExportCSV={vi.fn()}
                onStudentClick={vi.fn()}
            />
        );

        const ratingHeader = screen.getByText('Rating');
        fireEvent.click(ratingHeader);

        expect(onSortChange).toHaveBeenCalledWith('rating_desc');

        // Highest rating: Alice (CF 1900), Bob (LC 1750), Charlie (LC 1600)
        const rows = screen.getAllByRole('row');
        expect(rows[1].textContent).toContain('Alice Smith');
        expect(rows[2].textContent).toContain('Bob Jones');
        expect(rows[3].textContent).toContain('Charlie Brown');
    });

    it('filters students by search query while maintaining sort order', () => {
        render(
            <LeaderboardTable
                students={mockStudents}
                sortBy="solved"
                onSortChange={vi.fn()}
                onExportCSV={vi.fn()}
                onStudentClick={vi.fn()}
            />
        );

        const searchInput = screen.getByPlaceholderText(/search students/i);
        fireEvent.change(searchInput, { target: { value: 'alice' } });

        expect(screen.getByText('Alice Smith')).toBeTruthy();
        expect(screen.queryByText('Bob Jones')).toBeNull();
        expect(screen.queryByText('Charlie Brown')).toBeNull();
    });
});
