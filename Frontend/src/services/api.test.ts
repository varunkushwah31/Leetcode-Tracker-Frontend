import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { api, isAuthEndpoint } from './api';

describe('API Service Interceptors and Auth Handling', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    describe('isAuthEndpoint helper', () => {
        it('correctly identifies auth endpoints', () => {
            expect(isAuthEndpoint('/v1/auth/login')).toBe(true);
            expect(isAuthEndpoint('/v1/auth/register')).toBe(true);
            expect(isAuthEndpoint('/v1/auth/register/student')).toBe(true);
            expect(isAuthEndpoint('/v1/auth/refresh')).toBe(true);
            expect(isAuthEndpoint('/v1/auth/logout')).toBe(true);
            expect(isAuthEndpoint('/api/v1/auth/login')).toBe(true);
        });

        it('returns false for non-auth endpoints', () => {
            expect(isAuthEndpoint('/students/me/dashboard')).toBe(false);
            expect(isAuthEndpoint('/mentors/123')).toBe(false);
            expect(isAuthEndpoint(undefined)).toBe(false);
            expect(isAuthEndpoint('')).toBe(false);
        });
    });

    describe('Request Interceptor', () => {
        it('does NOT attach Authorization header to auth endpoints even when token exists', async () => {
            localStorage.setItem('accessToken', 'stale-test-token');

            // Find the request interceptor handler
            const requestInterceptor = (api.interceptors.request as any).handlers[0];
            const config = {
                url: '/v1/auth/login',
                headers: {} as Record<string, string>,
            };

            const result = await requestInterceptor.fulfilled(config);
            expect(result.headers.Authorization).toBeUndefined();
        });

        it('DOES attach Authorization header to protected endpoints when token exists', async () => {
            localStorage.setItem('accessToken', 'valid-test-token');

            const requestInterceptor = (api.interceptors.request as any).handlers[0];
            const config = {
                url: '/students/me/dashboard',
                headers: {} as Record<string, string>,
            };

            const result = await requestInterceptor.fulfilled(config);
            expect(result.headers.Authorization).toBe('Bearer valid-test-token');
        });
    });

    describe('Response Interceptor 401 handling', () => {
        it('does NOT trigger token refresh or window.location when auth endpoint returns 401', async () => {
            const postSpy = vi.spyOn(axios, 'post');

            const responseInterceptor = (api.interceptors.response as any).handlers[0];

            const authError = {
                config: { url: '/v1/auth/login', headers: {} },
                response: {
                    status: 401,
                    statusText: 'Unauthorized',
                    data: { message: 'Invalid email or password.' }
                }
            };

            await expect(responseInterceptor.rejected(authError)).rejects.toThrow('Invalid email or password.');
            // Crucial: token refresh endpoint /v1/auth/refresh must NOT have been called!
            expect(postSpy).not.toHaveBeenCalled();
        });

        it('correctly extracts structured validation errors from backend response', async () => {
            const responseInterceptor = (api.interceptors.response as any).handlers[0];

            const validationError = {
                config: { url: '/v1/auth/register/student', headers: {} },
                response: {
                    status: 400,
                    statusText: 'Bad Request',
                    data: {
                        message: 'Validation failed',
                        validationErrors: {
                            email: 'Must be a valid email address',
                            password: 'Password must be at least 8 characters'
                        }
                    }
                }
            };

            await expect(responseInterceptor.rejected(validationError)).rejects.toThrow(
                /Validation failed \(email: Must be a valid email address, password: Password must be at least 8 characters\)/
            );
        });

        it('correctly extracts conflict error from duplicate registration', async () => {
            const responseInterceptor = (api.interceptors.response as any).handlers[0];

            const conflictError = {
                config: { url: '/v1/auth/register/student', headers: {} },
                response: {
                    status: 409,
                    statusText: 'Conflict',
                    data: {
                        message: 'Student with email already exists'
                    }
                }
            };

            await expect(responseInterceptor.rejected(conflictError)).rejects.toThrow('Student with email already exists');
        });
    });
});
