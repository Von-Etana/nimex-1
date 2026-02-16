interface ConfigValidationResult {
  isValid: boolean;
  missingVars: string[];
  errors: string[];
}

class ConfigValidator {
  private requiredEnvVars = [
    'VITE_TWILIO_ACCOUNT_SID',
    'VITE_TWILIO_AUTH_TOKEN',
    'VITE_TWILIO_API_KEY',
    'VITE_TWILIO_API_SECRET',
    'VITE_TWILIO_PHONE_NUMBER',
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_GOOGLE_MAPS_API_KEY',
  ];

  validate(): ConfigValidationResult {
    const missingVars: string[] = [];
    const errors: string[] = [];

    // Check for missing environment variables
    for (const varName of this.requiredEnvVars) {
      const value = (import.meta.env as any)[varName];
      if (!value || value.trim() === '') {
        missingVars.push(varName);
      }
    }

    // Validate specific formats

    const twilioPhone = import.meta.env.VITE_TWILIO_PHONE_NUMBER;
    if (twilioPhone && !twilioPhone.match(/^\+[1-9]\d{1,14}$/)) {
      errors.push('VITE_TWILIO_PHONE_NUMBER must be in E.164 format (e.g., +1234567890)');
    }

    const firebaseAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
    if (firebaseAuthDomain && !firebaseAuthDomain.includes('.firebaseapp.com')) {
      errors.push('VITE_FIREBASE_AUTH_DOMAIN must be a valid Firebase Auth Domain');
    }

    return {
      isValid: missingVars.length === 0 && errors.length === 0,
      missingVars,
      errors,
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
}

export const configValidator = new ConfigValidator();
export type { ConfigValidationResult };