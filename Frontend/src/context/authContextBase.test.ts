import { describe, it, expect } from 'vitest';
import { ALLOWED_ROLES } from './authContextBase';

describe('AuthContextBase Constants', () => {
    it('defines the allowed roles correctly', () => {
        expect(ALLOWED_ROLES).toContain('SUPER_ADMIN');
        expect(ALLOWED_ROLES).toContain('MENTOR');
        expect(ALLOWED_ROLES).toContain('STUDENT');
        expect(ALLOWED_ROLES).toHaveLength(3);
    });
});
