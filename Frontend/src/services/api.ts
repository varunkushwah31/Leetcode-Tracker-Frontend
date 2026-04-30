import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export const api = axios.create({
    baseURL: API_BASE_URL,
    // CRITICAL: This tells the browser to include the HTTP-Only refresh token cookie in requests
    withCredentials: true,
});

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
        return Promise.reject(error);
    }
);

// 2. RESPONSE INTERCEPTOR (Handles Token Rotation & Global Error Formatting)
api.interceptors.response.use(
    (response) => {
        // If the request succeeds, just return the response
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // --- PART A: Token Rotation Logic ---
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Silently request a new token from the backend
                const refreshResponse = await axios.post(
                    `${API_BASE_URL}/v1/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                const newAccessToken = refreshResponse.data.accessToken;
                localStorage.setItem('accessToken', newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                // Retry the original request
                return api(originalRequest);

            } catch (refreshError: any) {
                console.error('Session expired. Please log in again.');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
                window.location.href = '/login';

                // Format the refresh error if the backend sent a specific message
                let refreshErrMsg = "Session expired. Please log in again.";
                if (refreshError.response?.data?.message) {
                    refreshErrMsg = refreshError.response.data.message;
                }
                return Promise.reject(new Error(refreshErrMsg));
            }
        }

        // --- PART B: Global Error Formatting (For all other errors) ---
        let specificErrorMessage = "Unable to connect to the server. Please check your internet connection.";

        if (error.response) {
            // The request reached the backend, and it responded with an error status
            // Extract our custom Spring Boot ApiErrorResponse payload
            const backendData = error.response.data;

            if (backendData && backendData.message) {
                // This grabs the exact message from your GlobalExceptionHandler!
                specificErrorMessage = backendData.message;
            } else if (typeof backendData === 'string' && backendData !== '') {
                // Fallback just in case the backend sends a plain text string instead of JSON
                specificErrorMessage = backendData;
            } else {
                // Fallback for generic server errors
                specificErrorMessage = `Server Error (${error.response.status}): ${error.response.statusText}`;
            }
        } else if (error.request) {
            // The request was made but no response was received (Backend is down/offline)
            specificErrorMessage = "The backend server is not responding. Please ensure it is running.";
        }

        // Reject the promise with a standard Error object containing our highly specific message
        return Promise.reject(new Error(specificErrorMessage));
    }
);

export default api;