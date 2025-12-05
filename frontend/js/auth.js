// Login Form Handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');

    try {
        const response = await api.post('/auth/login', {
            username,
            password
        });

        if (response.success) {
            // Store token and user data
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data));

            // Show success message
            messageDiv.className = 'message success';
            messageDiv.textContent = 'Login successful! Redirecting...';

            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        }
    } catch (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = error.message || 'Login failed. Please try again.';
    }
});
