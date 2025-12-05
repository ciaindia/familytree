// Environment Configuration
// Automatically detects if running in production or development

// Helper function to detect if running locally
const isLocalEnvironment = () => {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
};

const config = {
    // Auto-detect API URL based on current hostname
    API_BASE_URL: isLocalEnvironment()
        ? 'http://localhost:5000/api'  // Development
        : `${window.location.protocol}//${window.location.hostname}/api`,  // Production

    // Auto-detect base URL for static files (photos)
    BASE_URL: isLocalEnvironment()
        ? 'http://localhost:5000'  // Development
        : `${window.location.protocol}//${window.location.hostname}`  // Production
};

// Expose config globally
window.APP_CONFIG = config;

console.log('Environment:', isLocalEnvironment() ? 'Development' : 'Production');
console.log('API URL:', config.API_BASE_URL);
console.log('Base URL:', config.BASE_URL);
