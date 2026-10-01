import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

declare module "axios" {
    export interface InternalAxiosRequestConfig {
        _retry?: boolean;
    }
}

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

export type ApiFormattedError = Error & { status?: number };

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const api = axios.create({
    baseURL: API_BASE_URL,
    // CRITICAL: This tells the browser to include the HTTP-Only refresh token cookie in requests
    withCredentials: true,
});

// Single-flight refresh queue: concurrent 401s share one refresh call.
let refreshPromise: Promise<string> | null = null;

function requestTokenRefresh(): Promise<string> {
    refreshPromise ??= axios
      .post<{ accessToken: string }>(
        `${API_BASE_URL}/v1/auth/refresh`,
        {},
        {withCredentials: true}
      )
      .then((refreshResponse) => {
          const newAccessToken = refreshResponse.data.accessToken;
          if (!newAccessToken) {
              throw new Error("Session expired. Please log in again.");
          }
          localStorage.setItem('accessToken', newAccessToken);
          return newAccessToken;
      })
      .finally(() => {
          refreshPromise = null;
      });
    return refreshPromise;
}

function toFormattedError(message: string, status?: number): ApiFormattedError {
    const err = new Error(message) as ApiFormattedError;
    if (typeof status === 'number') err.status = status;
    return err;
}

function extractRefreshErrorMessage(refreshError: unknown): { message: string; status?: number } {
    if (axios.isAxiosError(refreshError)) {
        const data = refreshError.response?.data as { message?: string } | undefined;
        return {
            message: data?.message || "Session expired. Please log in again.",
            status: refreshError.response?.status,
        };
    }
    if (refreshError instanceof Error && refreshError.message) {
        return { message: refreshError.message };
    }
    return { message: "Session expired. Please log in again." };
}

function extractErrorMessage(error: AxiosError<{ message?: string; validationErrors?: Record<string, string> } | string>): string {
    if (!error.response) {
        if (error.request) {
            return "The backend server is not responding. Please ensure it is running.";
        }
        return "Unable to connect to the server. Please check your internet connection.";
    }

    const { status, statusText, data, headers } = error.response;

    // Rate limiting: 429 Too Many Requests
    if (status === 429) {
        const retryAfter = headers?.['retry-after'];
        if (data && typeof data === 'object' && data.message) {
            return data.message;
        }
        return `Rate limit exceeded. Please wait ${retryAfter ? `${retryAfter} seconds` : 'a few moments'} before trying again.`;
    }

    // Structured server error response
    if (data && typeof data === 'object') {
        if (data.validationErrors && Object.keys(data.validationErrors).length > 0) {
            const formattedFields = Object.entries(data.validationErrors)
                .map(([field, msg]) => `${field}: ${msg}`)
                .join(', ');
            return `${data.message || 'Validation failed'} (${formattedFields})`;
        }
        if (data.message) {
            return data.message;
        }
    }

    if (typeof data === 'string' && data !== '') {
        const isHtml = data.toLowerCase().includes('<!doctype') || data.toLowerCase().includes('<html');
        if (isHtml) {
            return status === 400
                ? "Bad Request (400): Headers or cookies sent from your browser are too large. Please clear browser cookies for localhost."
                : `Server Error (${status}): ${statusText || 'Unexpected server error'}`;
        }
        return data;
    }

    return `Server Error (${status}): ${statusText || 'Unexpected server error'}`;
}

async function handle401Refresh(originalRequest: RetryableRequest) {
    originalRequest._retry = true;
    try {
        const newAccessToken = await requestTokenRefresh();
        if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return await api(originalRequest);
    } catch (refreshError: unknown) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';

        const { message, status } = extractRefreshErrorMessage(refreshError);
        throw toFormattedError(message, status ?? 401);
    }
}

// 1. REQUEST INTERCEPTOR (Attaches the Access Token to every request)
api.interceptors.request.use(
    (config) => {
        // Grab the short-lived access token from local storage
        const token = localStorage.getItem('accessToken');

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        throw error;
    }
);

// 2. RESPONSE INTERCEPTOR (Handles Token Rotation & Global Error Formatting)
api.interceptors.response.use(
    (response) => {
        // If the request succeeds, just return the response
        return response;
    },
    async (error: AxiosError<{ message?: string } | string>) => {
        const originalRequest = error.config as RetryableRequest | undefined;

        // --- PART A: Token Rotation Logic (single-flight) ---
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
            return await handle401Refresh(originalRequest);
        }

        // --- PART B: Global Error Formatting (For all other errors) ---
        const specificErrorMessage = extractErrorMessage(error);
        if (error.response?.status === 429) {
            console.warn(`[RateLimit 429] Too Many Requests for ${originalRequest?.url}:`, specificErrorMessage);
        }
        throw toFormattedError(specificErrorMessage, error.response?.status);
    }
);

export default api;
