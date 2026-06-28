interface ConfigValidationResult {
  isValid: boolean;
  missingVars: string[];
  errors: string[];
  warnings: string[];
}

class ConfigValidator {
  private requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_GOOGLE_MAPS_API_KEY',
  ];

  /** Recommended vars — missing ones produce a warning but don't block startup. */
  private recommendedEnvVars = [
    'VITE_RESEND_API_KEY',
    'VITE_APP_URL',
  ];

  validate(): ConfigValidationResult {
    const missingVars: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for missing required environment variables
    for (const varName of this.requiredEnvVars) {
      const value = (import.meta.env as any)[varName];
      if (!value || value.trim() === '') {
        missingVars.push(varName);
      }
    }

    // Check recommended variables (warn, don't error)
    for (const varName of this.recommendedEnvVars) {
      const value = (import.meta.env as any)[varName];
      if (!value || value.trim() === '') {
        warnings.push(`${varName} is not set — some features may be degraded`);
      }
    }

    // Validate specific formats
    const firebaseAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
    if (firebaseAuthDomain && !firebaseAuthDomain.includes('.firebaseapp.com')) {
      errors.push('VITE_FIREBASE_AUTH_DOMAIN must be a valid Firebase Auth Domain');
    }

    const resendKey = import.meta.env.VITE_RESEND_API_KEY;
    if (resendKey && !resendKey.startsWith('re_') && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resendKey)) {
      errors.push('VITE_RESEND_API_KEY does not appear to be a valid Resend API key (should start with re_ or be a valid UUID)');
    }

    return {
      isValid: missingVars.length === 0 && errors.length === 0,
      missingVars,
      errors,
      warnings,
    };
  }

  validateAndThrow(): void {
    const result = this.validate();
    if (!result.isValid) {
      const messages = [];
      if (result.missingVars.length > 0) {
        messages.push(`Missing required environment variables: ${result.missingVars.join(', ')}`);
      }
      if (result.errors.length > 0) {
        messages.push(`Configuration errors: ${result.errors.join('; ')}`);
      }
      throw new Error(`Configuration validation failed: ${messages.join('. ')}`);
    }
  }

  getRequiredVars(): string[] {
    return [...this.requiredEnvVars];
  }

  getRecommendedVars(): string[] {
    return [...this.recommendedEnvVars];
  }
}

export const configValidator = new ConfigValidator();
export type { ConfigValidationResult };