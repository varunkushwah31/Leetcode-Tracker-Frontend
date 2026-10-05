import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminOverview } from './AdminOverview';
import { AdminService } from '@/services/endpoints';
import type { SystemOverviewDTO, StudentSummaryDTO, CacheStatsResponse } from '@/types';

vi.mock('@/services/endpoints', () => ({
    AdminService: {
        getOverview: vi.fn(),
        getAllStudents: vi.fn(),
        getCacheStats: vi.fn(),
        forceSyncAll: vi.fn(),
        createMentor: vi.fn(),
        deleteMentor: vi.fn(),
        deleteClassroom: vi.fn(),
        deleteStudent: vi.fn(),
        syncStudent: vi.fn(),
        clearCache: vi.fn(),
    },
}));

const mockOverview: SystemOverviewDTO = {
    totalStudents: 42,
    totalMentors: 3,
    totalClassrooms: 4,
    totalAssignments: 12,
    dualPlatformStudents: 20,
    leetcodeOnlyStudents: 15,
    codeforcesOnlyStudents: 7,
    allMentors: [
        { id: 'm1', name: 'Ada Lovelace', email: 'ada@example.com', role: 'MENTOR', classroomIds: ['c1'] },
        { id: 'm2', name: 'Alan Turing', email: 'alan@example.com', role: 'SUPER_ADMIN', classroomIds: [] },
    ],
    allClassrooms: [
        { classroomId: 'c1', className: 'Algorithms 101', mentorName: 'Ada Lovelace', enrolledStudents: [] },
    ],
};

const mockStudents: StudentSummaryDTO[] = [
    {
        id: 's1',
        name: 'Grace Hopper',
        email: 'grace@example.com',
        role: 'STUDENT',
        leetcodeUsername: 'grace_lc',
        codeforcesHandle: 'grace_cf',
        leetcodeSolvedCount: 150,
        codeforcesSolvedCount: 50,
        totalSolved: 200,
        consistencyStreak: 14,
        rank: 'Guardian',
        currentContestRating: 2150,
        completedAssignments: 5,
        pendingAssignments: 0,
    },
];

const mockCacheStats: CacheStatsResponse = {
    redisStatus: 'CONNECTED',
    usedMemoryHuman: '4.2M',
    usedMemoryPeakHuman: '8.0M',
    redisVersion: '7.2.4',
    configuredCaches: ['classroom-dashboard', 'student-stats'],
    namespaceKeyCounts: { 'classroom-dashboard*': 10, 'student-stats*': 25 },
};

describe('AdminOverview Component', () => {
    const mockBack = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(AdminService.getOverview).mockResolvedValue({ data: mockOverview } as never);
        vi.mocked(AdminService.getAllStudents).mockResolvedValue({ data: mockStudents } as never);
        vi.mocked(AdminService.getCacheStats).mockResolvedValue({ data: mockCacheStats } as never);
    });

    it('renders overview header and KPI metrics', async () => {
        render(<AdminOverview onBack={mockBack} />);

        await waitFor(() => {
            expect(screen.getByText('Super Admin Center')).toBeDefined();
            expect(screen.getByText('42')).toBeDefined(); // Total students
            expect(screen.getByText('3')).toBeDefined(); // Total mentors
            expect(screen.getByText('4')).toBeDefined(); // Active classrooms
        });
    });

    it('switches to Mentors tab and displays mentors list', async () => {
        render(<AdminOverview onBack={mockBack} />);

        await waitFor(() => {
            expect(screen.getByText('Super Admin Center')).toBeDefined();
        });

        const mentorsTab = screen.getByRole('tab', { name: /Mentors & Faculty/i });
        fireEvent.pointerDown(mentorsTab, { button: 0 });
        fireEvent.click(mentorsTab);

        await waitFor(() => {
            expect(screen.getByText('Ada Lovelace')).toBeDefined();
            expect(screen.getByText('Alan Turing')).toBeDefined();
            expect(screen.getByText('SUPER ADMIN')).toBeDefined();
        });
    });

    it('switches to Students Directory tab and displays student information', async () => {
        render(<AdminOverview onBack={mockBack} />);

        await waitFor(() => {
            expect(screen.getByText('Super Admin Center')).toBeDefined();
        });

        const studentsTab = screen.getByRole('tab', { name: /Students Directory/i });
        fireEvent.pointerDown(studentsTab, { button: 0 });
        fireEvent.click(studentsTab);

        await waitFor(() => {
            expect(screen.getByText('Grace Hopper')).toBeDefined();
            expect(screen.getByText(/grace_lc/i)).toBeDefined();
            expect(screen.getByText(/grace_cf/i)).toBeDefined();
        });
    });

    it('switches to Redis Diagnostics tab and displays cache stats', async () => {
        render(<AdminOverview onBack={mockBack} />);

        await waitFor(() => {
            expect(screen.getByText('Super Admin Center')).toBeDefined();
        });

        const cacheTab = screen.getByRole('tab', { name: /Redis Diagnostics/i });
        fireEvent.pointerDown(cacheTab, { button: 0 });
        fireEvent.click(cacheTab);

        await waitFor(() => {
            expect(screen.getByText('Redis Cache Management')).toBeDefined();
            expect(screen.getByText('classroom-dashboard')).toBeDefined();
            expect(screen.getByText('student-stats')).toBeDefined();
        });
    });

    it('triggers global sync when clicking Force Global Sync button', async () => {
        vi.mocked(AdminService.forceSyncAll).mockResolvedValue({ data: { message: 'Sync complete' } } as never);

        render(<AdminOverview onBack={mockBack} />);

        await waitFor(() => {
            expect(screen.getByText('Super Admin Center')).toBeDefined();
        });

        const syncButton = screen.getByRole('button', { name: /Force Global Sync/i });
        fireEvent.click(syncButton);

        await waitFor(() => {
            expect(AdminService.forceSyncAll).toHaveBeenCalled();
        });
    });

    it('renders and filters safely when students and mentors have null or missing fields', async () => {
        const corruptedStudents = [
            ...mockStudents,
            {
                id: 'corrupt-1',
                name: null as unknown as string,
                email: null as unknown as string,
                role: 'STUDENT',
                leetcodeUsername: null as unknown as string,
                codeforcesHandle: null as unknown as string,
                leetcodeSolvedCount: 0,
                codeforcesSolvedCount: 0,
                totalSolved: 0,
                consistencyStreak: 0,
                rank: 'Unranked',
                currentContestRating: 0,
                completedAssignments: 0,
                pendingAssignments: 0,
            },
        ];

        vi.mocked(AdminService.getAllStudents).mockResolvedValue({ data: corruptedStudents } as never);

        render(<AdminOverview onBack={mockBack} />);

        await waitFor(() => {
            expect(screen.getByText('Super Admin Center')).toBeDefined();
        });

        const studentsTab = screen.getByRole('tab', { name: /Students Directory/i });
        fireEvent.click(studentsTab);

        await waitFor(() => {
            expect(screen.getByText('Grace Hopper')).toBeDefined();
            expect(screen.getByText('Unnamed Student')).toBeDefined();
        });

        // Search input should filter without crashing on null properties
        const searchInput = screen.getByPlaceholderText(/Search students by name/i);
        fireEvent.change(searchInput, { target: { value: 'Grace' } });

        await waitFor(() => {
            expect(screen.getByText('Grace Hopper')).toBeDefined();
            expect(screen.queryByText('Unnamed Student')).toBeNull();
        });
    });
});
