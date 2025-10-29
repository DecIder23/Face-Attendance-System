// Common authentication functions
function logout() {
    // Clear all auth-related data from localStorage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail'); // Assuming userEmail might be stored
    localStorage.removeItem('userName'); // Assuming userName might be stored

    // Clear sessionStorage as well
    sessionStorage.clear();

    // Clear all accessible cookies
    document.cookie.split(';').forEach(function(c) {
        document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
    
    // Redirect to login page
    window.location.href = '/index.html';
}
