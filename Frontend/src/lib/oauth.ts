/**
 * Helper to get the OAuth2 authorization initiation URL for supported providers.
 * In development, Vite proxies `/oauth2` directly to the Spring Boot backend (`http://localhost:8080`).
 * In production, if VITE_API_BASE_URL is an absolute URL, the backend origin is derived.
 */
export type OAuthProvider = 'google' | 'github';

export function getOAuth2AuthorizationUrl(provider: OAuthProvider): string {
    const oauthBase = import.meta.env.VITE_OAUTH_BASE_URL;
    if (oauthBase && typeof oauthBase === 'string' && oauthBase.trim()) {
        const cleanBase = oauthBase.trim().replace(/\/+$/, '');
        return `${cleanBase}/oauth2/authorization/${provider}`;
    }

    const apiBase = import.meta.env.VITE_API_BASE_URL;
    if (apiBase && typeof apiBase === 'string' && apiBase.startsWith('http')) {
        try {
            const origin = new URL(apiBase).origin;
            return `${origin}/oauth2/authorization/${provider}`;
        } catch {
            // Fallback to relative path if URL parsing fails
        }
    }
    return `/oauth2/authorization/${provider}`;
}

export function initiateOAuth2Login(provider: OAuthProvider): void {
    const url = getOAuth2AuthorizationUrl(provider);
    window.location.href = url;
}
