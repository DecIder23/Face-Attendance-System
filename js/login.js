document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('username').value; // Renamed from username to email for consistency with backend
        const password = document.getElementById('password').value;
        
        // Remove any existing error message
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userRole', data.user.role);
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('userEmail', data.user.email); // Store email for display if needed
                if (data.user.role === 'student') {
                    localStorage.setItem('studentEmail', data.user.email); // Save for subjects page auto-fill
                    localStorage.setItem('studentId', data.user.id); // Ensure studentId is set for attendance page
                }

                if (data.user.role === 'admin') {
                    window.location.href = 'pages/admin/dashboard.html';
                } else if (data.user.role === 'teacher') {
                    window.location.href = 'pages/teacher/dashboard.html'; // Assuming a teacher dashboard exists
                } else if (data.user.role === 'student') {
                    window.location.href = 'pages/student/dashboard.html'; // Assuming a student dashboard exists
                } else {
                    displayErrorMessage('Unknown user role.');
                }
            } else {
                displayErrorMessage(data.message || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Login error:', error);
            displayErrorMessage('An error occurred during login. Please try again later.');
        }
    });

    function displayErrorMessage(message) {
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.textContent = message;
        loginForm.appendChild(errorMsg);
    }
    
    // Check if user is already logged in
    // Check if user is already logged in and redirect
    if (localStorage.getItem('isLoggedIn') === 'true') {
        const userRole = localStorage.getItem('userRole');
        if (userRole === 'admin') {
            window.location.href = 'pages/admin/dashboard.html';
        } else if (userRole === 'teacher') {
            window.location.href = 'pages/teacher/dashboard.html';
        } else if (userRole === 'student') {
            window.location.href = 'pages/student/dashboard.html';
        }
    }
});

