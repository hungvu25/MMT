/**
 * Auto refresh access token when it's about to expire
 */

let refreshInterval = null;

export function startTokenRefresh() {
    // Clear any existing interval
    stopTokenRefresh();
    
    // Refresh token every 25 minutes (access token expires in 30 minutes)
    refreshInterval = setInterval(async () => {
        await refreshAccessToken();
    }, 25 * 60 * 1000); // 25 minutes
    
    console.log('[TokenRefresh] Auto refresh started');
}

export function stopTokenRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
        console.log('[TokenRefresh] Auto refresh stopped');
    }
}

export async function refreshAccessToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
        console.log('[TokenRefresh] No refresh token found');
        return false;
    }
    
    try {
        console.log('[TokenRefresh] Refreshing access token...');
        
        const res = await fetch('http://localhost:8000/api/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
        });
        
        if (!res.ok) {
            throw new Error('Refresh token expired or invalid');
        }
        
        const data = await res.json();
        
        // Update access token
        localStorage.setItem('access_token', data.access_token);
        
        console.log('[TokenRefresh] ✅ Access token refreshed successfully');
        return true;
        
    } catch (error) {
        console.error('[TokenRefresh] ❌ Failed to refresh token:', error);
        
        // Clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('username');
        
        // Dispatch event to notify app to redirect to login
        window.dispatchEvent(new CustomEvent('tokenExpired'));
        
        return false;
    }
}
