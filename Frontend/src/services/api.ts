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


// 2. RESPONSE INTERCEPTOR (Handles 401 errors and Token Rotation)
api.interceptors.response.use(
    (response) => {
        // If the request succeeds, just return the response
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // If the error is 401 (Unauthorized) AND we haven't already retried this request
        if (error.response?.status === 401 && !originalRequest._retry) {

            // Mark this request so we don't get stuck in an infinite retry loop
            originalRequest._retry = true;

            try {
                // Silently request a new token from the backend
                // Notice we use a raw axios call here, not our 'api' instance, to avoid interceptor loops
                const refreshResponse = await axios.post(
                    `${API_BASE_URL}/v1/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                // Grab the brand new access token from the response
                const newAccessToken = refreshResponse.data.accessToken;

                // Save it to local storage
                localStorage.setItem('accessToken', newAccessToken);

                // Update the original failed request with the new token
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                // Retry the original request!
                return api(originalRequest);

            } catch (refreshError) {
                // If the refresh fails (e.g., the 7-day cookie expired or was revoked),
                // the session is truly dead. We must log the user out.
                console.error('Session expired. Please log in again.');

                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');

                // Force redirect to the login page
                window.location.href = '/login';

                return Promise.reject(refreshError);
            }
        }

        // If it's any other error (400, 404, 500), just pass it down to the component
        return Promise.reject(error);
    }
);


export default api;