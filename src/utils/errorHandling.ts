/**
 * Error Handling Utility
 * Maps technical error codes (especially Firebase Auth) to friendly user messages.
 */

export const getFriendlyErrorMessage = (error: any): string => {
    if (!error) return 'An unexpected error occurred.';

    // If it's a string, logic might vary, but usually we want to checking generic strings too
    const message = typeof error === 'string' ? error : error.message || error.code || '';
    const code = error.code || '';

    // Firebase Auth Error Codes
    if (code === 'auth/email-already-in-use' || message.includes('email-already-in-use')) {
        return 'This email address is already in use. Please sign in instead.';
    }

    if (code === 'auth/invalid-email' || message.includes('invalid-email')) {
        return 'Please enter a valid email address.';
    }

    if (code === 'auth/weak-password' || message.includes('weak-password')) {
        return 'Your password is too weak. Please use at least 6 characters.';
    }

    if (code === 'auth/user-not-found' || message.includes('user-not-found')) {
        return 'No account found with this email. Please check your email or sign up.';
    }

    if (code === 'auth/wrong-password' || message.includes('wrong-password')) {
        return 'Incorrect password. Please try again or reset your password.';
    }

    if (code === 'auth/network-request-failed' || message.includes('network-request-failed')) {
        return 'Network error. Please check your internet connection and try again.';
    }

    if (code === 'auth/too-many-requests' || message.includes('too-many-requests')) {
        return 'Too many attempts. Please try again later or reset your password.';
    }

    if (code === 'auth/requires-recent-login' || message.includes('requires-recent-login')) {
        return 'For security, please sign in again to continue.';
    }

    // Generic or Custom Errors
    if (message.includes('Passwords do not match')) {
        return 'Passwords do not match. Please try again.';
    }

    // Fallback for unhandled technical errors
    if (process.env.NODE_ENV === 'development') {
        return message; // Show tech error in dev
    }

    return 'An unexpected error occurred. Please try again.';
};
